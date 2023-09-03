
const StatusBarView = require('../lib/status-bar-view');

describe("StatusBarView", function() {
  let statusBarView = null;

  class TestItem {
    constructor(id) {
      this.id = id;
    }
  }

  beforeEach(function() {
    statusBarView = new StatusBarView();

    atom.views.addViewProvider(TestItem, function(model) {
      const element = document.createElement("item-view");
      element.model = model;
      return element;
    });
  });

  describe("::addLeftTile({item, priority})", function() {
    it("appends the view for the given item to its left side", function() {
      const testItem1 = new TestItem(1);
      const testItem2 = new TestItem(2);
      const testItem3 = new TestItem(3);

      const tile1 = statusBarView.addLeftTile({item: testItem1, priority: 10});
      const tile2 = statusBarView.addLeftTile({item: testItem2, priority: 30});
      const tile3 = statusBarView.addLeftTile({item: testItem3, priority: 20});

      const {leftPanel} = statusBarView;

      expect(leftPanel.children[0].nodeName).toBe("ITEM-VIEW");
      expect(leftPanel.children[1].nodeName).toBe("ITEM-VIEW");
      expect(leftPanel.children[2].nodeName).toBe("ITEM-VIEW");

      expect(leftPanel.children[0].model).toBe(testItem1);
      expect(leftPanel.children[1].model).toBe(testItem3);
      expect(leftPanel.children[2].model).toBe(testItem2);

      expect(statusBarView.getLeftTiles()).toEqual([tile1, tile3, tile2]);
      expect(tile1.getPriority()).toBe(10);
      expect(tile1.getItem()).toBe(testItem1);
    });

    it("allows the view to be removed", function() {
      const testItem = new TestItem(1);
      const tile = statusBarView.addLeftTile({item: testItem, priority: 10});
      tile.destroy();
      expect(statusBarView.leftPanel.children.length).toBe(0);

      return statusBarView.addLeftTile({item: testItem, priority: 9});
    });

    describe("when no priority is given", () => it("appends the item", function() {
      const testItem1 = new TestItem(1);
      const testItem2 = new TestItem(2);

      statusBarView.addLeftTile({item: testItem1, priority: 1000});
      statusBarView.addLeftTile({item: testItem2});

      const {leftPanel} = statusBarView;
      expect(leftPanel.children[0].model).toBe(testItem1);
      expect(leftPanel.children[1].model).toBe(testItem2);
    }));
  });

  describe("::addRightTile({item, priority})", function() {
    it("appends the view for the given item to its right side", function() {
      const testItem1 = new TestItem(1);
      const testItem2 = new TestItem(2);
      const testItem3 = new TestItem(3);

      const tile1 = statusBarView.addRightTile({item: testItem1, priority: 10});
      const tile2 = statusBarView.addRightTile({item: testItem2, priority: 30});
      const tile3 = statusBarView.addRightTile({item: testItem3, priority: 20});

      const {rightPanel} = statusBarView;

      expect(rightPanel.children[0].nodeName).toBe("ITEM-VIEW");
      expect(rightPanel.children[1].nodeName).toBe("ITEM-VIEW");
      expect(rightPanel.children[2].nodeName).toBe("ITEM-VIEW");

      expect(rightPanel.children[0].model).toBe(testItem2);
      expect(rightPanel.children[1].model).toBe(testItem3);
      expect(rightPanel.children[2].model).toBe(testItem1);

      expect(statusBarView.getRightTiles()).toEqual([tile2, tile3, tile1]);
      expect(tile1.getPriority()).toBe(10);
      expect(tile1.getItem()).toBe(testItem1);
    });

    it("allows the view to be removed", function() {
      const testItem = new TestItem(1);
      const disposable = statusBarView.addRightTile({item: testItem, priority: 10});
      disposable.destroy();
      expect(statusBarView.rightPanel.children.length).toBe(0);

      return statusBarView.addRightTile({item: testItem, priority: 11});
    });

    describe("when no priority is given", () => it("prepends the item", function() {
      const testItem1 = new TestItem(1, {priority: 1000});
      const testItem2 = new TestItem(2);

      statusBarView.addRightTile({item: testItem1, priority: 1000});
      statusBarView.addRightTile({item: testItem2});

      const {rightPanel} = statusBarView;
      expect(rightPanel.children[0].model).toBe(testItem2);
      expect(rightPanel.children[1].model).toBe(testItem1);
    }));
  });
});
