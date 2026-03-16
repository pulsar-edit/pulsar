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
    // Use the new `.versionSatisfies()` API to check if our last dismissed version
    // is the same as the current version. `.versionSatisfies()` compares equality
    // by default, so no comparator is needed
    return atom.versionSatisfies(atom.config.get('welcome.lastViewedChangeLog'));
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
                Update Electron to version 30!
                <ul>
                  <li>Node is now version 20.11.1!</li>
                  <li>Chromium is now version 124!</li>
                  <li>This means better performance, better Node library compatibility, and ability for community packages to use newer features of Chromium.</li>
                  <li>It should also vastly improve the Pulsar experience for Linux users in Wayland environments.</li>
                  <li>Because this is such a big upgrade, some of your community packages might be affected! Read <a href="https://blog.pulsar-edit.dev/posts/20251202-savetheclocktower-pulsar-on-electron-30/">Pulsar on Electron 30: what it means for you</a> for more information.</li>
                </ul>
              </li>
              <li>
                [settings-view] Fix issue that closes project windows when the user clicked on a badge in a package card.
              </li>
              <li>
                [find-and-replace] Fix issue that prevents searches with patterns from working properly in projects with multiple roots.
              </li>
              <li>
                Fix issue affecting keybinding interpretation on non-QWERTY keyboards in Linux/X11 environments.
              </li>
              <li>
                Fix Linux issue causing the menu bar to hide immediately after a project window opens.
              </li>
              <li>
                Fix macOS issue causing buffer contents to fail to update for some users when modified by another program.
              </li>
              <li>
                Fix issue causing the <code>.deb</code> installation to refuse to launch because of improper permissions.
              </li>
              <li>
                Fix issue causing the <code>.rpm</code> installation to run the wrong script when upgrading.
              </li>
              <li>
                Fix issue causing the <code>--package</code> switch not to work correctly when invoked directly on the Pulsar binary, rather than on <code>pulsar.sh</code>/<code>pulsar.cmd</code>.
              </li>
              <li>
                Fix issue that prevents <code>ppm</code> from being symlinked or un-symlinked correctly in Linux install/uninstall scripts.
              </li>
              <li>
                Add <code>atom.project.addPaths</code> method for adding multiple project roots at once.
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
