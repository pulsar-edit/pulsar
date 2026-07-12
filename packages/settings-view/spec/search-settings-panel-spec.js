const SearchSettingsPanel = require("../lib/search-settings-panel");

describe("SearchSettingsPanel", () => {
  let searchSettingsPanel;

  beforeEach(() => {
    searchSettingsPanel = new SearchSettingsPanel(null);
  });

  afterEach(() => {
    searchSettingsPanel.destroy();
  });

  describe("handleSettingsString", () => {
    it("handles null values", () => {
      expect(searchSettingsPanel.handleSettingsString(null)).toBe("");
    });

    it("converts uppercase to lowercase", () => {
      expect(searchSettingsPanel.handleSettingsString("Hello World")).toBe("hello world");
    });
  });

  describe("getScore", () => {
    it("returns a positive score and match indexes for a matching query", () => {
      const result = searchSettingsPanel.getScore("hello world", "hello");
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchIndexes.length).toBeGreaterThan(0);
    });

    it("returns zero for non-matching and empty inputs", () => {
      expect(searchSettingsPanel.getScore("hello", "xyz")).toEqual({
        score: 0,
        matchIndexes: [],
      });
      expect(searchSettingsPanel.getScore(null, "hello")).toEqual({
        score: 0,
        matchIndexes: [],
      });
    });
  });

  describe("generateRanks", () => {
    it("ranks primary fields", () => {
      const result = searchSettingsPanel.generateRanks(
        "tab",
        "Tab Setting",
        "Just a friendly tab setting",
        "tabs",
        "tabSetting",
      );
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.matchIndexes.length).toBeGreaterThan(0);
    });

    it("allows description-only matches with a lower weight", () => {
      const result = searchSettingsPanel.generateRanks(
        "indentation",
        "Width",
        "Controls automatic indentation behavior",
        "editor",
        "tabLength",
      );
      expect(result.totalScore).toBeGreaterThan(0);
    });
  });

  describe("schema collection", () => {
    it("recursively indexes nested settings without mutating their schemas", () => {
      const schema = {
        example: {
          type: "object",
          properties: {
            group: {
              type: "object",
              title: "Group",
              properties: {
                child: {
                  type: "boolean",
                  title: "Child",
                  description: "A nested setting",
                },
              },
            },
          },
        },
      };

      const results = searchSettingsPanel.collectSettings(schema);
      expect(results.map((result) => result.path)).toEqual([
        "example.group",
        "example.group.child",
      ]);
      expect(schema.example.properties.group.path).not.toBeDefined();
      expect(schema.example.properties.group.rank).not.toBeDefined();
    });

    it("omits settings that have no editable destination", () => {
      const results = searchSettingsPanel.collectSettings({
        core: {
          type: "object",
          properties: {
            customFileTypes: { type: "object", properties: {} },
            themes: { type: "array" },
          },
        },
      });
      expect(results.map((result) => result.path)).toEqual(["core.themes"]);
    });
  });

  describe("query filters", () => {
    it("switches the active filter when a filter button is clicked", () => {
      const editorButton = searchSettingsPanel.refs.filterGroup.querySelector(
        '[data-search-filter="editor"]',
      );
      editorButton.click();

      expect(searchSettingsPanel.activeFilter).toBe("editor");
      expect(editorButton).toHaveClass("selected");
      expect(editorButton.getAttribute("aria-pressed")).toBe("true");
      expect(
        searchSettingsPanel.refs.filterGroup.querySelector('[data-search-filter="all"]'),
      ).not.toHaveClass("selected");
    });

    it("supports case-insensitive namespace prefixes", () => {
      expect(searchSettingsPanel.parseQuery("Editor: font size")).toEqual({
        filter: "editor",
        searchTerm: "font size",
      });
    });

    it("uses the selected filter when no prefix is present", () => {
      searchSettingsPanel.activeFilter = "packages";
      expect(searchSettingsPanel.parseQuery("spell check")).toEqual({
        filter: "packages",
        searchTerm: "spell check",
      });
    });
  });

  describe("search states", () => {
    it("shows guidance before a query and a useful empty result message", () => {
      expect(searchSettingsPanel.refs.resultsSection).toBeHidden();
      expect(searchSettingsPanel.refs.searchStatus.textContent).toContain("Type a setting name");

      searchSettingsPanel.updateSearchState("empty", { query: "does-not-exist" });
      expect(searchSettingsPanel.refs.resultsSection).toBeHidden();
      expect(searchSettingsPanel.refs.searchStatus.textContent).toContain("No settings found");
    });
  });
});
