/** @babel */
/** @jsx etch.dom */

import etch from 'etch';
import { CompositeDisposable, Emitter } from 'atom';

export default class ChangeLogView {
  constructor(props) {
    this.props = props;
    this.emitter = new Emitter();
    this.subscriptions = new CompositeDisposable();

    this.didDismissForCurrentVersion = false;

    // Extract a version string so we can use it for comparison purposes.
    this.version = atom.getVersion().split(' ')[0];

    this._dismissVersion = this.dismissVersion.bind(this);

    etch.initialize(this);

    this.subscriptions.add(
      // Listen for signals from other windows that signal the closure of a
      // change log; if it closes in any window, it should close in all
      // windows.
      atom.signal.onMessage('welcome:changelog-close', () => this.destroy()),
      // Listen for changes to this setting and keep this checkbox
      // synchronized.
      atom.config.onDidChange('welcome.lastViewedChangeLog', ({ newValue }) => {
        this.refs.skipChangeLog.checked = atom.versionSatisfies(newValue);
      })
    );
  }

  didChangeShowChangeLog() {
    atom.config.set('welcome.showChangeLog', this.checked);
  }

  dismissVersion(event) {
    let isChecked = event.currentTarget.checked;
    if (isChecked) {
      atom.config.set('welcome.lastViewedChangeLog', this.version);
    } else {
      atom.config.unset('welcome.lastViewedChangeLog');
    }
  }

  wasVersionDismissed() {
    // Use the new `.versionSatisfies()` API to check if our last dismissed
    // version is the same as the current version. `.versionSatisfies()`
    // compares equality by default, so no comparator is needed.
    return atom.versionSatisfies(atom.config.get('welcome.lastViewedChangeLog'));
  }

  destroy () {
    atom.signal.send('welcome:changelog-close', true);
    this.subscriptions.dispose();
    this.emitter.emit('did-destroy');
  }

  onDidDestroy (callback) {
    return this.emitter.on('did-destroy', callback);
  }

  update() {}

  serialize() {
    return {
      deserializer: 'ChangeLogView',
      uri: this.props.uri
    };
  }

  openUri (event) {
    let anchor = event.target.closest('[href]');
    if (!anchor) return;

    let uri = anchor.getAttribute('href');
    if (!uri?.startsWith('atom://')) return;

    atom.workspace.open(uri);
  }

  render() {
    return (
      <div className="welcome" on={{ click: this.openUri }}>
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
              <li>New <code>terminal</code> package features: hyperlink support, clickable file paths, and shell integration in order to track the terminal’s working directory.</li>
              <li>Project-wide recursive file-watching now runs in a separate worker process and has two implementations: <code>nsfw</code> (the default) and <code>@parcel/watcher</code>. You may use the <strong>Core → File System Watcher</strong> setting to switch implementations.</li>
              <li>Pane items have a new “deleted” state to represent (for instance) buffers whose backing file is no longer present on disk. New settings <code>editor.promptWhenAbandoningDeletedFile</code> and <code>tabs.enableItemStatusColoring</code> control the new behavior and appearance around deleted items.</li>
              <li>Bug fixes and performance improvements — especially around syntax highlighting of large files.</li>
              <li>Updated Electron to v32.3.3.</li>
            </ul>

            <section className="welcome-panel">
              <label>
                <input className="input-checkbox"
                  type="checkbox"
                  checked={atom.config.get('welcome.showChangeLog')}
                  onchange={this.didChangeShowChangeLog}
                />
                Show the Change Log after an update
              </label>
            </section>
            <section className="welcome-panel">
              <label>
                <input className="input-checkbox"
                  type="checkbox"
                  ref="skipChangeLog"
                  checked={this.wasVersionDismissed()}
                  onchange={this._dismissVersion}
                />
                Don’t show a Change Log again for version {this.version}
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
