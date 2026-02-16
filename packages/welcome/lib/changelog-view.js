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
                Bump <code>ppm</code> to use Node 20.11.1
                <ul>
                  <li>For the first time in a long time, both <code>ppm</code> and Pulsar are using the same version of Node; this should avoid some rare bugs encountered when installing certain packages.</li>
                </ul>
              </li>
              <li>
                Fix handling when opening files to certain line numbers via CLI - e.g. <code>pulsar foo.txt:30</code>
              </li>
              <li>
                Prevent packages from spawning new background tasks if the environment is unloading.
              </li>
              <li>
                <code>find-and-replace</code> Fix an issue where certain files would show results in a project-wide search even when they would be excluded by the file/directory pattern.
              </li>
              <li>
                <code>markdown-preview</code> Fix situations where "Save as HTML" and "Copy as HTML" silently failed with certain kinds of content.
              </li>
              <li>
                <code>autocomplete-plus</code> Prevent certain kinds of suggestions from being incorrectly filtered out of the result set.
              </li>
              <li>
                <code>language-java</code> Update to the latest <code>tree-sitter-java</code> parser, adding support for multiline strings, amount other things.
              </li>
              <li>
                <code>language-python</code> Better highlighting of <code>except</code> clauses; fixed folding of certain <code>if</code> blocks.
              </li>
              <li>
                <code>language-typescript</code> Better highlighting of template literals; adding folding of <code>interface</code> and <code>enum</code> blocks.
              </li>
              <li>
                <code>language-javascript</code> Proper highlighting of JSX with namespaced attributes.
              </li>
              <li>
                Fix an issue in <code>superstring</code> that occasionally caused crashes while editing text.
              </li>
              <li>
                Add support for additional image formats in Pulsar's Markdown renderer.
              </li>
              <li>
                Minor reduction of binary size through various means.
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
