class KnownWordsChecker {
    static initClass() {
        this.prototype.enableAdd = false;
        this.prototype.spelling = null;
        this.prototype.checker = null;
    }

    constructor(knownWords) {
        // Set up the spelling manager we'll be using.
        const spellingManager = require('spelling-manager');
        this.spelling = new spellingManager.TokenSpellingManager();
        this.checker = new spellingManager.BufferSpellingChecker(this.spelling);

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
    providesSpelling(args) {
        return true;
    }
    providesSuggestions(args) {
        return true;
    }
    providesAdding(args) {
        return this.enableAdd;
    }

    check(args, text) {
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

    suggest(args, word) {
        return this.spelling.suggest(word);
    }

    getAddingTargets(args) {
        if (this.enableAdd) {
            return [{ sensitive: false, label: 'Add to ' + this.getName() }];
        } else {
            return [];
        }
    }

    add(args, target) {
        const c = atom.config.get('spell-check.knownWords');
        c.push(target.word);
        return atom.config.set('spell-check.knownWords', c);
    }

    setAddKnownWords(newValue) {
        return (this.enableAdd = newValue);
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
KnownWordsChecker.initClass();

module.exports = KnownWordsChecker;
