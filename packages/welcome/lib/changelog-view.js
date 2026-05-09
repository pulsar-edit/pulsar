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
              <li>
                New <code>terminal</code> package! For more information, consult the package’s <a href="atom://config/packages/terminal">settings and README</a>, or read <a href="https://blog.pulsar-edit.dev/posts/20260510-savetheclocktower-terminal-package/">the introductory blog post</a>.
              </li>
              <li>
                New <code>editor.largeFileThreshold</code> setting that allows the user to configure the file-size threshold of the “large file mode” present in TextMate-style grammars.
              </li>
              <li>
                New experimental setting: <code>core.promptOnConflict</code>. When enabled, Pulsar will ask for confirmation if you try to save an item while it’s in a “conflicted” state. You may decide whether to cancel or proceed with overwriting the file on disk. (For an editor, the “conflicted” state occurs if you open a file and make changes, but another program writes different contents to the file on disk before you can save your changes in Pulsar.) Since this setting is experimental, it is disabled by default… but we encourage users to enable it and help us test it!
              </li>
              <li>
                Minor Electron version increase to v30.5.1.
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
