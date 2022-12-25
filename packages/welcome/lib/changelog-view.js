/** @babel */
/** @jsx etch.dom */

import etch from 'etch';

export default class ChangeLogView {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
  }

  didChangeShowChangeLog() {
    atom.config.set('welcome.showChangeLog', this.checked);
  }

  dismissVersion() {
    atom.config.set('welcome.lastViewedChangeLog', atom.getVersion().split(" ")[0]);
  }

  wasVersionDismissed() {
    const lastVersion = atom.config.get('welcome.lastViewedChangeLog');
    const curVersion = atom.getVersion().split(".");
    if (lastVersion[0] < curVersion[0] && lastVersion[1] < curVersion[1] && lastVersion[2].split(" ")[0] < curVersion[2].split(" ")[0]) {
      return false;
    } else {
      return true;
    }
  }

  update() {}

  serialize() {
    return {
      deserializer: 'ChangeLogView',
      uri: this.props.uri
    };
  }

  render() {
    return (
      <div className="welcome">
        <div className="welcome-container">
          <div className="header">
            <a title="Full Change Log" href="https://github.com/pulsar-edit/pulsar/blob/master/CHANGELOG.md">
              {/* LOGO GOES HERE */}
              <h1 className="welcome-title">
                Change Log
              </h1>
            </a>
          </div>
          <div className="welcome-panel">
            <p>Take a look at some of the awesome things {atom.branding.name} has changed:</p>
            <p>Feel free to read our <a href="https://github.com/pulsar-edit/pulsar/blob/master/CHANGELOG.md">Full Change Log</a>.</p>
            <ul>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/28">
                  Bump to Electron 12 and Node 14
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/7">
                  Added a rebranding API
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/67">
                  Removed experimental file watchers on the editor and fixes for how the Config File is watched.
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/131">
                  Ability to install packages from Git Repositories
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/68">
                  Migrated to a new Pulsar Package Repository Backend
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/settings-view/pull/2">
                  Better error messages when a package fails to install.
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/14">
                  Bumped Tree-Sitter to 0.20.1 and all grammars to their recent versions
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/101">
                  Native support for ARM Linux
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/54">
                  Native Support for Apple Silicon
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/105">
                  Removed Benchmark Mode
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/40">
                  Removed all telemetry from the editor.
                </a>
              </li>
              <li>
                <a href="https://pulsar-edit.dev">
                  New Pulsar Website
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/186">
                  Apple Silicon support for `github` Package v0.36.13
                </a>
              </li>

            </ul>

            <section className="welcome-panel">
              <label>
                <input className="input-checkbox"
                  type="checkbox"
                  checked={atom.config.get('welcome.showChangeLog')}
                  onchange={this.didChangeShowChangeLog}
                />
                Show the Change Log after an update.
              </label>
            </section>
            <section className="welcome-panel">
              <label>
                <input className="input-checkbox"
                  type="checkbox"
                  checked={this.wasVersionDismissed()}
                  onchange={this.dismissVersion}
                />
                Dismiss this Change Log
              </label>
            </section>
          </div>
        </div>
      </div>
    );
  }

  getURI() {
    return this.props.uri;
  }

  getTitle() {
    return 'Change Log';
  }

  isEqual(other) {
    return other instanceof ChangeLogView;
  }
}
