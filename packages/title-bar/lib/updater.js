const { ApplicationMenu } = require("./app-menu.js");
const { MenuItem } = require("./item.js");
const { MenuLabel } = require("./label.js");
const { Diff, EditToken } = require("./diff.js");

function deepClone(obj) {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

class MenuUpdater {
  static getTemplate() {
    const template = deepClone(atom.menu.template);

    if (!(template instanceof Array)) {
      console.error("MenuUpdater: Menu template is malformed!");
      return [];
    }

    template.some((o) => {
      if (o.label === "&Packages") {
        o.submenu?.sort((a, b) => {
          if (a.label !== undefined && b.label !== undefined) {
            const aL = a.label.toLowerCase(),
              bL = b.label.toLowerCase();
            if (aL < bL) return -1;
            if (aL > bL) return 1;
          }
          return 0;
        });
        return true;
      }
      return false;
    });

    return template;
  }

  static run(appMenu) {
    const template = MenuUpdater.getTemplate();

    if (template.length === 0) {
      return 0;
    }

    return MenuUpdater.recurse(appMenu, appMenu.getLabels(), template);
  }

  static recurse(parent, a, b) {
    let edits = 0;
    const diff = new Diff(a, b, MenuUpdater.equals);
    const editscript = diff.createEditScript();
    edits += MenuUpdater.execEditScript(parent, a, b, editscript);

    // After edit script, a has been modified. Get fresh list and match by label/command
    const updatedItems =
      parent instanceof ApplicationMenu ? parent.getLabels() : (parent.getSubmenu() ?? []);

    updatedItems.forEach((item) => {
      const itemSub = item.getSubmenu();
      if (itemSub === undefined) return;

      // Find matching template item by label
      const labelText = item.getLabelText();
      const templateItem = b.find((t) => t.label === labelText);

      if (!templateItem) return;

      if (!(templateItem.submenu instanceof Array)) {
        // Item has submenu in DOM but not in template - this is fine, skip it
        return;
      }

      // Skip if template submenu is empty but DOM has items - this indicates
      // dynamic content that's about to be repopulated.
      if (templateItem.submenu.length === 0 && itemSub.length > 0) {
        return;
      }

      edits += MenuUpdater.recurse(item, itemSub, templateItem.submenu);
    });

    return edits;
  }

  static execEditScript(parent, a, b, script) {
    let ai = 0,
      bi = 0,
      edits = script.length;
    script.forEach((opr) => {
      switch (opr) {
        case EditToken.NOOP:
          (ai++, bi++);
          edits--;
          return;

        case EditToken.DELETE:
          if (parent instanceof ApplicationMenu) {
            parent.removeLabel(ai);
          } else {
            parent.removeChild(ai);
          }
          break;

        case EditToken.INSERT:
          if (parent instanceof ApplicationMenu) {
            const newItem = MenuLabel.createMenuLabel(b[bi]);
            parent.insertLabel(newItem, ai++);
          } else {
            const newItem = MenuItem.createMenuItem(b[bi]);
            parent.insertChild(newItem, ai++);
          }
          bi++;
          break;

        case EditToken.REPLACE:
          if (parent instanceof ApplicationMenu) {
            parent.removeLabel(ai);
            const newItem = MenuLabel.createMenuLabel(b[bi]);
            parent.insertLabel(newItem, ai++);
          } else {
            parent.removeChild(ai);
            const newItem = MenuItem.createMenuItem(b[bi]);
            parent.insertChild(newItem, ai++);
          }
          break;
      }
    });

    return edits;
  }

  static equals(a, b) {
    if (a === undefined || b === undefined) {
      return false;
    }

    if (a instanceof MenuLabel) {
      return a.getLabelText() === b.label;
    }

    if (a instanceof MenuItem) {
      if (a.isSeparator()) {
        return b.type === "separator";
      }
      if (a.getCommand() !== undefined) {
        const commandMatch = a.getCommand() === b.command;
        if (!commandMatch) return false;

        // For all other commands, compare full commandDetail
        const detailA = a.getCommandDetail();
        const detailB = b.commandDetail;
        if (detailA !== undefined || detailB !== undefined) {
          return JSON.stringify(detailA) === JSON.stringify(detailB);
        }
        return true;
      }
      return a.getLabelText() === b.label;
    }

    return false;
  }
}

module.exports = { MenuUpdater };
