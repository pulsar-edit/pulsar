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
      expect(typeof obj.sequence === "string").toBe(true);
    });

    it("Returns the expected sequence", () => {
      let obj = searchSettingsPanel.getScore("hello world", "hello");
      expect(obj.sequence).toBe("hello");
    });

    it("Returns the expected score", () => {
      let obj = searchSettingsPanel.getScore("bank", "ba");
      expect(obj.score).toBe(0.5)
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

      expect(typeof obj.title === "object").toBe(true);
      expect(typeof obj.title.score === "number").toBe(true);
      expect(typeof obj.title.sequence === "string").toBe(true);
      expect(typeof obj.description === "object").toBe(true);
      expect(typeof obj.description.score === "number").toBe(true);
      expect(typeof obj.description.sequence === "string").toBe(true);
      expect(typeof obj.settingName === "object").toBe(true);
      expect(typeof obj.settingName.score === "number").toBe(true);
      expect(typeof obj.settingName.sequence === "string").toBe(true);
      expect(typeof obj.settingItem === "object").toBe(true);
      expect(typeof obj.settingItem.score === "number").toBe(true);
      expect(typeof obj.settingItem.sequence === "string").toBe(true);
      expect(typeof obj.totalScore === "number").toBe(true);
    });
  });

});
