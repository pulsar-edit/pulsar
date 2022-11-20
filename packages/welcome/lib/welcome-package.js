/** @babel */

import { CompositeDisposable } from 'atom';
import ReporterProxy from './reporter-proxy';

let WelcomeView, GuideView, ChangeLogView;

const WELCOME_URI = 'atom://welcome/welcome';
const GUIDE_URI = 'atom://welcome/guide';
const CHANGELOG_URI = 'atom://welcome/changelog';

export default class WelcomePackage {
  constructor() {
    this.reporterProxy = new ReporterProxy();
  }

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
      this.reporterProxy.sendEvent('show-on-initial-load');
    }

    if (atom.config.get('welcome.showChangeLog')) {
      let lastViewedVersion = atom.config.get('welcome.lastViewedChangeLog').split(".");
      let curVersion = atom.getVersion().split(".");
      // Usually getVersion Returns something along MAJOR.MINOR.PATCH ARCH
      // So we will account for that when checking what version they have.
      if (lastViewedVersion[0] < curVersion[0] && lastViewedVersion[1] < curVersion[1] && lastViewedVersion[2].split(" ")[0] < curVersion[2].split(" ")[0]) {
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
    return Promise.all([
      atom.workspace.open(CHANGELOG_URI, { split: 'down' });
    ]);
  }

  consumeReporter(reporter) {
    return this.reporterProxy.setReporter(reporter);
  }

  deactivate() {
    this.subscriptions.dispose();
  }

  createWelcomeView(state) {
    if (WelcomeView == null) WelcomeView = require('./welcome-view');
    return new WelcomeView({ reporterProxy: this.reporterProxy, ...state });
  }

  createGuideView(state) {
    if (GuideView == null) GuideView = require('./guide-view');
    return new GuideView({ reporterProxy: this.reporterProxy, ...state });
  }

  createChangeLogView(state) {
    if (ChangeLogView == null) ChangeLogView = require("./changelog-view");
    return new ChangeLogView({ reporterProxy: this.reporterProxy, ...state });
  }
}
