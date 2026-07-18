/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let KeyBinding;
const {calculateSpecificity, MODIFIERS, isKeyup} = require('./helpers');

const MATCH_TYPES = {
  EXACT: 'exact',
  PARTIAL: 'partial',
  PENDING_KEYUP: 'pendingKeyup'
};
module.exports.MATCH_TYPES = MATCH_TYPES;

module.exports.KeyBinding =
(KeyBinding = (function() {
  KeyBinding = class KeyBinding {
    static initClass() {
      this.currentIndex = 1;
  
      this.prototype.enabled = true;
    }

    constructor(source, command, keystrokes, selector, priority) {
      this.source = source;
      this.command = command;
      this.keystrokes = keystrokes;
      this.priority = priority;
      this.keystrokeArray = this.keystrokes.split(' ');
      this.keystrokeCount = this.keystrokeArray.length;
      this.selector = selector.replace(/!important/g, '');
      this.specificity = calculateSpecificity(selector);
      this.index = this.constructor.currentIndex++;
      this.cachedKeyups = null;
    }

    matches(keystroke) {
      const multiKeystroke = /\s/.test(keystroke);
      if (multiKeystroke) {
        return keystroke === this.keystroke;
      } else {
        return keystroke.split(' ')[0] === this.keystroke.split(' ')[0];
      }
    }

    compare(keyBinding) {
      if (keyBinding.priority === this.priority) {
        if (keyBinding.specificity === this.specificity) {
          return keyBinding.index - this.index;
        } else {
          return keyBinding.specificity - this.specificity;
        }
      } else {
        return keyBinding.priority - this.priority;
      }
    }

    // Return the keyup portion of the binding, if any, as an array of
    // keystrokes.
    getKeyups() {
      if (this.cachedKeyups != null) { return this.cachedKeyups; }
      for (let i = 0; i < this.keystrokeArray.length; i++) {
        var keystroke = this.keystrokeArray[i];
        if (isKeyup(keystroke)) { return this.cachedKeyups = this.keystrokeArray.slice(i); }
      }
    }

    // userKeystrokes is an array of keystrokes e.g.
    // ['ctrl-y', 'ctrl-x', '^x']
    matchesKeystrokes(userKeystrokes) {
      let userKeystrokeIndex = -1;
      let userKeystrokesHasKeydownEvent = false;
      const matchesNextUserKeystroke = function(bindingKeystroke) {
        while (userKeystrokeIndex < (userKeystrokes.length - 1)) {
          userKeystrokeIndex += 1;
          var userKeystroke = userKeystrokes[userKeystrokeIndex];
          var isKeydownEvent = !isKeyup(userKeystroke);
          if (isKeydownEvent) { userKeystrokesHasKeydownEvent = true; }
          if (bindingKeystroke === userKeystroke) {
            return true;
          } else if (isKeydownEvent) {
            return false;
          }
        }
        return null;
      };

      let isPartialMatch = false;
      let bindingRemainderContainsOnlyKeyups = true;
      const bindingKeystrokeIndex = 0;
      for (var bindingKeystroke of Array.from(this.keystrokeArray)) {
        if (!isPartialMatch) {
          var doesMatch = matchesNextUserKeystroke(bindingKeystroke);
          if (doesMatch === false) {
            return false;
          } else if (doesMatch === null) {
            // Make sure userKeystrokes with only keyup events don't match everything
            if (userKeystrokesHasKeydownEvent) {
              isPartialMatch = true;
            } else {
              return false;
            }
          }
        }

        if (isPartialMatch) {
          if (!isKeyup(bindingKeystroke)) { bindingRemainderContainsOnlyKeyups = false; }
        }
      }

      // Bindings that match the beginning of the user's keystrokes are not a match.
      // e.g. This is not a match. It would have been a match on the previous keystroke:
      // bindingKeystrokes = ['ctrl-tab', '^tab']
      // userKeystrokes    = ['ctrl-tab', '^tab', '^ctrl']
      if (userKeystrokeIndex < (userKeystrokes.length - 1)) { return false; }

      if (isPartialMatch && bindingRemainderContainsOnlyKeyups) {
        return MATCH_TYPES.PENDING_KEYUP;
      } else if (isPartialMatch) {
        return MATCH_TYPES.PARTIAL;
      } else {
        return MATCH_TYPES.EXACT;
      }
    }
  };
  KeyBinding.initClass();
  return KeyBinding;
})());
