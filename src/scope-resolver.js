const { Point } = require('text-buffer');
const ScopeDescriptor = require('./scope-descriptor');

// TODO: These utility functions are duplicated between this file and
// `wasm-tree-sitter-language-mode.js`. Eventually they might need to be moved
// into a `utils` file somewhere.

// Compares “informal” points like the ones in a tree-sitter tree; saves us
// from having to convert them to actual `Point`s.
function comparePoints(a, b) {
  const rows = a.row - b.row;
  if (rows === 0) {
    return a.column - b.column;
  } else {
    return rows;
  }
}

function rangeSpecToString (range) {
  let [sp, ep] = [range.startPosition, range.endPosition];
  return `(${sp.row}, ${sp.column}) - (${ep.row}, ${ep.column})`;
}

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

function resolveNodePosition(node, descriptor) {
  let parts = descriptor.split('.');
  let lastPart = parts.pop();
  let result = parts.length === 0 ?
    node :
    resolveNodeDescriptor(node, parts.join('.'));
  if (!result) { return null; }
  return result[lastPart];
}

function interpretPredicateValue(value) {
  if (value === "true") { return true; }
  if (value === "false") { return false; }
  if (/^\d+$/.test(value)) { return Number(value); }
  return value;
}

function interpretPossibleKeyValuePair(rawValue, coerceValue = false) {
  if (!rawValue.includes(' ')) { return [rawValue, null]; }

  // Split on the first space. Everything after the first space is the value.
  let parts = rawValue.split(' ');
  let key = parts.shift(), value = parts.join(' ');

  // We only want to interpret the value if we're comparing it to a config
  // value; otherwise we want to compare strings to strings.
  if (coerceValue) value = interpretPredicateValue(value);

  return [key, value];
}

// A data structure for storing scope information while processing capture
// data. The data is reset in between each task.
//
// It also applies the conventions that we've adopted in SCM files
// (particularly in `highlights.scm`) that let us constrain the conditions
// under which various scopes get applied. When a given query capture is added,
// `ScopeResolver` may "reject" it if it fails to pass the given test.
//
// `ScopeResolver` also sets boundaries for possible consumption by a
// `HighlightIterator`. However, it is used to resolve several different kinds
// of query captures — not just highlights.
//
class ScopeResolver {
  constructor(languageLayer, idForScope) {
    this.languageLayer = languageLayer;
    this.buffer = languageLayer.buffer;
    this.config = languageLayer?.languageMode?.config ?? atom.config;
    this.grammar = languageLayer.grammar;
    this.idForScope = idForScope ?? (x => x);
    this.boundaries = new Map;
    this.rangeData = new Map;
    this.pointKeyCache = new Map;
    this.patternCache = new Map;
    this.configCache = new Map;
    this.configSubscription = this.config.onDidChange(() => {
      this.configCache.clear();
    });
  }

  getOrCompilePattern(pattern) {
    let regex = this.patternCache.get(pattern);
    if (!regex) {
      regex = new RegExp(pattern);
      this.patternCache.set(pattern, regex);
    }
    return regex;
  }

  getConfig(key) {
    if (this.configCache.has(key)) {
      return this.configCache.get(key);
    }
    let value = this.config.get(key, {
      scope: new ScopeDescriptor({ scopes: [this.grammar.scopeName] })
    });
    this.configCache.set(key, value);
    return value;
  }

  indexToPosition(index) {
    return this.buffer.positionForCharacterIndex(index);
  }

  positionToIndex(position)  {
    return this.buffer.characterIndexForPosition(position);
  }

  adjustPositionByOffset(position, offset) {
    let index = this.positionToIndex(position);
    index += offset;
    let newPosition = this.indexToPosition(index);
    return this.buffer.clipPosition(newPosition);
  }

  shouldInvalidateOnChange(capture) {
    return capture.setProperties &&
      ('highlight.invalidateOnChange' in capture.setProperties);
  }

  // We want to index scope data on buffer position, but each `Point` (or
  // ad-hoc point object) is a different object. We could normalize them to a
  // string and use the string as the map key, but we'd have to convert them
  // back to `Point`s later on, so let's just do it now.
  //
  // Here we make it so that every point that describes the same buffer
  // position is keyed on the same `Point` instance.
  _keyForPoint(point) {
    let { row, column } = point;
    let key = `${row},${column}`;
    let normalized = this.pointKeyCache.get(key);
    if (!normalized) {
      normalized = new Point(Number(row), Number(column));
      this.pointKeyCache.set(key, normalized.freeze());
    }
    return normalized;
  }

  _keyForRange(range) {
    let { startIndex, endIndex } = range;
    return `${startIndex}/${endIndex}`;
  }

  setDataForRange(range, props) {
    let key = this._keyForRange(range);
    let normalizedProps = { ...props };
    // TEMP: No longer needed when we remove support for (#set! test.final
    // true).
    for (let prop of ['final', 'shy']) {
      if (`test.${prop}` in normalizedProps) {
        normalizedProps[`capture.${prop}`] = normalizedProps[`test.${prop}`];
      }
    }
    return this.rangeData.set(key, normalizedProps);
  }

  getDataForRange(syntax) {
    let key = this._keyForRange(syntax);
    return this.rangeData.get(key);
  }

  isValidRange(range) {
    let { startPosition, startIndex, endPosition, endIndex } = range;
    if (!(
      typeof startIndex === 'number' &&
      typeof endIndex === 'number' &&
      typeof startPosition === 'object' &&
      typeof endPosition === 'object'
    )) { return false; }
    if (startIndex > endIndex) { return false; }
    if (comparePoints(startPosition, endPosition) >= 0) { return false; }
    return true;
  }

  // Detects whether a capture wants to alter its range from the default.
  adjustsCaptureRange(capture) {
    let { setProperties: props = {} } = capture;
    let keys = Object.keys(props);
    if (keys.length === 0) { return false; }
    return keys.some(k => this.capturePropertyIsAdjustment(k));
  }

  rangeExceedsBoundsOfCapture(range, capture) {
    return range.startIndex < capture.node.startIndex ||
      range.endIndex > capture.node.endIndex;
  }

  normalizeAdjustmentProperty(prop) {
    if (prop.startsWith('adjust.')) {
      prop = prop.replace(/^adjust\./, '');
    }
    return prop;
  }

  capturePropertyIsAdjustment(prop) {
    prop = this.normalizeAdjustmentProperty(prop);
    return prop in ScopeResolver.ADJUSTMENTS;
  }

  applyAdjustment(prop, ...args) {
    prop = this.normalizeAdjustmentProperty(prop);
    return ScopeResolver.ADJUSTMENTS[prop](...args);
  }

  normalizeTestProperty(prop) {
    if (prop.startsWith('test.')) {
      prop = prop.substring(5);
    }

    // TEMP: Normalize `onlyIfNotFoo` and `onlyIfFoo` to `foo`.
    if (prop.startsWith('onlyIfNot')) {
      prop = prop.charAt(9).toLowerCase() + prop.substring(10);
    }
    if (prop.startsWith('onlyIf')) {
      prop = prop.charAt(6).toLowerCase() + prop.substring(7);
    }
    return prop;
  }

  normalizeCaptureSettingProperty(prop) {
    if (prop.startsWith('capture.')) {
      prop = prop.substring(8);
    }
    // TEMP: Normalize `test.final` and `test.shy` to `final` and `shy`.
    if (prop === 'test.final' || prop === 'test.shy') {
      prop = prop.substring(5);
    }
    return prop;
  }

  capturePropertyIsTest(prop) {
    prop = this.normalizeTestProperty(prop);
    return prop in ScopeResolver.TESTS;
  }

  capturePropertyIsCaptureSetting(prop) {
    // TEMP: Support `test.final` and `test.shy` temporarily.
    if (prop === 'test.final' || prop === 'test.shy') {
      return true;
    }
    if (prop.includes('.') && !prop.startsWith('capture.')) {
      return false;
    }
    prop = this.normalizeCaptureSettingProperty(prop);
    return prop in ScopeResolver.CAPTURE_SETTINGS;
  }

  applyTest(prop, ...args) {
    let isLegacyNegation = prop.includes('onlyIfNot');
    prop = this.normalizeTestProperty(prop);
    let result = ScopeResolver.TESTS[prop](...args);
    return isLegacyNegation ? !result : result;
  }

  applyCaptureSettingProperty(prop, ...args) {
    prop = this.normalizeCaptureSettingProperty(prop);
    return ScopeResolver.CAPTURE_SETTINGS[prop](...args);
  }

  warnAboutExceededRange(range, capture) {
    let msg = ['Cannot extend past original range of capture!'];

    msg.push(`Scope name: ${capture.name}`);
    msg.push(`Original range: ${rangeSpecToString(capture.node)}`);
    msg.push(`Adjusted range: ${rangeSpecToString(range)}`);

    if (atom.inDevMode()) {
      throw new Error(msg.join('\n'));
    }

    console.warn(msg.join('\n'));
  }

  // Given a capture and possible predicate data, determines the buffer range
  // that this capture wants to cover.
  determineCaptureRange(capture) {
    // For our purposes, a "range" is not a `Range` object, but rather an
    // object that has all four of `startPosition`, `endPosition`,
    // `startIndex`, and `endIndex`. Any single node can thus fulfill this
    // contract, but so can a plain object of our own construction.
    let { setProperties: props = {} } = capture;
    if (!this.adjustsCaptureRange(capture)) { return capture.node; }

    let range = {
      startPosition: capture.node.startPosition,
      startIndex: capture.node.startIndex,
      endPosition: capture.node.endPosition,
      endIndex: capture.node.endIndex
    };

    for (let key in props) {
      if (this.capturePropertyIsAdjustment(key)) {
        let value = props[key];

        // Transform the range successively. Later adjustments can optionally
        // act on earlier adjustments, or they can ignore the current position
        // and inspect the original node instead.
        range = this.applyAdjustment(key, capture.node, value, range, this);

        // If any single adjustment returns `null`, we shouldn't store this
        // capture.
        if (range === null) { return null; }
      }
    }

    if (this.rangeExceedsBoundsOfCapture(range, capture)) {
      this.warnAboutExceededRange(range, capture);
    }

    // Any invalidity in the returned range means we shouldn't store this
    // capture.
    if (!this.isValidRange(range)) { return null; }
    return range;
  }

  // Given a syntax capture, test whether we should include its scope in the
  // document.
  test(capture, existingData) {
    let {
      node,
      setProperties: props = {},
      assertedProperties: asserted = {},
      refutedProperties: refuted = {}
    } = capture;

    if (existingData?.final || existingData?.['capture.final']) {
      return false;
    }

    // Capture settings (final/shy) are the only keys in `setProperties` that
    // matter when testing this capture.
    //
    // TODO: For compatibility reasons, we're still checking tests of the form
    // (#set! test.final) here, but this should be removed before modern
    // Tree-sitter ships.
    for (let key in props) {
      let isCaptureSettingProperty = this.capturePropertyIsCaptureSetting(key);
      let isTest = this.capturePropertyIsTest(key);
      if (!(isCaptureSettingProperty || isTest)) { continue; }
      let value = props[key] ?? true;
      if (isCaptureSettingProperty) {
        if (!this.applyCaptureSettingProperty(key, node, existingData, this)) {
          return false;
        }
      } else {
        // TODO: Remove this once third-party grammars have had time to adapt to
        // the migration of tests to `#is?` and `#is-not?`.
        if (!this.applyTest(key, node, value, existingData, this)) {
          return false;
        }
      }
    }

    // Apply tests of the form `(#is? foo)`.
    for (let key in asserted) {
      if (!this.capturePropertyIsTest(key)) { continue; }
      let value = asserted[key] ?? true;
      let result = this.applyTest(key, node, value, existingData, this);
      if (!result) return false;
    }

    // Apply tests of the form `(#is-not? foo)`.
    for (let key in refuted) {
      if (!this.capturePropertyIsTest(key)) { continue; }
      let value = refuted[key] ?? true;
      let result = this.applyTest(key, node, value, existingData, this);
      if (result) return false;
    }

    return true;
  }

  // Attempt to add a syntax capture to the boundary data, along with its scope
  // ID. Will apply any adjustments to determine the range of the scope being
  // applied, then check any test rules to see whether the scope should be
  // added for that range.
  //
  // Will return `false` if the scope should not be added for the given range;
  // otherwise will return the computed range.
  store(capture) {
    let {
      node,
      name,
      setProperties: props = {}
    } = capture;

    name = ScopeResolver.interpolateName(name, node);

    // Find out which range this capture wants.
    let range = this.determineCaptureRange(capture);
    if (range === null) {
      // This capture specified a range adjustment that turned out not to be
      // valid. We view those adjustments as essential — that is, if the
      // assumed conditions of the `#set!` rules result in invalidity, it means
      // that we should not try to honor the capture in the first place.
      return false;
    }

    let data = this.getDataForRange(range);

    if (!this.test(capture, data)) {
      return false;
    } else {
      this.setDataForRange(range, props);
    }

    if (name === '_IGNORE_') {
      // "@_IGNORE_" is a magical variable in an SCM file that will not be
      // applied in the grammar, but which allows us to prevent other kinds of
      // scopes from matching. We purposefully allowed this syntax node to set
      // data for a given range, but not to apply its scope ID to any
      // boundaries.
      return false;
    }

    let id = this.idForScope(name);

    let {
      startPosition: start,
      endPosition: end
    } = range;

    this.setBoundary(start, id, 'open');
    this.setBoundary(end, id, 'close');

    return range;
  }

  setBoundary(point, id, which, { root = false } = {}) {
    let key = this._keyForPoint(point);

      if (!this.boundaries.has(key)) {
      this.boundaries.set(key, { open: [], close: [] })
    }

    let bundle = this.boundaries.get(key);
    let idBundle = bundle[which];

    // In general, we want to close scopes in the reverse order of when they
    // were opened, and captures that match earlier get to open first. But
    // `root` is a way of opting out of this behavior and asserting that a
    // scope added later is more important. We use this to add the language's
    // root scope if needed.
    if (which === 'open') {
      // If an earlier token has already opened at this point, we want to open
      // after it.
      if (root) { idBundle.unshift(id); }
      else { idBundle.push(id); }
    } else {
      // If an earlier token has already closed at this point, we want to close
      // before it.
      if (root) { idBundle.push(id); }
      else { idBundle.unshift(id); }
    }
  }

  reset() {
    this.boundaries.clear();
    this.rangeData.clear();
  }

  destroy() {
    this.reset();
    this.patternCache.clear();
    this.pointKeyCache.clear();
    this.configCache.clear();
    this.configSubscription.dispose();
  }

  *[Symbol.iterator]() {
    // Iterate in buffer position order.
    let keys = [...this.boundaries.keys()];
    keys.sort((a, b) => a.compare(b));

    for (let key of keys) {
      yield [key, this.boundaries.get(key)];
    }
  }
}


// Scope names can mark themselves with `TEXT` to interpolate the node's text
// into the capture, or `TYPE` to interpolate the anonymous node's type.
ScopeResolver.interpolateName = (name, node) => {
  // Only interpolate `_TEXT_` if we know the text has no spaces. Spaces are
  // not valid in scope names.
  if (name.includes('_TEXT_') &&
   !node.text.includes(' ')) {
    name = name.replace('_TEXT_', node.text);
  }
  if (name.includes('_TYPE_')) {
    name = name.replace('_TYPE_', node.type);
  }
  return name;
};


// Special `#set!` predicates that work on “claimed” and “unclaimed” ranges.
ScopeResolver.CAPTURE_SETTINGS = {
  // Passes only if another capture has not already declared `final` for the
  // exact same range. If a capture is the first one to define `final`, then
  // all other captures for that same range are ignored, whether they try to
  // define `final` or not.
  final(node, existingData) {
    let final = existingData?.final || existingData?.['capture.final'];
    return !(existingData && final);
  },

  // Passes only if no earlier capture has occurred for the exact same range.
  shy(node, existingData) {
    return existingData === undefined;
  }
};


// These tests are used to define criteria under which the scope should be
// applied. Set them in a query file like so:
//
// (
//   (foo) @some.scope.name
//   (#is? test.first)
// )
//
// For boolean rules, the second argument to `#is?` can be omitted.
//
// A test can be negated with `#is-not?`:
//
// (
//   (foo) @some.scope.name
//   (#is-not? test.first)
// )
//
// These tests come in handy for criteria that can't be represented by the
// built-in predicates like `#match?` and `#eq?`.
//
// NOTE: Syntax queries will always be run through a `ScopeResolver`, but other
// kinds of queries may or may not, depending on purpose.
//

ScopeResolver.TESTS = {

  // Passes only if the node is of the given type. Can accept multiple
  // space-separated types.
  type(node, nodeType) {
    if (!nodeType.includes(' ')) { return node.type === nodeType }
    let nodeTypes = nodeType.split(/\s+/);
    return nodeTypes.some(t => t === node.type);
  },

  // Passes only if the node contains any descendant ERROR nodes.
  hasError(node) {
    return node.hasError();
  },

  // Passes when the node's tree belongs to an injection layer, rather than the
  // buffer's root language layer.
  injection(node, value, existingData, instance) {
    return instance.languageLayer.depth > 0;
  },

  // Passes when the node has no parent.
  root(node) {
    return !node.parent;
  },

  // Passes only if the given node is the first among its siblings.
  //
  // Is not guaranteed to pass if descended from an ERROR node.
  first(node) {
    // Root nodes are always first.
    if (!node.parent) { return true; }

    // We're really paranoid on these because if the parse tree is in an error
    // state, weird things can happen, like a node's parent not having a
    // `firstChild`.
    return node?.parent?.firstChild?.id === node.id;
  },

  // Passes only if the given node is the last among its siblings.
  //
  // Is not guaranteed to pass if descended from an ERROR node.
  last(node) {
    // Root nodes are always last.
    if (!node.parent) { return true; }
    return node?.parent?.lastChild?.id === node.id;
  },

  // Passes when the node is the first of its type among its siblings.
  //
  // Is not guaranteed to pass if descended from an ERROR node.
  firstOfType(node) {
    if (!node.parent) { return true; }
    let type = node.type;
    let parent = node.parent;
    // Lots of optional chaining here to guard against weird states inside
    // ERROR nodes.
    if ((parent?.childCount ?? 0) === 0) { return false; }
    for (let i = 0; i < parent.childCount; i++) {
      let child = parent?.child(i);
      if (!child) { continue; }
      if (child?.id === node.id) { return true; }
      else if (child?.type === type) { return false; }
    }
    return false;
  },

  // Passes when the node is the last of its type among its siblings.
  //
  // Is not guaranteed to pass if descended from an ERROR node.
  lastOfType(node) {
    if (!node.parent) { return true; }
    let type = node.type;
    let parent = node.parent;
    if ((parent?.childCount ?? 0) === 0) { return false; }
    for (let i = parent.childCount - 1; i >= 0; i--) {
      let child = parent?.child(i);
      if (!child) { continue; }
      if (child?.id === node.id) { return true; }
      else if (child?.type === type) { return false; }
    }
    return false;
  },

  // Passes when the node represents the last non-whitespace content on its
  // row. Considers the node's ending row.
  lastTextOnRow(node, value, existingData, instance) {
    let { buffer } = instance;
    let text = buffer.lineForRow(node.endPosition.row);
    let textAfterNode = text.slice(node.endPosition.column);
    return !/\S/.test(textAfterNode);
  },

  // Passes when the node represents the first non-whitespace content on its
  // row. Considers the node's starting row.
  firstTextOnRow(node, value, existingData, instance) {
    let { buffer } = instance;
    let text = buffer.lineForRow(node.startPosition.row);
    let textBeforeNode = text.slice(0, node.startPosition.column);
    return !/\S/.test(textBeforeNode);
  },

  // Passes if this node has any node of the given type(s) in its ancestor
  // chain.
  descendantOfType(node, type) {
    let multiple = type.includes(' ');
    let target = multiple ? type.split(/\s+/) : type;
    let current = node;
    while (current.parent) {
      current = current.parent;
      if (multiple && target.includes(current.type)) { return true; }
      else if (!multiple && target === current.type) { return true; }
    }
    return false;
  },

  // Passes if there's an ancestor, but fails if the ancestor type matches
  // the second,third,etc argument
  ancestorTypeNearerThan(node, types) {
    let [target, ...rejected] = types.split(/\s+/);
    rejected = new Set(rejected)
    let current = node;
    while (current.parent) {
      current = current.parent;
      if (rejected.has(current.type)) { return false; }
      if (target === current.type) { return true; }
    }
    return false;
  },

  // Passes if this node has at least one descendant of the given type(s).
  ancestorOfType(node, type) {
    let target = type.includes(' ') ? type.split(/\s+/) : type;
    let descendants = node.descendantsOfType(target);
    return descendants.length > 0;
  },

  // Passes if this range (after adjustments) has previously had data stored at
  // the given key.
  rangeWithData(node, rawValue, existingData) {
    if (existingData === undefined) { return false; }
    let [key, value] = interpretPossibleKeyValuePair(rawValue, false);

    // Invalid predicates should be ignored.
    if (!key) { return true; }

    return (value !== null) ?
      existingData[key] === value :
      (key in existingData);
  },

  // Passes if one of this node's ancestors has stored data at the given key
  // for its inherent range (ignoring adjustments).
  descendantOfNodeWithData(node, rawValue, existingData, instance) {
    let current = node;
    let [key, value] = interpretPossibleKeyValuePair(rawValue, false);

    // Invalid predicates should be ignored.
    if (!key) { return true; }

    while (current.parent) {
      current = current.parent;
      let data = instance.getDataForRange(current);
      if (data === undefined) { continue; }
      let passes = (value !== null) ? data[key] === value : (key in data);
      if (passes) { return true; }
    }
    return false;
  },

  // Passes if this node starts on the same row as the one in the described
  // position. Accepts a node position descriptor.
  startsOnSameRowAs(node, descriptor) {
    let otherNodePosition = resolveNodePosition(node, descriptor);
    return otherNodePosition.row === node.startPosition.row;
  },

  // Passes if this node ends on the same row as the one in the described
  // position. Accepts a node position descriptor.
  endsOnSameRowAs(node, descriptor) {
    let otherNodePosition = resolveNodePosition(node, descriptor);
    return otherNodePosition.row === node.endPosition.row;
  },

  // Passes only when a given config option is present and truthy. Accepts
  // either (a) a configuration key or (b) a configuration key and value
  // separated by a space.
  config(node, rawValue, existingData, instance) {
    let [key, value] = interpretPossibleKeyValuePair(rawValue, true);

    // Invalid predicates should be ignored.
    if (!key) { return true; }

    let configValue = instance.getConfig(key) ?? false;
    return value === null ? !!configValue : configValue === value;
  }
};

// Usually, we want to map a scope to the exact range of a node in the tree,
// but sometimes that isn't possible. "Adjustments" are pieces of metadata
// assigned to captures that can transform the range to a subset of the initial
// range.
//
// In order to retain our ability to know what scopes to apply when
// re-highlighting an arbitrary buffer region, scope adjustments cannot go
// beyond the bounds of their originally captured node. To have a capture span
// two siblings, for instance, you must capture the _parent_ node and adjust
// the range down from there.
//
ScopeResolver.ADJUSTMENTS = {
  // Alter the given range to start at the start or end of a different node.
  startAt(node, value, range, resolver) {
    let start = resolveNodePosition(node, value);
    if (!start) { return null; }

    range.startPosition = start;
    range.startIndex = resolver.positionToIndex(range.startPosition);
    return range;
  },

  // Alter the given range to end at the start or end of a different node.
  endAt(node, value, range, resolver) {
    let end = resolveNodePosition(node, value);
    if (!end) { return null; }

    range.endPosition = end;
    range.endIndex = resolver.positionToIndex(range.endPosition);
    return range;
  },

  // Offset the start position by a fixed number of characters in either
  // direction. Can act after other range alterations.
  offsetStart(node, value, range, resolver) {
    let offset = Number(value);
    if (isNaN(offset)) { return null; }
    let { startPosition } = range;

    let offsetPosition = resolver.adjustPositionByOffset(startPosition, offset);
    let offsetIndex = resolver.positionToIndex(offsetPosition);

    range.startPosition = offsetPosition;
    range.startIndex = offsetIndex;

    return range;
  },

  // Offset the end position by a fixed number of characters in either
  // direction. Can act after other range alterations.
  offsetEnd(node, value, range, resolver) {
    let offset = Number(value);
    if (isNaN(offset)) { return null; }
    let { endPosition } = range;

    let offsetPosition = resolver.adjustPositionByOffset(endPosition, offset);
    let offsetIndex = resolver.positionToIndex(offsetPosition);

    range.endPosition = offsetPosition;
    range.endIndex = offsetIndex;

    return range;
  },

  // Change the start and end positions to correspond exactly to the extent of
  // the match of the given regular expression. Will match against the text of
  // the capture's node.
  startAndEndAroundFirstMatchOf(node, value, position, resolver) {
    let regex = resolver.getOrCompilePattern(value);
    let match = node.text.match(regex);
    if (!match) { return null; }
    let oldStartPosition = { ...node.startPosition };
    let startOffset = match.index;
    let endOffset = match.index + match[0].length;

    position.startPosition = resolver.adjustPositionByOffset(
      oldStartPosition, startOffset);
    position.endPosition = resolver.adjustPositionByOffset(
      oldStartPosition, endOffset);

    position.startIndex = resolver.positionToIndex(position.startPosition);
    position.endIndex = resolver.positionToIndex(position.endPosition);

    return position;
  },

  // Change the start position to the point at the beginning of the match of
  // the given regular expression. Will match against the text of the capture's
  // node.
  startBeforeFirstMatchOf(node, value, position, resolver) {
    let regex = resolver.getOrCompilePattern(value);
    let match = node.text.match(regex);

    if (!match) { return null; }
    let oldStartPosition = { ...node.startPosition };

    let startOffset = match.index;

    position.startPosition = resolver.adjustPositionByOffset(
      oldStartPosition, startOffset);
    position.startIndex = resolver.positionToIndex(position.startPosition);

    return position;
  },

  // Change the start position to the point at the end of the match of the
  // given regular expression. Will match against the text of the capture's
  // node.
  startAfterFirstMatchOf(node, value, position, resolver) {
    let regex = resolver.getOrCompilePattern(value);
    let match = node.text.match(regex);

    if (!match) { return null; }
    let oldStartPosition = { ...node.startPosition };

    let startOffset = match.index + match[0].length;

    position.startPosition = resolver.adjustPositionByOffset(
      oldStartPosition, startOffset);
    position.startIndex = resolver.positionToIndex(position.startPosition);

    return position;
  },

  // Change the end position to the point at the start of the match of the
  // given regular expression. Will match against the text of the capture's
  // node.
  endBeforeFirstMatchOf(node, value, position, resolver) {
    let regex = resolver.getOrCompilePattern(value);
    let match = node.text.match(regex);

    if (!match) { return null; }
    let oldStartPosition = { ...node.startPosition };
    let endOffset = match.index;

    position.endPosition = resolver.adjustPositionByOffset(
      oldStartPosition, endOffset);
    position.endIndex = resolver.positionToIndex(position.endPosition);

    return position;
  },

  // Change the end position to the point at the end of the match of the
  // given regular expression. Will match against the text of the capture's
  // node.
  endAfterFirstMatchOf(node, value, position, resolver) {
    let regex = resolver.getOrCompilePattern(value);
    let match = node.text.match(regex);

    if (!match) { return null; }
    let oldStartPosition = { ...node.startPosition };
    let endOffset = match.index + match[0].length;

    position.endPosition = resolver.adjustPositionByOffset(
      oldStartPosition, endOffset);
    position.endIndex = resolver.positionToIndex(position.endPosition);

    return position;
  }
};


module.exports = ScopeResolver;
