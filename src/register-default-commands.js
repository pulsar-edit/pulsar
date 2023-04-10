const {ipcRenderer} = require('electron');
const Grim = require('grim');

module.exports = function({commandRegistry, commandInstaller, config, notificationManager, project, clipboard}) {
  commandRegistry.add('atom-workspace', {
    'pane:show-next-recently-used-item': function() {
      return this.getModel().getActivePane().activateNextRecentlyUsedItem();
    },
    'pane:show-previous-recently-used-item': function() {
      return this.getModel().getActivePane().activatePreviousRecentlyUsedItem();
    },
    'pane:move-active-item-to-top-of-stack': function() {
      return this.getModel().getActivePane().moveActiveItemToTopOfStack();
    },
    'pane:show-next-item': function() {
      return this.getModel().getActivePane().activateNextItem();
    },
    'pane:show-previous-item': function() {
      return this.getModel().getActivePane().activatePreviousItem();
    },
    'pane:show-item-1': function() {
      return this.getModel().getActivePane().activateItemAtIndex(0);
    },
    'pane:show-item-2': function() {
      return this.getModel().getActivePane().activateItemAtIndex(1);
    },
    'pane:show-item-3': function() {
      return this.getModel().getActivePane().activateItemAtIndex(2);
    },
    'pane:show-item-4': function() {
      return this.getModel().getActivePane().activateItemAtIndex(3);
    },
    'pane:show-item-5': function() {
      return this.getModel().getActivePane().activateItemAtIndex(4);
    },
    'pane:show-item-6': function() {
      return this.getModel().getActivePane().activateItemAtIndex(5);
    },
    'pane:show-item-7': function() {
      return this.getModel().getActivePane().activateItemAtIndex(6);
    },
    'pane:show-item-8': function() {
      return this.getModel().getActivePane().activateItemAtIndex(7);
    },
    'pane:show-item-9': function() {
      return this.getModel().getActivePane().activateLastItem();
    },
    'pane:move-item-right': function() {
      return this.getModel().getActivePane().moveItemRight();
    },
    'pane:move-item-left': function() {
      return this.getModel().getActivePane().moveItemLeft();
    },
    'window:increase-font-size': function() {
      return this.getModel().increaseFontSize();
    },
    'window:decrease-font-size': function() {
      return this.getModel().decreaseFontSize();
    },
    'window:reset-font-size': function() {
      return this.getModel().resetFontSize();
    },
    'application:about': function() {
      return ipcRenderer.send('command', 'application:about');
    },
    'application:show-preferences': function() {
      return ipcRenderer.send('command', 'application:show-settings');
    },
    'application:show-settings': function() {
      return ipcRenderer.send('command', 'application:show-settings');
    },
    'application:quit': function() {
      return ipcRenderer.send('command', 'application:quit');
    },
    'application:hide': function() {
      return ipcRenderer.send('command', 'application:hide');
    },
    'application:hide-other-applications': function() {
      return ipcRenderer.send('command', 'application:hide-other-applications');
    },
    'application:install-update': function() {
      return ipcRenderer.send('command', 'application:install-update');
    },
    'application:unhide-all-applications': function() {
      return ipcRenderer.send('command', 'application:unhide-all-applications');
    },
    'application:new-window': function() {
      return ipcRenderer.send('command', 'application:new-window');
    },
    'application:new-file': function() {
      return ipcRenderer.send('command', 'application:new-file');
    },
    'application:open': function() {
      var defaultPath, ref, ref1, ref2;
      defaultPath = (ref = (ref1 = atom.workspace.getActiveTextEditor()) != null ? ref1.getPath() : void 0) != null ? ref : (ref2 = atom.project.getPaths()) != null ? ref2[0] : void 0;
      return ipcRenderer.send('open-chosen-any', defaultPath);
    },
    'application:open-file': function() {
      var defaultPath, ref, ref1, ref2;
      defaultPath = (ref = (ref1 = atom.workspace.getActiveTextEditor()) != null ? ref1.getPath() : void 0) != null ? ref : (ref2 = atom.project.getPaths()) != null ? ref2[0] : void 0;
      return ipcRenderer.send('open-chosen-file', defaultPath);
    },
    'application:open-folder': function() {
      var defaultPath, ref, ref1, ref2;
      defaultPath = (ref = (ref1 = atom.workspace.getActiveTextEditor()) != null ? ref1.getPath() : void 0) != null ? ref : (ref2 = atom.project.getPaths()) != null ? ref2[0] : void 0;
      return ipcRenderer.send('open-chosen-folder', defaultPath);
    },
    'application:open-dev': function() {
      return ipcRenderer.send('command', 'application:open-dev');
    },
    'application:open-safe': function() {
      return ipcRenderer.send('command', 'application:open-safe');
    },
    'application:add-project-folder': function() {
      return atom.addProjectFolder();
    },
    'application:minimize': function() {
      return ipcRenderer.send('command', 'application:minimize');
    },
    'application:zoom': function() {
      return ipcRenderer.send('command', 'application:zoom');
    },
    'application:bring-all-windows-to-front': function() {
      return ipcRenderer.send('command', 'application:bring-all-windows-to-front');
    },
    'application:open-your-config': function() {
      return ipcRenderer.send('command', 'application:open-your-config');
    },
    'application:open-your-init-script': function() {
      return ipcRenderer.send('command', 'application:open-your-init-script');
    },
    'application:open-your-keymap': function() {
      return ipcRenderer.send('command', 'application:open-your-keymap');
    },
    'application:open-your-snippets': function() {
      return ipcRenderer.send('command', 'application:open-your-snippets');
    },
    'application:open-your-stylesheet': function() {
      return ipcRenderer.send('command', 'application:open-your-stylesheet');
    },
    'application:open-license': function() {
      return this.getModel().openLicense();
    },
    'window:run-package-specs': function() {
      return this.runPackageSpecs();
    },
    'window:toggle-left-dock': function() {
      return this.getModel().getLeftDock().toggle();
    },
    'window:toggle-right-dock': function() {
      return this.getModel().getRightDock().toggle();
    },
    'window:toggle-bottom-dock': function() {
      return this.getModel().getBottomDock().toggle();
    },
    'window:focus-next-pane': function() {
      return this.getModel().activateNextPane();
    },
    'window:focus-previous-pane': function() {
      return this.getModel().activatePreviousPane();
    },
    'window:focus-pane-above': function() {
      return this.focusPaneViewAbove();
    },
    'window:focus-pane-below': function() {
      return this.focusPaneViewBelow();
    },
    'window:focus-pane-on-left': function() {
      return this.focusPaneViewOnLeft();
    },
    'window:focus-pane-on-right': function() {
      return this.focusPaneViewOnRight();
    },
    'window:move-active-item-to-pane-above': function() {
      return this.moveActiveItemToPaneAbove();
    },
    'window:move-active-item-to-pane-below': function() {
      return this.moveActiveItemToPaneBelow();
    },
    'window:move-active-item-to-pane-on-left': function() {
      return this.moveActiveItemToPaneOnLeft();
    },
    'window:move-active-item-to-pane-on-right': function() {
      return this.moveActiveItemToPaneOnRight();
    },
    'window:copy-active-item-to-pane-above': function() {
      return this.moveActiveItemToPaneAbove({
        keepOriginal: true
      });
    },
    'window:copy-active-item-to-pane-below': function() {
      return this.moveActiveItemToPaneBelow({
        keepOriginal: true
      });
    },
    'window:copy-active-item-to-pane-on-left': function() {
      return this.moveActiveItemToPaneOnLeft({
        keepOriginal: true
      });
    },
    'window:copy-active-item-to-pane-on-right': function() {
      return this.moveActiveItemToPaneOnRight({
        keepOriginal: true
      });
    },
    'window:save-all': function() {
      return this.getModel().saveAll();
    },
    'window:toggle-invisibles': function() {
      return config.set("editor.showInvisibles", !config.get("editor.showInvisibles"));
    },
    'window:log-deprecation-warnings': function() {
      return Grim.logDeprecations();
    },
    'window:toggle-auto-indent': function() {
      return config.set("editor.autoIndent", !config.get("editor.autoIndent"));
    },
    'pane:reopen-closed-item': function() {
      return this.getModel().reopenItem();
    },
    'core:close': function() {
      return this.getModel().closeActivePaneItemOrEmptyPaneOrWindow();
    },
    'core:save': function() {
      return this.getModel().saveActivePaneItem();
    },
    'core:save-as': function() {
      return this.getModel().saveActivePaneItemAs();
    }
  }, false);
  if (process.platform === 'darwin') {
    commandRegistry.add('atom-workspace', 'window:install-shell-commands', (function() {
      return commandInstaller.installShellCommandsInteractively();
    }), false);
  }
  commandRegistry.add('atom-pane', {
    'pane:save-items': function() {
      return this.getModel().saveItems();
    },
    'pane:split-left': function() {
      return this.getModel().splitLeft();
    },
    'pane:split-right': function() {
      return this.getModel().splitRight();
    },
    'pane:split-up': function() {
      return this.getModel().splitUp();
    },
    'pane:split-down': function() {
      return this.getModel().splitDown();
    },
    'pane:split-left-and-copy-active-item': function() {
      return this.getModel().splitLeft({
        copyActiveItem: true
      });
    },
    'pane:split-right-and-copy-active-item': function() {
      return this.getModel().splitRight({
        copyActiveItem: true
      });
    },
    'pane:split-up-and-copy-active-item': function() {
      return this.getModel().splitUp({
        copyActiveItem: true
      });
    },
    'pane:split-down-and-copy-active-item': function() {
      return this.getModel().splitDown({
        copyActiveItem: true
      });
    },
    'pane:split-left-and-move-active-item': function() {
      return this.getModel().splitLeft({
        moveActiveItem: true
      });
    },
    'pane:split-right-and-move-active-item': function() {
      return this.getModel().splitRight({
        moveActiveItem: true
      });
    },
    'pane:split-up-and-move-active-item': function() {
      return this.getModel().splitUp({
        moveActiveItem: true
      });
    },
    'pane:split-down-and-move-active-item': function() {
      return this.getModel().splitDown({
        moveActiveItem: true
      });
    },
    'pane:close': function() {
      return this.getModel().close();
    },
    'pane:close-other-items': function() {
      return this.getModel().destroyInactiveItems();
    },
    'pane:increase-size': function() {
      return this.getModel().increaseSize();
    },
    'pane:decrease-size': function() {
      return this.getModel().decreaseSize();
    }
  }, false);
  commandRegistry.add('atom-text-editor', stopEventPropagation({
    'core:move-left': function() {
      return this.moveLeft();
    },
    'core:move-right': function() {
      return this.moveRight();
    },
    'core:select-left': function() {
      return this.selectLeft();
    },
    'core:select-right': function() {
      return this.selectRight();
    },
    'core:select-up': function() {
      return this.selectUp();
    },
    'core:select-down': function() {
      return this.selectDown();
    },
    'core:select-all': function() {
      return this.selectAll();
    },
    'editor:select-word': function() {
      return this.selectWordsContainingCursors();
    },
    'editor:consolidate-selections': function(event) {
      if (!this.consolidateSelections()) {
        return event.abortKeyBinding();
      }
    },
    'editor:move-to-beginning-of-next-paragraph': function() {
      return this.moveToBeginningOfNextParagraph();
    },
    'editor:move-to-beginning-of-previous-paragraph': function() {
      return this.moveToBeginningOfPreviousParagraph();
    },
    'editor:move-to-beginning-of-screen-line': function() {
      return this.moveToBeginningOfScreenLine();
    },
    'editor:move-to-beginning-of-line': function() {
      return this.moveToBeginningOfLine();
    },
    'editor:move-to-end-of-screen-line': function() {
      return this.moveToEndOfScreenLine();
    },
    'editor:move-to-end-of-line': function() {
      return this.moveToEndOfLine();
    },
    'editor:move-to-first-character-of-line': function() {
      return this.moveToFirstCharacterOfLine();
    },
    'editor:move-to-beginning-of-word': function() {
      return this.moveToBeginningOfWord();
    },
    'editor:move-to-end-of-word': function() {
      return this.moveToEndOfWord();
    },
    'editor:move-to-beginning-of-next-word': function() {
      return this.moveToBeginningOfNextWord();
    },
    'editor:move-to-previous-word-boundary': function() {
      return this.moveToPreviousWordBoundary();
    },
    'editor:move-to-next-word-boundary': function() {
      return this.moveToNextWordBoundary();
    },
    'editor:move-to-previous-subword-boundary': function() {
      return this.moveToPreviousSubwordBoundary();
    },
    'editor:move-to-next-subword-boundary': function() {
      return this.moveToNextSubwordBoundary();
    },
    'editor:select-to-beginning-of-next-paragraph': function() {
      return this.selectToBeginningOfNextParagraph();
    },
    'editor:select-to-beginning-of-previous-paragraph': function() {
      return this.selectToBeginningOfPreviousParagraph();
    },
    'editor:select-to-end-of-line': function() {
      return this.selectToEndOfLine();
    },
    'editor:select-to-beginning-of-line': function() {
      return this.selectToBeginningOfLine();
    },
    'editor:select-to-end-of-word': function() {
      return this.selectToEndOfWord();
    },
    'editor:select-to-beginning-of-word': function() {
      return this.selectToBeginningOfWord();
    },
    'editor:select-to-beginning-of-next-word': function() {
      return this.selectToBeginningOfNextWord();
    },
    'editor:select-to-next-word-boundary': function() {
      return this.selectToNextWordBoundary();
    },
    'editor:select-to-previous-word-boundary': function() {
      return this.selectToPreviousWordBoundary();
    },
    'editor:select-to-next-subword-boundary': function() {
      return this.selectToNextSubwordBoundary();
    },
    'editor:select-to-previous-subword-boundary': function() {
      return this.selectToPreviousSubwordBoundary();
    },
    'editor:select-to-first-character-of-line': function() {
      return this.selectToFirstCharacterOfLine();
    },
    'editor:select-line': function() {
      return this.selectLinesContainingCursors();
    },
    'editor:select-larger-syntax-node': function() {
      return this.selectLargerSyntaxNode();
    },
    'editor:select-smaller-syntax-node': function() {
      return this.selectSmallerSyntaxNode();
    }
  }), false);
  commandRegistry.add('atom-text-editor:not([readonly])', stopEventPropagation({
    'core:undo': function() {
      return this.undo();
    },
    'core:redo': function() {
      return this.redo();
    }
  }), false);
  commandRegistry.add('atom-text-editor', stopEventPropagationAndGroupUndo(config, {
    'core:copy': function() {
      return this.copySelectedText();
    },
    'editor:copy-selection': function() {
      return this.copyOnlySelectedText();
    }
  }), false);
  commandRegistry.add('atom-text-editor:not([readonly])', stopEventPropagationAndGroupUndo(config, {
    'core:backspace': function() {
      return this.backspace();
    },
    'core:delete': function() {
      return this.delete();
    },
    'core:cut': function() {
      return this.cutSelectedText();
    },
    'core:paste': function() {
      return this.pasteText();
    },
    'editor:paste-without-reformatting': function() {
      return this.pasteText({
        normalizeLineEndings: false,
        autoIndent: false,
        preserveTrailingLineIndentation: true
      });
    },
    'editor:delete-to-previous-word-boundary': function() {
      return this.deleteToPreviousWordBoundary();
    },
    'editor:delete-to-next-word-boundary': function() {
      return this.deleteToNextWordBoundary();
    },
    'editor:delete-to-beginning-of-word': function() {
      return this.deleteToBeginningOfWord();
    },
    'editor:delete-to-beginning-of-line': function() {
      return this.deleteToBeginningOfLine();
    },
    'editor:delete-to-end-of-line': function() {
      return this.deleteToEndOfLine();
    },
    'editor:delete-to-end-of-word': function() {
      return this.deleteToEndOfWord();
    },
    'editor:delete-to-beginning-of-subword': function() {
      return this.deleteToBeginningOfSubword();
    },
    'editor:delete-to-end-of-subword': function() {
      return this.deleteToEndOfSubword();
    },
    'editor:delete-line': function() {
      return this.deleteLine();
    },
    'editor:cut-to-end-of-line': function() {
      return this.cutToEndOfLine();
    },
    'editor:cut-to-end-of-buffer-line': function() {
      return this.cutToEndOfBufferLine();
    },
    'editor:transpose': function() {
      return this.transpose();
    },
    'editor:upper-case': function() {
      return this.upperCase();
    },
    'editor:lower-case': function() {
      return this.lowerCase();
    }
  }), false);
  commandRegistry.add('atom-text-editor:not([mini])', stopEventPropagation({
    'core:move-up': function() {
      return this.moveUp();
    },
    'core:move-down': function() {
      return this.moveDown();
    },
    'core:move-to-top': function() {
      return this.moveToTop();
    },
    'core:move-to-bottom': function() {
      return this.moveToBottom();
    },
    'core:page-up': function() {
      return this.pageUp();
    },
    'core:page-down': function() {
      return this.pageDown();
    },
    'core:select-to-top': function() {
      return this.selectToTop();
    },
    'core:select-to-bottom': function() {
      return this.selectToBottom();
    },
    'core:select-page-up': function() {
      return this.selectPageUp();
    },
    'core:select-page-down': function() {
      return this.selectPageDown();
    },
    'editor:add-selection-below': function() {
      return this.addSelectionBelow();
    },
    'editor:add-selection-above': function() {
      return this.addSelectionAbove();
    },
    'editor:split-selections-into-lines': function() {
      return this.splitSelectionsIntoLines();
    },
    'editor:toggle-soft-tabs': function() {
      return this.toggleSoftTabs();
    },
    'editor:toggle-soft-wrap': function() {
      return this.toggleSoftWrapped();
    },
    'editor:fold-all': function() {
      return this.foldAll();
    },
    'editor:unfold-all': function() {
      return this.unfoldAll();
    },
    'editor:fold-current-row': function() {
      this.foldCurrentRow();
      return this.scrollToCursorPosition();
    },
    'editor:unfold-current-row': function() {
      this.unfoldCurrentRow();
      return this.scrollToCursorPosition();
    },
    'editor:fold-selection': function() {
      return this.foldSelectedLines();
    },
    'editor:fold-at-indent-level-1': function() {
      this.foldAllAtIndentLevel(0);
      return this.scrollToCursorPosition();
    },
    'editor:fold-at-indent-level-2': function() {
      this.foldAllAtIndentLevel(1);
      return this.scrollToCursorPosition();
    },
    'editor:fold-at-indent-level-3': function() {
      this.foldAllAtIndentLevel(2);
      return this.scrollToCursorPosition();
    },
    'editor:fold-at-indent-level-4': function() {
      this.foldAllAtIndentLevel(3);
      return this.scrollToCursorPosition();
    },
    'editor:fold-at-indent-level-5': function() {
      this.foldAllAtIndentLevel(4);
      return this.scrollToCursorPosition();
    },
    'editor:fold-at-indent-level-6': function() {
      this.foldAllAtIndentLevel(5);
      return this.scrollToCursorPosition();
    },
    'editor:fold-at-indent-level-7': function() {
      this.foldAllAtIndentLevel(6);
      return this.scrollToCursorPosition();
    },
    'editor:fold-at-indent-level-8': function() {
      this.foldAllAtIndentLevel(7);
      return this.scrollToCursorPosition();
    },
    'editor:fold-at-indent-level-9': function() {
      this.foldAllAtIndentLevel(8);
      return this.scrollToCursorPosition();
    },
    'editor:log-cursor-scope': function() {
      return showCursorScope(this.getCursorScope(), notificationManager);
    },
    'editor:log-cursor-syntax-tree-scope': function() {
      return showSyntaxTree(this.getCursorSyntaxTreeScope(), notificationManager);
    },
    'editor:copy-path': function() {
      return copyPathToClipboard(this, project, clipboard, false);
    },
    'editor:copy-project-path': function() {
      return copyPathToClipboard(this, project, clipboard, true);
    },
    'editor:toggle-indent-guide': function() {
      return config.set('editor.showIndentGuide', !config.get('editor.showIndentGuide'));
    },
    'editor:toggle-line-numbers': function() {
      return config.set('editor.showLineNumbers', !config.get('editor.showLineNumbers'));
    },
    'editor:scroll-to-cursor': function() {
      return this.scrollToCursorPosition();
    }
  }), false);
  return commandRegistry.add('atom-text-editor:not([mini]):not([readonly])', stopEventPropagationAndGroupUndo(config, {
    'editor:indent': function() {
      return this.indent();
    },
    'editor:auto-indent': function() {
      return this.autoIndentSelectedRows();
    },
    'editor:indent-selected-rows': function() {
      return this.indentSelectedRows();
    },
    'editor:outdent-selected-rows': function() {
      return this.outdentSelectedRows();
    },
    'editor:newline': function() {
      return this.insertNewline();
    },
    'editor:newline-below': function() {
      return this.insertNewlineBelow();
    },
    'editor:newline-above': function() {
      return this.insertNewlineAbove();
    },
    'editor:toggle-line-comments': function() {
      return this.toggleLineCommentsInSelection();
    },
    'editor:checkout-head-revision': function() {
      return atom.workspace.checkoutHeadRevision(this);
    },
    'editor:move-line-up': function() {
      return this.moveLineUp();
    },
    'editor:move-line-down': function() {
      return this.moveLineDown();
    },
    'editor:move-selection-left': function() {
      return this.moveSelectionLeft();
    },
    'editor:move-selection-right': function() {
      return this.moveSelectionRight();
    },
    'editor:duplicate-lines': function() {
      return this.duplicateLines();
    },
    'editor:join-lines': function() {
      return this.joinLines();
    }
  }), false);
};

var stopEventPropagation = function(commandListeners) {
  const newCommandListeners = {};
  for (let commandName in commandListeners) {
    let commandListener = commandListeners[commandName];
    newCommandListeners[commandName] = function(event) {
      event.stopPropagation();
      return commandListener.call(this.getModel(), event);
    };
  }
  return newCommandListeners;
};

var stopEventPropagationAndGroupUndo = function(config, commandListeners) {
  const newCommandListeners = {};
  for (let commandName in commandListeners) {
    let commandListener = commandListeners[commandName];
    newCommandListeners[commandName] = function(event) {
      event.stopPropagation();
      const model = this.getModel();
      model.transact(model.getUndoGroupingInterval(),() => commandListener.call(model, event));
    };
  }
  return newCommandListeners;
};

var showCursorScope = function(descriptor, notificationManager) {
  let list = descriptor.scopes.toString().split(',');
  list = list.map((item) => `* ${item}`);
  const content = `Scopes at Cursor\n${list.join('\n')}`;
  return notificationManager.addInfo(content, {dismissable: true});
};

var showSyntaxTree = function(descriptor, notificationManager) {
  let list = descriptor.scopes.toString().split(',');
  list = list.map((item) => `* ${item}`);
  const content = `Syntax tree at Cursor\n${list.join('\n')}`;
  return notificationManager.addInfo(content, {dismissable: true});
};

var copyPathToClipboard = function(editor, project, clipboard, relative) {
  let filePath;
  if (filePath = editor.getPath()) {
    if (relative) {
      filePath = project.relativize(filePath);
    }
    clipboard.write(filePath);
  }
};
