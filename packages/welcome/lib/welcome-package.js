/** @babel */

import { CompositeDisposable } from "atom";

let GuideView;

const ABOUT_URI = "atom://about";
const GUIDE_URI = "atom://welcome/guide";

export default class WelcomePackage {
  async activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.workspace.addOpener((filePath) => {
        if (filePath === GUIDE_URI) {
          return this.createGuideView({ uri: GUIDE_URI });
        }
      }),
    );

    this.subscriptions.add(atom.commands.add("atom-workspace", "welcome:show", () => this.show()));

    const showAbout = atom.config.get("welcome.showOnStartup");
    const showGuide = atom.config.get("welcome.showGuideOnStartup");
    if (showAbout || showGuide) {
      await this.show({ about: showAbout, guide: showGuide });
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

  deactivate() {
    this.subscriptions.dispose();
  }

  createGuideView(state) {
    if (GuideView == null) GuideView = require("./guide-view");
    return new GuideView(state);
  }
}
