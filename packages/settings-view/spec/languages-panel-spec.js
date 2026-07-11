const LanguagesPanel = require("../lib/languages-panel");

describe("LanguagesPanel", () => {
  let panel = null;

  beforeEach(async () => {
    await atom.packages.activatePackage("language-javascript");
    panel = new LanguagesPanel();
  });

  afterEach(() => {
    panel.destroy();
  });

  it("lists the defaults entry and the loaded grammars", () => {
    const options = Array.from(panel.refs.languageSelect.options);
    expect(options[0].textContent).toBe("All Languages (defaults)");
    const labels = options.map((option) => option.textContent);
    expect(labels).toContain("JavaScript");
    const jsOption = options.find((option) => option.textContent === "JavaScript");
    expect(jsOption.value).toBe("source.js");
  });

  it("shows the language namespace defaults panel initially", () => {
    const control = panel.element.querySelector('[id="language.tabLength"]');
    expect(control).toExist();
    expect(panel.refs.grammarInfo.style.display).toBe("none");
  });

  it("switches to a scoped settings panel when a language is chosen", () => {
    panel.refs.languageSelect.value = "source.js";
    panel.refs.languageSelect.dispatchEvent(new Event("change"));

    expect(panel.settingsPanel.options.scopeName).toBe(".source.js");
    expect(panel.element.querySelector('[id="language.tabLength"]')).toExist();
    expect(panel.refs.grammarInfo.textContent).toContain("source.js");
  });

  it("writes scoped overrides through the scoped settings panel", () => {
    panel.refs.languageSelect.value = "source.js";
    panel.refs.languageSelect.dispatchEvent(new Event("change"));

    panel.settingsPanel.set("language.tabLength", 8);
    expect(atom.config.get("language.tabLength", { scope: ["source.js"] })).toBe(8);
    expect(atom.config.get("language.tabLength")).toBe(2);
  });

  it("falls back to the defaults entry when the chosen grammar goes away", async () => {
    panel.refs.languageSelect.value = "source.js";
    panel.refs.languageSelect.dispatchEvent(new Event("change"));

    await atom.packages.deactivatePackage("language-javascript");
    panel.populateLanguageSelect();
    expect(panel.selectedScopeName).toBe("");
    expect(panel.refs.grammarInfo.style.display).toBe("none");
  });
});
