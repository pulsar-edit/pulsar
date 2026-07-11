/** @babel */

import { CompositeDisposable } from "atom";

let GuideView, ChangeLogView;

const ABOUT_URI = "atom://about";
const GUIDE_URI = "atom://welcome/guide";
const CHANGELOG_URI = "atom://welcome/changelog";

export default class WelcomePackage {
  async activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.workspace.addOpener((filePath) => {
        if (filePath === CHANGELOG_URI) {
          return this.createChangeLogView({ uri: CHANGELOG_URI });
        }
      }),
    );

    this.subscriptions.add(
      atom.workspace.addOpener((filePath) => {
        if (filePath === GUIDE_URI) {
          return this.createGuideView({ uri: GUIDE_URI });
        }
      }),
    );

    this.subscriptions.add(atom.commands.add("atom-workspace", "welcome:show", () => this.show()));

    this.subscriptions.add(
      atom.commands.add("atom-workspace", "welcome:showchangelog", () => this.showChangeLog()),
    );

    const showAbout = atom.config.get("welcome.showOnStartup");
    const showGuide = atom.config.get("welcome.showGuideOnStartup");
    if (showAbout || showGuide) {
      await this.show({ about: showAbout, guide: showGuide });
    }

    if (atom.config.get("welcome.showChangeLog")) {
      // Use new `.versionSatisfies()` API to see if last viewed changelog is
      // less than the current Lumine version
      if (atom.versionSatisfies(`> ${atom.config.get("welcome.lastViewedChangeLog")}`)) {
        await this.showChangeLog();
      }
    }
  }

  async show({ about = true, guide = true } = {}) {
    const opened = [];
    if (about) {
      // The About pane (owned by the `about` package) serves as the info panel.
      // Ensure that package is active before opening its atom://about URI.
      await atom.packages.activatePackage("about");
      opened.push(atom.workspace.open(ABOUT_URI, { split: "left" }));
    }
    if (guide) {
      opened.push(atom.workspace.open(GUIDE_URI, { split: "right" }));
    }
    return Promise.all(opened);
  }

  showChangeLog() {
    const paneWillShow =
      atom.config.get("welcome.showOnStartup") || atom.config.get("welcome.showGuideOnStartup");
    if (paneWillShow) {
      // If a welcome pane will also appear, open the changelog on the bottom pane
      return Promise.all([atom.workspace.open(CHANGELOG_URI, { split: "down" })]);
    } else {
      // But if no welcome pane is shown, show the changelog in its place.
      return Promise.all([atom.workspace.open(CHANGELOG_URI, { split: "left" })]);
    }
  }

  deactivate() {
    this.subscriptions.dispose();
  }

  createGuideView(state) {
    if (GuideView == null) GuideView = require("./guide-view");
    return new GuideView(state);
  }

  createChangeLogView(state) {
    if (ChangeLogView == null) ChangeLogView = require("./changelog-view");
    return new ChangeLogView(state);
  }
}
