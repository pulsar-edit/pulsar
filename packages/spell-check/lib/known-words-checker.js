let SpellingManager;

class KnownWordsChecker {
  enableAdd = false;
  spelling = null;
  checker = null;

  static initClass() {
    this.prototype.enableAdd = false;
    this.prototype.spelling = null;
    this.prototype.checker = null;
  }

  constructor(knownWords) {
    // Set up the spelling manager we'll be using.
    SpellingManager ??= require('spelling-manager');
    this.spelling = new SpellingManager.TokenSpellingManager();
    this.checker = new SpellingManager.BufferSpellingChecker(this.spelling);

    // Set our known words.
    this.setKnownWords(knownWords);
  }

  deactivate() {}

  getId() {
    return 'spell-check:known-words';
  }
  getName() {
    return 'Known Words';
  }
  getPriority() {
    return 10;
  }
  isEnabled() {
    return this.spelling.sensitive || this.spelling.insensitive;
  }

  getStatus() {
    return 'Working correctly.';
  }
  providesSpelling(_) {
    return true;
  }
  providesSuggestions(_) {
    return true;
  }
  providesAdding(_) {
    return this.enableAdd;
  }

  check(_, text) {
    const ranges = [];
    const checked = this.checker.check(text);
    const id = this.getId();
    for (let token of checked) {
      if (token.status === 1) {
        ranges.push({ start: token.start, end: token.end });
      }
    }

    return { id, correct: ranges };
  }

  suggest(_, word) {
    return this.spelling.suggest(word);
  }

  getAddingTargets(_) {
    if (this.enableAdd) {
      return [{ sensitive: false, label: 'Add to ' + this.getName() }];
    } else {
      return [];
    }
  }

  add(_, target) {
    const c = atom.config.get('spell-check.knownWords');
    c.push(target.word);
    atom.config.set('spell-check.knownWords', c);
  }

  setAddKnownWords(newValue) {
    this.enableAdd = newValue;
  }

  setKnownWords(knownWords) {
    // Clear out the old list.
    this.spelling.sensitive = {};
    this.spelling.insensitive = {};

    // Add the new ones into the list.
    if (knownWords) {
      return knownWords.map((ignore) => this.spelling.add(ignore));
    }
  }
}

module.exports = KnownWordsChecker;
