const { Disposable, TextEditor } = require('atom');
const Config = require('./config');
const ProviderBroker = require('./provider-broker');
const Path = require('path');
const { shell } = require('electron');
const { migrateOldConfigIfNeeded } = require('./util');

const NO_PROVIDERS_MESSAGE = `You don’t have any symbol providers installed.`;
const NO_PROVIDERS_DESCRIPTION = `The button below will show all packages that can provide symbols.

At minimum, we recommend you install the following packages to get an experience similar to that of the built-in \`symbols-view\` package:

* \`symbol-provider-tree-sitter\`
* \`symbol-provider-ctags\`
`;

const NO_PROVIDERS_BUTTONS = [
  {
    text: 'Find providers',
    onDidClick: () => {
      shell.openExternal(`https://web.pulsar-edit.dev/packages?service=symbol.provider&serviceType=provided`);
    }
  }
];

module.exports = {
  activate() {
    Config.activate();
    this.stack = [];
    this.broker = new ProviderBroker();

    this.workspaceSubscription = atom.commands.add(
      'atom-workspace',
      {
        'symbols-view:toggle-project-symbols': (event) => {
          if (!this.ensureProvidersExist()) {
            event.abortKeyBinding();
            return;
          }
          let text = this.getSelectedTextIfEnabled(event);
          this.createProjectView().toggle(text);
        },
        'symbols-view:show-active-providers': () => {
          this.showActiveProviders();
        }
      }
    );

    this.editorSubscription = atom.commands.add(
      'atom-text-editor:not([mini])',
      {
        'symbols-view:toggle-file-symbols': (event) => {
          if (!this.ensureProvidersExist()) {
            event.abortKeyBinding();
            return;
          }
          let text = this.getSelectedTextIfEnabled(event);
          this.createFileView().toggle(text);
        },
        'symbols-view:go-to-declaration': () => {
          if (!this.ensureProvidersExist()) return;
          this.createGoToView().toggle();
        },
        'symbols-view:return-from-declaration': () => {
          if (!this.ensureProvidersExist()) return;
          this.createGoBackView().toggle();
        }
      }
    );

    migrateOldConfigIfNeeded();
  },

  getSelectedTextIfEnabled(event) {
    let editorView = event.target.closest('atom-text-editor');
    if (!editorView) return '';
    let editor = editorView.getModel();
    let selection = editor.getLastSelection();

    // Don't use the selection if it spans more than one buffer line.
    let range = selection.getBufferRange();
    if (range.start.row !== range.end.row) return '';

    // Don't use the selection unless the associated config option is enabled.
    let prefill = atom.config.get(
      'symbols-view.prefillSelectedText',
      { scope: [editor.getGrammar()?.scopeName] }
    );
    return prefill ? editor.getSelectedText() : '';
  },

  deactivate() {
    this.fileView?.destroy();
    this.fileView = null;

    this.projectView?.destroy();
    this.projectView = null;

    this.goToView?.destroy();
    this.goToView = null;

    this.goBackView?.destroy();
    this.goBackView = null;

    this.workspaceSubscription?.dispose();
    this.workspaceSubscription = null;

    this.editorSubscription?.dispose();
    this.editorSubscription = null;

    this.broker?.destroy();
    this.broker = null;

    this.subscriptions?.dispose();
    this.subscriptions = null;
  },

  consumeSymbolProvider(provider) {
    if (Array.isArray(provider)) {
      this.broker.add(...provider);
    } else {
      this.broker.add(provider);
    }

    return new Disposable(() => {
      if (Array.isArray(provider)) {
        this.broker?.remove(...provider);
      } else {
        this.broker?.remove(provider);
      }
    });
  },

  createFileView() {
    if (this.fileView) return this.fileView;

    const FileView = require('./file-view');
    this.fileView = new FileView(this.stack, this.broker);
    return this.fileView;
  },

  createProjectView() {
    if (this.projectView) return this.projectView;

    const ProjectView = require('./project-view');
    this.projectView = new ProjectView(this.stack, this.broker);
    return this.projectView;
  },

  createGoToView() {
    if (this.goToView) return this.goToView;

    const GoToView = require('./go-to-view');
    this.goToView = new GoToView(this.stack, this.broker);
    return this.goToView;
  },

  createGoBackView() {
    if (this.goBackView) return this.goBackView;

    const GoBackView = require('./go-back-view');
    this.goBackView = new GoBackView(this.stack, this.broker);
    return this.goBackView;
  },

  showActiveProviders() {
    let providerList = [];
    for (let provider of this.broker.providers) {
      providerList.push({
        name: provider.name,
        packageName: provider.packageName
      });
    }

    let message = providerList.map(
      p => `* **${p.name}** provided by \`${p.packageName}\``
    ).join('\n');

    atom.notifications.addInfo(
      'Symbols View Redux providers',
      {
        description: message,
        dismissable: true,
        buttons: [
          {
            text: 'Copy',
            onDidClick() {
              atom.clipboard.write(message);
            }
          }
        ]
      }
    );
  },

  ensureProvidersExist() {
    if (this.broker.providers.length > 0) return true;

    atom.notifications.addWarning(
      NO_PROVIDERS_MESSAGE,
      {
        description: NO_PROVIDERS_DESCRIPTION,
        buttons: NO_PROVIDERS_BUTTONS,
        dismissable: true
      }
    );

    return false;
  },

  ensureActiveTextEditorExists() {
    let editor = atom.workspace.getActiveTextEditor();
    return !!editor;
  },

  // A `hyperclick` consumer that works similarly to the
  // `symbols-view:go-to-definition` command.
  provideHyperclick() {
    return {
      priority: 1,
      getSuggestionForWord: async (editor, _text, range) => {
        let goto = this.createGoToView();
        let symbols = await goto.generateSymbols(editor, range);
        let editorPath = editor.getPath();
        if (!symbols || symbols.length === 0) return;

        // If we're at the definition site, the only result will be a symbol
        // whose position is identical to the position we asked about. Filter
        // it out. In that situation, we don't want a hyperclick affordance at
        // all.
        symbols = symbols.filter(sym => {
          let { path, directory, file } = sym;
          if (!path) {
            path = Path.join(directory, file);
          }
          return path !== editorPath || sym.position.compare(range.start) !== 0;
        });
        if (symbols.length === 0) return;

        return {
          range,
          callback: () => {
            editor.setSelectedBufferRange(range);
            goto.toggle();
          }
        };
      }
    };
  }
};
