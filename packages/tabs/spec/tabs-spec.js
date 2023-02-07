const _ = require('underscore-plus');
const path = require('path');
const temp = require('temp');
const TabBarView = require('../lib/tab-bar-view');
const layout = require('../lib/layout');
const main = require('../lib/main');
let {triggerMouseEvent, triggerClickEvent, buildDragEvents, buildDragEnterLeaveEvents, buildWheelEvent, buildWheelPlusShiftEvent} = require("./event-helpers.js");

describe("Tabs package main", () => {
  let centerElement = null;

  beforeEach(() => {
    centerElement = atom.workspace.getCenter().paneContainer.getElement();

    waitsForPromise(() => atom.workspace.open('sample.js'));

    waitsForPromise(() => atom.packages.activatePackage("tabs"));
  });

  describe(".activate()", () => it("appends a tab bar all existing and new panes", () => {
    jasmine.attachToDOM(centerElement);
    expect(centerElement.querySelectorAll('.pane').length).toBe(1);
    expect(centerElement.querySelectorAll('.pane > .tab-bar').length).toBe(1);

    const pane = atom.workspace.getActivePane();
    pane.splitRight();

    expect(centerElement.querySelectorAll('.pane').length).toBe(2);
    const tabBars = centerElement.querySelectorAll('.pane > .tab-bar');
    expect(tabBars.length).toBe(2);
    expect(tabBars[1].getAttribute('location')).toBe('center');
  }));

  describe(".deactivate()", () => it("removes all tab bar views and stops adding them to new panes", () => {
    const pane = atom.workspace.getActivePane();
    pane.splitRight();
    jasmine.attachToDOM(centerElement);
    expect(centerElement.querySelectorAll('.pane').length).toBe(2);
    expect(centerElement.querySelectorAll('.pane > .tab-bar').length).toBe(2);

    waitsForPromise(() => Promise.resolve(atom.packages.deactivatePackage('tabs'))); // Wrapped so works with Promise & non-Promise deactivate

    runs(() => {
      expect(centerElement.querySelectorAll('.pane').length).toBe(2);
      expect(centerElement.querySelectorAll('.pane > .tab-bar').length).toBe(0);

      pane.splitRight();
      expect(centerElement.querySelectorAll('.pane').length).toBe(3);
      expect(centerElement.querySelectorAll('.pane > .tab-bar').length).toBe(0);
    });
  }));
});

describe("TabBarView", () => {
  let [deserializerDisposable, item1, item2, editor1, pane, tabBar] = Array.from([]);

  class TestView {
    static deserialize({title, longTitle, iconName}) { return new TestView(title, longTitle, iconName); }
    constructor(title, longTitle, iconName, pathURI, isPermanentDockItem) {
      this.title = title;
      this.longTitle = longTitle;
      this.iconName = iconName;
      this.pathURI = pathURI;
      this._isPermanentDockItem = isPermanentDockItem;
      this.element = document.createElement('div');
      this.element.textContent = this.title;
      if (isPermanentDockItem != null) {
        this.isPermanentDockItem = () => isPermanentDockItem;
      }
    }
    getTitle() { return this.title; }
    getLongTitle() { return this.longTitle; }
    getURI() { return this.pathURI; }
    getIconName() { return this.iconName; }
    serialize() { return {deserializer: 'TestView', title: this.title, longTitle: this.longTitle, iconName: this.iconName}; }
    copy() { return new TestView(this.title, this.longTitle, this.iconName); }
    onDidChangeTitle(callback) {
      if (this.titleCallbacks == null) { this.titleCallbacks = []; }
      this.titleCallbacks.push(callback);
      return {dispose: () => _.remove(this.titleCallbacks, callback)};
    }
    emitTitleChanged() {
      return Array.from(this.titleCallbacks != null ? this.titleCallbacks : []).map((callback) => callback());
    }
    onDidChangeIcon(callback) {
      if (this.iconCallbacks == null) { this.iconCallbacks = []; }
      this.iconCallbacks.push(callback);
      return {dispose: () => _.remove(this.iconCallbacks, callback)};
    }
    emitIconChanged() {
      return Array.from(this.iconCallbacks != null ? this.iconCallbacks : []).map((callback) => callback());
    }
    onDidChangeModified() { // to suppress deprecation warning
      return {dispose() {}};
    }
  }

  beforeEach(() => {
    deserializerDisposable = atom.deserializers.add(TestView);
    item1 = new TestView('Item 1', undefined, "squirrel", "sample.js");
    item2 = new TestView('Item 2');

    waitsForPromise(() => atom.workspace.open('sample.js'));

    runs(() => {
      editor1 = atom.workspace.getActiveTextEditor();
      pane = atom.workspace.getActivePane();
      pane.addItem(item1, {index: 0});
      pane.addItem(item2, {index: 2});
      pane.activateItem(item2);
      tabBar = new TabBarView(pane, 'center');
    });
  });

  afterEach(() => deserializerDisposable.dispose());

  describe("when the mouse is moved over the tab bar", () => it("fixes the width on every tab", () => {
    jasmine.attachToDOM(tabBar.element);

    triggerMouseEvent('mouseenter', tabBar.element);

    const initialWidth1 = tabBar.tabAtIndex(0).element.getBoundingClientRect().width.toFixed(0);
    const initialWidth2 = tabBar.tabAtIndex(2).element.getBoundingClientRect().width.toFixed(0);

    // Minor OS differences cause fractional-pixel differences so ignore fractional part
    expect(parseFloat(tabBar.tabAtIndex(0).element.style.maxWidth.replace('px', '')).toFixed(0)).toBe(initialWidth1);
    expect(parseFloat(tabBar.tabAtIndex(2).element.style.maxWidth.replace('px', '')).toFixed(0)).toBe(initialWidth2);
  }));

  describe("when the mouse is moved away from the tab bar", () => it("resets the width on every tab", () => {
    jasmine.attachToDOM(tabBar.element);

    triggerMouseEvent('mouseenter', tabBar.element);
    triggerMouseEvent('mouseleave', tabBar.element);

    expect(tabBar.tabAtIndex(0).element.style.maxWidth).toBe('');
    expect(tabBar.tabAtIndex(1).element.style.maxWidth).toBe('');
  }));

  describe("when a drag leave event moves the mouse from the tab bar", () => it("resets the width on every tab", () => {
    jasmine.attachToDOM(tabBar.element);

    triggerMouseEvent('mouseenter', tabBar.element);
    triggerMouseEvent('dragleave', tabBar.element);

    expect(tabBar.tabAtIndex(0).element.style.maxWidth).toBe('');
    expect(tabBar.tabAtIndex(1).element.style.maxWidth).toBe('');
  }));

  describe(".initialize(pane)", () => {
    it("creates a tab for each item on the tab bar's parent pane", () => {
      expect(pane.getItems().length).toBe(3);
      expect(tabBar.element.querySelectorAll('.tab').length).toBe(3);

      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title').textContent).toBe(item1.getTitle());
      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title').dataset.name).toBeUndefined();
      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title').dataset.path).toBeUndefined();
      expect(tabBar.element.querySelectorAll('.tab')[0].dataset.type).toBe('TestView');

      expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title').textContent).toBe(editor1.getTitle());
      expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title').dataset.name).toBe(path.basename(editor1.getPath()));
      expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title').dataset.path).toBe(editor1.getPath());
      expect(tabBar.element.querySelectorAll('.tab')[1].dataset.type).toBe('TextEditor');

      expect(tabBar.element.querySelectorAll('.tab')[2].querySelector('.title').textContent).toBe(item2.getTitle());
      expect(tabBar.element.querySelectorAll('.tab')[2].querySelector('.title').dataset.name).toBeUndefined();
      expect(tabBar.element.querySelectorAll('.tab')[2].querySelector('.title').dataset.path).toBeUndefined();
      expect(tabBar.element.querySelectorAll('.tab')[0].dataset.type).toBe('TestView');
    });

    it("highlights the tab for the active pane item", () => expect(tabBar.element.querySelectorAll('.tab')[2]).toHaveClass('active'));

    it("emits a warning when ::onDid... functions are not valid Disposables", () => {
      class BadView {
        constructor() {
          this.element = document.createElement('div');
        }
        getTitle() { return "Anything"; }
        onDidChangeTitle() {}
        onDidChangeIcon() {}
        onDidChangeModified() {}
        onDidSave() {}
        onDidChangePath() {}
      }

      const warnings = [];
      spyOn(console, "warn").andCallFake((message, object) => warnings.push({message, object}));

      const badItem = new BadView('Item 3');
      pane.addItem(badItem);

      expect(warnings[0].message).toContain("onDidChangeTitle");
      expect(warnings[0].object).toBe(badItem);

      expect(warnings[1].message).toContain("onDidChangePath");
      expect(warnings[1].object).toBe(badItem);

      expect(warnings[2].message).toContain("onDidChangeIcon");
      expect(warnings[2].object).toBe(badItem);

      expect(warnings[3].message).toContain("onDidChangeModified");
      expect(warnings[3].object).toBe(badItem);

      expect(warnings[4].message).toContain("onDidSave");
      expect(warnings[4].object).toBe(badItem);
    });
  });

  describe("when the active pane item changes", () => it("highlights the tab for the new active pane item", () => {
    pane.activateItem(item1);
    expect(tabBar.element.querySelectorAll('.active').length).toBe(1);
    expect(tabBar.element.querySelectorAll('.tab')[0]).toHaveClass('active');

    pane.activateItem(item2);
    expect(tabBar.element.querySelectorAll('.active').length).toBe(1);
    expect(tabBar.element.querySelectorAll('.tab')[2]).toHaveClass('active');
  }));

  describe("when a new item is added to the pane", () => {
    it("adds the 'modified' class to the new tab if the item is initially modified", () => {
      let editor2 = null;

      waitsForPromise(() => {
        if (atom.workspace.createItemForURI != null) {
          return atom.workspace.createItemForURI('sample.txt').then(o => editor2 = o);
        } else {
          return atom.workspace.open('sample.txt', {activateItem: false}).then(o => editor2 = o);
        }
      });

      runs(() => {
        editor2.insertText('x');
        pane.activateItem(editor2);
        expect(tabBar.tabForItem(editor2).element).toHaveClass('modified');
      });
    });

    describe("when addNewTabsAtEnd is set to true in package settings", () => {
      it("adds a tab for the new item at the end of the tab bar", () => {
        atom.config.set("tabs.addNewTabsAtEnd", true);
        const item3 = new TestView('Item 3');
        pane.activateItem(item3);
        expect(tabBar.element.querySelectorAll('.tab').length).toBe(4);
        expect(tabBar.tabAtIndex(3).element.querySelector('.title').textContent).toMatch('Item 3');
      });

      it("puts the new tab at the last index of the pane's items", () => {
        atom.config.set("tabs.addNewTabsAtEnd", true);
        const item3 = new TestView('Item 3');
        // activate item1 so default is to add immediately after
        pane.activateItem(item1);
        pane.activateItem(item3);
        expect(pane.getItems()[pane.getItems().length - 1]).toEqual(item3);
      });
    });

    describe("when addNewTabsAtEnd is set to false in package settings", () => it("adds a tab for the new item at the same index as the item in the pane", () => {
      atom.config.set("tabs.addNewTabsAtEnd", false);
      pane.activateItem(item1);
      const item3 = new TestView('Item 3');
      pane.activateItem(item3);
      expect(tabBar.element.querySelectorAll('.tab').length).toBe(4);
      expect(tabBar.tabAtIndex(1).element.querySelector('.title').textContent).toMatch('Item 3');
    }));
  });

  describe("when an item is removed from the pane", () => {
    it("removes the item's tab from the tab bar", () => {
      pane.destroyItem(item2);
      expect(tabBar.getTabs().length).toBe(2);
      expect(tabBar.element.textContent).not.toMatch('Item 2');
    });

    it("updates the titles of the remaining tabs", () => {
      expect(tabBar.tabForItem(item2).element.textContent).toMatch('Item 2');
      item2.longTitle = '2';
      const item2a = new TestView('Item 2');
      item2a.longTitle = '2a';
      pane.activateItem(item2a);
      expect(tabBar.tabForItem(item2).element.textContent).toMatch('2');
      expect(tabBar.tabForItem(item2a).element.textContent).toMatch('2a');
      pane.destroyItem(item2a);
      expect(tabBar.tabForItem(item2).element.textContent).toMatch('Item 2');
    });
  });

  describe("when a tab is clicked", () => {
    it("shows the associated item on the pane and focuses the pane", () => {
      spyOn(pane, 'activate');

      let {mousedown, click} = triggerClickEvent(tabBar.tabAtIndex(0).element, {button: 0});
      expect(pane.getActiveItem()).toBe(pane.getItems()[0]);
      // allows dragging
      expect(mousedown.preventDefault).not.toHaveBeenCalled();
      expect(click.preventDefault).toHaveBeenCalled();

      ({mousedown, click} = triggerClickEvent(tabBar.tabAtIndex(2).element, {button: 0}));
      expect(pane.getActiveItem()).toBe(pane.getItems()[2]);
      // allows dragging
      expect(mousedown.preventDefault).not.toHaveBeenCalled();
      expect(click.preventDefault).toHaveBeenCalled();
      expect(pane.activate.callCount).toBe(2);
    });

    it("closes the tab when middle clicked", () => {
      const {click} = triggerClickEvent(tabBar.tabForItem(editor1).element, {button: 1});

      expect(pane.getItems().length).toBe(2);
      expect(pane.getItems().indexOf(editor1)).toBe(-1);
      expect(editor1.isDestroyed()).toBeTruthy();
      expect(tabBar.getTabs().length).toBe(2);
      expect(tabBar.element.textContent).not.toMatch('sample.js');

      expect(click.preventDefault).toHaveBeenCalled();
    });

    it("doesn't switch tab when right (or ctrl-left) clicked", () => {
      spyOn(pane, 'activate');

      let {mousedown} = triggerClickEvent(tabBar.tabAtIndex(0).element, {button: 2});
      expect(pane.getActiveItem()).not.toBe(pane.getItems()[0]);
      expect(mousedown.preventDefault).toHaveBeenCalled();

      ({mousedown} = triggerClickEvent(tabBar.tabAtIndex(0).element, {button: 0, ctrlKey: true}));
      expect(pane.getActiveItem()).not.toBe(pane.getItems()[0]);
      expect(mousedown.preventDefault).toHaveBeenCalled();

      // We don't switch tabs, but the pane should still be activated
      // because of the mouse click
      expect(pane.activate).toHaveBeenCalled();
    });
  });

  describe("when a tab's close icon is clicked", () => it("destroys the tab's item on the pane", () => {
    tabBar.tabForItem(editor1).element.querySelector('.close-icon').click();
    expect(pane.getItems().length).toBe(2);
    expect(pane.getItems().indexOf(editor1)).toBe(-1);
    expect(editor1.isDestroyed()).toBeTruthy();
    expect(tabBar.getTabs().length).toBe(2);
    expect(tabBar.element.textContent).not.toMatch('sample.js');
  }));

  describe("when an item is activated", () => {
    let [item3] = Array.from([]);
    beforeEach(() => {
      item3 = new TestView("Item 3");
      pane.activateItem(item3);

      // Set up styles so the tab bar has a scrollbar
      tabBar.element.style.display = 'flex';
      tabBar.element.style.overflowX = 'scroll';
      tabBar.element.style.margin = '0';

      const container = document.createElement('div');
      container.style.width = '150px';
      container.appendChild(tabBar.element);
      jasmine.attachToDOM(container);

      // Expect there to be content to scroll
      expect(tabBar.element.scrollWidth).toBeGreaterThan(tabBar.element.clientWidth);
    });

    it("does not scroll to the item when it is visible", () => {
      pane.activateItem(item1);
      expect(tabBar.element.scrollLeft).toBe(0);

      pane.activateItem(editor1);
      expect(tabBar.element.scrollLeft).toBe(0);

      pane.activateItem(item2);
      expect(tabBar.element.scrollLeft).toBe(0);

      pane.activateItem(item3);
      expect(tabBar.element.scrollLeft).not.toBe(0);
    });

    it("scrolls to the item when it isn't completely visible", () => {
      tabBar.element.scrollLeft = 5;
      expect(tabBar.element.scrollLeft).toBe(5); // This can be 0 if there is no horizontal scrollbar

      pane.activateItem(item1);
      expect(tabBar.element.scrollLeft).toBe(0);

      pane.activateItem(item3);
      expect(tabBar.element.scrollLeft).toBe(tabBar.element.scrollWidth - tabBar.element.clientWidth);
    });
  });

  describe("when a tab item's title changes", () => it("updates the title of the item's tab", () => {
    editor1.buffer.setPath('/this/is-a/test.txt');
    expect(tabBar.tabForItem(editor1).element.textContent).toMatch('test.txt');
  }));

  describe("when two tabs have the same title", () => it("displays the long title on the tab if it's available from the item", () => {
    item1.title = "Old Man";
    item1.longTitle = "Grumpy Old Man";
    item1.emitTitleChanged();
    item2.title = "Old Man";
    item2.longTitle = "Jolly Old Man";
    item2.emitTitleChanged();

    expect(tabBar.tabForItem(item1).element.textContent).toMatch("Grumpy Old Man");
    expect(tabBar.tabForItem(item2).element.textContent).toMatch("Jolly Old Man");

    item2.longTitle = undefined;
    item2.emitTitleChanged();

    expect(tabBar.tabForItem(item1).element.textContent).toMatch("Grumpy Old Man");
    expect(tabBar.tabForItem(item2).element.textContent).toMatch("Old Man");
  }));

  describe("the close button", () => {
    it("is present in the center, regardless of the value returned by isPermanentDockItem()", () => {
      const item3 = new TestView('Item 3', undefined, "squirrel", "sample.js");
      expect(item3.isPermanentDockItem).toBeUndefined();
      const item4 = new TestView('Item 4', undefined, "squirrel", "sample.js", true);
      expect(typeof item4.isPermanentDockItem).toBe('function');
      const item5 = new TestView('Item 5', undefined, "squirrel", "sample.js", false);
      expect(typeof item5.isPermanentDockItem).toBe('function');
      pane.activateItem(item3);
      pane.activateItem(item4);
      pane.activateItem(item5);
      const tabs = tabBar.element.querySelectorAll('.tab');
      expect(tabs[2].querySelector('.close-icon')).not.toEqual(null);
      expect(tabs[3].querySelector('.close-icon')).not.toEqual(null);
      expect(tabs[4].querySelector('.close-icon')).not.toEqual(null);
    });

    if (atom.workspace.getRightDock == null) { return; }
    describe("in docks", () => {
      beforeEach(() => {
        pane = atom.workspace.getRightDock().getActivePane();
        tabBar = new TabBarView(pane, 'right');
      });

      it("isn't shown if the method returns true", () => {
        item1 = new TestView('Item 1', undefined, "squirrel", "sample.js", true);
        expect(typeof item1.isPermanentDockItem).toBe('function');
        pane.activateItem(item1);
        const tab = tabBar.element.querySelector('.tab');
        expect(tab.querySelector('.close-icon')).toEqual(null);
      });

      it("is shown if the method returns false", () => {
        item1 = new TestView('Item 1', undefined, "squirrel", "sample.js", false);
        expect(typeof item1.isPermanentDockItem).toBe('function');
        pane.activateItem(item1);
        const tab = tabBar.element.querySelector('.tab');
        expect(tab.querySelector('.close-icon')).not.toBeUndefined();
      });

      it("is shown if the method doesn't exist", () => {
        item1 = new TestView('Item 1', undefined, "squirrel", "sample.js");
        expect(item1.isPermanentDockItem).toBeUndefined();
        pane.activateItem(item1);
        const tab = tabBar.element.querySelector('.tab');
        expect(tab.querySelector('.close-icon')).not.toEqual(null);
      });
    });
  });

  describe("when an item has an icon defined", () => {
    it("displays the icon on the tab", () => {
      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).toHaveClass("icon");
      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).toHaveClass("icon-squirrel");
    });

    it("hides the icon from the tab if the icon is removed", () => {
      item1.getIconName = null;
      item1.emitIconChanged();
      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).not.toHaveClass("icon");
      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).not.toHaveClass("icon-squirrel");
    });

    it("updates the icon on the tab if the icon is changed", () => {
      item1.getIconName = () => "zap";
      item1.emitIconChanged();
      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).toHaveClass("icon");
      expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).toHaveClass("icon-zap");
    });

    describe("when showIcon is set to true in package settings", () => {
      beforeEach(() => {
        spyOn(tabBar.tabForItem(item1), 'updateIconVisibility').andCallThrough();

        atom.config.set("tabs.showIcons", true);

        waitsFor(() => tabBar.tabForItem(item1).updateIconVisibility.callCount > 0);

        runs(() => tabBar.tabForItem(item1).updateIconVisibility.reset());
      });

      it("doesn't hide the icon", () => expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).not.toHaveClass("hide-icon"));

      it("hides the icon from the tab when showIcon is changed to false", () => {
        atom.config.set("tabs.showIcons", false);

        waitsFor(() => tabBar.tabForItem(item1).updateIconVisibility.callCount > 0);

        runs(() => expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).toHaveClass("hide-icon"));
      });
    });

    describe("when showIcon is set to false in package settings", () => {
      beforeEach(() => {
        spyOn(tabBar.tabForItem(item1), 'updateIconVisibility').andCallThrough();

        atom.config.set("tabs.showIcons", false);

        waitsFor(() => tabBar.tabForItem(item1).updateIconVisibility.callCount > 0);

        runs(() => tabBar.tabForItem(item1).updateIconVisibility.reset());
      });

      it("hides the icon", () => expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).toHaveClass("hide-icon"));

      it("shows the icon on the tab when showIcon is changed to true", () => {
        atom.config.set("tabs.showIcons", true);

        waitsFor(() => tabBar.tabForItem(item1).updateIconVisibility.callCount > 0);

        expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).not.toHaveClass("hide-icon");
      });
    });
  });

  describe("when the item doesn't have an icon defined", () => {
    it("doesn't display an icon on the tab", () => {
      expect(tabBar.element.querySelectorAll('.tab')[2].querySelector('.title')).not.toHaveClass("icon");
      expect(tabBar.element.querySelectorAll('.tab')[2].querySelector('.title')).not.toHaveClass("icon-squirrel");
    });

    it("shows the icon on the tab if an icon is defined", () => {
      item2.getIconName = () => "squirrel";
      item2.emitIconChanged();
      expect(tabBar.element.querySelectorAll('.tab')[2].querySelector('.title')).toHaveClass("icon");
      expect(tabBar.element.querySelectorAll('.tab')[2].querySelector('.title')).toHaveClass("icon-squirrel");
    });
  });

  describe("when a tab item's modified status changes", () => it("adds or removes the 'modified' class to the tab based on the status", () => {
    const tab = tabBar.tabForItem(editor1);
    expect(editor1.isModified()).toBeFalsy();
    expect(tab.element).not.toHaveClass('modified');

    editor1.insertText('x');
    advanceClock(editor1.buffer.stoppedChangingDelay);
    expect(editor1.isModified()).toBeTruthy();
    expect(tab.element).toHaveClass('modified');

    editor1.undo();
    advanceClock(editor1.buffer.stoppedChangingDelay);
    expect(editor1.isModified()).toBeFalsy();
    expect(tab.element).not.toHaveClass('modified');
  }));

  describe("when a pane item moves to a new index", () => {
    // behavior is independent of addNewTabs config
    describe("when addNewTabsAtEnd is set to true in package settings", () => it("updates the order of the tabs to match the new item order", () => {
      atom.config.set("tabs.addNewTabsAtEnd", true);
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
      pane.moveItem(item2, 1);
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "Item 2", "sample.js"]);
      pane.moveItem(editor1, 0);
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 1", "Item 2"]);
      pane.moveItem(item1, 2);
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 2", "Item 1"]);
  }));

    describe("when addNewTabsAtEnd is set to false in package settings", () => it("updates the order of the tabs to match the new item order", () => {
      atom.config.set("tabs.addNewTabsAtEnd", false);
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
      pane.moveItem(item2, 1);
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "Item 2", "sample.js"]);
      pane.moveItem(editor1, 0);
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 1", "Item 2"]);
      pane.moveItem(item1, 2);
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 2", "Item 1"]);
  }));
});

  describe("context menu commands", () => {
    beforeEach(() => {
      const paneElement = pane.getElement();
      return paneElement.insertBefore(tabBar.element, paneElement.firstChild);
    });

    describe("when tabs:close-tab is fired", () => it("closes the active tab", () => {
      triggerClickEvent(tabBar.tabForItem(item2).element, {button: 2});
      atom.commands.dispatch(tabBar.element, 'tabs:close-tab');
      expect(pane.getItems().length).toBe(2);
      expect(pane.getItems().indexOf(item2)).toBe(-1);
      expect(tabBar.getTabs().length).toBe(2);
      expect(tabBar.element.textContent).not.toMatch('Item 2');
    }));

    describe("when tabs:close-other-tabs is fired", () => it("closes all other tabs except the active tab", () => {
      triggerClickEvent(tabBar.tabForItem(item2).element, {button: 2});
      atom.commands.dispatch(tabBar.element, 'tabs:close-other-tabs');
      expect(pane.getItems().length).toBe(1);
      expect(tabBar.getTabs().length).toBe(1);
      expect(tabBar.element.textContent).not.toMatch('sample.js');
      expect(tabBar.element.textContent).toMatch('Item 2');
    }));

    describe("when tabs:close-tabs-to-right is fired", () => it("closes only the tabs to the right of the active tab", () => {
      pane.activateItem(editor1);
      triggerClickEvent(tabBar.tabForItem(editor1).element, {button: 2});
      atom.commands.dispatch(tabBar.element, 'tabs:close-tabs-to-right');
      expect(pane.getItems().length).toBe(2);
      expect(tabBar.getTabs().length).toBe(2);
      expect(tabBar.element.textContent).not.toMatch('Item 2');
      expect(tabBar.element.textContent).toMatch('Item 1');
    }));

    describe("when tabs:close-tabs-to-left is fired", () => it("closes only the tabs to the left of the active tab", () => {
      pane.activateItem(editor1);
      triggerClickEvent(tabBar.tabForItem(editor1).element, {button: 2});
      atom.commands.dispatch(tabBar.element, 'tabs:close-tabs-to-left');
      expect(pane.getItems().length).toBe(2);
      expect(tabBar.getTabs().length).toBe(2);
      expect(tabBar.element.textContent).toMatch('Item 2');
      expect(tabBar.element.textContent).not.toMatch('Item 1');
    }));

    describe("when tabs:close-all-tabs is fired", () => it("closes all the tabs", () => {
      expect(pane.getItems().length).toBeGreaterThan(0);
      atom.commands.dispatch(tabBar.element, 'tabs:close-all-tabs');
      expect(pane.getItems().length).toBe(0);
    }));

    describe("when tabs:close-saved-tabs is fired", () => it("closes all the saved tabs", () => {
      item1.isModified = () => true;
      atom.commands.dispatch(tabBar.element, 'tabs:close-saved-tabs');
      expect(pane.getItems().length).toBe(1);
      expect(pane.getItems()[0]).toBe(item1);
    }));

    describe("when tabs:split-up is fired", () => it("splits the selected tab up", () => {
      triggerClickEvent(tabBar.tabForItem(item2).element, {button: 2});
      expect(atom.workspace.getCenter().getPanes().length).toBe(1);

      atom.commands.dispatch(tabBar.element, 'tabs:split-up');
      expect(atom.workspace.getCenter().getPanes().length).toBe(2);
      expect(atom.workspace.getCenter().getPanes()[1]).toBe(pane);
      expect(atom.workspace.getCenter().getPanes()[0].getItems()[0].getTitle()).toBe(item2.getTitle());
    }));

    describe("when tabs:split-down is fired", () => it("splits the selected tab down", () => {
      triggerClickEvent(tabBar.tabForItem(item2).element, {button: 2});
      expect(atom.workspace.getCenter().getPanes().length).toBe(1);

      atom.commands.dispatch(tabBar.element, 'tabs:split-down');
      expect(atom.workspace.getCenter().getPanes().length).toBe(2);
      expect(atom.workspace.getCenter().getPanes()[0]).toBe(pane);
      expect(atom.workspace.getCenter().getPanes()[1].getItems()[0].getTitle()).toBe(item2.getTitle());
    }));

    describe("when tabs:split-left is fired", () => it("splits the selected tab to the left", () => {
      triggerClickEvent(tabBar.tabForItem(item2).element, {button: 2});
      expect(atom.workspace.getCenter().getPanes().length).toBe(1);

      atom.commands.dispatch(tabBar.element, 'tabs:split-left');
      expect(atom.workspace.getCenter().getPanes().length).toBe(2);
      expect(atom.workspace.getCenter().getPanes()[1]).toBe(pane);
      expect(atom.workspace.getCenter().getPanes()[0].getItems()[0].getTitle()).toBe(item2.getTitle());
    }));

    describe("when tabs:split-right is fired", () => it("splits the selected tab to the right", () => {
      triggerClickEvent(tabBar.tabForItem(item2).element, {button: 2});
      expect(atom.workspace.getCenter().getPanes().length).toBe(1);

      atom.commands.dispatch(tabBar.element, 'tabs:split-right');
      expect(atom.workspace.getCenter().getPanes().length).toBe(2);
      expect(atom.workspace.getCenter().getPanes()[0]).toBe(pane);
      expect(atom.workspace.getCenter().getPanes()[1].getItems()[0].getTitle()).toBe(item2.getTitle());
    }));

    describe("when tabs:open-in-new-window is fired", () => {
      describe("by right-clicking on a tab", () => {
        beforeEach(() => {
          triggerClickEvent(tabBar.tabForItem(item1).element, {button: 2});
          expect(atom.workspace.getCenter().getPanes().length).toBe(1);
          spyOn(atom, 'open');
        });

        it("opens new window, closes current tab", () => {
          atom.commands.dispatch(tabBar.element, 'tabs:open-in-new-window');
          expect(atom.open).toHaveBeenCalled();

          expect(pane.getItems().length).toBe(2);
          expect(tabBar.getTabs().length).toBe(2);
          expect(tabBar.element.textContent).toMatch('Item 2');
          expect(tabBar.element.textContent).not.toMatch('Item 1');
        });

        it("resets the width on every tab", () => {
          // mouseenter (which will get emitted when going to right-click the tab) fixes the tab widths
          // Make sure after the command is executed the widths are reset
          triggerMouseEvent('mouseenter', tabBar.element);
          atom.commands.dispatch(tabBar.element, 'tabs:open-in-new-window');

          jasmine.attachToDOM(tabBar.element);
          expect(tabBar.tabAtIndex(0).element.style.maxWidth).toBe('');
          expect(tabBar.tabAtIndex(1).element.style.maxWidth).toBe('');
        });
      });

      describe("from the command palette", () => // See #309 for background

      it("does nothing", () => {
        spyOn(atom, 'open');
        atom.commands.dispatch(tabBar.element, 'tabs:open-in-new-window');
        expect(atom.open).not.toHaveBeenCalled();
      }));
    });
  });

  describe("command palette commands", () => {
    let paneElement = null;

    beforeEach(() => paneElement = pane.getElement());

    describe("when tabs:close-tab is fired", () => {
      it("closes the active tab", () => {
        atom.commands.dispatch(paneElement, 'tabs:close-tab');
        expect(pane.getItems().length).toBe(2);
        expect(pane.getItems().indexOf(item2)).toBe(-1);
        expect(tabBar.getTabs().length).toBe(2);
        expect(tabBar.element.textContent).not.toMatch('Item 2');
      });

      it("does nothing if no tabs are open", () => {
        atom.commands.dispatch(paneElement, 'tabs:close-tab');
        atom.commands.dispatch(paneElement, 'tabs:close-tab');
        atom.commands.dispatch(paneElement, 'tabs:close-tab');
        expect(pane.getItems().length).toBe(0);
        expect(tabBar.getTabs().length).toBe(0);
      });
    });

    describe("when tabs:close-other-tabs is fired", () => it("closes all other tabs except the active tab", () => {
      atom.commands.dispatch(paneElement, 'tabs:close-other-tabs');
      expect(pane.getItems().length).toBe(1);
      expect(tabBar.getTabs().length).toBe(1);
      expect(tabBar.element.textContent).not.toMatch('sample.js');
      expect(tabBar.element.textContent).toMatch('Item 2');
    }));

    describe("when tabs:close-tabs-to-right is fired", () => it("closes only the tabs to the right of the active tab", () => {
      pane.activateItem(editor1);
      atom.commands.dispatch(paneElement, 'tabs:close-tabs-to-right');
      expect(pane.getItems().length).toBe(2);
      expect(tabBar.getTabs().length).toBe(2);
      expect(tabBar.element.textContent).not.toMatch('Item 2');
      expect(tabBar.element.textContent).toMatch('Item 1');
    }));

    describe("when tabs:close-all-tabs is fired", () => it("closes all the tabs", () => {
      expect(pane.getItems().length).toBeGreaterThan(0);
      atom.commands.dispatch(paneElement, 'tabs:close-all-tabs');
      expect(pane.getItems().length).toBe(0);
    }));

    describe("when tabs:close-saved-tabs is fired", () => it("closes all the saved tabs", () => {
      item1.isModified = () => true;
      atom.commands.dispatch(paneElement, 'tabs:close-saved-tabs');
      expect(pane.getItems().length).toBe(1);
      expect(pane.getItems()[0]).toBe(item1);
    }));

    describe("when pane:close is fired", () => it("destroys all the tabs within the pane", () => {
      const pane2 = pane.splitDown({copyActiveItem: true});
      const tabBar2 = new TabBarView(pane2, 'center');
      const tab2 = tabBar2.tabAtIndex(0);
      spyOn(tab2, 'destroy');

      waitsForPromise(() => Promise.resolve(pane2.close()).then(() => expect(tab2.destroy).toHaveBeenCalled()));
    }));
  });

  describe("dragging and dropping tabs", () => {
    describe("when a tab is dragged within the same pane", () => {
      describe("when it is dropped on tab that's later in the list", () => it("moves the tab and its item, shows the tab's item, and focuses the pane", () => {
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);
        spyOn(pane, 'activate');

        const tabToDrag = tabBar.tabAtIndex(0);
        spyOn(tabToDrag, 'destroyTooltip');
        spyOn(tabToDrag, 'updateTooltip');
        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabToDrag.element, tabBar.tabAtIndex(1).element));
        tabBar.onDragStart(dragStartEvent);

        expect(tabToDrag.destroyTooltip).toHaveBeenCalled();
        expect(tabToDrag.updateTooltip).not.toHaveBeenCalled();

        tabBar.onDrop(dropEvent);
        expect(tabToDrag.updateTooltip).toHaveBeenCalled();

        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 1", "Item 2"]);
        expect(pane.getItems()).toEqual([editor1, item1, item2]);
        expect(pane.getActiveItem()).toBe(item1);
        expect(pane.activate).toHaveBeenCalled();
      }));

      describe("when it is dropped on a tab that's earlier in the list", () => it("moves the tab and its item, shows the tab's item, and focuses the pane", () => {
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);
        spyOn(pane, 'activate');

        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(2).element, tabBar.tabAtIndex(0).element));
        tabBar.onDragStart(dragStartEvent);
        tabBar.onDrop(dropEvent);

        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "Item 2", "sample.js"]);
        expect(pane.getItems()).toEqual([item1, item2, editor1]);
        expect(pane.getActiveItem()).toBe(item2);
        expect(pane.activate).toHaveBeenCalled();
      }));

      describe("when it is dropped on itself", () => it("doesn't move the tab or item, but does make it the active item and focuses the pane", () => {
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);
        spyOn(pane, 'activate');

        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(0).element, tabBar.tabAtIndex(0).element));
        tabBar.onDragStart(dragStartEvent);
        tabBar.onDrop(dropEvent);

        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item1);
        expect(pane.activate).toHaveBeenCalled();
      }));

      describe("when it is dropped on the tab bar", () => it("moves the tab and its item to the end", () => {
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);
        spyOn(pane, 'activate');

        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(0).element, tabBar.element));
        tabBar.onDragStart(dragStartEvent);
        tabBar.onDrop(dropEvent);

        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 2", "Item 1"]);
        expect(pane.getItems()).toEqual([editor1, item2, item1]);
    }));
  });

    describe("when a tab is dragged to a different pane", () => {
      let [pane2, tabBar2, item2b] = Array.from([]);

      beforeEach(() => {
        pane2 = pane.splitRight({copyActiveItem: true});
        [item2b] = Array.from(pane2.getItems());
        return tabBar2 = new TabBarView(pane2, 'center');
      });

      it("removes the tab and item from their original pane and moves them to the target pane", () => {
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);

        expect(tabBar2.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 2"]);
        expect(pane2.getItems()).toEqual([item2b]);
        expect(pane2.activeItem).toBe(item2b);
        spyOn(pane2, 'activate');

        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(0).element, tabBar2.tabAtIndex(0).element));
        tabBar.onDragStart(dragStartEvent);
        tabBar2.onDrop(dropEvent);

        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);

        expect(tabBar2.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 2", "Item 1"]);
        expect(pane2.getItems()).toEqual([item2b, item1]);
        expect(pane2.activeItem).toBe(item1);
        expect(pane2.activate).toHaveBeenCalled();
      });

      describe("when the tab is dragged to an empty pane", () => it("removes the tab and item from their original pane and moves them to the target pane", () => {
        pane2.destroyItems();

        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);

        expect(tabBar2.getTabs().map(tab => tab.element.textContent)).toEqual([]);
        expect(pane2.getItems()).toEqual([]);
        expect(pane2.activeItem).toBeUndefined();
        spyOn(pane2, 'activate');

        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(0).element, tabBar2.element));
        tabBar.onDragStart(dragStartEvent);
        tabBar2.onDragOver(dropEvent);
        tabBar2.onDrop(dropEvent);

        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);

        expect(tabBar2.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1"]);
        expect(pane2.getItems()).toEqual([item1]);
        expect(pane2.activeItem).toBe(item1);
        expect(pane2.activate).toHaveBeenCalled();
      }));

      describe("when addNewTabsAtEnd is set to true in package settings", () => it("moves the dragged tab to the desired index in the new pane", () => {
        atom.config.set("tabs.addNewTabsAtEnd", true);
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2);

        expect(tabBar2.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 2"]);
        expect(pane2.getItems()).toEqual([item2b]);
        expect(pane2.activeItem).toBe(item2b);
        spyOn(pane2, 'activate');

        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar2.tabAtIndex(0).element, tabBar.tabAtIndex(0).element));
        tabBar2.onDragStart(dragStartEvent);
        tabBar.onDrop(dropEvent);

        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "Item 2", "sample.js", "Item 2"]);
        expect(pane.getItems()).toEqual([item1, item2b, editor1, item2]);
        expect(pane.getActiveItem()).toBe(item2b);

        atom.config.set("tabs.addNewTabsAtEnd", false);
      }));

      describe("when alwaysShowTabBar is set to true in package settings", () => it("always shows the tab bar in the new pane", () => {
        atom.config.set("tabs.alwaysShowTabBar", true);
        expect(pane2.getItems().length).toBe(1);
        expect(tabBar2.element).not.toHaveClass('hidden');

        const [dragEnterEvent, dragLeaveEvent] = Array.from(buildDragEnterLeaveEvents(pane2.getElement(), pane.getElement()));

        tabBar2.onPaneDragEnter(dragEnterEvent);
        expect(tabBar2.element).not.toHaveClass('hidden');

        tabBar2.onPaneDragLeave(dragLeaveEvent);
        expect(tabBar2.element).not.toHaveClass('hidden');
      }));

      describe("when alwaysShowTabBar is set to false in package settings", () => {
        beforeEach(() => {
          atom.config.set("tabs.alwaysShowTabBar", false);
          expect(pane2.getItems().length).toBe(1);
          expect(tabBar2.element).toHaveClass('hidden');
        });

        it("toggles the tab bar in the new pane", () => {
          spyOn(tabBar2, 'itemIsAllowed').andReturn(true);
          const [dragEnterEvent, dragLeaveEvent] = Array.from(buildDragEnterLeaveEvents(pane2.getElement(), pane.getElement()));

          tabBar2.onPaneDragEnter(dragEnterEvent);
          expect(tabBar2.element).not.toHaveClass('hidden');

          tabBar2.onPaneDragLeave(dragLeaveEvent);
          expect(tabBar2.element).toHaveClass('hidden');
        });

        it("does not toggle the tab bar if the item cannot be moved to that pane", () => {
          spyOn(tabBar2, 'itemIsAllowed').andReturn(false);
          const [dragEnterEvent, dragLeaveEvent] = Array.from(buildDragEnterLeaveEvents(pane2.getElement(), pane.getElement()));

          tabBar2.onPaneDragEnter(dragEnterEvent);
          expect(tabBar2.element).toHaveClass('hidden');

          tabBar2.onPaneDragLeave(dragLeaveEvent);
          expect(tabBar2.element).toHaveClass('hidden');
        });

        it("does not toggle the tab bar if the item being dragged is not a tab", () => {
          const [dragEnterEvent, dragLeaveEvent] = Array.from(buildDragEnterLeaveEvents(pane2.getElement(), pane.getElement()));
          dragEnterEvent.dataTransfer.clearData('atom-tab-event');
          dragLeaveEvent.dataTransfer.clearData('atom-tab-event');

          tabBar2.onPaneDragEnter(dragEnterEvent);
          expect(tabBar2.element).toHaveClass('hidden');

          tabBar2.onPaneDragLeave(dragLeaveEvent);
          expect(tabBar2.element).toHaveClass('hidden');
        });
      });
    });

    describe("when a tab is dragged over a pane item", () => {
      beforeEach(() => {
        jasmine.attachToDOM(atom.workspace.getElement());
        return layout.activate();
      });

      afterEach(() => {
        layout.deactivate();
        return layout.test = {};});

      it("draws an overlay over the item", () => {
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        const tab = tabBar.tabAtIndex(2).element;
        layout.test = {
          pane,
          itemView: pane.getElement().querySelector('.item-views'),
          rect: {top: 0, left: 0, width: 100, height: 100}
        };

        expect(layout.view.classList.contains('visible')).toBe(false);
        // Drag into pane
        tab.ondrag({target: tab, clientX: 50, clientY: 50});
        expect(layout.view.classList.contains('visible')).toBe(true);
        expect(layout.view.style.height).toBe("100px");
        expect(layout.view.style.width).toBe("100px");
        // Drag out of pane
        delete layout.test.pane;
        tab.ondrag({target: tab, clientX: 200, clientY: 200});
        expect(layout.view.classList.contains('visible')).toBe(false);
      });

      it("cleaves the pane in two", () => {
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        const tab = tabBar.tabAtIndex(2).element;
        layout.test = {
          pane,
          itemView: pane.getElement().querySelector('.item-views'),
          rect: {top: 0, left: 0, width: 100, height: 100}
        };

        tab.ondrag({target: tab, clientX: 80, clientY: 50});
        tab.ondragend({target: tab, clientX: 80, clientY: 50});
        expect(atom.workspace.getCenter().getPanes().length).toEqual(2);
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js"]);
        expect(atom.workspace.getActivePane().getItems().length).toEqual(1);
      });

      describe("when the dragged tab is the only one in the pane", () => it("does nothing", () => {
        tabBar.getTabs()[0].element.querySelector('.close-icon').click();
        tabBar.getTabs()[1].element.querySelector('.close-icon').click();
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js"]);
        const tab = tabBar.tabAtIndex(0).element;
        layout.test = {
          pane,
          itemView: pane.getElement().querySelector('.item-views'),
          rect: {top: 0, left: 0, width: 100, height: 100}
        };

        tab.ondrag({target: tab, clientX: 80, clientY: 50});
        tab.ondragend({target: tab, clientX: 80, clientY: 50});
        expect(atom.workspace.getCenter().getPanes().length).toEqual(1);
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js"]);
    }));

      describe("when the pane is empty", () => it("moves the tab to the target pane", () => {
        const toPane = pane.splitDown();
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
        expect(toPane.getItems().length).toBe(0);
        const tab = tabBar.tabAtIndex(2).element;
        layout.test = {
          pane: toPane,
          itemView: toPane.getElement().querySelector('.item-views'),
          rect: {top: 0, left: 0, width: 100, height: 100}
        };

        tab.ondrag({target: tab, clientX: 80, clientY: 50});
        tab.ondragend({target: tab, clientX: 80, clientY: 50});
        expect(atom.workspace.getCenter().getPanes().length).toEqual(2);
        expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js"]);
        expect(atom.workspace.getActivePane().getItems().length).toEqual(1);
      }));

      describe("when the tab is not allowed in that pane", () => it("does not move the tab, nor does it create a split", () => {
        layout.test = {
          pane,
          itemView: pane.getElement().querySelector('.item-views'),
          rect: {top: 0, left: 0, width: 100, height: 100}
        };

        spyOn(layout, 'itemIsAllowedInPane').andReturn(false);
        spyOn(pane, 'split');

        const tab = tabBar.tabAtIndex(0).element;
        tab.ondrag({target: tab, clientX: 80, clientY: 50});
        layout.lastSplit = 'left';
        tab.ondragend({target: tab, clientX: 80, clientY: 50});

        expect(pane.split).not.toHaveBeenCalled();
      }));
    });

    describe("when a non-tab is dragged to pane", () => it("has no effect", () => {
      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
      expect(pane.getItems()).toEqual([item1, editor1, item2]);
      expect(pane.getActiveItem()).toBe(item2);
      spyOn(pane, 'activate');

      const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(0).element, tabBar.tabAtIndex(0).element));
      tabBar.onDrop(dropEvent);

      expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
      expect(pane.getItems()).toEqual([item1, editor1, item2]);
      expect(pane.getActiveItem()).toBe(item2);
      expect(pane.activate).not.toHaveBeenCalled();
    }));

    describe("when a tab is dragged out of application", () => it("should carry the file's information", () => {
      const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(1).element, tabBar.tabAtIndex(1).element));
      tabBar.onDragStart(dragStartEvent);

      expect(dragStartEvent.dataTransfer.getData("text/plain")).toEqual(editor1.getPath());
      if (process.platform === 'darwin') {
        expect(dragStartEvent.dataTransfer.getData("text/uri-list")).toEqual(`file://${editor1.getPath()}`);
      }
    }));

    describe("when a tab is dragged to another Atom window", () => {
      beforeEach(() => spyOn(pane, 'destroyItem').andCallThrough());

      it("closes the tab in the first window and opens the tab in the second window", () => {
        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(1).element, tabBar.tabAtIndex(0).element));
        tabBar.onDragStart(dragStartEvent);
        atom.getCurrentWindow().webContents.send('tab:dropped', pane.id, 1);

        // Can't spy on onDropOnOtherWindow since it's binded
        waitsFor('dragged pane item to be destroyed', () => pane.destroyItem.callCount === 1);

        runs(() => {
          expect(pane.getItems()).toEqual([item1, item2]);
          expect(pane.getActiveItem()).toBe(item2);

          dropEvent.dataTransfer.setData('from-window-id', tabBar.getWindowId() + 1);

          spyOn(tabBar, 'moveItemBetweenPanes').andCallThrough();
          return tabBar.onDrop(dropEvent);
        });

        waitsFor(() => tabBar.moveItemBetweenPanes.callCount > 0);

        runs(() => {
          const editor = atom.workspace.getActiveTextEditor();
          expect(editor.getPath()).toBe(editor1.getPath());
          expect(pane.getItems()).toEqual([item1, editor, item2]);});
    });

      it("transfers the text of the editor when it is modified", () => {
        editor1.setText('I came from another window');
        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(1).element, tabBar.tabAtIndex(0).element));
        tabBar.onDragStart(dragStartEvent);
        atom.getCurrentWindow().webContents.send('tab:dropped', pane.id, 1);

        // Can't spy on onDropOnOtherWindow since it's binded
        waitsFor('dragged pane item to be destroyed', () => pane.destroyItem.callCount === 1);

        runs(() => {
          dropEvent.dataTransfer.setData('from-window-id', tabBar.getWindowId() + 1);

          spyOn(tabBar, 'moveItemBetweenPanes').andCallThrough();
          return tabBar.onDrop(dropEvent);
        });

        waitsFor(() => tabBar.moveItemBetweenPanes.callCount > 0);

        runs(() => expect(atom.workspace.getActiveTextEditor().getText()).toBe('I came from another window'));
      });

      it("allows untitled editors to be moved between windows", () => {
        editor1.getBuffer().setPath(null);
        editor1.setText('I have no path');

        const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(1).element, tabBar.tabAtIndex(0).element));
        tabBar.onDragStart(dragStartEvent);
        atom.getCurrentWindow().webContents.send('tab:dropped', pane.id, 1);

        // Can't spy on onDropOnOtherWindow since it's binded
        waitsFor('dragged pane item to be destroyed', () => pane.destroyItem.callCount === 1);

        runs(() => {
          dropEvent.dataTransfer.setData('from-window-id', tabBar.getWindowId() + 1);

          spyOn(tabBar, 'moveItemBetweenPanes').andCallThrough();
          return tabBar.onDrop(dropEvent);
        });

        waitsFor(() => tabBar.moveItemBetweenPanes.callCount > 0);

        runs(() => {
          expect(atom.workspace.getActiveTextEditor().getText()).toBe('I have no path');
          expect(atom.workspace.getActiveTextEditor().getPath()).toBeUndefined();
        });
      });
    });

    if (atom.workspace.getLeftDock != null) {
      describe("when a tab is dragged to another pane container", () => {
        let [pane2, tabBar2, dockItem] = Array.from([]);

        beforeEach(() => {
          jasmine.attachToDOM(atom.workspace.getElement());
          pane = atom.workspace.getActivePane();
          pane2 = atom.workspace.getLeftDock().getActivePane();
          dockItem = new TestView('Dock Item');
          pane2.addItem(dockItem);
          tabBar2 = new TabBarView(pane2, 'left');
        });

        it("removes the tab and item from their original pane and moves them to the target pane", () => {
          expect(atom.workspace.getLeftDock().isVisible()).toBe(false);

          expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["Item 1", "sample.js", "Item 2"]);
          expect(pane.getItems()).toEqual([item1, editor1, item2]);
          expect(pane.getActiveItem()).toBe(item2);

          expect(tabBar2.getTabs().map(tab => tab.element.textContent)).toEqual(["Dock Item"]);
          expect(pane2.getItems()).toEqual([dockItem]);
          expect(pane2.getActiveItem()).toBe(dockItem);

          const [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(0).element, tabBar2.element));
          tabBar.onDragStart(dragStartEvent);
          expect(tabBar2.element.querySelector('.placeholder')).toBeNull();
          tabBar2.onDragOver(dropEvent);
          expect(tabBar2.element.querySelector('.placeholder')).not.toBeNull();
          tabBar2.onDrop(dropEvent);
          expect(tabBar2.element.querySelector('.placeholder')).toBeNull();

          expect(tabBar.getTabs().map(tab => tab.element.textContent)).toEqual(["sample.js", "Item 2"]);
          expect(pane.getItems()).toEqual([editor1, item2]);
          expect(pane.getActiveItem()).toBe(item2);

          expect(tabBar2.getTabs().map(tab => tab.element.textContent)).toEqual(["Dock Item", "Item 1"]);
          expect(pane2.getItems()).toEqual([dockItem, item1]);
          expect(pane2.activeItem).toBe(item1);
          expect(atom.workspace.getLeftDock().isVisible()).toBe(true);
        });

        it("shows a placeholder and allows the tab be dropped only if the item supports the target pane container location", () => {
          item1.getAllowedLocations = () => ['center', 'bottom'];
          let [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(0).element, tabBar2.element));
          tabBar.onDragStart(dragStartEvent);
          expect(tabBar2.element.querySelector('.placeholder')).toBeNull();
          tabBar2.onDragOver(dropEvent);
          expect(tabBar2.element.querySelector('.placeholder')).toBeNull();
          tabBar2.onDrop(dropEvent);
          expect(tabBar2.element.querySelector('.placeholder')).toBeNull();
          expect(pane.getItems()).toEqual([item1, editor1, item2]);
          expect(pane2.getItems()).toEqual([dockItem]);

          item1.getAllowedLocations = () => ['left'];
          [dragStartEvent, dropEvent] = Array.from(buildDragEvents(tabBar.tabAtIndex(0).element, tabBar2.element));
          tabBar.onDragStart(dragStartEvent);
          expect(tabBar2.element.querySelector('.placeholder')).toBeNull();
          tabBar2.onDragOver(dropEvent);
          expect(tabBar2.element.querySelector('.placeholder')).not.toBeNull();
          tabBar2.onDrop(dropEvent);
          expect(tabBar2.element.querySelector('.placeholder')).toBeNull();
          expect(pane.getItems()).toEqual([editor1, item2]);
          expect(pane2.getItems()).toEqual([dockItem, item1]);
      });
    });
    }
});

  describe("when the tab bar is double clicked", () => it("opens a new empty editor", () => {
    const newFileHandler = jasmine.createSpy('newFileHandler');
    atom.commands.add(tabBar.element, 'application:new-file', newFileHandler);

    triggerMouseEvent("dblclick", tabBar.getTabs()[0].element);
    expect(newFileHandler.callCount).toBe(0);

    triggerMouseEvent("dblclick", tabBar.element);
    expect(newFileHandler.callCount).toBe(1);
  }));

  describe("when the tab bar is right-clicked", () => {
    it("adds the right-clicked class when right-clicked", () => {
      triggerClickEvent(tabBar.tabAtIndex(0).element, {button: 2});
      expect(tabBar.tabAtIndex(0).element.classList.contains('right-clicked')).toBe(true);
      triggerClickEvent(tabBar.tabAtIndex(2).element, {button: 2});
      expect(tabBar.tabAtIndex(2).element.classList.contains('right-clicked')).toBe(true);
      expect(tabBar.tabAtIndex(0).element.classList.contains('right-clicked')).toBe(false);
    });
  });

  describe("when the mouse wheel is used on the tab bar", () => {
    describe("when tabScrolling is true in package settings", () => {
      beforeEach(() => {
        atom.config.set("tabs.tabScrolling", true);
        return atom.config.set("tabs.tabScrollingThreshold", 120);
      });

      describe("when the mouse wheel scrolls up", () => {
        it("changes the active tab to the previous tab", () => {
          expect(pane.getActiveItem()).toBe(item2);
          tabBar.element.dispatchEvent(buildWheelEvent(120));
          expect(pane.getActiveItem()).toBe(editor1);
        });

        it("changes the active tab to the previous tab only after the wheelDelta crosses the threshold", () => {
          expect(pane.getActiveItem()).toBe(item2);
          tabBar.element.dispatchEvent(buildWheelEvent(50));
          expect(pane.getActiveItem()).toBe(item2);
          tabBar.element.dispatchEvent(buildWheelEvent(50));
          expect(pane.getActiveItem()).toBe(item2);
          tabBar.element.dispatchEvent(buildWheelEvent(50));
          expect(pane.getActiveItem()).toBe(editor1);
        });
      });

      describe("when the mouse wheel scrolls down", () => it("changes the active tab to the previous tab", () => {
        expect(pane.getActiveItem()).toBe(item2);
        tabBar.element.dispatchEvent(buildWheelEvent(-120));
        expect(pane.getActiveItem()).toBe(item1);
      }));

      describe("when the mouse wheel scrolls up and shift key is pressed", () => it("does not change the active tab", () => {
        expect(pane.getActiveItem()).toBe(item2);
        tabBar.element.dispatchEvent(buildWheelPlusShiftEvent(120));
        expect(pane.getActiveItem()).toBe(item2);
      }));

      describe("when the mouse wheel scrolls down and shift key is pressed", () => it("does not change the active tab", () => {
        expect(pane.getActiveItem()).toBe(item2);
        tabBar.element.dispatchEvent(buildWheelPlusShiftEvent(-120));
        expect(pane.getActiveItem()).toBe(item2);
      }));

      describe("when the tabScrolling is changed to false", () => it("does not change the active tab when scrolling", () => {
        atom.config.set("tabs.tabScrolling", false);

        expect(pane.getActiveItem()).toBe(item2);
        tabBar.element.dispatchEvent(buildWheelEvent(120));
        expect(pane.getActiveItem()).toBe(item2);
      }));
    });

    describe("when tabScrolling is false in package settings", () => {
      beforeEach(() => atom.config.set("tabs.tabScrolling", false));

      describe("when the mouse wheel scrolls up one unit", () => it("does not change the active tab", () => {
        expect(pane.getActiveItem()).toBe(item2);
        tabBar.element.dispatchEvent(buildWheelEvent(120));
        expect(pane.getActiveItem()).toBe(item2);
      }));

      describe("when the mouse wheel scrolls down one unit", () => it("does not change the active tab", () => {
        expect(pane.getActiveItem()).toBe(item2);
        tabBar.element.dispatchEvent(buildWheelEvent(-120));
        expect(pane.getActiveItem()).toBe(item2);
      }));
    });
  });

  describe("when alwaysShowTabBar is true in package settings", () => {
    beforeEach(() => atom.config.set("tabs.alwaysShowTabBar", true));

    describe("when more than one tab is open", () => it("shows the tab bar", () => {
      expect(pane.getItems().length).toBe(3);
      expect(tabBar.element).not.toHaveClass('hidden');
    }));

    describe("when only one tab is open", () => it("shows the tab bar", () => {
      expect(pane.getItems().length).toBe(3);

      waitsForPromise(() => pane.destroyItem(item1));

      waitsForPromise(() => pane.destroyItem(item2));

      runs(() => {
        expect(pane.getItems().length).toBe(1);
        expect(tabBar.element).not.toHaveClass('hidden');
      });
    }));
  });

  describe("when alwaysShowTabBar is false in package settings", () => {
    beforeEach(() => atom.config.set("tabs.alwaysShowTabBar", false));

    describe("when more than one tab is open", () => it("shows the tab bar", () => {
      expect(pane.getItems().length).toBe(3);
      expect(tabBar.element).not.toHaveClass('hidden');
    }));

    describe("when only one tab is open", () => it("hides the tab bar", () => {
      expect(pane.getItems().length).toBe(3);

      waitsForPromise(() => pane.destroyItem(item1));

      waitsForPromise(() => pane.destroyItem(item2));

      runs(() => {
        expect(pane.getItems().length).toBe(1);
        expect(tabBar.element).toHaveClass('hidden');
      });
    }));

    describe("when there are multiple panes", () => it("hides each tab bar separately", () => {
      const item3 = new TestView('Item 3');
      const item4 = new TestView('Item 4');
      const pane2 = pane.splitRight({items: [item3, item4]});
      const tabBar2 = new TabBarView(pane2, 'center');

      expect(tabBar.element).not.toHaveClass('hidden');
      expect(tabBar2.element).not.toHaveClass('hidden');

      waitsForPromise(() => pane2.destroyItem(item3));

      runs(() => {
        expect(pane2.getItems().length).toBe(1);

        expect(tabBar.element).not.toHaveClass('hidden');
        expect(tabBar2.element).toHaveClass('hidden');
      });
    }));
  });

  if ((atom.workspace.buildTextEditor().isPending != null) || (atom.workspace.getActivePane().getActiveItem != null)) {
    const isPending = function(item) {
      if (item.isPending != null) {
        return item.isPending();
      } else {
        return atom.workspace.getActivePane().getPendingItem() === item;
      }
    };

    describe("when tab's pane item is pending", () => {
      beforeEach(() => pane.destroyItems());

      describe("when opening a new tab", () => it("adds tab with class 'temp'", () => {
        editor1 = null;
        waitsForPromise(() => atom.workspace.open('sample.txt', {pending: true}).then(o => editor1 = o));

        runs(() => {
          pane.activateItem(editor1);
          expect(tabBar.element.querySelectorAll('.tab .temp').length).toBe(1);
          expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).toHaveClass('temp');
        });
      }));

      describe("when tabs:keep-pending-tab is triggered on the pane", () => it("terminates pending state on the tab's item", () => {
        editor1 = null;
        waitsForPromise(() => atom.workspace.open('sample.txt', {pending: true}).then(o => editor1 = o));

        runs(() => {
          pane.activateItem(editor1);
          expect(isPending(editor1)).toBe(true);
          atom.commands.dispatch(atom.workspace.getActivePane().getElement(), 'tabs:keep-pending-tab');
          expect(isPending(editor1)).toBe(false);
        });
      }));

      describe("when there is a temp tab already", () => {
        it("it will replace an existing temporary tab", () => {
          editor1 = null;
          let editor2 = null;

          waitsForPromise(() => atom.workspace.open('sample.txt', {pending: true}).then(function(o) {
            editor1 = o;
            return atom.workspace.open('sample2.txt', {pending: true}).then(o => editor2 = o);
          }));

          runs(() => {
            expect(editor1.isDestroyed()).toBe(true);
            expect(tabBar.tabForItem(editor1)).toBeUndefined();
            expect(tabBar.tabForItem(editor2).element.querySelector('.title')).toHaveClass('temp');
          });
        });

        it("makes the tab permanent when double-clicking the tab", () => {
          let editor2 = null;

          waitsForPromise(() => atom.workspace.open('sample.txt', {pending: true}).then(o => editor2 = o));

          runs(() => {
            pane.activateItem(editor2);
            expect(tabBar.tabForItem(editor2).element.querySelector('.title')).toHaveClass('temp');
            triggerMouseEvent('dblclick', tabBar.tabForItem(editor2).element, {button: 0});
            expect(tabBar.tabForItem(editor2).element.querySelector('.title')).not.toHaveClass('temp');
          });
        });
      });

      describe("when editing a file in pending state", () => it("makes the item and tab permanent", () => {
        editor1 = null;
        waitsForPromise(() => atom.workspace.open('sample.txt', {pending: true}).then(function(o) {
          editor1 = o;
          pane.activateItem(editor1);
          editor1.insertText('x');
          return advanceClock(editor1.buffer.stoppedChangingDelay);
        }));

        runs(() => expect(tabBar.tabForItem(editor1).element.querySelector('.title')).not.toHaveClass('temp'));
      }));

      describe("when saving a file", () => it("makes the tab permanent", () => {
        editor1 = null;
        waitsForPromise(() => atom.workspace.open(path.join(temp.mkdirSync('tabs-'), 'sample.txt'), {pending: true}).then(function(o) {
          editor1 = o;
          pane.activateItem(editor1);
          return editor1.save();
        }));

        runs(() => expect(tabBar.tabForItem(editor1).element.querySelector('.title')).not.toHaveClass('temp'));
      }));

      describe("when splitting a pending tab", () => {
        editor1 = null;
        beforeEach(() => waitsForPromise(() => atom.workspace.open('sample.txt', {pending: true}).then(o => editor1 = o)));

        it("makes the tab permanent in the new pane", () => {
          pane.activateItem(editor1);
          const pane2 = pane.splitRight({copyActiveItem: true});
          const tabBar2 = new TabBarView(pane2, 'center');
          const newEditor = pane2.getActiveItem();
          expect(isPending(newEditor)).toBe(false);
          expect(tabBar2.tabForItem(newEditor).element.querySelector('.title')).not.toHaveClass('temp');
        });

        it("keeps the pending tab in the old pane", () => {
          expect(isPending(editor1)).toBe(true);
          expect(tabBar.tabForItem(editor1).element.querySelector('.title')).toHaveClass('temp');
        });
      });

      describe("when dragging a pending tab to a different pane", () => it("makes the tab permanent in the other pane", () => {
        editor1 = null;
        waitsForPromise(() => atom.workspace.open('sample.txt', {pending: true}).then(o => editor1 = o));

        runs(() => {
          pane.activateItem(editor1);
          const pane2 = pane.splitRight();

          const tabBar2 = new TabBarView(pane2, 'center');
          tabBar2.moveItemBetweenPanes(pane, 0, pane2, 1, editor1);

          expect(tabBar2.tabForItem(pane2.getActiveItem()).element.querySelector('.title')).not.toHaveClass('temp');
        });
      }));
    });
  }

  describe("integration with version control systems", () => {
    let [repository, tab, tab1] = Array.from([]);

    beforeEach(() => {
      tab = tabBar.tabForItem(editor1);
      spyOn(tab, 'setupVcsStatus').andCallThrough();
      spyOn(tab, 'updateVcsStatus').andCallThrough();

      tab1 = tabBar.tabForItem(item1);
      tab1.path = '/some/path/outside/the/repository';
      spyOn(tab1, 'updateVcsStatus').andCallThrough();

      // Mock the repository
      repository = jasmine.createSpyObj('repo', ['isPathIgnored', 'getCachedPathStatus', 'isStatusNew', 'isStatusModified']);
      repository.isStatusNew.andCallFake(status => status === 'new');
      repository.isStatusModified.andCallFake(status => status === 'modified');

      repository.onDidChangeStatus = function(callback) {
        if (this.changeStatusCallbacks == null) { this.changeStatusCallbacks = []; }
        this.changeStatusCallbacks.push(callback);
        return {dispose: () => _.remove(this.changeStatusCallbacks, callback)};
      };
      repository.emitDidChangeStatus = function(event) {
        return Array.from(this.changeStatusCallbacks != null ? this.changeStatusCallbacks : []).map((callback) => callback(event));
      };

      repository.onDidChangeStatuses = function(callback) {
        if (this.changeStatusesCallbacks == null) { this.changeStatusesCallbacks = []; }
        this.changeStatusesCallbacks.push(callback);
        return {dispose: () => _.remove(this.changeStatusesCallbacks, callback)};
      };
      repository.emitDidChangeStatuses = function(event) {
        return Array.from(this.changeStatusesCallbacks != null ? this.changeStatusesCallbacks : []).map((callback) => callback(event));
      };

      // Mock atom.project to pretend we are working within a repository
      spyOn(atom.project, 'repositoryForDirectory').andReturn(Promise.resolve(repository));

      atom.config.set("tabs.enableVcsColoring", true);

      return waitsFor(() => (repository.changeStatusCallbacks != null ? repository.changeStatusCallbacks.length : undefined) > 0);
    });

    describe("when working inside a VCS repository", () => {
      it("adds custom style for new items", () => {
        repository.getCachedPathStatus.andReturn('new');
        tab.updateVcsStatus(repository);
        expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).toHaveClass("status-added");
      });

      it("adds custom style for modified items", () => {
        repository.getCachedPathStatus.andReturn('modified');
        tab.updateVcsStatus(repository);
        expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).toHaveClass("status-modified");
      });

      it("adds custom style for ignored items", () => {
        repository.isPathIgnored.andReturn(true);
        tab.updateVcsStatus(repository);
        expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).toHaveClass("status-ignored");
      });

      it("does not add any styles for items not in the repository", () => {
        expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).not.toHaveClass("status-added");
        expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).not.toHaveClass("status-modified");
        expect(tabBar.element.querySelectorAll('.tab')[0].querySelector('.title')).not.toHaveClass("status-ignored");
      });
    });

    describe("when changes in item statuses are notified", () => {
      it("updates status for items in the repository", () => {
        tab.updateVcsStatus.reset();
        repository.emitDidChangeStatuses();
        expect(tab.updateVcsStatus.calls.length).toEqual(1);
      });

      it("updates the status of an item if it has changed", () => {
        repository.getCachedPathStatus.reset();
        expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).not.toHaveClass("status-modified");
        repository.emitDidChangeStatus({path: tab.path, pathStatus: "modified"});
        expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).toHaveClass("status-modified");
        expect(repository.getCachedPathStatus.calls.length).toBe(0);
      });

      it("does not update status for items not in the repository", () => {
        tab1.updateVcsStatus.reset();
        repository.emitDidChangeStatuses();
        expect(tab1.updateVcsStatus.calls.length).toEqual(0);
      });
    });

    describe("when an item is saved", () => {
      it("does not update VCS subscription if the item's path remains the same", () => {
        tab.setupVcsStatus.reset();
        tab.item.buffer.emitter.emit('did-save', {path: tab.path});
        expect(tab.setupVcsStatus.calls.length).toBe(0);
      });

      it("updates VCS subscription if the item's path has changed", () => {
        tab.setupVcsStatus.reset();
        tab.item.buffer.emitter.emit('did-save', {path: '/some/other/path'});
        expect(tab.setupVcsStatus.calls.length).toBe(1);
      });
    });

    describe("when enableVcsColoring changes in package settings", () => {
      it("removes status from the tab if enableVcsColoring is set to false", () => {
        repository.emitDidChangeStatus({path: tab.path, pathStatus: 'new'});

        expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).toHaveClass("status-added");
        atom.config.set("tabs.enableVcsColoring", false);
        expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).not.toHaveClass("status-added");
      });

      it("adds status to the tab if enableVcsColoring is set to true", () => {
        atom.config.set("tabs.enableVcsColoring", false);
        repository.getCachedPathStatus.andReturn('modified');
        expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).not.toHaveClass("status-modified");
        atom.config.set("tabs.enableVcsColoring", true);

        waitsFor(() => (repository.changeStatusCallbacks != null ? repository.changeStatusCallbacks.length : undefined) > 0);

        runs(() => expect(tabBar.element.querySelectorAll('.tab')[1].querySelector('.title')).toHaveClass("status-modified"));
      });
    });

    if (atom.workspace.getLeftDock != null) {
      describe("a pane in the dock", () => {
        beforeEach(() => main.activate());
        afterEach(() => main.deactivate());
        it("gets decorated with tabs", () => {
          const dock = atom.workspace.getLeftDock();
          const dockElement = dock.getElement();
          const item = new TestView('Dock Item 1');
          expect(dockElement.querySelectorAll('.tab').length).toBe(0);
          pane = dock.getActivePane();
          pane.activateItem(item);
          expect(dockElement.querySelectorAll('.tab').length).toBe(1);
          pane.destroyItem(item);
          expect(dockElement.querySelectorAll('.tab').length).toBe(0);
        });
      });
    }
  });
});
