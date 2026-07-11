/** @babel */
/** @jsx etch.dom */

import etch from 'etch';

export default class GuideView {
  constructor(props) {
    this.props = props;
    this.brand = atom.branding.name;
    this.didClickProjectButton = this.didClickProjectButton.bind(this);
    this.didClickPackagesButton = this.didClickPackagesButton.bind(this);
    this.didClickThemesButton = this.didClickThemesButton.bind(this);
    this.didClickStylingButton = this.didClickStylingButton.bind(this);
    this.didClickInitScriptButton = this.didClickInitScriptButton.bind(this);
    this.didClickSnippetsButton = this.didClickSnippetsButton.bind(this);
    this.didChangeShowOnStartup = this.didChangeShowOnStartup.bind(this);
    etch.initialize(this);
  }

  update() { }

  didChangeShowOnStartup(e) {
    atom.config.set('welcome.showGuideOnStartup', e.target.checked);
  }

  render() {
    return (
      <div className="welcome is-guide">
        <div className="welcome-container">
          <section className="welcome-panel">
            <h1 className="welcome-title">Get to know {this.brand}!</h1>

            <details
              className="welcome-card"
              {...this.getSectionProps('project')}
            >
              <summary className="welcome-summary icon icon-repo">
                Open a <span className="welcome-highlight">Project</span>
              </summary>
              <div className="welcome-detail">
                <p>
                  <img
                    className="welcome-img"
                    src="atom://welcome/assets/project.svg"
                  />
                </p>
                <p>
                  In {this.brand} you can open individual files or a whole folder as a
                  project. Opening a folder will add a tree view, on the left side
                  (by default), listing all the files and folders belonging to your project.
                </p>
                <p>
                  <button
                    ref="projectButton"
                    onclick={this.didClickProjectButton}
                    className="btn btn-primary"
                  >
                    Open a Project
                  </button>
                </p>
                <p className="welcome-note">
                  <strong>Next time:</strong> You can also open projects from
                  the menu, keyboard shortcut or by dragging a folder onto the
                  {this.brand} dock icon.
                </p>
              </div>
            </details>

            <details
              className="welcome-card"
              {...this.getSectionProps('packages')}
            >
              <summary className="welcome-summary icon icon-package">
                Install a <span className="welcome-highlight">Package</span>
              </summary>
              <div className="welcome-detail">
                <p>
                  <img
                    className="welcome-img"
                    src="atom://welcome/assets/package.svg"
                  />
                </p>
                <p>
                  One of the best things about {this.brand} is the package ecosystem.
                  Installing packages adds new features and functionality you
                  can use to make the editor suit your needs. Let's install one.
                </p>
                <p>
                  <button
                    ref="packagesButton"
                    onclick={this.didClickPackagesButton}
                    className="btn btn-primary"
                  >
                    Open Installer
                  </button>
                </p>
                <p className="welcome-note">
                  <strong>Next time:</strong> You can install new packages from
                  the settings.
                </p>
              </div>
            </details>

            <details
              className="welcome-card"
              {...this.getSectionProps('themes')}
            >
              <summary className="welcome-summary icon icon-paintcan">
                Choose a <span className="welcome-highlight">Theme</span>
              </summary>
              <div className="welcome-detail">
                <p>
                  <img
                    className="welcome-img"
                    src="atom://welcome/assets/theme.svg"
                  />
                </p>
                <p>{this.brand} comes with preinstalled themes. Let's try a few.</p>
                <p>
                  <button
                    ref="themesButton"
                    onclick={this.didClickThemesButton}
                    className="btn btn-primary"
                  >
                    Open the theme picker
                  </button>
                </p>
                <p>
                  You can also install themes created by the {this.brand} community. To
                  install new themes, click on "+ Install" and switch the toggle
                  to "themes".
                </p>
                <p className="welcome-note">
                  <strong>Next time:</strong> You can switch themes from the
                  settings.
                </p>
              </div>
            </details>

            <details
              className="welcome-card"
              {...this.getSectionProps('styling')}
            >
              <summary className="welcome-summary icon icon-paintcan">
                Customize the <span className="welcome-highlight">Styling</span>
              </summary>
              <div className="welcome-detail">
                <p>
                  <img
                    className="welcome-img"
                    src="atom://welcome/assets/code.svg"
                  />
                </p>
                <p>
                  You can customize almost anything by adding your own CSS/LESS.
                </p>
                <p>
                  <button
                    ref="stylingButton"
                    onclick={this.didClickStylingButton}
                    className="btn btn-primary"
                  >
                    Open your Stylesheet
                  </button>
                </p>
                <p>Now uncomment some of the examples or try your own</p>
                <p className="welcome-note">
                  <strong>Next time:</strong> You can open your stylesheet from
                  Menu > {this.getApplicationMenuName()}.
                </p>
              </div>
            </details>

            <details
              className="welcome-card"
              {...this.getSectionProps('init-script')}
            >
              <summary className="welcome-summary icon icon-code">
                Hack on the <span className="welcome-highlight">Init Script</span>
              </summary>
              <div className="welcome-detail">
                <p>
                  <img
                    className="welcome-img"
                    src="atom://welcome/assets/code.svg"
                  />
                </p>
                <p>
                  The init script is a bit of JavaScript or CoffeeScript run at
                  startup. You can use it to quickly change the behaviour of {this.brand}.
                </p>
                <p>
                  <button
                    ref="initScriptButton"
                    onclick={this.didClickInitScriptButton}
                    className="btn btn-primary"
                  >
                    Open your Init Script
                  </button>
                </p>
                <p>Uncomment some of the examples or try out your own.</p>
                <p className="welcome-note">
                  <strong>Next time:</strong> You can open your init script from
                  Menu > {this.getApplicationMenuName()}.
                </p>
              </div>
            </details>

            <details
              className="welcome-card"
              {...this.getSectionProps('snippets')}
            >
              <summary className="welcome-summary icon icon-code">
                Add a <span className="welcome-highlight">Snippet</span>
              </summary>
              <div className="welcome-detail">
                <p>
                  <img
                    className="welcome-img"
                    src="atom://welcome/assets/code.svg"
                  />
                </p>
                <p>
                  {this.brand} snippets allow you to enter a simple prefix in the editor
                  and hit tab to expand the prefix into a larger code block with
                  templated values.
                </p>
                <p>
                  <button
                    ref="snippetsButton"
                    onclick={this.didClickSnippetsButton}
                    className="btn btn-primary"
                  >
                    Open your Snippets
                  </button>
                </p>
                <p>
                  In your snippets file, type <code>snip</code> then hit{' '}
                  <code>tab</code>. The <code>snip</code> snippet will expand to
                  create a snippet!
                </p>
                <p className="welcome-note">
                  <strong>Next time:</strong> You can open your snippets in Menu
                  > {this.getApplicationMenuName()}.
                </p>
              </div>
            </details>

            <details
              className="welcome-card"
              {...this.getSectionProps('shortcuts')}
            >
              <summary className="welcome-summary icon icon-keyboard">
                Learn <span className="welcome-highlight">Keyboard Shortcuts</span>
              </summary>
              <div className="welcome-detail">
                <p>
                  <img
                    className="welcome-img"
                    src="atom://welcome/assets/shortcut.svg"
                  />
                </p>
                <p>
                  If you only remember one keyboard shortcut make it{' '}
                  <kbd className="welcome-key">
                    {this.getCommandPaletteKeyBinding()}
                  </kbd>
                  . This keystroke toggles the command palette, which lists
                  every {this.brand} command. It's a good way to learn more shortcuts.
                  Yes, you can try it now!
                </p>
                <p>
                  If you want to use these guides again use the command palette{' '}
                  <kbd className="welcome-key">
                    {this.getCommandPaletteKeyBinding()}
                  </kbd>{' '}
                  and search for <span className="text-highlight">Welcome</span>
                  .
                </p>
              </div>
            </details>

            <label className="welcome-startup">
              <input
                className="input-checkbox"
                type="checkbox"
                checked={atom.config.get('welcome.showGuideOnStartup')}
                onchange={this.didChangeShowOnStartup}
              />
              Show when opening {this.brand}
            </label>
          </section>
        </div>
      </div>
    );
  }

  getSectionProps(sectionName) {
    const props = {
      dataset: { section: sectionName }
    };
    if (
      this.props.openSections &&
      this.props.openSections.indexOf(sectionName) !== -1
    ) {
      props.open = true;
    }
    return props;
  }

  getCommandPaletteKeyBinding() {
    if (process.platform === 'darwin') {
      return 'cmd-shift-p';
    } else {
      return 'ctrl-shift-p';
    }
  }

  getApplicationMenuName() {
    if (process.platform === 'darwin') {
      return 'Lumine';
    } else if (process.platform === 'linux') {
      return 'Edit';
    } else {
      return 'File';
    }
  }

  serialize() {
    return {
      deserializer: this.constructor.name,
      openSections: this.getOpenSections(),
      uri: this.getURI()
    };
  }

  getURI() {
    return this.props.uri;
  }

  getTitle() {
    return 'Welcome Guide';
  }

  getIconName() {
    return 'book';
  }

  isEqual(other) {
    return other instanceof GuideView;
  }

  getOpenSections() {
    return Array.from(this.element.querySelectorAll('details[open]')).map(
      sectionElement => sectionElement.dataset.section
    );
  }

  didClickProjectButton() {
    atom.commands.dispatch(
      atom.views.getView(atom.workspace),
      'application:open'
    );
  }

  didClickPackagesButton() {
    atom.workspace.open('atom://config/install', { split: 'left' });
  }

  didClickThemesButton() {
    atom.workspace.open('atom://config/themes', { split: 'left' });
  }

  didClickStylingButton() {
    atom.workspace.open('atom://.lumine/stylesheet', { split: 'left' });
  }

  didClickInitScriptButton() {
    atom.workspace.open('atom://.lumine/init-script', { split: 'left' });
  }

  didClickSnippetsButton() {
    atom.workspace.open('atom://.lumine/snippets', { split: 'left' });
  }
}
