const { it, fit, ffit, beforeEach, afterEach, conditionPromise } = require("./async-spec-helpers"); // eslint-disable-line no-unused-vars

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Style Guide", () => {
  beforeEach(async () => {
    await atom.packages.activatePackage("styleguide");
  });

  describe("the Styleguide view", () => {
    let styleGuideView;
    beforeEach(async () => {
      styleGuideView = await atom.workspace.open("atom://styleguide");
    });

    it("opens the style guide", () => {
      expect(styleGuideView.element.textContent).toContain("Styleguide");
    });

    it("assigns a grammar to its editors even if present before the correct grammar is added", async () => {
      jasmine.useRealClock();
      // Sections render on later animation frames and the grammar assignment
      // happens asynchronously after the language package activates, so poll
      // instead of sleeping for a fixed interval.
      await conditionPromise(
        () => styleGuideView.element.querySelector(".example-html atom-text-editor") != null,
        "the HTML example editor to render",
      );
      const editor = styleGuideView.element.querySelector(".example-html atom-text-editor");
      const te = editor.getModel();
      expect(te.getGrammar()?.scopeName).toBe("text.plain.null-grammar");

      await atom.packages.activatePackage("language-html");
      await conditionPromise(
        () => te.getGrammar()?.scopeName === "text.html.basic",
        "the HTML grammar to be assigned",
      );

      expect(te.getGrammar()?.scopeName).toBe("text.html.basic");
    });

    it("documents both the classic and extended theme variables", async () => {
      jasmine.useRealClock();
      // Sections render their content on an animation frame after expanding.
      await wait(50);
      const variableNames = Array.from(
        styleGuideView.element.querySelectorAll('[data-name="variables"] [data-var]'),
      ).map((el) => el.dataset.var);

      // Classic contract
      expect(variableNames).toContain("text-color");
      expect(variableNames).toContain("component-padding");
      // Extended contract added by the CSS custom-property migration
      expect(variableNames).toContain("accent-bg-color");
      expect(variableNames).toContain("text-color-on-info");
      expect(variableNames).toContain("level-1-color");
    });

    it("does not auto-select an item in the showcase select list", async () => {
      jasmine.useRealClock();
      // The section renders (and the select list filters/selects) on later frames.
      await wait(50);

      const section = styleGuideView.element.querySelector('[data-name="select-list"]');
      // The live SelectListView is the first example in the section.
      const liveExample = section.querySelector(".example");

      // A selected item would call scrollIntoViewIfNeeded and scroll the whole
      // styleguide down to this mid-page example on open.
      expect(liveExample.querySelector(".select-list .selected")).toBeNull();
    });

    it("labels each variable swatch with the active theme's resolved value", async () => {
      jasmine.useRealClock();
      jasmine.attachToDOM(styleGuideView.element);
      // Resolved values are filled in on an animation frame.
      await wait(50);

      const swatch = styleGuideView.element.querySelector(
        '[data-name="variables"] .is-color[data-var="text-color"]',
      );
      const value = swatch.querySelector(".is-value");
      expect(value).not.toBeNull();
      // The active theme resolves --text-color to a concrete color.
      expect(value.textContent).toMatch(/^(rgb|rgba|color|oklch|lab|lch|hsl)/);
    });
  });
});
