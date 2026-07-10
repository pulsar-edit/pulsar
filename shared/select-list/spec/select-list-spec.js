const {
  SelectListView,
  highlightMatches,
  getMatchIndices,
  createTwoLineItem,
} = require("../lib/select");

describe("SelectListView", () => {
  let view;

  function textItemView(props = {}) {
    return new SelectListView({
      items: ["one", "two", "three"],
      elementForItem: (item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      },
      ...props,
    });
  }

  function listTexts() {
    return Array.from(view.element.querySelectorAll("li"), (li) => li.textContent);
  }

  async function nextUpdate() {
    await SelectListView.getScheduler().getNextUpdatePromise();
  }

  beforeEach(() => {
    jasmine.attachToDOM(atom.views.getView(atom.workspace));
  });

  afterEach(async () => {
    if (view) {
      await view.destroy();
      view = null;
    }
  });

  describe("rendering and filtering", () => {
    it("renders all items initially and filters them as the query changes", async () => {
      view = textItemView();
      expect(listTexts()).toEqual(["one", "two", "three"]);

      view.refs.queryEditor.setText("tw");
      await nextUpdate();
      expect(listTexts()).toEqual(["two"]);

      view.refs.queryEditor.setText("");
      await nextUpdate();
      expect(listTexts()).toEqual(["one", "two", "three"]);
    });

    it("filters via filterKeyForItem for object items", async () => {
      view = new SelectListView({
        items: [{ name: "alpha" }, { name: "beta" }],
        filterKeyForItem: (item) => item.name,
        elementForItem: (item) => {
          const li = document.createElement("li");
          li.textContent = item.name;
          return li;
        },
      });

      view.refs.queryEditor.setText("bet");
      await nextUpdate();
      expect(listTexts()).toEqual(["beta"]);
    });

    it("limits the rendered items to maxResults", () => {
      view = textItemView({ maxResults: 2 });
      expect(listTexts()).toEqual(["one", "two"]);
    });

    it("renders emptyMessage when no items match", async () => {
      view = textItemView({ emptyMessage: "nothing here" });
      view.refs.queryEditor.setText("zzz");
      await nextUpdate();
      expect(view.refs.emptyMessage.textContent).toBe("nothing here");
    });

    it("renders two-line items from {primary, secondary} descriptors", () => {
      view = new SelectListView({
        items: ["item"],
        elementForItem: (item) => ({ primary: item, secondary: "detail" }),
      });
      const li = view.element.querySelector("li");
      expect(li.classList.contains("two-lines")).toBe(true);
      expect(li.querySelector(".primary-line").textContent).toBe("item");
      expect(li.querySelector(".secondary-line").textContent).toBe("detail");
    });

    it("passes matchIndices aligned with the filter key to elementForItem", async () => {
      view = new SelectListView({
        items: ["abc", "xyz"],
        elementForItem: (item, { filterKey, matchIndices }) => {
          const li = document.createElement("li");
          li.appendChild(highlightMatches(filterKey, matchIndices));
          return li;
        },
      });

      view.refs.queryEditor.setText("ac");
      await nextUpdate();
      const matches = view.element.querySelectorAll(".character-match");
      expect(Array.from(matches, (m) => m.textContent)).toEqual(["a", "c"]);
    });
  });

  describe("selection", () => {
    it("wraps when navigating past the ends of the list", async () => {
      view = textItemView();
      expect(view.getSelectedItem()).toBe("one");

      await view.selectPrevious();
      expect(view.getSelectedItem()).toBe("three");

      await view.selectNext();
      expect(view.getSelectedItem()).toBe("one");

      await view.selectLast();
      expect(view.getSelectedItem()).toBe("three");

      await view.selectFirst();
      expect(view.getSelectedItem()).toBe("one");
    });

    it("marks the selected item's element and reports selection changes", async () => {
      const selections = [];
      view = textItemView({ didChangeSelection: (item) => selections.push(item) });

      await view.selectNext();
      expect(view.element.querySelector("li.selected").textContent).toBe("two");
      expect(selections[selections.length - 1]).toBe("two");
    });

    it("confirms the selected item and empty selections", async () => {
      const confirmed = [];
      let confirmedEmpty = false;
      view = textItemView({
        didConfirmSelection: (item) => confirmed.push(item),
        didConfirmEmptySelection: () => (confirmedEmpty = true),
      });

      view.confirmSelection();
      expect(confirmed).toEqual(["one"]);

      view.refs.queryEditor.setText("zzz");
      await nextUpdate();
      view.confirmSelection();
      expect(confirmedEmpty).toBe(true);
    });

    it("invokes didCancelSelection on cancel", () => {
      let cancelled = false;
      view = textItemView({ didCancelSelection: () => (cancelled = true) });
      view.cancelSelection();
      expect(cancelled).toBe(true);
    });
  });

  describe("panel management", () => {
    it("shows and hides a modal panel and focuses the query editor", () => {
      view = textItemView();
      expect(view.isVisible()).toBeFalsy();

      view.show();
      expect(view.isVisible()).toBe(true);
      expect(atom.workspace.getModalPanels()).toContain(view.panel);
      expect(view.element.contains(document.activeElement)).toBe(true);

      view.hide();
      expect(view.isVisible()).toBe(false);

      view.toggle();
      expect(view.isVisible()).toBe(true);
    });

    it("creates the panel hidden on getPanel() and reuses it on show()", () => {
      view = textItemView();
      const panel = view.getPanel();
      expect(panel.isVisible()).toBe(false);
      expect(atom.workspace.getModalPanels()).toContain(panel);

      view.show();
      expect(view.panel).toBe(panel);
      expect(panel.isVisible()).toBe(true);
    });

    it("exposes panelItem as the panel's item", () => {
      const wrapper = {};
      view = textItemView({ panelItem: wrapper });
      wrapper.element = view.element;

      expect(view.getPanel().getItem()).toBe(wrapper);
    });

    it("calls willShow before becoming visible", () => {
      let willShowCalled = false;
      let visibleDuringWillShow = null;
      view = textItemView({
        willShow: () => {
          willShowCalled = true;
          visibleDuringWillShow = view.isVisible();
        },
      });
      view.show();
      expect(willShowCalled).toBe(true);
      expect(visibleDuringWillShow).toBeFalsy();
    });

    it("destroys its panel on destroy", async () => {
      view = textItemView();
      const panel = view.getPanel();
      await view.destroy();
      view = null;
      expect(atom.workspace.getModalPanels()).not.toContain(panel);
    });
  });

  describe("initiallyVisibleItemCount", () => {
    it("renders items beyond the count with visible: false", () => {
      const items = [];
      for (let i = 0; i < 10; i++) items.push(`item-${i}`);

      view = new SelectListView({
        items,
        initiallyVisibleItemCount: 4,
        elementForItem: (item, { visible }) => {
          const li = document.createElement("li");
          if (visible) li.textContent = item;
          return li;
        },
      });

      const texts = listTexts();
      expect(texts.length).toBe(10);
      expect(texts.slice(0, 4)).toEqual(["item-0", "item-1", "item-2", "item-3"]);
      expect(texts.slice(4).every((text) => text === "")).toBe(true);
    });

    it("re-renders an item with visible: true when selected", async () => {
      const items = ["a", "b", "c"];
      view = new SelectListView({
        items,
        initiallyVisibleItemCount: 1,
        elementForItem: (item, { visible }) => {
          const li = document.createElement("li");
          if (visible) li.textContent = item;
          return li;
        },
      });
      expect(listTexts()).toEqual(["a", "", ""]);

      await view.selectNext();
      expect(listTexts()).toEqual(["a", "b", ""]);
    });

    it("always reports visible: true when the feature is off", () => {
      const seen = [];
      view = new SelectListView({
        items: ["x"],
        elementForItem: (item, { visible }) => {
          seen.push(visible);
          return document.createElement("li");
        },
      });
      expect(seen).toEqual([true]);
    });
  });

  describe("update()", () => {
    it("replaces items, query and messages", async () => {
      view = textItemView();

      await view.update({ items: ["four", "five"] });
      expect(listTexts()).toEqual(["four", "five"]);

      await view.update({ query: "fi" });
      expect(listTexts()).toEqual(["five"]);

      await view.update({ errorMessage: "boom", infoMessage: "fyi", loadingMessage: "wait" });
      expect(view.refs.errorMessage.textContent).toBe("boom");
      expect(view.refs.infoMessage.textContent).toBe("fyi");
      expect(view.refs.loadingMessage.textContent).toBe("wait");
    });
  });

  describe("helpers", () => {
    it("getMatchIndices returns the matched character positions", () => {
      const indices = getMatchIndices("MyComponent.js", "mcjs");
      expect(Array.isArray(indices)).toBe(true);
      expect(indices.length).toBe(4);
      expect(getMatchIndices("abc", "zzz")).toBeNull();
    });

    it("highlightMatches wraps matched characters in .character-match spans", () => {
      const fragment = highlightMatches("abcdef", [0, 1, 3]);
      const el = document.createElement("div");
      el.appendChild(fragment);
      expect(el.textContent).toBe("abcdef");
      const matches = Array.from(el.querySelectorAll(".character-match"), (m) => m.textContent);
      expect(matches).toEqual(["ab", "d"]);
    });

    it("createTwoLineItem builds a two-line li with icon classes", () => {
      const li = createTwoLineItem({ primary: "top", secondary: "bottom", icon: ["icon-file"] });
      expect(li.classList.contains("two-lines")).toBe(true);
      expect(li.querySelector(".primary-line").classList.contains("icon-file")).toBe(true);
      expect(li.querySelector(".primary-text").textContent).toBe("top");
      expect(li.querySelector(".secondary-line").textContent).toBe("bottom");
    });
  });
});
