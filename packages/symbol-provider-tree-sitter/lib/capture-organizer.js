const { Point } = require('atom');

function resolveNodeDescriptor(node, descriptor) {
  let parts = descriptor.split('.');
  let result = node;
  while (result !== null && parts.length > 0) {
    let part = parts.shift();
    if (!result[part]) { return null; }
    result = result[part];
  }
  return result;
}

const PatternCache = {
  getOrCompile(pattern) {
    this.patternCache ??= new Map();
    let regex = this.patternCache.get(pattern);
    if (!regex) {
      regex = new RegExp(pattern, 'g');
      this.patternCache.set(pattern, regex);
    }
    return regex;
  },

  clear() {
    this.patternCache?.clear();
  },
};


// Assign a default icon type for each tag — or what LSP calls “kind.” This
// list is copied directly from the LSP spec's exhaustive list of potential
// symbol kinds:
//
// https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#symbolKind
function iconForTag(tag) {
  switch (tag) {
    case 'file':
      return 'icon-file';
    case 'module':
      return 'icon-database';
    case 'namespace':
      return 'icon-tag';
    case 'package':
      return 'icon-package';
    case 'class':
      return 'icon-puzzle';
    case 'method':
      return 'icon-gear';
    case 'property':
      return 'icon-primitive-dot';
    case 'field':
      return 'icon-primitive-dot';
    case 'constructor':
      return 'icon-tools';
    case 'enum':
      return 'icon-list-unordered';
    case 'interface':
      return 'icon-key';
    case 'function':
      return 'icon-gear';
    case 'variable':
      return 'icon-code';
    case 'constant':
      return 'icon-primitive-square';
    case 'string':
      return 'icon-quote';
    case 'number':
      return 'icon-plus';
    case 'boolean':
      return 'icon-question';
    case 'array':
      return 'icon-list-ordered';
    case 'object':
      return 'icon-file-code';
    case 'key':
      return 'icon-key';
    case 'null':
      return null;
    case 'enum-member':
      return 'icon-primitive-dot';
    case 'struct':
      return 'icon-book';
    case 'event':
      return 'icon-calendar';
    case 'operator':
      return 'icon-plus';
    case 'type-parameter':
      return null;
    default:
      return null;
  }
}


/**
 * A container capture. When another capture's node is contained by the
 * definition capture's node, it gets added to this instance.
 */
class Container {
  constructor(capture, organizer) {
    this.captureFields = new Map();
    this.captureFields.set(capture.name, capture);
    this.capture = capture;
    this.node = capture.node;
    this.organizer = organizer;
    this.props = capture.setProperties || {};

    this.tag = capture.name.substring(capture.name.indexOf('.') + 1);
    this.icon = this.resolveIcon();
    this.position = capture.node.range.start;
  }

  getCapture(name) {
    return this.captureFields.get(name);
  }

  hasCapture(capture) {
    return this.captureFields.has(capture.name);
  }

  endsBefore(range) {
    let containerRange = this.node.range;
    return containerRange.end.compare(range.start) === -1;
  }

  add(capture) {
    if (this.captureFields.has(capture.name)) {
      console.warn(`Name already exists:`, capture.name);
    }
    // Any captures added to this definition need to be checked to make sure
    // their nodes are actually descendants of this definition's node.
    if (!this.node.range.containsRange(capture.node.range)) {
      return false;
    }
    this.captureFields.set(capture.name, capture);
    if (capture.name === 'name') {
      this.nameCapture = new Name(capture, this.organizer);
    }
    return true;
  }

  isValid() {
    return (
      this.nameCapture &&
      this.position instanceof Point
    );
  }

  resolveIcon() {
    let icon = this.props['symbol.icon'] ?? iconForTag(this.tag);
    if (icon && !icon.startsWith('icon-'))
      icon = `icon-${icon}`;
    return icon;
  }

  toSymbol() {
    if (!this.nameCapture) return null;
    let nameSymbol = this.nameCapture.toSymbol();
    let symbol = {
      name: nameSymbol.name,
      shortName: nameSymbol.shortName,
      tag: nameSymbol.tag ?? this.tag,
      icon: nameSymbol.icon ?? this.icon,
      position: this.position
    };

    if (nameSymbol.context) {
      symbol.context = nameSymbol.context;
    }

    return symbol;
  }
}

class Definition extends Container {
  constructor(...args) {
    super(...args);
    this.type = 'definition';
  }
}

class Reference extends Container {
  constructor(...args) {
    super(...args);
    this.type = 'reference';
  }
}

class Name {
  constructor(capture, organizer) {
    this.type = 'name';
    this.organizer = organizer;
    this.props = capture.setProperties ?? {};
    this.capture = capture;
    this.node = capture.node;
    this.position = capture.node.range.start;
    this.name = this.resolveName(capture);
    this.shortName = this.resolveName(capture, { short: true });
    this.context = this.resolveContext(capture);
    this.tag = this.resolveTag(capture);
    this.icon = this.resolveIcon(capture);
  }

  getSymbolNameForNode(node) {
    return this.organizer.nameCache.get(node.id);
  }

  resolveName(capture, { short = false } = {}) {
    let { node, props } = this;
    let base = node.text;
    if (props['symbol.strip']) {
      let pattern = PatternCache.getOrCompile(props['symbol.strip']);
      base = base.replace(pattern, '');
    }

    // The “short name” is the symbol's base name before we prepend or append
    // any text.
    if (short) return base;

    // TODO: Regex-based replacement?
    if (props['symbol.prepend']) {
      base = `${props['symbol.prepend']}${base}`;
    }
    if (props['symbol.append']) {
      base = `${base}${props['symbol.append']}`;
    }

    let prefix = this.resolvePrefix(capture);
    if (prefix) {
      let joiner = props['symbol.joiner'] ?? '';
      base = `${prefix}${joiner}${base}`;
    }
    this.organizer.nameCache.set(node.id, base);
    return base;
  }

  resolveContext() {
    let { node, props } = this;
    let result = null;
    if (props['symbol.contextNode']) {
      let contextNode = resolveNodeDescriptor(node, props['symbol.contextNode']);
      if (contextNode) {
        result = contextNode.text;
      }
    }

    if (props['symbol.context']) {
      result = props['symbol.context'];
    }

    return result;
  }

  resolvePrefix() {
    let { node, props } = this;
    let symbolDescriptor = props['symbol.prependSymbolForNode'];
    let textDescriptor = props['symbol.prependTextForNode'];

    // Prepending with a symbol name requires that we already have determined
    // the name for another node, which means the other node must have a
    // corresponding symbol. But it allows for recursion.
    if (symbolDescriptor) {
      let other = resolveNodeDescriptor(node, symbolDescriptor);
      if (other) {
        let symbolName = this.getSymbolNameForNode(other);
        if (symbolName) return symbolName;
      }
    }

    // A simpler option is to prepend with a node's text. This works on any
    // arbitrary node, even nodes that don't have their own symbol names.
    if (textDescriptor) {
      let other = resolveNodeDescriptor(node, textDescriptor);
      if (other) {
        return other.text;
      }
    }

    return null;
  }

  resolveTag() {
    return this.props['symbol.tag'] ?? null;
  }

  resolveIcon() {
    let icon = this.props['symbol.icon'] ?? null;
    if (icon && !icon.startsWith('icon-'))
      icon = `icon-${icon}`;
    return icon;
  }

  toSymbol() {
    let { name, shortName, position, context, tag, icon } = this;
    let symbol = { name, shortName, position, icon };
    if (tag) {
      symbol.tag = tag;
      symbol.icon ??= iconForTag(tag);
    }
    if (context) symbol.context = context;

    return symbol;
  }

}

/**
 * Keeps track of @definition.* captures and the captures they may contain.
 */
class CaptureOrganizer {
  clear() {
    this.nameCache ??= new Map();
    this.nameCache.clear();
    this.activeContainers = [];

    this.definitions = [];
    this.references = [];
    this.names = [];
    this.extraCaptures = [];
  }

  destroy() {
    PatternCache.clear();
    this.clear();
  }

  isDefinition(capture) {
    return capture.name.startsWith('definition.');
  }

  isReference(capture) {
    return capture.name.startsWith('reference.');
  }

  isName(capture) {
    return capture.name === 'name';
  }

  finish(container) {
    if (!container) return;
    if (container instanceof Definition) {
      this.definitions.push(container);
    } else if (container instanceof Reference) {
      this.references.push(container);
    }
    let index = this.activeContainers.indexOf(container);
    if (index === -1) return;
    this.activeContainers.splice(index, 1);
  }

  addToContainer(capture) {
    let index = this.activeContainers.length - 1;
    let added = false;
    while (index >= 0) {
      let container = this.activeContainers[index];
      if (!container.hasCapture(capture)) {
        if (container.add(capture)) {
          added = true;
          break;
        }
      }
      index--;
    }
    return added;
  }

  pruneActiveContainers(capture) {
    let { range } = capture.node;
    let indices = [];
    for (let [index, container] of this.activeContainers.entries()) {
      if (container.endsBefore(range)) {
        indices.unshift(index);
      }
    }

    for (let index of indices) {
      this.finish(this.activeContainers[index]);
    }
  }

  process(captures, scopeResolver) {
    scopeResolver.reset();

    this.clear();

    for (let capture of captures) {
      if (!scopeResolver.store(capture)) continue;
      this.pruneActiveContainers(capture);

      if (this.isDefinition(capture)) {
        this.activeContainers.push(new Definition(capture, this));
      } else if (this.isReference(capture)) {
        this.activeContainers.push(new Reference(capture, this));
      } else if (this.isName(capture)) {
        // See if this @name capture belongs with the most recent @definition
        // capture.
        if (this.addToContainer(capture)) {
          continue;
        }
        this.names.push(new Name(capture, this));
      } else {
        if (!this.addToContainer(capture)) {
          continue;
        } else {
          this.extraCaptures.push(capture);
        }
      }
    }
    while (this.activeContainers.length) {
      this.finish(this.activeContainers[0]);
    }

    let symbols = [];
    for (let definition of this.definitions) {
      if (!definition.isValid()) continue;
      symbols.push(definition.toSymbol());
    }

    if (atom.config.get('symbol-provider-tree-sitter.includeReferences')) {
      for (let reference of this.references) {
        if (!reference.isValid()) continue;
        symbols.push(reference.toSymbol());
      }
    }

    for (let name of this.names) {
      symbols.push(name.toSymbol());
    }

    scopeResolver.reset();

    return symbols;
  }
}

module.exports = CaptureOrganizer;
