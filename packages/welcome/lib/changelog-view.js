/** @babel */
/** @jsx etch.dom */

import etch from 'etch';

export default class ChangeLogView {
  constructor(props) {
    this.props = props;
    etch.initialize(this);

    this.element.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (link && link.dataset.event) {
        this.props.reporterProxy.sendEvent(
          `clicked-welcome-${link.dataset.event}-link`
        );
      }
    });
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
            <a title="pulsar-edit.dev" href={atom.branding.urlWeb}>
              {/* LOGO GOES HERE */}
              <h1 className="welcome-title">
                Change Log
              </h1>
            </a>
          </div>
          <div className="welcome-panel">
            <p>Take a look at some of the awesome things {atom.branding.name} has changed:</p>
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
                  Removed experimental file watchers on the editor
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/131">
                  Ability to install packages from Git Repositories
                </a>
              </li>
              <li>
                <a href="#">
                  Migrated to a new Repository Backend
                </a>
              </li>
              <li>
                <a href="#">
                  Better error messages when a package fails to install.
                </a>
              </li>
              <li>
                <a href="#">
                  Configuration file watching fixes
                </a>
              </li>
              <li>
                <a href="#">
                  Bumped Tree-Sitter to 0.20.1 and all grammars to their recent versions
                </a>
              </li>
              <li>
                <a href="#">
                  Native support for Apple Silicon
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/105">
                  Removed Benchmark Mode
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/59">
                  Bumped Async to v3.2.4
                </a>
              </li>
              <li>
                <a href="https://github.com/pulsar-edit/pulsar/pull/40">
                  Removed all telemetry from the editor.
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
                Want to Dismiss this Change Log?
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
