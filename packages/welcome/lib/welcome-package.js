/** @babel */

import { CompositeDisposable } from 'atom';

let WelcomeView, GuideView, ChangeLogView;

const WELCOME_URI = 'atom://welcome/welcome';
const GUIDE_URI = 'atom://welcome/guide';
const CHANGELOG_URI = 'atom://welcome/changelog';

export default class WelcomePackage {
  async activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.workspace.addOpener(filePath => {
        if (filePath === CHANGELOG_URI) {
          return this.createChangeLogView({ uri: CHANGELOG_URI });
        }
      })
    );

    this.subscriptions.add(
      atom.workspace.addOpener(filePath => {
        if (filePath === WELCOME_URI) {
          return this.createWelcomeView({ uri: WELCOME_URI });
        }
      })
    );

    this.subscriptions.add(
      atom.workspace.addOpener(filePath => {
        if (filePath === GUIDE_URI) {
          return this.createGuideView({ uri: GUIDE_URI });
        }
      })
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'welcome:show', () => this.show())
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'welcome:showchangelog', () => this.showChangeLog())
    );

    if (atom.config.get('welcome.showOnStartup')) {
      await this.show();
    }

    if (atom.config.get('welcome.showChangeLog')) {
      // Use new `.versionSatisfies()` API to see if last viewed changelog is
      // less than the current Pulsar version
      if (atom.versionSatisfies(`> ${atom.config.get('welcome.lastViewedChangeLog')}`)) {
        await this.showChangeLog();
      }
    }
  }

  show() {
    return Promise.all([
      atom.workspace.open(WELCOME_URI, { split: 'left' }),
      atom.workspace.open(GUIDE_URI, { split: 'right' })
    ]);
  }

  showChangeLog() {
    if (atom.config.get('welcome.showOnStartup')) {
      // If the welcome view will also appear open the changelog on the bottom pane
      return Promise.all([
        atom.workspace.open(CHANGELOG_URI, { split: 'down' })
      ]);
    } else {
      // But if the welcome view is disabled, show the changelog in place of the welcome view.
      return Promise.all([
        atom.workspace.open(CHANGELOG_URI, { split: 'left' })
      ]);
    }
  }

  deactivate() {
    this.subscriptions.dispose();
  }

  createWelcomeView(state) {
    if (WelcomeView == null) WelcomeView = require('./welcome-view');
    return new WelcomeView(state);
  }

  createGuideView(state) {
    if (GuideView == null) GuideView = require('./guide-view');
    return new GuideView(state);
  }

  createChangeLogView(state) {
    if (ChangeLogView == null) ChangeLogView = require("./changelog-view");
    return new ChangeLogView(state);
  }
}
