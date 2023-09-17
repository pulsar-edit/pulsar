const { Disposable } = require('atom');
const etch = require('etch');
const { shell } = require('electron');
const AtomLogo = require('./atom-logo');
const EtchComponent = require('../etch-component');

const $ = etch.dom;

module.exports = class AboutView extends EtchComponent {
  handleAtomVersionClick(e) {
    e.preventDefault();
    atom.clipboard.write(this.props.currentAtomVersion);
  }

  handleElectronVersionClick(e) {
    e.preventDefault();
    atom.clipboard.write(this.props.currentElectronVersion);
  }

  handleChromeVersionClick(e) {
    e.preventDefault();
    atom.clipboard.write(this.props.currentChromeVersion);
  }

  handleNodeVersionClick(e) {
    e.preventDefault();
    atom.clipboard.write(this.props.currentNodeVersion);
  }

  handleReleaseNotesClick(e) {
    e.preventDefault();
    shell.openExternal(
      this.props.updateManager.getReleaseNotesURLForCurrentVersion()
    );
  }

  handleLicenseClick(e) {
    e.preventDefault();
    atom.commands.dispatch(
      atom.views.getView(atom.workspace),
      'application:open-license'
    );
  }

  handleTermsOfUseClick(e) {
    e.preventDefault();
    shell.openExternal('https://atom.io/terms'); //If we use this then this URL will need updating but button disabled (L#182)
    // TODO Update to Privacy Policy once `pulsar-edit.github.io` #161 is resolved
  }

  handleHowToUpdateClick(e) {
    e.preventDefault();
    shell.openExternal(
            'https://github.com/pulsar-edit/pulsar/tree/master/packages/pulsar-updater#readme'
    );
  }

  executeUpdateAction(e) {
    e.preventDefault();
    atom.commands.dispatch(
      atom.views.getView(atom.workspace),
      'pulsar-updater:check-for-update'
    );
  }

  handleShowMoreClick(e) {
    e.preventDefault();
    var showMoreDiv = document.querySelector('.show-more');
    var showMoreText = document.querySelector('.about-more-expand');
    switch (showMoreText.textContent) {
      case 'Show more':
        showMoreDiv.classList.toggle('hidden');
        showMoreText.textContent = 'Hide';
        break;
      case 'Hide':
        showMoreDiv.classList.toggle('hidden');
        showMoreText.textContent = 'Show more';
        break;
    }
  }

  render() {
    return $.div(
      { className: 'pane-item native-key-bindings about' },
      $.div(
        { className: 'about-container min-width-min-content' },
        $.header(
          { className: 'about-header' },
          $.a(
            { className: 'about-atom-io', href: `${atom.branding.urlWeb}`, },
            $(AtomLogo)
          ),
          $.div(
            { className: 'about-header-info' },
            $.span(
              {
                className: 'about-version-container atom',
                onclick: this.handleAtomVersionClick.bind(this)
              },
              $.span(
                { className: 'about-version' },
                `${this.props.currentAtomVersion} ${process.arch}`
              ),
              $.span({ className: 'icon icon-clippy about-copy-version' })
            ),
            $.a(
              {
                className: 'about-header-release-notes',
                onclick: this.handleReleaseNotesClick.bind(this)
              },
              'Release Notes'
            )
          ),
          $.span(
            {
              className:
                'about-version-container show-more-expand',
              onclick: this.handleShowMoreClick.bind(this)
            },
            $.span({ className: 'about-more-expand' }, 'Show more')
          ),
          $.div(
            { className: 'show-more hidden about-more-info' },
            $.div(
              { className: 'about-more-info' },
              $.span(
                {
                  className: 'about-version-container inline-block electron',
                  onclick: this.handleElectronVersionClick.bind(this)
                },
                $.span(
                  { className: 'about-more-version' },
                  `Electron: ${this.props.currentElectronVersion} `
                ),
                $.span({ className: 'icon icon-clippy about-copy-version' })
              )
            ),
            $.div(
              { className: 'about-more-info' },
              $.span(
                {
                  className: 'about-version-container inline-block chrome',
                  onclick: this.handleChromeVersionClick.bind(this)
                },
                $.span(
                  { className: 'about-more-version' },
                  `Chrome: ${this.props.currentChromeVersion} `
                ),
                $.span({ className: 'icon icon-clippy about-copy-version' })
              )
            ),
            $.div(
              { className: 'about-more-info' },
              $.span(
                {
                  className: 'about-version-container inline-block node',
                  onclick: this.handleNodeVersionClick.bind(this)
                },
                $.span(
                  { className: 'about-more-version' },
                  `Node: ${this.props.currentNodeVersion} `
                ),
                $.span({ className: 'icon icon-clippy about-copy-version' })
              )
            )
          )
        )
      ),

      $.div(
        { className: 'about-updates group-start min-width-min-content' },
        $.div(
          { className: 'about-updates-box' },
          $.div(
            { className: 'about-updates-status' },
            $.div(
              { className: 'about-updates-item app-unsupported' },
              $.span(
                { className: 'about-updates-label is-strong' },
                'Updates have been moved to the package ', $.code({style: {'white-space': 'nowrap'}}, 'pulsar-updater'), '.',
                $.br()
              ),
              $.a(
                {
                  className: 'about-updates-instructions',
                  onclick: this.handleHowToUpdateClick.bind(this)
                },
                'How to update'
              )
            )
          ),
          this.renderUpdateChecker()
        )
      ),

      $.div(
        { className: 'about-actions group-item' },
        $.div(
          { className: 'btn-group' },
          $.button(
            {
              className: 'btn view-license',
              onclick: this.handleLicenseClick.bind(this)
            },
            'License'
          ),
          //Disabled the below as we don't have this but can reuse if there is the need
          /*$.button(
            {
              className: 'btn terms-of-use',
              onclick: this.handleTermsOfUseClick.bind(this)
            },
            'Terms of Use'
          )*/
        )
      ),

      $.div(
        { className: 'about-love group-start' },
        $.a({ className: 'icon icon-code', href: `${atom.branding.urlGH}` }),
        $.span({ className: 'inline' }, ' with '),
        $.a({ className: 'icon icon-heart', href: `${atom.branding.urlWeb}` + "community" }),
        $.span({ className: 'inline' }, ' by '),
        //$.a({ className: 'icon icon-logo-github', href: `${atom.branding.urlWeb}` }) Replace icon with Pulsar word logo and delete following line
        $.a({ className: 'inline', href: `${atom.branding.urlWeb}` }, 'Pulsar Team')
      ),
    );
  }

  renderUpdateChecker() {
    if (atom.packages.isPackageDisabled("pulsar-updater")) {
      return $.div(
        { className: 'about-updates-item app-unsupported' },
        $.span(
          { className: 'about-updates-label is-strong' },
          'Enable `pulsar-updater` to check for updates'
        )
      );
    } else {
      return $.button(
        {
          className: 'btn about-update-action-button',
          onclick: this.executeUpdateAction.bind(this),
          style: {
            display: 'block',
            margin: '0 .5em'
          }
        },
        'Check Now'
      );
    }
  }

  serialize() {
    return {
      deserializer: this.constructor.name,
      uri: this.props.uri
    };
  }

  onDidChangeTitle() {
    return new Disposable();
  }

  onDidChangeModified() {
    return new Disposable();
  }

  getTitle() {
    return 'About';
  }

  getIconName() {
    return 'info';
  }
};
