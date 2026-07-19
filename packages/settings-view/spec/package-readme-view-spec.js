const PackageReadmeView = require("../lib/package-readme-view");

describe("PackageReadmeView", () => {
  let view = null;

  const readme = [
    "# Title",
    "",
    "## Table of contents",
    "",
    "- [Title](#title)",
    "- [Install](#install)",
    "- [User content foo](#user-content-foo)",
    "",
    "## Install",
    "",
    "Install instructions.",
    "",
    "## Foo",
    "",
    "## User content foo",
  ].join("\n");

  afterEach(() => {
    if (view) {
      view.destroy();
    }
    view = null;
  });

  describe("rendering a README with a table of contents", () => {
    it("adds safely prefixed heading ids for fragment links", () => {
      view = new PackageReadmeView(readme, "https://github.com/lumine-code/lumine", false);
      expect(view.packageReadme.querySelector("#user-content-title")).not.toBeNull();
      expect(view.packageReadme.querySelector("#user-content-install")).not.toBeNull();
    });

    it("does not inject heading link icons", () => {
      view = new PackageReadmeView(readme, "https://github.com/lumine-code/lumine", false);
      expect(view.packageReadme.querySelector("svg.octicon")).toBeNull();
    });

    it("preserves in-page fragment links for a remote README", () => {
      view = new PackageReadmeView(readme, "https://github.com/lumine-code/lumine", false);
      expect(view.packageReadme.querySelector('a[href="#install"]')).not.toBeNull();
    });

    it("scrolls to the matching heading when a fragment link is clicked", () => {
      view = new PackageReadmeView(readme, "https://github.com/lumine-code/lumine", false);
      jasmine.attachToDOM(view.element);

      const link = view.packageReadme.querySelector('a[href="#title"]');
      const target = view.packageReadme.querySelector("#user-content-title");
      spyOn(target, "scrollIntoView");

      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      expect(target.scrollIntoView).toHaveBeenCalled();
    });

    it("prefers the generated prefixed id over a colliding raw id", () => {
      view = new PackageReadmeView(readme, "https://github.com/lumine-code/lumine", false);
      const link = view.packageReadme.querySelector('a[href="#user-content-foo"]');
      const rawTarget = view.packageReadme.querySelector("#user-content-foo");
      const prefixedTarget = view.packageReadme.querySelector("#user-content-user-content-foo");
      spyOn(rawTarget, "scrollIntoView");
      spyOn(prefixedTarget, "scrollIntoView");

      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      expect(prefixedTarget.scrollIntoView).toHaveBeenCalled();
      expect(rawTarget.scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
