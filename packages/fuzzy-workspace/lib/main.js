const { CompositeDisposable } = require("atom");
const { SelectListView, createTwoLineItem, highlightMatches } = require("select-list");
const { clipboard } = require("electron");

const CONTAINERS = [
  { label: "Center", get: () => atom.workspace.getCenter() },
  { label: "Left Dock", get: () => atom.workspace.getLeftDock() },
  { label: "Right Dock", get: () => atom.workspace.getRightDock() },
  { label: "Bottom Dock", get: () => atom.workspace.getBottomDock() },
];

module.exports = {
  items: [],
  signature: null,
  selectList: null,
  disposables: null,

  activate() {
    this.selectList = new SelectListView({
      className: "fuzzy-workspace",
      maxResults: 50,
      emptyMessage: "No open items found",
      removeDiacritics: true,
      algorithm: "command-t",
      elementForItem: (item, options) => this.elementForItem(item, options),
      didConfirmSelection: () => this.performAction("focus"),
      didCancelSelection: () => this.selectList.hide(),
      willShow: () => this.update(),
      filterKeyForItem: (item) => item.title,
    });

    this.disposables = new CompositeDisposable(
      atom.commands.add("atom-workspace", {
        "fuzzy-workspace:toggle": () => this.selectList.toggle(),
      }),
      atom.commands.add(this.selectList.element, {
        "select-list:focus-selected-item": () => this.performAction("focus"),
        "select-list:close-selected-item": () => this.performAction("close"),
        "select-list:copy-selected-path": () => this.performAction("copy-path"),
        "select-list:query-selection": () => this.selectList.setQueryFromSelection(),
      }),
    );
  },

  deactivate() {
    this.disposables.dispose();
    this.selectList.destroy();
  },

  buildItems() {
    const items = [];
    for (const { label, get } of CONTAINERS) {
      const container = get();
      if (!container) continue;
      for (const pane of container.getPanes()) {
        for (const paneItem of pane.getItems()) {
          const uri = this.uriFor(paneItem);
          items.push({
            paneItem,
            pane,
            container: label,
            active: paneItem === pane.getActiveItem(),
            title: this.titleFor(paneItem),
            uri,
            icon: this.iconFor(paneItem, uri),
          });
        }
      }
    }
    return items;
  },

  titleFor(paneItem) {
    if (paneItem && typeof paneItem.getTitle === "function") {
      const title = paneItem.getTitle();
      if (title) return title;
    }
    return "untitled";
  },

  uriFor(paneItem) {
    if (paneItem && typeof paneItem.getURI === "function") {
      return paneItem.getURI() || undefined;
    }
    if (paneItem && typeof paneItem.getPath === "function") {
      return paneItem.getPath() || undefined;
    }
    return undefined;
  },

  iconFor(paneItem, uri) {
    if (paneItem && typeof paneItem.getIconName === "function") {
      const name = paneItem.getIconName();
      if (name) return ["icon-" + name];
    }
    if (uri && !uri.includes("://")) {
      return this.iconClassForPath(uri);
    }
    return ["icon-file-text"];
  },

  elementForItem(item, { matchIndices }) {
    const li = createTwoLineItem({
      primary: highlightMatches(item.title, matchIndices),
      secondary: item.uri || item.container,
      icon: item.icon,
    });
    if (item.active) li.classList.add("active-item");
    li.firstChild.dataset.container = item.container;
    return li;
  },

  getHelpMarkdown() {
    return (
      "Available commands:\n" +
      "- **Enter**: Focus item\n" +
      "- **Alt+Delete**: Close item\n" +
      "- **Alt+C**: Copy path\n" +
      "- **Alt+S**: Query from selection\n\n" +
      `**${this.items.length}** open item${this.items.length !== 1 ? "s" : ""}`
    );
  },

  update() {
    const items = this.buildItems();
    const signature = this.signatureFor(items);
    if (signature === this.signature) return;
    this.signature = signature;
    this.items = items;
    this.selectList.update({
      items: this.items,
      helpMarkdown: this.getHelpMarkdown(),
    });
  },

  signatureFor(items) {
    return items
      .map((item) => `${item.container}\0${item.title}\0${item.uri || ""}\0${item.active ? 1 : 0}`)
      .join("\x01");
  },

  performAction(mode) {
    const item = this.selectList.getSelectedItem();
    if (!item) return;

    if (mode === "copy-path") {
      this.selectList.hide();
      if (!item.uri) {
        atom.notifications.addWarning("Selected item has no path");
        return;
      }
      clipboard.writeText(item.uri);
      return;
    }

    if (mode === "close") {
      item.pane.destroyItem(item.paneItem);
      this.update();
      return;
    }

    if (mode === "focus") {
      this.selectList.hide();
      const container = item.pane.getContainer();
      if (container && typeof container.show === "function") {
        container.show();
      }
      item.pane.activateItem(item.paneItem);
      item.pane.activate();
      const el = typeof item.paneItem.getElement === "function" ? item.paneItem.getElement() : null;
      if (el && typeof el.focus === "function") el.focus();
    }
  },

  iconClassForPath(filePath) {
    return atom.ui.iconClassForPath(filePath);
  },
};
