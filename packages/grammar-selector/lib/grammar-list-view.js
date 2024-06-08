const SelectListView = require('atom-select-list');

module.exports = class GrammarListView {
  constructor() {
    this.autoDetect = { name: 'Auto Detect' };

    this.configSubscription = atom.config.observe(
      'grammar-selector.hideDuplicateTextMateGrammars',
      (value) => {
        this.hideDuplicateGrammars = value
      }
    );

    this.selectListView = new SelectListView({
      itemsClassList: ['mark-active'],
      items: [],
      filterKeyForItem: grammar => grammar.name,
      elementForItem: grammar => {
        const grammarName = grammar.name || grammar.scopeName;
        const element = document.createElement('li');
        if (grammar === this.currentGrammar) {
          element.classList.add('active');
        }
        element.classList.add('grammar-item');
        element.textContent = grammarName;
        element.dataset.grammar = grammarName;

        const div = document.createElement('div');
        div.classList.add('pull-right');

        if (!this.hideDuplicateGrammars) {
          // When we show all grammars, we should add a badge to each grammar
          // to distinguish them from one another in the list.
          const parser = document.createElement('span');

          let badgeText = getBadgeTextForGrammar(grammar);
          let badgeColor = getBadgeColorForGrammar(grammar);

          parser.classList.add(
            'grammar-selector-parser',
            'badge',
            badgeColor
          );
          parser.textContent = badgeText;
          if (isModernTreeSitter(grammar)) {
            parser.setAttribute(
              'title',
              '(Recommended) A faster parser with improved syntax highlighting & code navigation support.'
            );
          }
          div.appendChild(parser);
        }

        if (grammar.scopeName) {
          const scopeName = document.createElement('scopeName');
          scopeName.classList.add('badge', 'badge-info');
          scopeName.textContent = grammar.scopeName;
          div.appendChild(scopeName);
          element.appendChild(div);
        }

        return element;
      },
      didConfirmSelection: grammar => {
        this.cancel();
        if (grammar === this.autoDetect) {
          atom.textEditors.clearGrammarOverride(this.editor);
        } else {
          atom.grammars.assignGrammar(this.editor, grammar);
        }
      },
      didCancelSelection: () => {
        this.cancel();
      }
    });

    this.selectListView.element.classList.add('grammar-selector');
  }

  destroy() {
    this.cancel();
    return this.selectListView.destroy();
  }

  cancel() {
    if (this.panel != null) {
      this.panel.destroy();
    }
    this.panel = null;
    this.currentGrammar = null;
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  attach() {
    this.previouslyFocusedElement = document.activeElement;
    if (this.panel == null) {
      this.panel = atom.workspace.addModalPanel({ item: this.selectListView });
    }
    this.selectListView.focus();
    this.selectListView.reset();
  }

  getAllDisplayableGrammars() {
    let allGrammars = atom.grammars
      .getGrammars({ includeTreeSitter: true })
      .filter(grammar => {
        return grammar !== atom.grammars.nullGrammar && grammar.name;
      });

    return allGrammars;
  }

  async toggle() {
    if (this.panel != null) {
      this.cancel();
      return;
    }

    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      this.editor = editor;
      this.currentGrammar = this.editor.getGrammar();
      if (this.currentGrammar === atom.grammars.nullGrammar) {
        this.currentGrammar = this.autoDetect;
      }

      let grammars = this.getAllDisplayableGrammars();

      grammars.sort((a, b) => {
        if (a.scopeName === 'text.plain') {
          return -1;
        } else if (b.scopeName === 'text.plain') {
          return 1;
        } else if (a.name === b.name) {
          return compareGrammarType(a, b);
        }
        return a.name.localeCompare(b.name);
      });

      if (this.hideDuplicateGrammars) {
        let displayedGrammars = [];
        let seenIds = new Set();

        for (let grammar of grammars) {
          if (seenIds.has(grammar.scopeName)) continue;
          seenIds.add(grammar.scopeName);
          displayedGrammars.push(grammar);
        }

        grammars = displayedGrammars;
      }

      grammars.unshift(this.autoDetect);
      await this.selectListView.update({ items: grammars });
      this.attach();
    }
  }
};

// We look up global settings here, but it's just to determine the badge
// colors. Otherwise we should be looking up these values in a scope-specific
// manner.
function getLanguageModeConfig() {
  let isTreeSitterMode = atom.config.get('core.useTreeSitterParsers');
  if (!isTreeSitterMode) return 'textmate';
  return 'wasm-tree-sitter';
}

function isModernTreeSitter(grammar) {
  return grammar.constructor.name === 'WASMTreeSitterGrammar';
}

function compareGrammarType(a, b) {
  return getGrammarScore(a) - getGrammarScore(b);
}

// Given a scope name, determines the user's preferred parser type for that
// language.
function getParserPreferenceForScopeName(scopeName) {
  let useTreeSitterParsers = atom.config.get(
    'core.useTreeSitterParsers',
    { scope: [scopeName] }
  );
  let useLegacyTreeSitter = atom.config.get(
    'core.useLegacyTreeSitter',
    { scope: [scopeName] }
  );

  if (!useTreeSitterParsers) {
    return 'textmate';
  } else if (useLegacyTreeSitter) {
    return 'node-tree-sitter';
  } else {
    return 'web-tree-sitter';
  }
}

function getBadgeTextForGrammar(grammar) {
  switch (grammar.constructor.name) {
    case 'Grammar':
      return 'TextMate';
    case 'WASMTreeSitterGrammar':
      return 'Modern Tree-sitter';
    case 'TreeSitterGrammar':
      return 'Legacy Tree-sitter';
  }
}

const BADGE_COLORS_BY_LANGUAGE_MODE_CONFIG = {
  'textmate': {
    'Grammar': 'badge-success',
    'TreeSitterGrammar': 'badge-info',
    'WASMTreeSitterGrammar': 'badge-info'
  },
  'web-tree-sitter': {
    'WASMTreeSitterGrammar': 'badge-success',
    'TreeSitterGrammar': 'badge-warning',
    'Grammar': 'badge-info'
  },
  'node-tree-sitter': {
    'TreeSitterGrammar': 'badge-success',
    'WASMTreeSitterGrammar': 'badge-warning',
    'Grammar': 'badge-info'
  }
};

function getBadgeColorForGrammar(grammar) {
  let languageModeConfig = getLanguageModeConfig();
  let classNameMap = BADGE_COLORS_BY_LANGUAGE_MODE_CONFIG[languageModeConfig];
  return classNameMap[grammar.constructor.name];
}

function getGrammarScore(grammar) {
  let languageParser = getParserPreferenceForScopeName(grammar.scopeName);
  if (isModernTreeSitter(grammar)) {
    return languageParser === 'node-tree-sitter' ? -1 : -2;
  }
  return languageParser === 'textmate' ? -3 : 0;
}
