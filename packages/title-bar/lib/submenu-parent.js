/**
 * Mixin for classes that act as parents to submenu items.
 * Provides shared mouse event handling with debounce for submenu opening.
 *
 * Classes using this mixin must have:
 * - `submenu` or `items` property (array-like of menu items)
 * - Items must have: setSelected(), setOpen(), hasSubmenu(), isOpen() methods
 *
 * Optional: positionSubmenu(target) method for ContextMenu positioning
 */

const SUBMENU_DELAY = 100;

/**
 * Initialize submenu parent properties on an instance
 * @param {Object} instance - The instance to initialize
 */
function initSubmenuParent(instance) {
  instance.submenuTimer = null;
  instance.submenuTimerTarget = null;
}

/**
 * Get the submenu/items array from the instance
 * @param {Object} instance - The parent instance
 * @returns {Array} The submenu items
 */
function getItems(instance) {
  return instance.submenu || instance.items;
}

/**
 * Handle child mouse enter event with debounced submenu opening
 * @param {Object} instance - The parent instance (this)
 * @param {Object} target - The menu item being entered
 * @param {Event} e - The mouse event
 */
function onChildMouseEnter(instance, target) {
  // Clear any pending submenu timer
  if (instance.submenuTimer) {
    clearTimeout(instance.submenuTimer);
    instance.submenuTimer = null;
    instance.submenuTimerTarget = null;
  }

  const items = getItems(instance);

  // Clear focus from other items, but DON'T close open submenus yet
  items?.forEach((o) => {
    if (o !== target) {
      o.setSelected(false);
    }
  });

  // Focus this item (visual highlight)
  const isEnabled = target.isEnabled?.() ?? true;
  if (isEnabled) {
    target.setSelected(true);

    // Delay submenu opening - debounced by mousemove
    instance.submenuTimerTarget = target;
    instance.submenuTimer = setTimeout(() => {
      // Now close other submenus when this one is selected
      items?.forEach((o) => {
        if (o !== target) {
          o.setOpen(false);
        }
      });

      if (target.hasSubmenu()) {
        target.setOpen(true);
        // Call positionSubmenu if available (used by ContextMenu)
        instance.positionSubmenu?.(target);
      }

      instance.submenuTimer = null;
      instance.submenuTimerTarget = null;
    }, SUBMENU_DELAY);
  }
}

/**
 * Handle child mouse move event - resets debounce timer
 * @param {Object} instance - The parent instance (this)
 * @param {Object} target - The menu item being moved over
 * @param {Event} e - The mouse event
 */
function onChildMouseMove(instance, target) {
  // Reset timer only if moving over the same item that has a pending timer
  if (instance.submenuTimer && instance.submenuTimerTarget === target) {
    clearTimeout(instance.submenuTimer);

    const items = getItems(instance);

    instance.submenuTimer = setTimeout(() => {
      // Close other submenus when this one is selected
      items?.forEach((o) => {
        if (o !== target) {
          o.setOpen(false);
        }
      });

      if (target.hasSubmenu()) {
        target.setOpen(true);
        // Call positionSubmenu if available (used by ContextMenu)
        instance.positionSubmenu?.(target);
      }

      instance.submenuTimer = null;
      instance.submenuTimerTarget = null;
    }, SUBMENU_DELAY);
  }
}

/**
 * Clear focus (selection) from all items, keeping open submenus open
 * @param {Object} instance - The parent instance (this)
 */
function clearFocus(instance) {
  if (instance.submenuTimer) {
    clearTimeout(instance.submenuTimer);
    instance.submenuTimer = null;
    instance.submenuTimerTarget = null;
  }

  const items = getItems(instance);
  items?.forEach((o) => {
    if (!o.isOpen()) {
      o.setSelected(false);
    }
  });
}

/**
 * Recursively move nested submenus to a portal container
 * @param {Object} parentItem - The parent menu item
 * @param {HTMLElement} portalContainer - The portal container element
 */
function moveNestedSubmenusToPortal(parentItem, portalContainer) {
  if (!parentItem.hasSubmenu() || !portalContainer) return;

  parentItem.getSubmenu().forEach((item) => {
    if (item.hasSubmenu()) {
      item.setPortalContainer?.(portalContainer);
      moveNestedSubmenusToPortal(item, portalContainer);
    }
  });
}

/**
 * Apply the submenu parent mixin to a class
 * Adds onChildMouseEnter, onChildMouseMove, clearFocus methods
 * @param {Function} Class - The class to extend
 */
function applySubmenuParentMixin(Class) {
  const proto = Class.prototype;

  proto.onChildMouseEnter = function (target, e) {
    onChildMouseEnter(this, target, e);
  };

  proto.onChildMouseMove = function (target, e) {
    onChildMouseMove(this, target, e);
  };

  proto.clearFocus = function () {
    clearFocus(this);
  };
}

module.exports = {
  initSubmenuParent,
  onChildMouseEnter,
  onChildMouseMove,
  clearFocus,
  moveNestedSubmenusToPortal,
  applySubmenuParentMixin,
  SUBMENU_DELAY,
};
