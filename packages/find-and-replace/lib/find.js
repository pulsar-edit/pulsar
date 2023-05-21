const {CompositeDisposable, Disposable, TextBuffer} = require('atom');

const SelectNext = require('./select-next');
const {History, HistoryCycler} = require('./history');
const FindOptions = require('./find-options');
const BufferSearch = require('./buffer-search');
const getIconServices = require('./get-icon-services');
const FindView = require('./find-view');
const ProjectFindView = require('./project-find-view');
const ResultsModel = require('./project/results-model');
const ResultsPaneView = require('./project/results-pane');

module.exports = {
  activate(param) {
    // Convert old config setting for backward compatibility.
    if (param == null) { param = {}; }
    const {findOptions, findHistory, replaceHistory, pathsHistory} = param;
    if (atom.config.get('find-and-replace.openProjectFindResultsInRightPane')) {
      atom.config.set('find-and-replace.projectSearchResultsPaneSplitDirection', 'right');
    }
    atom.config.unset('find-and-replace.openProjectFindResultsInRightPane');

    atom.workspace.addOpener(function(filePath) {
      if (filePath.indexOf(ResultsPaneView.URI) !== -1) { return new ResultsPaneView(); }
    });

    this.subscriptions = new CompositeDisposable;
    this.currentItemSub = new Disposable;
    this.findHistory = new History(findHistory);
    this.replaceHistory = new History(replaceHistory);
    this.pathsHistory = new History(pathsHistory);

    this.findOptions = new FindOptions(findOptions);
    this.findModel = new BufferSearch(this.findOptions);
    this.resultsModel = new ResultsModel(this.findOptions);

    this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(paneItem => {
      this.subscriptions.delete(this.currentItemSub);
      this.currentItemSub.dispose();

      if (atom.workspace.isTextEditor(paneItem)) {
        return this.findModel.setEditor(paneItem);
      } else if (paneItem?.observeEmbeddedTextEditor != null) {
        this.currentItemSub = paneItem.observeEmbeddedTextEditor(editor => {
          if (atom.workspace.getCenter().getActivePaneItem() === paneItem) {
            return this.findModel.setEditor(editor);
          }
        });
        return this.subscriptions.add(this.currentItemSub);
      } else if (paneItem?.getEmbeddedTextEditor != null) {
        return this.findModel.setEditor(paneItem.getEmbeddedTextEditor());
      } else {
        return this.findModel.setEditor(null);
      }
    })
    );

    this.subscriptions.add(atom.commands.add('.find-and-replace, .project-find', 'window:focus-next-pane', () => atom.views.getView(atom.workspace).focus())
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'project-find:show', () => {
      this.createViews();
      return showPanel(this.projectFindPanel, this.findPanel, () => this.projectFindView.focusFindElement());
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'project-find:toggle', () => {
      this.createViews();
      return togglePanel(this.projectFindPanel, this.findPanel, () => this.projectFindView.focusFindElement());
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'project-find:show-in-current-directory', ({target}) => {
      this.createViews();
      this.findPanel.hide();
      this.projectFindPanel.show();
      this.projectFindView.focusFindElement();
      return this.projectFindView.findInCurrentlySelectedDirectory(target);
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:use-selection-as-find-pattern', () => {
      if (this.projectFindPanel?.isVisible() || this.findPanel?.isVisible()) { return; }
      return this.createViews();
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:use-selection-as-replace-pattern', () => {
      if (this.projectFindPanel?.isVisible() || this.findPanel?.isVisible()) { return; }
      return this.createViews();
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:toggle', () => {
      this.createViews();
      return togglePanel(this.findPanel, this.projectFindPanel, () => this.findView.focusFindEditor());
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:show', () => {
      this.createViews();
      return showPanel(this.findPanel, this.projectFindPanel, () => this.findView.focusFindEditor());
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:show-replace', () => {
      this.createViews();
      return showPanel(this.findPanel, this.projectFindPanel, () => this.findView.focusReplaceEditor());
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:clear-history', () => {
      this.findHistory.clear();
      return this.replaceHistory.clear();
    })
    );

    // Handling cancel in the workspace + code editors
    const handleEditorCancel = ({target}) => {
      const isMiniEditor = (target.tagName === 'ATOM-TEXT-EDITOR') && target.hasAttribute('mini');
      if (!isMiniEditor) {
        this.findPanel?.hide();
        return this.projectFindPanel?.hide();
      }
    };

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'core:cancel': handleEditorCancel,
      'core:close': handleEditorCancel
    }
    )
    );

    const selectNextObjectForEditorElement = editorElement => {
      if (this.selectNextObjects == null) { this.selectNextObjects = new WeakMap(); }
      const editor = editorElement.getModel();
      let selectNext = this.selectNextObjects.get(editor);
      if (selectNext == null) {
        selectNext = new SelectNext(editor);
        this.selectNextObjects.set(editor, selectNext);
      }
      return selectNext;
    };

    var showPanel = function(panelToShow, panelToHide, postShowAction) {
      panelToHide.hide();
      panelToShow.show();
      return postShowAction?.();
    };

    var togglePanel = function(panelToToggle, panelToHide, postToggleAction) {
      panelToHide.hide();

      if (panelToToggle.isVisible()) {
        return panelToToggle.hide();
      } else {
        panelToToggle.show();
        return postToggleAction?.();
      }
    };

    return this.subscriptions.add(atom.commands.add('.editor:not(.mini)', {
      'find-and-replace:select-next'(event) {
        return selectNextObjectForEditorElement(this).findAndSelectNext();
      },
      'find-and-replace:select-all'(event) {
        return selectNextObjectForEditorElement(this).findAndSelectAll();
      },
      'find-and-replace:select-undo'(event) {
        return selectNextObjectForEditorElement(this).undoLastSelection();
      },
      'find-and-replace:select-skip'(event) {
        return selectNextObjectForEditorElement(this).skipCurrentSelection();
      }
    }
    )
    );
  },

  consumeElementIcons(service) {
    getIconServices().setElementIcons(service);
    return new Disposable(() => getIconServices().resetElementIcons());
  },

  consumeFileIcons(service) {
    getIconServices().setFileIcons(service);
    return new Disposable(() => getIconServices().resetFileIcons());
  },

  toggleAutocompletions(value) {
    if ((this.findView == null)) {
      return;
    }
    if (value) {
      this.autocompleteSubscriptions = new CompositeDisposable;
      const disposable = this.autocompleteWatchEditor?.(this.findView.findEditor, ['default']);
      if (disposable != null) {
        return this.autocompleteSubscriptions.add(disposable);
      }
    } else {
      return this.autocompleteSubscriptions?.dispose();
    }
  },

  consumeAutocompleteWatchEditor(watchEditor) {
    this.autocompleteWatchEditor = watchEditor;
    atom.config.observe(
      'find-and-replace.autocompleteSearches',
      value => this.toggleAutocompletions(value));
    return new Disposable(() => {
      this.autocompleteSubscriptions?.dispose();
      return this.autocompleteWatchEditor = null;
    });
  },

  provideService() {
    return {resultsMarkerLayerForTextEditor: this.findModel.resultsMarkerLayerForTextEditor.bind(this.findModel)};
  },

  createViews() {
    if (this.findView != null) { return; }

    const findBuffer = new TextBuffer;
    const replaceBuffer = new TextBuffer;
    const pathsBuffer = new TextBuffer;

    const findHistoryCycler = new HistoryCycler(findBuffer, this.findHistory);
    const replaceHistoryCycler = new HistoryCycler(replaceBuffer, this.replaceHistory);
    const pathsHistoryCycler = new HistoryCycler(pathsBuffer, this.pathsHistory);

    const options = {findBuffer, replaceBuffer, pathsBuffer, findHistoryCycler, replaceHistoryCycler, pathsHistoryCycler};

    this.findView = new FindView(this.findModel, options);

    this.projectFindView = new ProjectFindView(this.resultsModel, options);

    this.findPanel = atom.workspace.addBottomPanel({item: this.findView, visible: false, className: 'tool-panel panel-bottom'});
    this.projectFindPanel = atom.workspace.addBottomPanel({item: this.projectFindView, visible: false, className: 'tool-panel panel-bottom'});

    this.findView.setPanel(this.findPanel);
    this.projectFindView.setPanel(this.projectFindPanel);

    // HACK: Soooo, we need to get the model to the pane view whenever it is
    // created. Creation could come from the opener below, or, more problematic,
    // from a deserialize call when splitting panes. For now, all pane views will
    // use this same model. This needs to be improved! I dont know the best way
    // to deal with this:
    // 1. How should serialization work in the case of a shared model.
    // 2. Or maybe we create the model each time a new pane is created? Then
    //    ProjectFindView needs to know about each model so it can invoke a search.
    //    And on each new model, it will run the search again.
    //
    // See https://github.com/atom/find-and-replace/issues/63
    // This makes projectFindView accesible in ResultsPaneView so that resultsModel
    // can be properly set for ResultsPaneView instances and ProjectFindView instance
    // as different pane views don't necessarily use same models anymore
    // but most recent pane view and projectFindView do
    ResultsPaneView.projectFindView = this.projectFindView;

    return this.toggleAutocompletions(atom.config.get('find-and-replace.autocompleteSearches'));
  },

  deactivate() {
    this.findPanel?.destroy();
    this.findPanel = null;
    this.findView?.destroy();
    this.findView = null;
    this.findModel?.destroy();
    this.findModel = null;

    this.projectFindPanel?.destroy();
    this.projectFindPanel = null;
    this.projectFindView?.destroy();
    this.projectFindView = null;

    ResultsPaneView.model = null;

    this.autocompleteSubscriptions?.dispose();
    this.autocompleteManagerService = null;
    this.subscriptions?.dispose();
    return this.subscriptions = null;
  },

  serialize() {
    return {
      findOptions: this.findOptions.serialize(),
      findHistory: this.findHistory.serialize(),
      replaceHistory: this.replaceHistory.serialize(),
      pathsHistory: this.pathsHistory.serialize()
    };
  }
};
