const BadgeView = require("../lib/badge-view");

describe("BadgeView", function () {
  it("renders a colored dot classed by the badge type", function () {
    const view = new BadgeView({ title: "Outdated", text: "Update it", type: "warn" });
    expect(view.element).toHaveClass("package-badge-dot");
    expect(view.element).toHaveClass("badge-dot-warn");
  });

  it("falls back to the default dot for an unknown type", function () {
    const view = new BadgeView({ title: "Note" });
    expect(view.element).toHaveClass("badge-dot-default");
    expect(view.element).not.toHaveClass("has-link");
  });

  it("combines the title and text for the hover tooltip", function () {
    const view = new BadgeView({ title: "Outdated", text: "GitHub install recommended" });
    expect(view.tooltipText()).toBe("Outdated: GitHub install recommended");
  });

  it("opens the badge link in the browser when clicked", function () {
    spyOn(atom, "openExternal");
    const view = new BadgeView({
      title: "Outdated",
      type: "warn",
      link: "https://example.test/badge",
    });
    expect(view.element).toHaveClass("has-link");
    jasmine.attachToDOM(view.element);
    view.element.click();
    expect(atom.openExternal).toHaveBeenCalledWith("https://example.test/badge");
  });
});
