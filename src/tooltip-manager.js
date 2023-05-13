const _ = require('underscore-plus');
const { Disposable, CompositeDisposable } = require('event-kit');
let Tooltip = null;

/**
 * @class TooltipManager
 * @classdesc Essential: Associates tooltips with HTML elements.
 * You can get the `TooltipManager` via `atom.tooltips`.
 * @see {@link https://github.com/pulsar-edit/pulsar/blob/master/docs/jsdoc-tutorials/tooltipmanager.md ToolTipManager Tutorial}
 */
module.exports = class TooltipManager {
  constructor({ keymapManager, viewRegistry }) {
    this.defaults = {
      trigger: 'hover',
      container: 'body',
      html: true,
      placement: 'auto top',
      viewportPadding: 2
    };

    this.hoverDefaults = {
      delay: { show: 1000, hide: 100 }
    };

    this.keymapManager = keymapManager;
    this.viewRegistry = viewRegistry;
    this.tooltips = new Map();
  }

  /**
   * @name add
   * @desc Essential: Add a tooltip to the given element.
   * @memberof TooltipManager
   * @param {HTMLElement} target
   * @param {object} options - An object with one or more of the following options.
   * @param {string|function} options.title - To use for the text in the tip. If
   * a function is passed, `this` will be set to the `target` element. This option
   * is mutually exclusive with the `item` option.
   * @param {boolean} options.html=true - A Boolean affecting the interpretation of
   * the `title` option. If `true` (the default), the `title` string will be
   * interpreted as HTML. Otherwise it will be interpreted as plain text.
   * @param {view} options.item - A view (object with an `.element` property)
   * or a DOM element containing custom content for the tooltip. This option
   * is mutually exclusive with the `title` option.
   * @param {string} options.class - A String with a class to apply to the tooltip
   * element to enable cusotm styling.
   * @param {string|function} options.placement - Returning a string to indicate
   * the position of the tooltip relative to `element`. Can be `'top'`, `'bottom'`,
   * `'left'`, `'right'`, or `'auto'`. When `'auto'` is specified, it will
   * dynamically reorient the tooltip. For example, if placement is `'auto left'`,
   * the tooltip will display to the left when possible, otherwise it will
   * display right.
   * @param {string} options.trigger='hover' - A String indicating how the tooltip should
   * be displayed. Choose from one of the following options:
   *    * `'hover'`: Show the tooltip when the mouse hovers over the element.
   *    * `'click'`: Show the tooltip when the element is clicked. The tooltip
   *      will be hidden after clicking the element again or anywhere else
   *      outside of the tooltip itself.
   *    * `'focus'`: Show the tooltip when the element is focused.
   *    * `'manual'`: Show the tooltip immediatley and only hide it when the
   *      returned disposable is disposed.
   * @param {object} options.delay - An object specifying the show and hide delay
   * in milliseconds. Defaults to `{show: 1000, hide: 100}` if the `trigger` is
   * `'hover'` and otherwise defaults to `0` for both values.
   * @param {string} keyBindingCommand - A string containing a command name. If
   * you specifiy this option and a key binding exists that matches the command,
   * it will be appended to the title or rendered alone if no title is specified.
   * @param {HTMLElement} keyBindingTarget - An `HTMLElement` on which to look
   * up the key binding. If this option is not supplied, the first of all matching
   * key bindings for the given command will be rendered.
   * @returns {Disposable} On which `.dispose()` can be called to remove the tooltip.
   */
  add(target, options) {
    if (target.jquery) {
      const disposable = new CompositeDisposable();
      for (let i = 0; i < target.length; i++) {
        disposable.add(this.add(target[i], options));
      }
      return disposable;
    }

    if (Tooltip == null) {
      Tooltip = require('./tooltip');
    }

    const { keyBindingCommand, keyBindingTarget } = options;

    if (keyBindingCommand != null) {
      const bindings = this.keymapManager.findKeyBindings({
        command: keyBindingCommand,
        target: keyBindingTarget
      });
      const keystroke = getKeystroke(bindings);
      if (options.title != null && keystroke != null) {
        options.title += ` ${getKeystroke(bindings)}`;
      } else if (keystroke != null) {
        options.title = getKeystroke(bindings);
      }
    }

    delete options.selector;
    options = _.defaults(options, this.defaults);
    if (options.trigger === 'hover') {
      options = _.defaults(options, this.hoverDefaults);
    }

    const tooltip = new Tooltip(target, options, this.viewRegistry);

    if (!this.tooltips.has(target)) {
      this.tooltips.set(target, []);
    }
    this.tooltips.get(target).push(tooltip);

    const hideTooltip = function() {
      tooltip.leave({ currentTarget: target });
      tooltip.hide();
    };

    // note: adding a listener here adds a new listener for every tooltip element that's registered.  Adding unnecessary listeners is bad for performance.  It would be better to add/remove listeners when tooltips are actually created in the dom.
    window.addEventListener('resize', hideTooltip);

    const disposable = new Disposable(() => {
      window.removeEventListener('resize', hideTooltip);

      hideTooltip();
      tooltip.destroy();

      if (this.tooltips.has(target)) {
        const tooltipsForTarget = this.tooltips.get(target);
        const index = tooltipsForTarget.indexOf(tooltip);
        if (index !== -1) {
          tooltipsForTarget.splice(index, 1);
        }
        if (tooltipsForTarget.length === 0) {
          this.tooltips.delete(target);
        }
      }
    });

    return disposable;
  }

  /**
   * @name findTooltips
   * @memberof TooltipManager
   * @desc Extended: Find the tooltips that have been applied to the given element.
   * @param {HTMLElement} target - The `HTMLElement` to find tooltips on.
   * @returns {Tooltip[]} Returns array of `Tooltip` objects that match the `target`.
   */
  findTooltips(target) {
    if (this.tooltips.has(target)) {
      return this.tooltips.get(target).slice();
    } else {
      return [];
    }
  }
};

function humanizeKeystrokes(keystroke) {
  let keystrokes = keystroke.split(' ');
  keystrokes = keystrokes.map(stroke => _.humanizeKeystroke(stroke));
  return keystrokes.join(' ');
}

function getKeystroke(bindings) {
  if (bindings && bindings.length) {
    return `<span class="keystroke">${humanizeKeystrokes(
      bindings[0].keystrokes
    )}</span>`;
  }
}
