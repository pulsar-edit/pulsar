/** @babel */
/** @jsx etch.dom */

import etch from 'etch';

export default class WelcomeView {
  constructor(props) {
    this.props = props;
    this.brand = atom.branding.name;
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

  didChangeShowOnStartup() {
    atom.config.set('welcome.showOnStartup', this.checked);
  }

  update() {}

  serialize() {
    return {
      deserializer: 'WelcomeView',
      uri: this.props.uri
    };
  }

  render() {
    return (
      <div className="welcome">
        <div className="welcome-container">
          <header className="welcome-header">
            <a href={atom.branding.urlWeb} style={{display: 'flex', 'flex-direction': 'column', 'align-items': 'center'}}>
              <img src={path.join(__dirname, '..', 'assets', 'logo.svg')} style={{width: "330px"}} />
              <h1 className="welcome-title">
                A Community-led Hyper-Hackable Text Editor
              </h1>
            </a>
          </header>

          <section className="welcome-panel">
            <p>For help, please visit</p>
            <ul>
              <li>
                The{' '}
                {/* // TODO_PULSAR: Update to our docs or test {atom.branding.urlWeb}+"/docs" */}
                <a
                  href="https://www.atom.io/docs"
                  dataset={{ event: 'atom-docs' }}
                >
                  {this.brand} docs
                </a>{' '}
                for Guides and the API reference.
              </li>
              <li>
                The {this.brand} forum at{' '}
                <a
                  href="https://github.com/pulsar-edit/pulsar/discussions"
                  dataset={{ event: 'discussions' }}
                >
                  Github Discussions
                </a>
              </li>
              <li>
                The{' '}
                <a
                  href={atom.branding.urlGH}
                  dataset={{ event: 'atom-org' }}
                >
                  {this.brand} org
                </a>
                . This is where all GitHub-created {this.brand} packages can be found.
              </li>
            </ul>
          </section>

          <section className="welcome-panel">
            <label>
              <input
                className="input-checkbox"
                type="checkbox"
                checked={atom.config.get('welcome.showOnStartup')}
                onchange={this.didChangeShowOnStartup}
              />
              Show Welcome Guide when opening {this.brand}
            </label>
          </section>

          <footer className="welcome-footer">
            <a href={atom.branding.urlWeb} dataset={{ event: 'footer-atom-io' }}>
              pulsar-edit.dev
            </a>{' '}
            <span className="text-subtle">×</span>{' '}
            <a
              className="icon icon-octoface"
              href="https://github.com/pulsar-edit"
              dataset={{ event: 'footer-octocat' }}
            />
          </footer>
        </div>
      </div>
    );
  }

  getURI() {
    return this.props.uri;
  }

  getTitle() {
    return 'Welcome';
  }

  isEqual(other) {
    return other instanceof WelcomeView;
  }
}
