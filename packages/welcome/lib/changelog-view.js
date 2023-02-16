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
                Fixed a bug where `pulsar` on Windows could never trigger
              </li>
              <li>
                Fixed `github` package shelling out to `git` on macOS
              </li>
              <li>
                Fixed minor bugs found during fixes to tests
              </li>
              <li>
                Improved our testing infastructure to aide in finding and fixing further bugs
              </li>
              <li>
                Updated many dependencies of Pulsar and it's core packages
              </li>
              <li>
                New Pulsar Icon on macOS
              </li>
              <li>
                Selected text is styled by default
              </li>
              <li>
                Restored `right-clicked` CSS class on tags
              </li>
              <li>
                Fixed syntax highlighting on C++
              </li>
              <li>
                Updated JavaScript snippets to modern ES6 syntax
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
