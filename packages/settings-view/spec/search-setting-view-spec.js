const SearchSettingView = require("../lib/search-setting-view");

describe("SearchSettingView", () => {
  let view;
  let settingsView;

  beforeEach(() => {
    atom.config.setSchema("search-test-package", {
      type: "object",
      properties: {
        nested: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              title: "Enable Search Test",
              description: "Enables the **test** feature.",
              default: false,
            },
          },
        },
      },
    });
    settingsView = { openSetting: jasmine.createSpy("openSetting") };
    view = new SearchSettingView(
      {
        path: "search-test-package.nested.enabled",
        rank: { totalScore: 0.75, matchIndexes: [] },
      },
      settingsView,
      "search",
    );
  });

  afterEach(() => view.destroy());

  it("renders a native keyboard-focusable link", () => {
    expect(view.refs.settingLink.getAttribute("href")).toBe(
      "atom://config/packages/search-test-package",
    );
    expect(view.refs.settingLink.tabIndex).toBe(0);
  });

  it("opens and reveals the selected setting", () => {
    view.refs.settingLink.click();
    expect(settingsView.openSetting).toHaveBeenCalledWith("search-test-package.nested.enabled");
  });

  it("renders setting descriptions as sanitized markdown", () => {
    expect(view.element.querySelector(".search-description strong").textContent).toBe("test");
  });
});
