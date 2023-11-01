const { Range } = require("atom");
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
    const isSass = hasScope(scopes, 'source.sass');

    const cursorRange = new Range(request.bufferPosition, request.bufferPosition);
    const range = [ [0, 0], [request.bufferPosition.row, request.bufferPosition.column] ];

    const finds = {
      close_bracket: cursorRange,
      open_bracket: cursorRange,
      colon: cursorRange,
      semicolon: cursorRange
    };

    request.editor.backwardsScanInBufferRange(/{|}/, range, (matched) => {
      if (matched.matchText === "}") {
        finds.close_bracket = matched.range;
      } else if (matched.matchText === "{") {
        finds.open_bracket = matched.range;
      }
    });

    request.editor.backwardsScanInBufferRange(/:|;/, range, (matched) => {
      if (matched.matchText === ":") {
        finds.colon = matched.range;
      } else if (matched.matchText === ";") {
        finds.semicolon = matched.range;
      }
    });

    const applyValueCompletions = () => {
      return this.getPropertyValueCompletions(request);
    };

    const applyPropertyCompletions = () => {
      if (isSass) {
        let tmpArr = this.getPropertyNameCompletions(request);
        return tmpArr.concat(this.getTagCompletions(request));
      } else {
        return this.getPropertyNameCompletions(request);
      }
    };

    const applySelectorCompletions = () => {
      let tmpArr = this.getPseudoSelectorCompletions(request);
      return tmpArr.concat(this.getTagCompletions(request));
    };

    if (finds.open_bracket.compare(cursorRange) === -1) {
      // The cursor is after an open bracket
      if (finds.colon.compare(cursorRange) === -1 && finds.open_bracket.compare(finds.colon) === -1) {
        // the cursor is after a colon
        // And the colon is after the open bracket
        // Completion Type: 'value'
        completions = applyValueCompletions();

      } else if (finds.semicolon.compare(cursorRange) === -1) {
        // the cursor is after a semicolon
        // Completion Type: 'property'
        completions = applyPropertyCompletions();

      } else {
        // the cursor is within an open bracket, but not after a colon or semicolon
        // Completion Type: 'property'
        completions = applyPropertyCompletions();

      }
    } else if (finds.close_bracket.compare(cursorRange) === -1) {
      // Completion Type: 'selector'
      completions = applySelectorCompletions();
    } else {
      // It doesn't seem the cursor is before or after any brackets.
      // May be the first line, so likely a selector
      // Completion Type: 'selector'
      completions = applySelectorCompletions();
    }

    return completions;
  },

  onDidInsertSuggestion({editor, suggestion}) {
    if (suggestion.type === 'property') { return setTimeout(this.triggerAutocomplete.bind(this, editor), 1); }
  },

  triggerAutocomplete(editor) {
    return atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate', {activatedManually: false});
  },

  isPropertyValuePrefix(prefix) {
    prefix = prefix.trim();
    return (prefix.length > 0) && (prefix !== ':');
  },

  getImportantPrefix(editor, bufferPosition) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    let importantPrefixPatternExec = importantPrefixPattern.exec(line);
    return (typeof importantPrefixPatternExec !== "undefined" && importantPrefixPatternExec !== null) ? importantPrefixPatternExec[1] : undefined;
  },

  getPreviousPropertyName(bufferPosition, editor) {
    let {row, column} = bufferPosition;
    while (row >= 0) {
      let line = editor.lineTextForBufferRow(row);
      if (row === bufferPosition.row) { line = line.substr(0, column); }
      let propertyName = (typeof inlinePropertyNameWithColonPattern.exec(line) !== "undefined" && inlinePropertyNameWithColonPattern.exec(line) !== null) ? inlinePropertyNameWithColonPattern.exec(line)[1] : undefined;
      if (propertyName == null) {
        propertyName = (typeof firstInlinePropertyNameWithColonPattern.exec(line) !== "undefined" && firstInlinePropertyNameWithColonPattern.exec(line) !== null) ? firstInlinePropertyNameWithColonPattern.exec(line)[1] : undefined;
      }
      if (propertyName == null) {
        propertyName = (typeof propertyNameWithColonPattern.exec(line) !== "undefined" && propertyNameWithColonPattern.exec(line) !== null) ? propertyNameWithColonPattern.exec(line)[1] : undefined;
      }
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
    const addSemicolon = !lineEndsWithSemicolon(bufferPosition, editor) && !hasScope(scopes, 'source.sass');

    const completions = [];
    if (this.isPropertyValuePrefix(prefix)) {
      for (value of Array.from(values)) {
        if (firstCharsEqual(value, prefix)) {
          completions.push(this.buildPropertyValueCompletion(value, property, addSemicolon));
        }
      }
    } else if (!hasScope(scopes, 'keyword.other.unit.percentage.css')) { // CSS
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
    return (typeof propertyNamePrefixPattern.exec(line) !== "undefined" && propertyNamePrefixPattern.exec(line) !== null) ? propertyNamePrefixPattern.exec(line)[0] : undefined;
  },

  getPropertyNameCompletions({bufferPosition, editor, scopeDescriptor, activatedManually}) {
    // Don't autocomplete property names in SASS on root level
    const scopes = scopeDescriptor.getScopesArray();
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    if (hasScope(scopes, 'source.sass') && !line.match(/^(\s|\t)/)) { return []; }

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
    return (typeof line.match(pseudoSelectorPrefixPattern) !== "undefined" && line.match(pseudoSelectorPrefixPattern) !== null) ? line.match(pseudoSelectorPrefixPattern)[0] : undefined;
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

const lineEndsWithSemicolon = function(bufferPosition, editor) {
  const {row} = bufferPosition;
  const line = editor.lineTextForBufferRow(row);
  return /;\s*$/.test(line);
};

// Checks if the given scope descriptor includes a scope that _starts with_ the
// given string, or is the given string exactly. Can optionally include a list
// of final path segments for checking against multiple of css/sass/less/postcss
// at once.
const hasScope = function(scopesArray, scope, endsWith = null) {
  if (endsWith && (typeof endsWith === 'string')) {
    endsWith = [endsWith];
  }
  for (var otherScope of Array.from(scopesArray)) {
    if (endsWith && Array.isArray(endsWith)) {
      if (!endsWith.some(ending => otherScope.endsWith(`.${ending}`))) { continue; }
    }
    if (otherScope === scope) { return true; }
    if (otherScope.startsWith(`${scope}.`)) { return true; }
  }
};

const firstCharsEqual = (str1, str2) => str1[0].toLowerCase() === str2[0].toLowerCase();
