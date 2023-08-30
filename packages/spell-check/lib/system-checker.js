let instance;
const spellchecker = require('spellchecker');
const pathspec = require('atom-pathspec');
const env = require('./checker-env');

// Initialize the global spell checker which can take some time. We also force
// the use of the system or operating system library instead of Hunspell.
if (env.isSystemSupported()) {
    instance = new spellchecker.Spellchecker();
    instance.setSpellcheckerType(spellchecker.ALWAYS_USE_SYSTEM);

    if (!instance.setDictionary('', '')) {
        instance = undefined;
    }
} else {
    instance = undefined;
}

// The `SystemChecker` is a special case to use the built-in system spell-checking
// provided by some platforms, such as Windows 8+ and macOS. This also doesn't have
// settings for specific locales because we need to use default, otherwise macOS
// starts to throw an occasional error if you use multiple locales at the same time
// due to some memory bug.
class SystemChecker {
    constructor() {
        if (atom.config.get('spell-check.enableDebug')) {
            debug = require('debug');
            this.log = debug('spell-check:system-checker');
        } else {
            this.log = (str) => {};
        }
        this.log('enabled', this.isEnabled(), this.getStatus());
    }

    deactivate() {}

    getId() {
        return 'spell-check:system';
    }
    getName() {
        return 'System Checker';
    }
    getPriority() {
        return 110;
    }
    isEnabled() {
        return instance;
    }
    getStatus() {
        if (instance) {
            return 'working correctly';
        } else {
            return 'not supported on platform';
        }
    }

    providesSpelling(args) {
        return this.isEnabled();
    }
    providesSuggestions(args) {
        return this.isEnabled();
    }
    providesAdding(args) {
        return false;
    } // Users can't add yet.

    check(args, text) {
        const id = this.getId();

        if (this.isEnabled()) {
            // We use the default checker here and not the locale-specific one so it
            // will check all languages at the same time.
            return instance.checkSpellingAsync(text).then((incorrect) => {
                if (this.log.enabled) {
                    this.log('check', incorrect);
                }
                return { id, invertIncorrectAsCorrect: true, incorrect };
            });
        } else {
            return { id, status: this.getStatus() };
        }
    }

    suggest(args, word) {
        return instance.getCorrectionsForMisspelling(word);
    }
}

module.exports = SystemChecker;
