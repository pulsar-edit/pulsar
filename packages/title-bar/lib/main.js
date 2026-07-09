let titleBar;

function getTitleBar() {
  if (!titleBar) {
    const { TitleBar } = require("./replacer.js");
    titleBar = new TitleBar();
  }
  return titleBar;
}

function activate(state) {
  getTitleBar().activate(state);
}

function deactivate() {
  titleBar?.deactivate();
  titleBar = undefined;
}

function serialize() {
  return titleBar?.serialize();
}

function provideControlTiles() {
  return titleBar?.titleBarView?.getControlTiles();
}

const api = {
  activate,
  deactivate,
  serialize,
  provideControlTiles,
};

function defineLazyExport(name, path, exportName = name) {
  Object.defineProperty(api, name, {
    enumerable: true,
    get() {
      return require(path)[exportName];
    },
  });
}

defineLazyExport("ApplicationMenu", "./app-menu.js");
defineLazyExport("MenuUpdater", "./updater.js");
defineLazyExport("ControlTiles", "./control-tiles.js");
defineLazyExport("Diff", "./diff.js");
defineLazyExport("EditToken", "./diff.js");

module.exports = api;
