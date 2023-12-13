const Path = require('path');
const fs = require('fs-plus');
const Config = require('./config');
const { CompositeDisposable, Point } = require('atom');
const SelectListView = require('atom-select-list');
const { match } = require('fuzzaldrin');

const el = require('./element-builder');
const { badge } = require('./util');

// Properties that we allow a provider to set on a `SelectListView` via a
// `ListController` instance.
const ALLOWED_PROPS_IN_LIST_CONTROLLER = new Set([
  'errorMessage',
  'emptyMessage',
  'loadingMessage',
  'loadingBadge'
]);

function validateListControllerProps(props) {
  return Object.keys(props).every(k => (
    ALLOWED_PROPS_IN_LIST_CONTROLLER.has(k)
  ));
}

/**
 * A class for setting various UI properties on a symbol list palette. This is a
 * privilege given to the “main” (or _exclusive_) provider for a given task.
 *
 * This is how we allow a provider to communicate its state to the UI without
 * giving it full control over the `SelectListView` used to show results.
 */
class ListController {
  constructor(view) {
    this.view = view;
  }

  set(props) {
    if (!validateListControllerProps(props)) {
      console.warn('Provider gave invalid properties to symbol list UI:', props);
    }
    return this.view.update(props);
  }

  clear(...propNames) {
    let props = {};
    for (let propName of propNames) {
      if (!ALLOWED_PROPS_IN_LIST_CONTROLLER.has(propName)) continue;
      props[propName] = null;
    }
    return this.view.update(props);
  }
}


class SymbolsView {
  static highlightMatches(_context, name, matches, offsetIndex = 0) {
    let lastIndex = 0;
    let matchedChars = [];

    const fragment = document.createDocumentFragment();

    for (let matchIndex of [...matches]) {
      matchIndex -= offsetIndex;
      if (matchIndex < 0) continue;

      let unmatched = name.substring(lastIndex, matchIndex);
      if (unmatched) {
        if (matchedChars.length) {
          let span = document.createElement('span');
          span.classList.add('character-match');
          span.textContent = matchedChars.join('');
          fragment.appendChild(span);
        }
        matchedChars = [];
        fragment.appendChild(document.createTextNode(unmatched));
      }
      matchedChars.push(name[matchIndex]);
      lastIndex = matchIndex + 1;
    }

    if (matchedChars.length) {
      const span = document.createElement('span');
      span.classList.add('character-match');
      span.textContent = matchedChars.join('');
      fragment.appendChild(span);
    }

    // Remaining characters are plain text.
    fragment.appendChild(
      document.createTextNode(name.substring(lastIndex))
    );

    return fragment;
  }

  constructor(stack, broker, options = {}) {
    this.stack = stack;
    this.broker = broker;

    options = {
      emptyMessage: 'No symbols found',
      maxResults: null,
      ...options
    };

    this.selectListView = new SelectListView({
      ...options,
      items: [],
      filterKeyForItem: (item) => item.name,
      elementForItem: this.elementForItem.bind(this),
      didChangeQuery: this.didChangeQuery.bind(this),
      didChangeSelection: this.didChangeSelection.bind(this),
      didConfirmSelection: this.didConfirmSelection.bind(this),
      didConfirmEmptySelection: this.didConfirmEmptySelection.bind(this),
      didCancelSelection: this.didCancelSelection.bind(this)
    });

    this.selectListViewOptions = options;

    this.listController = new ListController(this.selectListView);

    this.element = this.selectListView.element;
    this.element.classList.add('symbols-view');

    this.panel = atom.workspace.addModalPanel({ item: this, visible: false });

    this.configDisposable = new CompositeDisposable();

    this.configDisposable.add(
      atom.config.observe(
        `symbols-view`,
        (value) => {
          this.shouldShowProviderName = value.showProviderNamesInSymbolsView;
          this.useBadgeColors = value.useBadgeColors;
        }
      ),
      Config.observe('providerTimeout', (ms) => this.timeoutMs = ms),
      Config.observe('showIconsInSymbolsView', (show) => this.showIconsInSymbolsView = show)
    );

  }

  async destroy() {
    await this.cancel();
    this.configDisposable.dispose();
    this.panel.destroy();
    return this.selectListView.destroy();
  }

  getFilterKey() {
    return 'name';
  }

  elementForItem({ position, name, file, icon, tag, context, directory, providerName }) {
    name = name.replace(/\n/g, ' ');

    if (atom.project.getPaths().length > 1) {
      // More than one project root — we need to disambiguate the file paths.
      file = Path.join(Path.basename(directory), file);
    }

    let badges = [];

    if (providerName && this.shouldShowProviderName) {
      badges.push(providerName);
    }
    if (tag) badges.push(tag);

    let primaryLineClasses = ['primary-line'];
    if (this.showIconsInSymbolsView) {
      if (icon) {
        primaryLineClasses.push('icon', icon);
      } else {
        primaryLineClasses.push('no-icon');
      }
    }

    let matches = match(name, this.selectListView.getFilterQuery());
    let primary = el(`div.${primaryLineClasses.join('.')}`,
      el('div.name',
        SymbolsView.highlightMatches(this, name, matches)
      ),
      badges && el('div.badge-container',
        ...badges.map(
          b => badge(b, { variant: this.useBadgeColors })
        )
      )
    );

    let secondaryLineClasses = ['secondary-line'];
    if (this.showIconsInSymbolsView) {
      secondaryLineClasses.push('no-icon');
    }
    let secondary = el(`div.${secondaryLineClasses.join('.')}`,
      el('span.location',
        position ? `${file}:${position.row + 1}` : file
      ),
      context ? el('span.context', context) : null
    );

    return el('li.two-lines', primary, secondary);
  }

  async cancel() {
    if (!this.isCanceling) {
      this.isCanceling = true;
      await this.updateView({ items: [] });
      this.panel.hide();
      if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = null;
      }
      this.isCanceling = false;
    }
  }

  async updateView(options) {
    this.selectListView.update(options);
  }

  didChangeQuery() {
    // no-op
  }

  didCancelSelection() {
    this.cancel();
  }

  didConfirmEmptySelection() {
    this.cancel();
  }

  async didConfirmSelection(tag) {
    if (tag.file && !fs.isFileSync(Path.join(tag.directory, tag.file))) {
      await this.updateView({
        errorMessage: `Selected file does not exist`
      });
      setTimeout(() => {
        this.updateView({ errorMessage: null });
      }, 2000);
    } else {
      await this.cancel();
      this.openTag(tag, { pending: this.shouldBePending() });
    }
  }

  // Whether a pane opened by a view should be treated as a pending pane.
  shouldBePending() {
    return false;
  }

  didChangeSelection() {
    // no-op
  }

  openTag(tag, { pending } = {}) {
    pending ??= this.shouldBePending();
    let editor = atom.workspace.getActiveTextEditor();
    let previous;
    if (editor) {
      previous = {
        editorId: editor.id,
        position: editor.getCursorBufferPosition(),
        file: editor.getURI()
      };
    }

    let { position, range } = tag;
    if (!position) position = this.getTagLine(tag);

    let result = false;
    if (tag.file) {
      // Open a different file, then jump to a position.
      atom.workspace.open(
        Path.join(tag.directory, tag.file),
        { pending, activatePane: false }
      ).then(() => {
        if (position) {
          return this.moveToPosition(position, { range });
        }
        return undefined;
      });
      result = true;
    } else if (position && previous && !previous.position.isEqual(position)) {
      // Jump to a position in the same file.
      this.moveToPosition(position, { range });
      result = true;
    }
    if (result) this.stack.push(previous);
    return result;
  }

  moveToPosition(position, { beginningOfLine = true } = {}) {
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      editor.setCursorBufferPosition(position, { autoscroll: false });
      if (beginningOfLine) {
        editor.moveToFirstCharacterOfLine();
      }
      editor.scrollToCursorPosition({ center: true });
    }
  }

  attach() {
    this.previouslyFocusedElement = document.activeElement;
    this.panel.show();
    this.selectListView.reset();
    this.selectListView.focus();
  }

  isValidSymbol(symbol) {
    if (typeof symbol.name !== 'string') return false;
    if (!symbol.position && !symbol.range) return false;
    if (symbol.position && !(symbol.position instanceof Point)) {
      return false;
    }
    return true;
  }

  addSymbols(allSymbols, newSymbols, provider) {
    for (let symbol of newSymbols) {
      if (!this.isValidSymbol(symbol)) {
        console.warn('Invalid symbol:', symbol);
        continue;
      }
      // We enforce these so that (a) we can show a human-readable name of the
      // provider for each symbol (if the user opts into it), and (b) we can
      // selectively clear cached results for certain providers without
      // affecting others.
      symbol.providerName ??= provider.name;
      symbol.providerId ??= provider.packageName;
      if (symbol.path) {
        let parts = Path.parse(symbol.path);
        symbol.directory = `${parts.dir}${Path.sep}`;
        symbol.file = parts.base;
      }
      symbol.name = symbol.name.replace(/[\n\r\t]/, ' ');
      allSymbols.push(symbol);
    }
  }

  // TODO: What on earth is this? Can we possibly still need it?
  getTagLine(tag) {
    if (!tag) return undefined;

    if (tag.lineNumber) {
      return new Point(tag.lineNumber - 1, 0);
    }

    if (!tag.pattern) return undefined;
    let pattern = tag.pattern.replace(/(^\/\^)|(\$\/$)/g, '').trim();
    if (!pattern) return undefined;

    const file = Path.join(tag.directory, tag.file);
    if (!fs.isFileSync(file)) return undefined;

    let iterable = fs.readFileSync(file, 'utf8').split('\n');
    for (let index = 0; index < iterable.length; index++) {
      let line = iterable[index];
      if (pattern === line.trim()) {
        return new Point(index, 0);
      }
    }

    return undefined;
  }

  getSymbolsFromProvider(provider, signal, meta) {
    let controller = new AbortController();

    // If the user cancels the task, propagate that cancellation to this
    // provider's AbortController.
    signal.addEventListener('abort', () => controller.abort());

    // Cancel this job automatically if it times out.
    setTimeout(() => controller.abort(), this.timeoutMs);

    if (provider.isExclusive) {
      // The exclusive provider is the only one that gets an instance of
      // `ListController` so that it can set UI messages.
      return provider.getSymbols(
        { signal: controller.signal, ...meta },
        this.listController
      );
    } else {
      return provider.getSymbols(
        { signal: controller.signal, ...meta }
      );
    }
  }
}

module.exports = SymbolsView;
