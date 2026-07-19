/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// This custom subclass of CustomEvent exists to provide the ::abortKeyBinding
// method, as well as versions of the ::stopPropagation methods that record the
// intent to stop propagation so event bubbling can be properly simulated for
// detached elements.
//
// CustomEvent instances are exotic objects, meaning the CustomEvent constructor
// *must* be called with an exact CustomEvent instance. We work around this fact
// by building a CustomEvent directly, then injecting this object into the
// prototype chain by setting its __proto__ property.
let CommandEvent;
module.exports = CommandEvent = (function () {
  CommandEvent = class CommandEvent extends CustomEvent {
    static initClass() {
      this.prototype.keyBindingAborted = false;
      this.prototype.propagationStopped = false;
    }

    abortKeyBinding() {
      this.stopImmediatePropagation();
      return (this.keyBindingAborted = true);
    }

    stopPropagation() {
      this.propagationStopped = true;
      return super.stopPropagation(...arguments);
    }

    stopImmediatePropagation() {
      this.propagationStopped = true;
      return super.stopImmediatePropagation(...arguments);
    }
  };
  CommandEvent.initClass();
  return CommandEvent;
})();
