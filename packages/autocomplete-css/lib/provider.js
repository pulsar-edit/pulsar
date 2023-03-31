/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const COMPLETIONS = require('../completions.json');

const firstInlinePropertyNameWithColonPattern = /{\s*(\S+)\s*:/; // .example { display: }
const inlinePropertyNameWithColonPattern = /(?:;.+?)*;\s*(\S+)\s*:/; // .example { display: block; float: left; color: } (match the last one)
const propertyNameWithColonPattern = /^\s*(\S+)\s*:/; // display:
const propertyNamePrefixPattern = /[a-zA-Z]+[-a-zA-Z]*$/;
const pseudoSelectorPrefixPattern = /:(:)?([a-z]+[a-z-]*)?$/;
const tagSelectorPrefixPattern = /(^|\s|,)([a-z]+)?$/;
const importantPrefixPattern = /(![a-z]+)$/;
const cssDocsURL = "https://developer.mozilla.org/en-US/docs/Web/CSS";

module.exports = {
  selector: '.source.css, .source.sass, .source.css.postcss',
  disableForSelector: '.source.css .comment, .source.css .string, .source.sass .comment, .source.sass .string, .source.css.postcss .comment, source.css.postcss .string',
  properties: COMPLETIONS.properties,
  pseudoSelectors: COMPLETIONS.pseudoSelectors,
  tags: COMPLETIONS.tags,

  // Tell autocomplete to fuzzy filter the results of getSuggestions(). We are
  // still filtering by the first character of the prefix in this provider for
  // efficiency.
  filterSuggestions: true,

  getSuggestions(request) {
    let completions = null;
    const scopes = request.scopeDescriptor.getScopesArray();
    const isSass = hasScope(scopes, 'source.sass', true);

    if (this.isCompletingValue(request)) {
      completions = this.getPropertyValueCompletions(request);
    } else if (this.isCompletingPseudoSelector(request)) {
      completions = this.getPseudoSelectorCompletions(request);
    } else {
      if (isSass && this.isCompletingNameOrTag(request)) {
        completions = this.getPropertyNameCompletions(request)
          .concat(this.getTagCompletions(request));
      } else if (!isSass && this.isCompletingName(request)) {
        completions = this.getPropertyNameCompletions(request);
      }
    }

    if (!isSass && this.isCompletingTagSelector(request)) {
      const tagCompletions = this.getTagCompletions(request);
      if (tagCompletions != null ? tagCompletions.length : undefined) {
        if (completions == null) { completions = []; }
        completions = completions.concat(tagCompletions);
      }
    }

    return completions;
  },

  onDidInsertSuggestion({editor, suggestion}) {
    if (suggestion.type === 'property') { return setTimeout(this.triggerAutocomplete.bind(this, editor), 1); }
  },

  triggerAutocomplete(editor) {
    return atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate', {activatedManually: false});
  },

  isCompletingValue({scopeDescriptor, bufferPosition, prefix, editor}) {
    const scopes = scopeDescriptor.getScopesArray();

    const beforePrefixBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)];
    const beforePrefixScopes = editor.scopeDescriptorForBufferPosition(beforePrefixBufferPosition);
    const beforePrefixScopesArray = beforePrefixScopes.getScopesArray();

    const previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)];
    const previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
    const previousScopesArray = previousScopes.getScopesArray();

    return (hasScope(scopes, 'meta.property-list.css') && (prefix.trim() === ":")) ||
    (hasScope(previousScopesArray, 'meta.property-value.css')) ||
    (hasScope(scopes, 'meta.property-list.scss') && (prefix.trim() === ":")) ||
    (hasScope(previousScopesArray, 'meta.property-value.scss')) ||
    (hasScope(scopes, 'meta.property-list.postcss') && (prefix.trim() === ":")) ||
    (hasScope(previousScopesArray, 'meta.property-value.postcss')) ||
    (hasScope(scopes, 'source.sass', true) && (hasScope(scopes, 'meta.property-value.sass') ||
      (!hasScope(beforePrefixScopesArray, 'entity.name.tag.css') && (prefix.trim() === ":"))
    ));
  },

  isCompletingName({scopeDescriptor, bufferPosition, prefix, editor}) {
    const scopes = scopeDescriptor.getScopesArray();
    const isAtTerminator = prefix.endsWith(';');
    const isAtParentSymbol = prefix.endsWith('&');
    const isVariable = hasScope(scopes, 'variable.css') ||
      hasScope(scopes, 'variable.scss') ||
      hasScope(scopes, 'variable.var.postcss');
    const isInPropertyList = !isAtTerminator &&
      (hasScope(scopes, 'meta.property-list.css') ||
      hasScope(scopes, 'meta.property-list.scss') ||
      hasScope(scopes, 'meta.property-list.postcss'));

    if (!isInPropertyList) { return false; }
    if (isAtParentSymbol || isVariable) { return false; }

    const previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)];
    const previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
    const previousScopesArray = previousScopes.getScopesArray();

    if (hasScope(previousScopesArray, 'entity.other.attribute-name.class.css') ||
      hasScope(previousScopesArray, 'entity.other.attribute-name.id.css') ||
      hasScope(previousScopesArray, 'entity.other.attribute-name.id') ||
      hasScope(previousScopesArray, 'entity.other.attribute-name.parent-selector.css') ||
      hasScope(previousScopesArray, 'entity.name.tag.reference.scss') ||
      hasScope(previousScopesArray, 'entity.name.tag.scss') ||
      hasScope(previousScopesArray, 'entity.name.tag.reference.postcss') ||
      hasScope(previousScopesArray, 'entity.name.tag.postcss')) { return false; }

    const isAtBeginScopePunctuation = hasScope(scopes, 'punctuation.section.property-list.begin.bracket.curly.css') ||
      hasScope(scopes, 'punctuation.section.property-list.begin.bracket.curly.scss') ||
      hasScope(scopes, 'punctuation.section.property-list.begin.postcss');
    const isAtEndScopePunctuation = hasScope(scopes, 'punctuation.section.property-list.end.bracket.curly.css') ||
      hasScope(scopes, 'punctuation.section.property-list.end.bracket.curly.scss') ||
      hasScope(scopes, 'punctuation.section.property-list.end.postcss');

    if (isAtBeginScopePunctuation) {
      // * Disallow here: `canvas,|{}`
      // * Allow here: `canvas,{| }`
      return prefix.endsWith('{');
    } else if (isAtEndScopePunctuation) {
      // * Disallow here: `canvas,{}|`
      // * Allow here: `canvas,{ |}`
      return !prefix.endsWith('}');
    } else {
      return true;
    }
  },

  isCompletingNameOrTag({scopeDescriptor, bufferPosition, editor}) {
    const scopes = scopeDescriptor.getScopesArray();
    const prefix = this.getPropertyNamePrefix(bufferPosition, editor);
    return this.isPropertyNamePrefix(prefix) &&
      hasScope(scopes, 'meta.selector.css') &&
      !hasScope(scopes, 'entity.other.attribute-name.id.css.sass') &&
      !hasScope(scopes, 'entity.other.attribute-name.class.sass');
  },

  isCompletingTagSelector({editor, scopeDescriptor, bufferPosition}) {
    const scopes = scopeDescriptor.getScopesArray();
    const tagSelectorPrefix = this.getTagSelectorPrefix(editor, bufferPosition);
    if (!(tagSelectorPrefix != null ? tagSelectorPrefix.length : undefined)) { return false; }

    const previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)];
    const previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
    const previousScopesArray = previousScopes.getScopesArray();

    if (hasScope(scopes, 'meta.selector.css') || hasScope(previousScopesArray, 'meta.selector.css')) {
      return true;
    } else if (hasScope(scopes, 'source.css.scss', true) || hasScope(scopes, 'source.css.less', true) || hasScope(scopes, 'source.css.postcss', true)) {
      return !hasScope(previousScopesArray, 'meta.property-value.scss') &&
        !hasScope(previousScopesArray, 'meta.property-value.css') &&
        !hasScope(previousScopesArray, 'meta.property-value.postcss') &&
        !hasScope(previousScopesArray, 'support.type.property-value.css');
    } else {
      return false;
    }
  },

  isCompletingPseudoSelector({editor, scopeDescriptor, bufferPosition}) {
    const scopes = scopeDescriptor.getScopesArray();
    let previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)];
    let previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
    let previousScopesArray = previousScopes.getScopesArray();
    if ((hasScope(scopes, 'meta.selector.css') || hasScope(previousScopesArray, 'meta.selector.css')) && !hasScope(scopes, 'source.sass', true)) {
      return true;
    } else if (hasScope(scopes, 'source.css.scss', true) || hasScope(scopes, 'source.css.less', true) || hasScope(scopes, 'source.sass', true) || hasScope(scopes, 'source.css.postcss', true)) {
      const prefix = this.getPseudoSelectorPrefix(editor, bufferPosition);
      if (prefix) {
        previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)];
        previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
        previousScopesArray = previousScopes.getScopesArray();
        return !hasScope(previousScopesArray, 'meta.property-name.scss') &&
          !hasScope(previousScopesArray, 'meta.property-value.scss') &&
          !hasScope(previousScopesArray, 'meta.property-value.postcss') &&
          !hasScope(previousScopesArray, 'support.type.property-name.css') &&
          !hasScope(previousScopesArray, 'support.type.property-value.css') &&
          !hasScope(previousScopesArray, 'support.type.property-name.postcss');
      } else {
        return false;
      }
    } else {
      return false;
    }
  },

  isPropertyValuePrefix(prefix) {
    prefix = prefix.trim();
    return (prefix.length > 0) && (prefix !== ':');
  },

  isPropertyNamePrefix(prefix) {
    if (prefix == null) { return false; }
    prefix = prefix.trim();
    return (prefix.length > 0) && prefix.match(/^[a-zA-Z-]+$/);
  },

  getImportantPrefix(editor, bufferPosition) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    return __guard__(importantPrefixPattern.exec(line), x => x[1]);
  },

  getPreviousPropertyName(bufferPosition, editor) {
    let {row, column} = bufferPosition;
    while (row >= 0) {
      let line = editor.lineTextForBufferRow(row);
      if (row === bufferPosition.row) { line = line.substr(0, column); }
      let propertyName = __guard__(inlinePropertyNameWithColonPattern.exec(line), x => x[1]);
      if (propertyName == null) { propertyName = __guard__(firstInlinePropertyNameWithColonPattern.exec(line), x1 => x1[1]); }
      if (propertyName == null) { propertyName = __guard__(propertyNameWithColonPattern.exec(line), x2 => x2[1]); }
      if (propertyName) { return propertyName; }
      row--;
    }
  },

  getPropertyValueCompletions({bufferPosition, editor, prefix, scopeDescriptor}) {
    let importantPrefix, value;
    const property = this.getPreviousPropertyName(bufferPosition, editor);
    const values = this.properties[property] != null ? this.properties[property].values : undefined;
    if (values == null) { return null; }

    const scopes = scopeDescriptor.getScopesArray();
    const addSemicolon = !lineEndsWithSemicolon(bufferPosition, editor) && !hasScope(scopes, 'source.sass', true);

    const completions = [];
    if (this.isPropertyValuePrefix(prefix)) {
      for (value of Array.from(values)) {
        if (firstCharsEqual(value, prefix)) {
          completions.push(this.buildPropertyValueCompletion(value, property, addSemicolon));
        }
      }
    } else if (!hasScope(scopes, 'keyword.other.unit.percentage.css') && // CSS
    !hasScope(scopes, 'keyword.other.unit.scss') && // SCSS (TODO: remove in Atom 1.19.0)
    !hasScope(scopes, 'keyword.other.unit.css')) { // Less, Sass (TODO: remove in Atom 1.19.0)
      // Don't complete here: `width: 100%|`
      for (value of Array.from(values)) {
        completions.push(this.buildPropertyValueCompletion(value, property, addSemicolon));
      }
    }

    if (importantPrefix = this.getImportantPrefix(editor, bufferPosition)) {
      // attention: règle dangereux
      completions.push({
        type: 'keyword',
        text: '!important',
        displayText: '!important',
        replacementPrefix: importantPrefix,
        description: "Forces this property to override any other declaration of the same property. Use with caution.",
        descriptionMoreURL: `${cssDocsURL}/Specificity#The_!important_exception`
      });
    }

    return completions;
  },

  buildPropertyValueCompletion(value, propertyName, addSemicolon) {
    let text = value;
    if (addSemicolon) { text += ';'; }

    return {
      type: 'value',
      text,
      displayText: value,
      description: `${value} value for the ${propertyName} property`,
      descriptionMoreURL: `${cssDocsURL}/${propertyName}#Values`
    };
  },

  getPropertyNamePrefix(bufferPosition, editor) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    return __guard__(propertyNamePrefixPattern.exec(line), x => x[0]);
  },

  getPropertyNameCompletions({bufferPosition, editor, scopeDescriptor, activatedManually}) {
    // Don't autocomplete property names in SASS on root level
    const scopes = scopeDescriptor.getScopesArray();
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    if (hasScope(scopes, 'source.sass', true) && !line.match(/^(\s|\t)/)) { return []; }

    const prefix = this.getPropertyNamePrefix(bufferPosition, editor);
    if (!activatedManually && !prefix) { return []; }

    const completions = [];
    for (let property in this.properties) {
      const options = this.properties[property];
      if (!prefix || firstCharsEqual(property, prefix)) {
        completions.push(this.buildPropertyNameCompletion(property, prefix, options));
      }
    }
    return completions;
  },

  buildPropertyNameCompletion(propertyName, prefix, {description}) {
    return {
      type: 'property',
      text: `${propertyName}: `,
      displayText: propertyName,
      replacementPrefix: prefix,
      description,
      descriptionMoreURL: `${cssDocsURL}/${propertyName}`
    };
  },

  getPseudoSelectorPrefix(editor, bufferPosition) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    return __guard__(line.match(pseudoSelectorPrefixPattern), x => x[0]);
  },

  getPseudoSelectorCompletions({bufferPosition, editor}) {
    const prefix = this.getPseudoSelectorPrefix(editor, bufferPosition);
    if (!prefix) { return null; }

    const completions = [];
    for (let pseudoSelector in this.pseudoSelectors) {
      const options = this.pseudoSelectors[pseudoSelector];
      if (firstCharsEqual(pseudoSelector, prefix)) {
        completions.push(this.buildPseudoSelectorCompletion(pseudoSelector, prefix, options));
      }
    }
    return completions;
  },

  buildPseudoSelectorCompletion(pseudoSelector, prefix, {argument, description}) {
    const completion = {
      type: 'pseudo-selector',
      replacementPrefix: prefix,
      description,
      descriptionMoreURL: `${cssDocsURL}/${pseudoSelector}`
    };

    if (argument != null) {
      completion.snippet = `${pseudoSelector}(\${1:${argument}})`;
    } else {
      completion.text = pseudoSelector;
    }
    return completion;
  },

  getTagSelectorPrefix(editor, bufferPosition) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    return __guard__(tagSelectorPrefixPattern.exec(line), x => x[2]);
  },

  getTagCompletions({bufferPosition, editor, prefix}) {
    const completions = [];
    if (prefix) {
      for (let tag of Array.from(this.tags)) {
        if (firstCharsEqual(tag, prefix)) {
          completions.push(this.buildTagCompletion(tag));
        }
      }
    }
    return completions;
  },

  buildTagCompletion(tag) {
    return {
      type: 'tag',
      text: tag,
      description: `Selector for <${tag}> elements`
    };
  }
};

var lineEndsWithSemicolon = function(bufferPosition, editor) {
  const {row} = bufferPosition;
  const line = editor.lineTextForBufferRow(row);
  return /;\s*$/.test(line);
};

var hasScope = function(scopesArray, scope, checkEmbedded) {
  if (checkEmbedded == null) { checkEmbedded = false; }
  return (scopesArray.indexOf(scope) !== -1) ||
    (checkEmbedded && (scopesArray.indexOf(`${scope}.embedded.html`) !== -1));
};

var firstCharsEqual = (str1, str2) => str1[0].toLowerCase() === str2[0].toLowerCase();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
