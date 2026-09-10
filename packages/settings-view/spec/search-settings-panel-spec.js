const SearchSettingsPanel = require('../lib/search-settings-panel');

describe("SearchSettingsPanel", () => {

  describe("handleSettingsString", () => {
    let searchSettingsPanel = null;

    beforeEach(() => {
      searchSettingsPanel = new SearchSettingsPanel(null);
    });

    it("Is able to handle null values", () => {
      let string = searchSettingsPanel.handleSettingsString(null);
      expect(string).toBe("");
    });

    it("Is able to convert upercase to lowercase", () => {
      let string = searchSettingsPanel.handleSettingsString("Hello World");
      expect(string).toBe("hello world");
    });

    it("Does nothing to an already lowercase string", () => {
      let string = searchSettingsPanel.handleSettingsString("hello world");
      expect(string).toBe("hello world");
    });

  });

  describe("getScore", () => {
    let searchSettingsPanel = null;

    beforeEach(() => {
      searchSettingsPanel = new SearchSettingsPanel(null);
    });

    it("Returns a properly structured object", () => {
      let obj = searchSettingsPanel.getScore("hello world", "hello");
      expect(typeof obj === "object").toBe(true);
      expect(typeof obj.score === "number").toBe(true);
      expect(Array.isArray(obj.matchIndexes)).toBe(true);
    });

    it("Returns a positive score for a matching query", () => {
      let obj = searchSettingsPanel.getScore("hello world", "hello");
      expect(obj.score).toBeGreaterThan(0);
      expect(obj.matchIndexes.length).toBeGreaterThan(0);
    });

    it("Returns zero score for non-matching query", () => {
      let obj = searchSettingsPanel.getScore("hello", "xyz");
      expect(obj.score).toBe(0);
      expect(obj.matchIndexes.length).toBe(0);
    });

    it("Returns zero score for empty inputs", () => {
      let obj = searchSettingsPanel.getScore(null, "hello");
      expect(obj.score).toBe(0);
      obj = searchSettingsPanel.getScore("hello", null);
      expect(obj.score).toBe(0);
    });

  });

  describe("generateRanks", () => {
    let searchSettingsPanel = null;

    beforeEach(() => {
      searchSettingsPanel = new SearchSettingsPanel(null);
    });

    it("Returns a properly structured object", () => {
      let obj = searchSettingsPanel.generateRanks(
        "tab",
        "Tab Setting",
        "Just a friendly tab setting",
        "tabs",
        "tabSetting"
      );

      expect(typeof obj.totalScore === "number").toBe(true);
      expect(obj.totalScore).toBeGreaterThan(0);
      expect(Array.isArray(obj.matchIndexes)).toBe(true);
      expect(obj.matchIndexes.length).toBeGreaterThan(0);
    });
  });

});
