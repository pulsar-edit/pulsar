const spellchecker = require('spellchecker');
const pathspec = require('atom-pathspec');
const env = require('./checker-env');

let debug;

// The locale checker is a checker that takes a locale string (`en-US`) and
// optionally a path and then checks it.
class LocaleChecker {
  spellchecker = null;
  locale = null;
  enabled = true;
  reason = null;
  paths = null;
  checkDictionaryPath = true;
  checkDefaultPaths = true;

  constructor(locale, paths, hasSystemChecker, inferredLocale) {
    this.locale = locale;
    this.paths = paths;
    this.enabled = true;
    this.hasSystemChecker = hasSystemChecker;
    this.inferredLocale = inferredLocale;
    if (atom.config.get('spell-check.enableDebug')) {
      debug = require('debug');
      this.log = debug('spell-check:locale-checker').extend(locale);
    } else {
      this.log = (_str) => {};
    }
    this.log(
      'enabled',
      this.isEnabled(),
      'hasSystemChecker',
      this.hasSystemChecker,
      'inferredLocale',
      this.inferredLocale
    );
  }

  deactivate() {}

  getId() {
    let localeToken = this.locale.toLowerCase().replace('_', '-');
    return `spell-check:locale:${localeToken};`;
  }
  getName() {
    return `Locale Dictionary (${this.locale})`;
  }
  getPriority() {
    // Hard-coded system level data; has no user input.
    return 100;
  }
  isEnabled() {
    return this.enabled;
  }
  getStatus() {
    return this.reason;
  }
  providesSpelling(_) {
    return this.enabled;
  }
  providesSuggestions(_) {
    return this.enabled;
  }
  providesAdding(_) {
    return false;
  }

  async check(_, text) {
    this.deferredInit();
    const id = this.getId();
    if (!this.enabled) {
      return { id, status: this.getStatus() };
    }

    let incorrect = await this.spellchecker.checkSpellingAsync(text);
    if (this.log.enabled) {
      this.log('check', incorrect);
    }
    return { id, invertIncorrectAsCorrect: true, incorrect };
  }

  suggest(_, word) {
    this.deferredInit();
    return this.spellchecker.getCorrectionsForMisspelling(word);
  }

  deferredInit() {
    // If we already have a spellchecker, then we don't have to do anything.
    if (this.spellchecker) return;

    // Initialize the spell checker which can take some time. We also force
    // the use of the Hunspell library even on Mac OS X. The "system checker"
    // is the one that uses the built-in dictionaries from the operating system.
    const checker = new spellchecker.Spellchecker();
    checker.setSpellcheckerType(spellchecker.ALWAYS_USE_HUNSPELL);

    // Build up a list of paths we are checking so we can report them fully
    // to the user if we fail.
    const searchPaths = [];
    for (let searchPath of this.paths) {
      searchPaths.push(pathspec.getPath(searchPath));
    }

    // Add operating system specific paths to the search list.
    if (this.checkDefaultPaths) {
      if (env.isLinux()) {
        searchPaths.push('/usr/share/hunspell');
        searchPaths.push('/usr/share/myspell');
        searchPaths.push('/usr/share/myspell/dicts');
      }

      if (env.isDarwin()) {
        searchPaths.push('/'); // …?
        searchPaths.push('/System/Library/Spelling');
      }

      if (env.isWindows()) {
        searchPaths.push('C:\\');
      }
    }

    // Attempt to load all the paths for the dictionary until we find one.
    this.log('checking paths', searchPaths);
    for (let searchPath of searchPaths) {
      if (checker.setDictionary(this.locale, searchPath)) {
        this.log('found checker', searchPath);
        this.spellchecker = checker;
        return;
      }
    }

    // On Windows, if we can't find the dictionary using the paths, then we
    // also try the spelling API. This uses system checker with the given
    // locale, but doesn't provide a path. We do this at the end to let
    // Hunspell be used if the user provides that.
    if (env.isWindows()) {
      const systemChecker = new spellchecker.Spellchecker();
      systemChecker.setSpellcheckerType(spellchecker.ALWAYS_USE_SYSTEM);
      if (systemChecker.setDictionary(this.locale, '')) {
        this.log('using Windows Spell API');
        this.spellchecker = systemChecker;
        return;
      }
    }

    // If all else fails, try the packaged en-US dictionary in the `spellcheck`
    // library.
    if (this.checkDictionaryPath) {
      if (
        checker.setDictionary(this.locale, spellchecker.getDictionaryPath())
      ) {
        this.log('using packaged locale', spellchecker.getDictionaryPath());
        this.spellchecker = checker;
        return;
      }
    }

    // If we are using the system checker and we infered the locale, then we
    // don't want to show an error. This is because the system checker may have
    // handled it already.
    if (this.hasSystemChecker && this.inferredLocale) {
      this.log(
        'giving up quietly because of system checker and inferred locale'
      );
      this.enabled = false;
      this.reason = `Cannot load the locale dictionary for \`${this.locale}\`. No warning because system checker is in use and locale is inferred.`;
      return;
    }

    // If we fell through all the `if` blocks, then we couldn't load the
    // dictionary.
    this.enabled = false;
    this.reason = `Cannot load the locale dictionary for \`${this.locale}\`.`;
    const message = `The package \`spell-check\` cannot load the checker for \`${this.locale}\`. See the settings for ways of changing the languages used, resolving missing dictionaries, or hiding this warning.`;

    let searches = `\n\nThe plugin checked the following paths for dictionary files:\n* ${searchPaths.join(
      '\n* '
    )}`;

    if (!env.useLocales()) {
      searches =
        '\n\nThe plugin tried to use the system dictionaries to find the locale.';
    }

    const noticesMode = atom.config.get('spell-check.noticesMode');

    if (noticesMode === 'console' || noticesMode === 'both') {
      console.log(this.getId(), message + searches);
    }
    if (noticesMode === 'popup' || noticesMode === 'both') {
      atom.notifications.addWarning(message, {
        buttons: [
          {
            className: 'btn',
            onDidClick() {
              return atom.workspace.open('atom://config/packages/spell-check');
            },
            text: 'Settings',
          },
        ],
      });
    }
  }
}

module.exports = LocaleChecker;
