describe("About", () => {
  let workspaceElement;

  beforeEach(async () => {
    workspaceElement = atom.views.getView(atom.workspace);
    atom.config.set("about.showOnStartup", false);
    await atom.packages.activatePackage("about");
  });

  describe("startup", () => {
    it("opens About by default", async () => {
      await atom.packages.deactivatePackage("about");
      atom.config.unset("about.showOnStartup");

      await atom.packages.activatePackage("about");

      expect(atom.workspace.getActivePaneItem().getURI()).toBe("atom://about");
    });

    it("stores the startup checkbox preference", async () => {
      atom.config.set("about.showOnStartup", true);
      await atom.workspace.open("atom://about");
      jasmine.attachToDOM(workspaceElement);

      const checkbox = workspaceElement.querySelector(".about-startup .input-checkbox");
      expect(checkbox.checked).toBe(true);

      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));

      expect(atom.config.get("about.showOnStartup")).toBe(false);
    });
  });

  it("deserializes correctly", () => {
    let deserializedAboutView = atom.deserializers.deserialize({
      deserializer: "AboutView",
      uri: "atom://about",
    });

    expect(deserializedAboutView).toBeTruthy();
  });

  it("uses the canonical Lumine logo", async () => {
    await atom.workspace.open("atom://about");
    jasmine.attachToDOM(workspaceElement);
    const logo = workspaceElement.querySelector(".about-logo");

    expect(logo.tagName).toBe("IMG");
    expect(logo.src.replace(/\\/g, "/")).toMatch(/\/resources\/app-icons\/lumine\.svg$/);
  });

  describe("when the about:about-atom command is triggered", () => {
    it("shows the About Lumine view", async () => {
      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector(".about")).not.toExist();
      await atom.workspace.open("atom://about");

      let aboutElement = workspaceElement.querySelector(".about");
      expect(aboutElement).toBeVisible();
    });
  });

  describe("when the About view is already open in another pane", () => {
    it("activates the existing view instead of adding a duplicate", async () => {
      const item = await atom.workspace.open("atom://about", { split: "left" });
      const aboutPane = atom.workspace.paneForItem(item);
      const otherPane = aboutPane.splitRight();
      expect(atom.workspace.getActivePane()).toBe(otherPane);

      const reopened = await atom.workspace.open("atom://about");
      expect(reopened).toBe(item);
      expect(atom.workspace.getActivePane()).toBe(aboutPane);
      expect(atom.workspace.getPaneItems().filter((i) => i === item).length).toBe(1);
    });
  });

  describe("when the About view is reopened after being destroyed", () => {
    it("creates a fresh view", async () => {
      const item = await atom.workspace.open("atom://about");
      const pane = atom.workspace.paneForItem(item);
      pane.destroyItem(item);
      expect(item.isDestroyed()).toBe(true);

      const reopened = await atom.workspace.open("atom://about");
      expect(reopened).not.toBe(item);
      expect(reopened.isDestroyed()).toBe(false);
      expect(reopened.getURI()).toBe("atom://about");
    });
  });

  describe("when the Lumine version number is clicked", () => {
    it("copies the version number to the clipboard", async () => {
      await atom.workspace.open("atom://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let versionContainer = aboutElement.querySelector(".atom");
      versionContainer.click();
      expect(atom.clipboard.read()).toBe(atom.getVersion());
    });
  });

  describe("the additional version numbers", () => {
    it("are shown by default", async () => {
      await atom.workspace.open("atom://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      expect(aboutElement.querySelector(".electron")).toBeVisible();
      expect(aboutElement.querySelector(".chrome")).toBeVisible();
      expect(aboutElement.querySelector(".node")).toBeVisible();
    });
  });

  describe("when the Electron version number is clicked", () => {
    it("copies the version number to the clipboard", async () => {
      await atom.workspace.open("atom://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let versionContainer = aboutElement.querySelector(".electron");
      versionContainer.click();
      expect(atom.clipboard.read()).toBe(process.versions.electron);
    });
  });

  describe("when the Chrome version number is clicked", () => {
    it("copies the version number to the clipboard", async () => {
      await atom.workspace.open("atom://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let versionContainer = aboutElement.querySelector(".chrome");
      versionContainer.click();
      expect(atom.clipboard.read()).toBe(process.versions.chrome);
    });
  });

  describe("when the Node version number is clicked", () => {
    it("copies the version number to the clipboard", async () => {
      await atom.workspace.open("atom://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let versionContainer = aboutElement.querySelector(".node");
      versionContainer.click();
      expect(atom.clipboard.read()).toBe(process.version);
    });
  });

  describe("check for update appears", () => {
    it('when "lumine-updater" is enabled', async () => {
      atom.packages.activatePackage("lumine-updater");
      await atom.workspace.open("atom://about");
      jasmine.attachToDOM(workspaceElement);

      let aboutElement = workspaceElement.querySelector(".about");
      let updateContainer = aboutElement.querySelector(".about-update-action-button");
      expect(updateContainer.innerText).toBe("Check for updates");
    });
  });
});
