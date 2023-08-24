
describe('SCSS grammar', function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage('language-css'));

    waitsForPromise(() => atom.packages.activatePackage('language-sass'));

    runs(() => grammar = atom.grammars.grammarForScopeName('source.css.scss'));
  });

  it('parses the grammar', function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe('source.css.scss');
  });

  describe('numbers', function() {
    it('tokenizes them correctly', function() {
      let {tokens} = grammar.tokenizeLine('.something { color: 0 1 }');

      expect(tokens[8]).toEqual({value: '0', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[10]).toEqual({value: '1', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});

      ({tokens} = grammar.tokenizeLine('.something { height: 0.2 }'));

      expect(tokens[8]).toEqual({value: '0.2', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});

      ({tokens} = grammar.tokenizeLine('.something { height: .2 }'));

      expect(tokens[8]).toEqual({value: '.2', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});

      ({tokens} = grammar.tokenizeLine('.something { color: rgba(0, 128, 0, 1) }'));
      expect(tokens[10]).toEqual({value: '0', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[13]).toEqual({value: '128', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[16]).toEqual({value: '0', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[19]).toEqual({value: '1', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});

      ({tokens} = grammar.tokenizeLine('$q: (color1:$dark-orange);'));

      expect(tokens[4]).toEqual({value: 'color1', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'support.type.map.key.scss']});
  });

    it('tokenizes number operations', function() {
      let {tokens} = grammar.tokenizeLine('.something { top: +50%; }');

      expect(tokens[8]).toEqual({value: '+50', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});

      ({tokens} = grammar.tokenizeLine('.something { top: 50% - 30%; }'));

      expect(tokens[11]).toEqual({value: '-', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'keyword.operator.css']});
  });
});

  describe('selectors', function() {
    // TODO: We need more coverage of selectors
    const selectors = {
      'class': '.',
      'id': '#',
      'parent': '&',
      'placeholder': '%'
    };

    return (() => {
      const result = [];
      for (var scope in selectors) {
        var selector = selectors[scope];
        it(`tokenizes complex ${scope} selectors`, function() {
          let {tokens} = grammar.tokenizeLine(`${selector}legit-#\{$selector}-name\\@sm`);

          expect(tokens[0]).toEqual({value: selector, scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "punctuation.definition.entity.css"]});
          expect(tokens[1]).toEqual({value: "legit-", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[2]).toEqual({value: "#\{", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
          expect(tokens[3]).toEqual({value: "$selector", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "variable.scss"]});
          expect(tokens[4]).toEqual({value: "}", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
          expect(tokens[5]).toEqual({value: "-name", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[6]).toEqual({value: "\\@", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "constant.character.escape.scss"]});
          expect(tokens[7]).toEqual({value: "sm", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});

          ({tokens} = grammar.tokenizeLine(`${selector}legit-#\{component.$selector}-name\\@sm`));

          expect(tokens[0]).toEqual({value: selector, scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "punctuation.definition.entity.css"]});
          expect(tokens[1]).toEqual({value: "legit-", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[2]).toEqual({value: "#\{", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
          expect(tokens[3]).toEqual({value: "component", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "variable.scss"]});
          expect(tokens[4]).toEqual({value: ".", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.access.module.scss"]});
          expect(tokens[5]).toEqual({value: "$selector", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "variable.scss"]});
          expect(tokens[6]).toEqual({value: "}", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
          expect(tokens[7]).toEqual({value: "-name", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[8]).toEqual({value: "\\@", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "constant.character.escape.scss"]});
          expect(tokens[9]).toEqual({value: "sm", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
      });

        it(`tokenizes invalid identifiers in ${scope} selectors`, function() {
          let {tokens} = grammar.tokenizeLine(`${selector}legit-#\{$selector}-n}a$me\\@sm`);

          expect(tokens[0]).toEqual({value: selector, scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "punctuation.definition.entity.css"]});
          expect(tokens[1]).toEqual({value: "legit-", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[2]).toEqual({value: "#\{", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
          expect(tokens[3]).toEqual({value: "$selector", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "variable.scss"]});
          expect(tokens[4]).toEqual({value: "}", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
          expect(tokens[5]).toEqual({value: "-n", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[6]).toEqual({value: "}", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "invalid.illegal.identifier.scss"]});
          expect(tokens[7]).toEqual({value: "a", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[8]).toEqual({value: "$", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "invalid.illegal.identifier.scss"]});
          expect(tokens[9]).toEqual({value: "me", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[10]).toEqual({value: "\\@", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "constant.character.escape.scss"]});
          expect(tokens[11]).toEqual({value: "sm", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});

          ({tokens} = grammar.tokenizeLine(`${selector}legit-#\{component.$selector}-n}a$me\\@sm`));

          expect(tokens[0]).toEqual({value: selector, scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "punctuation.definition.entity.css"]});
          expect(tokens[1]).toEqual({value: "legit-", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[2]).toEqual({value: "#\{", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
          expect(tokens[3]).toEqual({value: "component", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "variable.scss"]});
          expect(tokens[4]).toEqual({value: ".", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.access.module.scss"]});
          expect(tokens[5]).toEqual({value: "$selector", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "variable.scss"]});
          expect(tokens[6]).toEqual({value: "}", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
          expect(tokens[7]).toEqual({value: "-n", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[8]).toEqual({value: "}", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "invalid.illegal.identifier.scss"]});
          expect(tokens[9]).toEqual({value: "a", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[10]).toEqual({value: "$", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "invalid.illegal.identifier.scss"]});
          expect(tokens[11]).toEqual({value: "me", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
          expect(tokens[12]).toEqual({value: "\\@", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`, "constant.character.escape.scss"]});
          expect(tokens[13]).toEqual({value: "sm", scopes: ["source.css.scss", `entity.other.attribute-name.${scope}.css`]});
      });

        result.push(it("tokenizes placeholder selectors in at-rules", function() {
          const {tokens} = grammar.tokenizeLine('@extend %placeholder;');

          expect(tokens[3]).toEqual({value: '%', scopes: ['source.css.scss', 'meta.at-rule.extend.scss', 'entity.other.attribute-name.placeholder.css', 'punctuation.definition.entity.css']});
          expect(tokens[4]).toEqual({value: 'placeholder', scopes: ['source.css.scss', 'meta.at-rule.extend.scss', 'entity.other.attribute-name.placeholder.css']});
          expect(tokens[5]).toEqual({value: ';', scopes: ['source.css.scss', 'punctuation.terminator.rule.css']});
      }));
      }
      return result;
    })();
});

  describe("attribute selectors", function() {
    it("tokenizes them correctly", function() {
      const {tokens} = grammar.tokenizeLine('[something="1"]');

      expect(tokens[0]).toEqual({value: '[', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'punctuation.definition.attribute-selector.begin.bracket.square.scss']});
      expect(tokens[1]).toEqual({value: 'something', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'entity.other.attribute-name.attribute.scss']});
      expect(tokens[2]).toEqual({value: '=', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'keyword.operator.scss']});
      expect(tokens[3]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: '1', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss']});
      expect(tokens[5]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss', 'punctuation.definition.string.end.scss']});
      expect(tokens[6]).toEqual({value: ']', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'punctuation.definition.attribute-selector.end.bracket.square.scss']});
  });

    it("tokenizes complex attribute selectors", function() {
      let {tokens} = grammar.tokenizeLine("[cla#\{$s}^=abc#\{d}e]");

      expect(tokens[0]).toEqual({value: "[", scopes: ["source.css.scss", "meta.attribute-selector.scss", "punctuation.definition.attribute-selector.begin.bracket.square.scss"]});
      expect(tokens[1]).toEqual({value: "cla", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss"]});
      expect(tokens[2]).toEqual({value: "#\{", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
      expect(tokens[3]).toEqual({value: "$s", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss", "variable.interpolation.scss", "variable.scss"]});
      expect(tokens[4]).toEqual({value: "}", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
      expect(tokens[5]).toEqual({value: "^=", scopes: ["source.css.scss", "meta.attribute-selector.scss", "keyword.operator.scss"]});
      expect(tokens[6]).toEqual({value: "abc", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss"]});
      expect(tokens[7]).toEqual({value: "#\{", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
      expect(tokens[8]).toEqual({value: "d", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss", "variable.interpolation.scss"]});
      expect(tokens[9]).toEqual({value: "}", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
      expect(tokens[10]).toEqual({value: "e", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss"]});
      expect(tokens[11]).toEqual({value: "]", scopes: ["source.css.scss", "meta.attribute-selector.scss", "punctuation.definition.attribute-selector.end.bracket.square.scss"]});

      ({tokens} = grammar.tokenizeLine("[cl#\{a.$s}^=abc#\{d}e]"));

      expect(tokens[0]).toEqual({value: "[", scopes: ["source.css.scss", "meta.attribute-selector.scss", "punctuation.definition.attribute-selector.begin.bracket.square.scss"]});
      expect(tokens[1]).toEqual({value: "cl", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss"]});
      expect(tokens[2]).toEqual({value: "#\{", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
      expect(tokens[3]).toEqual({value: "a", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss", "variable.interpolation.scss", "variable.scss"]});
      expect(tokens[4]).toEqual({value: ".", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss", "variable.interpolation.scss", "punctuation.access.module.scss"]});
      expect(tokens[5]).toEqual({value: "$s", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss", "variable.interpolation.scss", "variable.scss"]});
      expect(tokens[6]).toEqual({value: "}", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
      expect(tokens[7]).toEqual({value: "^=", scopes: ["source.css.scss", "meta.attribute-selector.scss", "keyword.operator.scss"]});
      expect(tokens[8]).toEqual({value: "abc", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss"]});
      expect(tokens[9]).toEqual({value: "#\{", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
      expect(tokens[10]).toEqual({value: "d", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss", "variable.interpolation.scss"]});
      expect(tokens[11]).toEqual({value: "}", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
      expect(tokens[12]).toEqual({value: "e", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss"]});
      expect(tokens[13]).toEqual({value: "]", scopes: ["source.css.scss", "meta.attribute-selector.scss", "punctuation.definition.attribute-selector.end.bracket.square.scss"]});
  });

    it("tokenizes the $= selector", function() {
      const {tokens} = grammar.tokenizeLine("[class$=test]");

      expect(tokens[0]).toEqual({value: "[", scopes: ["source.css.scss", "meta.attribute-selector.scss", "punctuation.definition.attribute-selector.begin.bracket.square.scss"]});
      expect(tokens[1]).toEqual({value: "class", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss"]});
      expect(tokens[2]).toEqual({value: "$=", scopes: ["source.css.scss", "meta.attribute-selector.scss", "keyword.operator.scss"]});
      expect(tokens[3]).toEqual({value: "test", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.unquoted.attribute-value.scss"]});
      expect(tokens[4]).toEqual({value: "]", scopes: ["source.css.scss", "meta.attribute-selector.scss", "punctuation.definition.attribute-selector.end.bracket.square.scss"]});
  });

    it("tokenizes multiple attribute selectors", function() {
      const {tokens} = grammar.tokenizeLine('[data-name="text-color"][data-value="null"]');

      expect(tokens[0]).toEqual({value: '[', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'punctuation.definition.attribute-selector.begin.bracket.square.scss']});
      expect(tokens[1]).toEqual({value: 'data-name', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'entity.other.attribute-name.attribute.scss']});
      expect(tokens[2]).toEqual({value: '=', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'keyword.operator.scss']});
      expect(tokens[3]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'text-color', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss']});
      expect(tokens[5]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss', 'punctuation.definition.string.end.scss']});
      expect(tokens[6]).toEqual({value: ']', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'punctuation.definition.attribute-selector.end.bracket.square.scss']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'punctuation.definition.attribute-selector.begin.bracket.square.scss']});
      expect(tokens[8]).toEqual({value: 'data-value', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'entity.other.attribute-name.attribute.scss']});
      expect(tokens[9]).toEqual({value: '=', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'keyword.operator.scss']});
      expect(tokens[10]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[11]).toEqual({value: 'null', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss']});
      expect(tokens[12]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'string.quoted.double.attribute-value.scss', 'punctuation.definition.string.end.scss']});
      expect(tokens[13]).toEqual({value: ']', scopes: ['source.css.scss', 'meta.attribute-selector.scss', 'punctuation.definition.attribute-selector.end.bracket.square.scss']});
  });
});

  describe('@at-root', () => it('tokenizes it correctly', function() {
    const {tokens} = grammar.tokenizeLine('@at-root (without: media) .btn { color: red; }');

    expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.at-root.scss', 'keyword.control.at-rule.at-root.scss', 'punctuation.definition.keyword.scss']});
    expect(tokens[1]).toEqual({value: 'at-root', scopes: ['source.css.scss', 'meta.at-rule.at-root.scss', 'keyword.control.at-rule.at-root.scss']});
}));

  describe('@include', function() {
    it('tokenizes it correctly', function() {
      let {tokens} = grammar.tokenizeLine('@include');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'keyword.control.at-rule.include.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'include', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'keyword.control.at-rule.include.scss']});

      ({tokens} = grammar.tokenizeLine('@include media{}'));

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'keyword.control.at-rule.include.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'include', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'keyword.control.at-rule.include.scss']});
      expect(tokens[3]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'entity.name.function.scss']});
      expect(tokens[4]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine('@include media($width: 100px){}'));

      expect(tokens[3]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'entity.name.function.scss']});
      expect(tokens[4]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.definition.parameters.begin.bracket.round.scss']});
      expect(tokens[6]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[10]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.definition.parameters.end.bracket.round.scss']});
      expect(tokens[11]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine('@include media(site.$width: 100px){}'));

      expect(tokens[3]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'entity.name.function.scss']});
      expect(tokens[4]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.definition.parameters.begin.bracket.round.scss']});
      expect(tokens[8]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[12]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.definition.parameters.end.bracket.round.scss']});
      expect(tokens[13]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
  });

    it("tokenizes correctly for includes from a module", function() {
      let {tokens} = grammar.tokenizeLine('@include media.breakpoint{}');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'keyword.control.at-rule.include.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'include', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'keyword.control.at-rule.include.scss']});
      expect(tokens[3]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'variable.scss']});
      expect(tokens[4]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.access.module.scss']});
      expect(tokens[5]).toEqual({value: 'breakpoint', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'entity.name.function.scss']});
      expect(tokens[6]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine('@include media.breakpoint($width: 100px){}'));

      expect(tokens[3]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'variable.scss']});
      expect(tokens[4]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.access.module.scss']});
      expect(tokens[5]).toEqual({value: 'breakpoint', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'entity.name.function.scss']});
      expect(tokens[6]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.definition.parameters.begin.bracket.round.scss']});
      expect(tokens[8]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[12]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.include.scss', 'punctuation.definition.parameters.end.bracket.round.scss']});
      expect(tokens[13]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
  });
});

  describe('@mixin', function() {
    it('tokenizes solitary @mixin correctly', function() {
      const {tokens} = grammar.tokenizeLine('@mixin');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'keyword.control.at-rule.mixin.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'mixin', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'keyword.control.at-rule.mixin.scss']});
  });

    it('tokenizes @mixin with no arguments correctly', function() {
      const {tokens} = grammar.tokenizeLine('@mixin media{}');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'keyword.control.at-rule.mixin.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'mixin', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'keyword.control.at-rule.mixin.scss']});
      expect(tokens[3]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'entity.name.function.scss']});
      expect(tokens[4]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
  });

    it('tokenizes @mixin with arguments correctly', function() {
      let {tokens} = grammar.tokenizeLine('@mixin media ($width){}');

      expect(tokens[3]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'entity.name.function.scss']});
      expect(tokens[5]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'punctuation.definition.parameters.begin.bracket.round.scss']});
      expect(tokens[7]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'punctuation.definition.parameters.end.bracket.round.scss']});
      expect(tokens[8]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine('@mixin media (site.$width){}'));

      expect(tokens[3]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'entity.name.function.scss']});
      expect(tokens[5]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'punctuation.definition.parameters.begin.bracket.round.scss']});
      expect(tokens[9]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.mixin.scss', 'punctuation.definition.parameters.end.bracket.round.scss']});
      expect(tokens[10]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
  });
});

  describe('@namespace', function() {
    it('tokenizes solitary @namespace correctly', function() {
      const {tokens} = grammar.tokenizeLine('@namespace');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'keyword.control.at-rule.namespace.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'namespace', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'keyword.control.at-rule.namespace.scss']});
  });

    it('tokenizes default namespace definition with url() correctly', function() {
      const {tokens} = grammar.tokenizeLine('@namespace url(XML-namespace-URL);');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'keyword.control.at-rule.namespace.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'namespace', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'keyword.control.at-rule.namespace.scss']});
      expect(tokens[3]).toEqual({value: 'url', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'support.function.misc.scss']});
  });

    it('tokenizes namespace prefix definition with url() correctly', function() {
      const {tokens} = grammar.tokenizeLine('@namespace prefix url(XML-namespace-URL);');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'keyword.control.at-rule.namespace.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'namespace', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'keyword.control.at-rule.namespace.scss']});
      expect(tokens[3]).toEqual({value: 'prefix', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'entity.name.namespace-prefix.scss']});
      expect(tokens[5]).toEqual({value: 'url', scopes: ['source.css.scss', 'meta.at-rule.namespace.scss', 'support.function.misc.scss']});
  });
});

  describe('@page', () => it('tokenizes it correctly', function() {
    let tokens = grammar.tokenizeLines(`\
@page {
text-align: center;
}\
`
    );

    expect(tokens[0][0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.page.scss', 'keyword.control.at-rule.page.scss', 'punctuation.definition.keyword.scss']});
    expect(tokens[0][1]).toEqual({value: 'page', scopes: ['source.css.scss', 'meta.at-rule.page.scss', 'keyword.control.at-rule.page.scss']});
    expect(tokens[1][0]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][1]).toEqual({value: 'text-align', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
    expect(tokens[1][2]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
    expect(tokens[1][3]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][4]).toEqual({value: 'center', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});

    tokens = grammar.tokenizeLines(`\
@page :left {
text-align: center;
}\
`
    );

    expect(tokens[0][0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.page.scss', 'keyword.control.at-rule.page.scss', 'punctuation.definition.keyword.scss']});
    expect(tokens[0][1]).toEqual({value: 'page', scopes: ['source.css.scss', 'meta.at-rule.page.scss', 'keyword.control.at-rule.page.scss']});
    expect(tokens[0][2]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.at-rule.page.scss']});
    expect(tokens[0][3]).toEqual({value: ':left', scopes: ['source.css.scss', 'meta.at-rule.page.scss', 'entity.name.function.scss']});
    expect(tokens[1][0]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][1]).toEqual({value: 'text-align', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
    expect(tokens[1][2]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
    expect(tokens[1][3]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][4]).toEqual({value: 'center', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});

    tokens = grammar.tokenizeLines(`\
@page:left {
text-align: center;
}\
`
    );

    expect(tokens[0][0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.page.scss', 'keyword.control.at-rule.page.scss', 'punctuation.definition.keyword.scss']});
    expect(tokens[0][1]).toEqual({value: 'page', scopes: ['source.css.scss', 'meta.at-rule.page.scss', 'keyword.control.at-rule.page.scss']});
    expect(tokens[0][2]).toEqual({value: ':left', scopes: ['source.css.scss', 'meta.at-rule.page.scss', 'entity.name.function.scss']});
    expect(tokens[1][0]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][1]).toEqual({value: 'text-align', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
    expect(tokens[1][2]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
    expect(tokens[1][3]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][4]).toEqual({value: 'center', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
}));

  describe('@supports', function() {
    it('tokenizes solitary @supports', function() {
      const {tokens} = grammar.tokenizeLine('@supports');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'keyword.control.at-rule.supports.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'supports', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'keyword.control.at-rule.supports.scss']});
  });

    it('tokenizes @supports with negation, testing for "flex" as value', function() {
      const {tokens} = grammar.tokenizeLine('@supports not ( display: flex ){}');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'keyword.control.at-rule.supports.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'supports', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'keyword.control.at-rule.supports.scss']});
      expect(tokens[3]).toEqual({value: 'not', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'keyword.operator.logical.scss']});
      expect(tokens[5]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'punctuation.definition.condition.begin.bracket.round.scss']});
      expect(tokens[7]).toEqual({value: 'display', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[8]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[10]).toEqual({value: 'flex', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
      expect(tokens[12]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'punctuation.definition.condition.end.bracket.round.scss']});
      expect(tokens[13]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
  });

    it('tokenizes @supports with disjunction, testing for "flex" as property', function() {
      const {tokens} = grammar.tokenizeLine('@supports (flex:2 2) or (  -webkit-flex  : 2 2)  {}');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'keyword.control.at-rule.supports.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'supports', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'keyword.control.at-rule.supports.scss']});
      expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'punctuation.definition.condition.begin.bracket.round.scss']});
      expect(tokens[4]).toEqual({value: 'flex', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[5]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[6]).toEqual({value: '2', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[9]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'punctuation.definition.condition.end.bracket.round.scss']});
      expect(tokens[11]).toEqual({value: 'or', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'keyword.operator.logical.scss']});
      expect(tokens[15]).toEqual({value: '-webkit-flex', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'meta.property-name.scss', 'support.type.vendored.property-name.css']});
      expect(tokens[17]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[19]).toEqual({value: '2', scopes: ['source.css.scss', 'meta.at-rule.supports.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[24]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
  });
});

  describe('property-list', function() {
    it('tokenizes the property-name and property-value', function() {
      const {tokens} = grammar.tokenizeLine('very-custom { color: inherit; }');

      expect(tokens[4]).toEqual({value: 'color', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[7]).toEqual({value: 'inherit', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
      expect(tokens[8]).toEqual({value: ';', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.terminator.rule.scss']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.end.bracket.curly.scss']});
  });

    it('tokenizes nested property-lists', function() {
      const {tokens} = grammar.tokenizeLine('very-custom { very-very-custom { color: inherit; } margin: top; }');

      expect(tokens[2]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
      expect(tokens[4]).toEqual({value: 'very-very-custom', scopes: ['source.css.scss', 'meta.property-list.scss', 'entity.name.tag.custom.scss']});
      expect(tokens[6]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
      expect(tokens[8]).toEqual({value: 'color', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[11]).toEqual({value: 'inherit', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
      expect(tokens[12]).toEqual({value: ';', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-list.scss', 'punctuation.terminator.rule.scss']});
      expect(tokens[14]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-list.scss', 'punctuation.section.property-list.end.bracket.curly.scss']});
      expect(tokens[16]).toEqual({value: 'margin', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[19]).toEqual({value: 'top', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
      expect(tokens[22]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.end.bracket.curly.scss']});
  });

    it('tokenizes an incomplete inline property-list', function() {
      const {tokens} = grammar.tokenizeLine('very-custom { color: inherit}');

      expect(tokens[4]).toEqual({value: 'color', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[7]).toEqual({value: 'inherit', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
      expect(tokens[8]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.end.bracket.curly.scss']});
  });

    it('tokenizes multiple lines of incomplete property-list', function() {
      const tokens = grammar.tokenizeLines(`\
very-custom { color: inherit }
another-one { display: none; }\
`
      );

      expect(tokens[0][0]).toEqual({value: 'very-custom', scopes: ['source.css.scss', 'entity.name.tag.custom.scss']});
      expect(tokens[0][4]).toEqual({value: 'color', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[0][7]).toEqual({value: 'inherit', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
      expect(tokens[0][9]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.end.bracket.curly.scss']});
      expect(tokens[1][0]).toEqual({value: 'another-one', scopes: ['source.css.scss', 'entity.name.tag.custom.scss']});
      expect(tokens[1][10]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.end.bracket.curly.scss']});
  });

    describe('property values', () => it('tokenizes parentheses', function() {
      const {tokens} = grammar.tokenizeLine('.foo { margin: ($bar * .8) 0 ($bar * .8) (foo.$bar * 2);');
      expect(tokens[8]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.begin.bracket.round.scss']});
      expect(tokens[9]).toEqual({value: '$bar', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[11]).toEqual({value: '*', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'keyword.operator.css']});
      expect(tokens[13]).toEqual({value: '.8', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[14]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.end.bracket.round.scss']});
      expect(tokens[16]).toEqual({value: '0', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[18]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.begin.bracket.round.scss']});
      expect(tokens[19]).toEqual({value: '$bar', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[21]).toEqual({value: '*', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'keyword.operator.css']});
      expect(tokens[23]).toEqual({value: '.8', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[24]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.end.bracket.round.scss']});
      expect(tokens[26]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.begin.bracket.round.scss']});
      expect(tokens[27]).toEqual({value: 'foo', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[28]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.access.module.scss']});
      expect(tokens[29]).toEqual({value: '$bar', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[31]).toEqual({value: '*', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'keyword.operator.css']});
      expect(tokens[33]).toEqual({value: '2', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[34]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.end.bracket.round.scss']});
  }));
});

  describe('property names with a prefix that matches an element name', () => it('does not confuse them with properties', function() {
    let tokens = grammar.tokenizeLines(`\
text {
text-align: center;
}\
`
    );

    expect(tokens[0][0]).toEqual({value: 'text', scopes: ['source.css.scss', 'entity.name.tag.css']});
    expect(tokens[1][0]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][1]).toEqual({value: 'text-align', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
    expect(tokens[1][2]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
    expect(tokens[1][3]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][4]).toEqual({value: 'center', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});

    tokens = grammar.tokenizeLines(`\
table {
table-layout: fixed;
}\
`
    );

    expect(tokens[0][0]).toEqual({value: 'table', scopes: ['source.css.scss', 'entity.name.tag.css']});
    expect(tokens[1][0]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][1]).toEqual({value: 'table-layout', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
    expect(tokens[1][2]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
    expect(tokens[1][3]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
    expect(tokens[1][4]).toEqual({value: 'fixed', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
}));

  describe('vendor properties', () => it('tokenizes the browser prefix', function() {
    const {tokens} = grammar.tokenizeLine('body { -webkit-box-shadow: none; }');

    expect(tokens[0]).toEqual({value: 'body', scopes: ['source.css.scss', 'entity.name.tag.css']});
    expect(tokens[4]).toEqual({value: '-webkit-box-shadow', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.vendored.property-name.css']});
}));

  describe('custom elements', function() {
    it('tokenizes them as tags', function() {
      let {tokens} = grammar.tokenizeLine('very-custom { color: red; }');

      expect(tokens[0]).toEqual({value: 'very-custom', scopes: ['source.css.scss', 'entity.name.tag.custom.scss']});

      ({tokens} = grammar.tokenizeLine('very-very-custom { color: red; }'));

      expect(tokens[0]).toEqual({value: 'very-very-custom', scopes: ['source.css.scss', 'entity.name.tag.custom.scss']});
  });

    it('tokenizes them with pseudo selectors', function() {
      const {tokens} = grammar.tokenizeLine('very-custom:hover { color: red; }');

      expect(tokens[0]).toEqual({value: 'very-custom', scopes: ['source.css.scss', 'entity.name.tag.custom.scss']});
      expect(tokens[1]).toEqual({value: ':', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']});
      expect(tokens[2]).toEqual({value: 'hover', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css']});
  });

    it('tokenizes them with class selectors', function() {
      const {tokens} = grammar.tokenizeLine('very-custom.class { color: red; }');

      expect(tokens[0]).toEqual({value: 'very-custom', scopes: ['source.css.scss', 'entity.name.tag.custom.scss']});
      expect(tokens[1]).toEqual({value: '.', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
      expect(tokens[2]).toEqual({value: 'class', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css']});
  });

    it("tokenizes them with attribute selectors", function() {
      const {tokens} = grammar.tokenizeLine("md-toolbar[color='primary']");

      expect(tokens[0]).toEqual({value: "md-toolbar", scopes: ["source.css.scss", "entity.name.tag.custom.scss"]});
      expect(tokens[1]).toEqual({value: "[", scopes: ["source.css.scss", "meta.attribute-selector.scss", "punctuation.definition.attribute-selector.begin.bracket.square.scss"]});
      expect(tokens[2]).toEqual({value: "color", scopes: ["source.css.scss", "meta.attribute-selector.scss", "entity.other.attribute-name.attribute.scss"]});
      expect(tokens[3]).toEqual({value: "=", scopes: ["source.css.scss", "meta.attribute-selector.scss", "keyword.operator.scss"]});
      expect(tokens[4]).toEqual({value: "'", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.quoted.single.attribute-value.scss", "punctuation.definition.string.begin.scss"]});
      expect(tokens[5]).toEqual({value: "primary", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.quoted.single.attribute-value.scss"]});
      expect(tokens[6]).toEqual({value: "'", scopes: ["source.css.scss", "meta.attribute-selector.scss", "string.quoted.single.attribute-value.scss", "punctuation.definition.string.end.scss"]});
      expect(tokens[7]).toEqual({value: ']', scopes: ["source.css.scss", "meta.attribute-selector.scss", "punctuation.definition.attribute-selector.end.bracket.square.scss"]});
  });

    it('does not confuse them with properties', function() {
      const tokens = grammar.tokenizeLines(`\
body {
  border-width: 2;
  font-size : 2;
  background-image  : none;
}\
`
      );

      expect(tokens[1][0]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[1][1]).toEqual({value: 'border-width', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[1][2]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[1][3]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[1][4]).toEqual({value: '2', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[2][0]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[2][1]).toEqual({value: 'font-size', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[2][2]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[2][3]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[2][4]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[2][5]).toEqual({value: '2', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[3][0]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[3][1]).toEqual({value: 'background-image', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[3][2]).toEqual({value: '  ', scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[3][3]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[3][4]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[3][5]).toEqual({value: 'none', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.constant.property-value.css']});
  });
});

  describe('pseudo classes', function() {
    it('tokenizes them', function() {
      const {tokens} = grammar.tokenizeLine('a:hover {}');

      expect(tokens[1]).toEqual({value: ':', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']});
      expect(tokens[2]).toEqual({value: 'hover', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css']});
  });

    it('tokenizes nth-* pseudo classes', function() {
      let {tokens} = grammar.tokenizeLine('a:nth-child(n)');

      expect(tokens[2]).toEqual({value: 'nth-child', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css']});
      expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.begin.bracket.round.css']});
      expect(tokens[4]).toEqual({value: 'n', scopes: ['source.css.scss', 'constant.other.scss']});
      expect(tokens[5]).toEqual({value: ')', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.end.bracket.round.css']});

      ({tokens} = grammar.tokenizeLine('a:nth-child(3n)'));

      expect(tokens[2]).toEqual({value: 'nth-child', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css']});
      expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.begin.bracket.round.css']});
      expect(tokens[4]).toEqual({value: '3', scopes: ['source.css.scss', 'constant.numeric.css']});
      expect(tokens[5]).toEqual({value: 'n', scopes: ['source.css.scss', 'constant.other.scss']});
      expect(tokens[6]).toEqual({value: ')', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.end.bracket.round.css']});

      ({tokens} = grammar.tokenizeLine('a:nth-child(2)'));

      expect(tokens[2]).toEqual({value: 'nth-child', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css']});
      expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.begin.bracket.round.css']});
      expect(tokens[4]).toEqual({value: '2', scopes: ['source.css.scss', 'constant.numeric.css']});
      expect(tokens[5]).toEqual({value: ')', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.end.bracket.round.css']});

      ({tokens} = grammar.tokenizeLine('a:nth-child(n + 2)'));

      expect(tokens[2]).toEqual({value: 'nth-child', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css']});
      expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.begin.bracket.round.css']});
      expect(tokens[4]).toEqual({value: 'n', scopes: ['source.css.scss', 'constant.other.scss']});
      expect(tokens[6]).toEqual({value: '2', scopes: ['source.css.scss', 'constant.numeric.css']});
      expect(tokens[7]).toEqual({value: ')', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.end.bracket.round.css']});

      ({tokens} = grammar.tokenizeLine('a:nth-child(3n + 2)'));

      expect(tokens[2]).toEqual({value: 'nth-child', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css']});
      expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.begin.bracket.round.css']});
      expect(tokens[4]).toEqual({value: '3', scopes: ['source.css.scss', 'constant.numeric.css']});
      expect(tokens[5]).toEqual({value: 'n', scopes: ['source.css.scss', 'constant.other.scss']});
      expect(tokens[7]).toEqual({value: '2', scopes: ['source.css.scss', 'constant.numeric.css']});
      expect(tokens[8]).toEqual({value: ')', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.end.bracket.round.css']});

      ({tokens} = grammar.tokenizeLine('a:nth-child(hi)'));

      expect(tokens[2]).toEqual({value: 'nth-child', scopes: ['source.css.scss', 'entity.other.attribute-name.pseudo-class.css']});
      expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.begin.bracket.round.css']});
      expect(tokens[4]).toEqual({value: 'hi', scopes: ['source.css.scss', 'invalid.illegal.scss']});
      expect(tokens[5]).toEqual({value: ')', scopes: ['source.css.scss', 'punctuation.definition.pseudo-class.end.bracket.round.css']});
  });

    it("tokenizes complex pseudo classes", function() {
      let {tokens} = grammar.tokenizeLine("&:nth-child(#\{$j})");

      expect(tokens[0]).toEqual({value: "&", scopes: ["source.css.scss", "entity.name.tag.reference.scss"]});
      expect(tokens[1]).toEqual({value: ":", scopes: ["source.css.scss", "entity.other.attribute-name.pseudo-class.css", "punctuation.definition.entity.css"]});
      expect(tokens[2]).toEqual({value: "nth-child", scopes: ["source.css.scss", "entity.other.attribute-name.pseudo-class.css"]});
      expect(tokens[3]).toEqual({value: "(", scopes: ["source.css.scss", "punctuation.definition.pseudo-class.begin.bracket.round.css"]});
      expect(tokens[4]).toEqual({value: "#\{", scopes: ["source.css.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
      expect(tokens[5]).toEqual({value: "$j", scopes: ["source.css.scss", "variable.interpolation.scss", "variable.scss"]});
      expect(tokens[6]).toEqual({value: "}", scopes: ["source.css.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
      expect(tokens[7]).toEqual({value: ")", scopes: ["source.css.scss", "punctuation.definition.pseudo-class.end.bracket.round.css"]});

      ({tokens} = grammar.tokenizeLine("&:nth-child(#\{m.$j})"));

      expect(tokens[0]).toEqual({value: "&", scopes: ["source.css.scss", "entity.name.tag.reference.scss"]});
      expect(tokens[1]).toEqual({value: ":", scopes: ["source.css.scss", "entity.other.attribute-name.pseudo-class.css", "punctuation.definition.entity.css"]});
      expect(tokens[2]).toEqual({value: "nth-child", scopes: ["source.css.scss", "entity.other.attribute-name.pseudo-class.css"]});
      expect(tokens[3]).toEqual({value: "(", scopes: ["source.css.scss", "punctuation.definition.pseudo-class.begin.bracket.round.css"]});
      expect(tokens[4]).toEqual({value: "#\{", scopes: ["source.css.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.begin.bracket.curly.scss"]});
      expect(tokens[5]).toEqual({value: "m", scopes: ["source.css.scss", "variable.interpolation.scss", "variable.scss"]});
      expect(tokens[6]).toEqual({value: ".", scopes: ["source.css.scss", "variable.interpolation.scss", "punctuation.access.module.scss"]});
      expect(tokens[7]).toEqual({value: "$j", scopes: ["source.css.scss", "variable.interpolation.scss", "variable.scss"]});
      expect(tokens[8]).toEqual({value: "}", scopes: ["source.css.scss", "variable.interpolation.scss", "punctuation.definition.interpolation.end.bracket.curly.scss"]});
      expect(tokens[9]).toEqual({value: ")", scopes: ["source.css.scss", "punctuation.definition.pseudo-class.end.bracket.round.css"]});
  });
});

  describe('pseudo elements', () => it('inherits the matching from language-css', function() {
    const {tokens} = grammar.tokenizeLine("&::after");

    expect(tokens[1]).toEqual({value: "::", scopes: ["source.css.scss", "entity.other.attribute-name.pseudo-element.css", "punctuation.definition.entity.css"]});
    expect(tokens[2]).toEqual({value: "after", scopes: ["source.css.scss", "entity.other.attribute-name.pseudo-element.css"]});
}));

  describe('functional pseudo classes', () => it('inherits the matching from language-css', function() {
    const {tokens} = grammar.tokenizeLine("&:not(.selected)");

    expect(tokens[1]).toEqual({value: ":", scopes: ["source.css.scss", "entity.other.attribute-name.pseudo-class.css", "punctuation.definition.entity.css"]});
    expect(tokens[2]).toEqual({value: "not", scopes: ["source.css.scss", "entity.other.attribute-name.pseudo-class.css"]});
    expect(tokens[3]).toEqual({value: "(", scopes: ["source.css.scss", "punctuation.section.function.begin.bracket.round.css"]});
    expect(tokens[4]).toEqual({value: ".", scopes: ["source.css.scss", "entity.other.attribute-name.class.css", "punctuation.definition.entity.css"]});
    expect(tokens[5]).toEqual({value: "selected", scopes: ["source.css.scss", "entity.other.attribute-name.class.css"]});
    expect(tokens[6]).toEqual({value: ")", scopes: ["source.css.scss", "punctuation.section.function.end.bracket.round.css"]});
}));

  describe('@keyframes', function() {
    it('parses the from and to properties', function() {
      const tokens = grammar.tokenizeLines(`\
@keyframes anim {
  from { opacity: 0; }
  to { opacity: 1; }
}\
`
      );

      expect(tokens[0][0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'keyword.control.at-rule.keyframes.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[0][1]).toEqual({value: 'keyframes', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'keyword.control.at-rule.keyframes.scss']});
      expect(tokens[0][2]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss']});
      expect(tokens[0][3]).toEqual({value: 'anim', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'entity.name.function.scss']});
      expect(tokens[0][5]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'punctuation.section.keyframes.begin.scss']});
      expect(tokens[1][1]).toEqual({value: 'from', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'entity.other.attribute-name.scss']});
      expect(tokens[1][5]).toEqual({value: 'opacity', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[1][8]).toEqual({value: '0', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[2][1]).toEqual({value: 'to', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'entity.other.attribute-name.scss']});
      expect(tokens[2][5]).toEqual({value: 'opacity', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'meta.property-list.scss', 'meta.property-name.scss', 'support.type.property-name.css']});
      expect(tokens[2][8]).toEqual({value: '1', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[3][0]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'punctuation.section.keyframes.end.scss']});
  });

    describe('when animation-name is specified as a string', function() {
      it('can be double-quoted, containing escapes', function() {
        const {tokens} = grammar.tokenizeLine('@keyframes "\\22 foo\\"" {}');

        expect(tokens[3]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'string.quoted.double.scss', 'punctuation.definition.string.begin.scss']});
        expect(tokens[4]).toEqual({value: '\\22', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'string.quoted.double.scss', 'entity.name.function.scss', 'constant.character.escape.scss']});
        expect(tokens[7]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'string.quoted.double.scss', 'punctuation.definition.string.end.scss']});
        expect(tokens[9]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'punctuation.section.keyframes.begin.scss']});
    });

      it('can be single-quoted, containing escapes', function() {
        const {tokens} = grammar.tokenizeLine("@keyframes '\\'foo\\27' {}");

        expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
        expect(tokens[6]).toEqual({value: '\\27', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'string.quoted.single.scss', 'entity.name.function.scss', 'constant.character.escape.scss']});
        expect(tokens[7]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'string.quoted.single.scss', 'punctuation.definition.string.end.scss']});
        expect(tokens[9]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'punctuation.section.keyframes.begin.scss']});
    });
  });
});

  describe('media queries', () => it('parses media types and features', function() {
    let {tokens} = grammar.tokenizeLine('@media screen {}');

    expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'keyword.control.at-rule.media.scss', 'punctuation.definition.keyword.scss']});
    expect(tokens[1]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'keyword.control.at-rule.media.scss']});
    expect(tokens[2]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.at-rule.media.scss']});
    expect(tokens[3]).toEqual({value: 'screen', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'support.constant.media.css']});
    expect(tokens[4]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.at-rule.media.scss']});
    expect(tokens[5]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});

    ({tokens} = grammar.tokenizeLine('@media (orientation: landscape) and (min-width: 700px) /* comment */ {}'));

    expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'keyword.control.at-rule.media.scss', 'punctuation.definition.keyword.scss']});
    expect(tokens[1]).toEqual({value: 'media', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'keyword.control.at-rule.media.scss']});
    expect(tokens[2]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.at-rule.media.scss']});
    expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'punctuation.definition.media-query.begin.bracket.round.scss']});
    expect(tokens[4]).toEqual({value: 'orientation', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'meta.property-name.media-query.scss', 'support.type.property-name.media.css']});
    expect(tokens[5]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'punctuation.separator.key-value.scss']});
    expect(tokens[6]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss']});
    expect(tokens[7]).toEqual({value: 'landscape', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'meta.property-value.media-query.scss', 'support.constant.property-value.css']});
    expect(tokens[8]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'punctuation.definition.media-query.end.bracket.round.scss']});
    expect(tokens[9]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.at-rule.media.scss']});
    expect(tokens[10]).toEqual({value: 'and', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'keyword.operator.logical.scss']});
    expect(tokens[12]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'punctuation.definition.media-query.begin.bracket.round.scss']});
    expect(tokens[13]).toEqual({value: 'min-width', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'meta.property-name.media-query.scss', 'support.type.property-name.media.css']});
    expect(tokens[14]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'punctuation.separator.key-value.scss']});
    expect(tokens[16]).toEqual({value: '700', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'meta.property-value.media-query.scss', 'constant.numeric.css']});
    expect(tokens[17]).toEqual({value: 'px', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'meta.property-value.media-query.scss', 'constant.numeric.css', 'keyword.other.unit.px.css']});
    expect(tokens[18]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'meta.property-list.media-query.scss', 'punctuation.definition.media-query.end.bracket.round.scss']});
    expect(tokens[20]).toEqual({value: '/*', scopes: ['source.css.scss', 'meta.at-rule.media.scss', 'comment.block.scss', 'punctuation.definition.comment.scss']});
    expect(tokens[24]).toEqual({value: '{', scopes: ['source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
}));

  describe('functions', function() {
    it('parses them', function() {
      let {tokens} = grammar.tokenizeLine('.a { hello: something($wow, 3) }');

      expect(tokens[8]).toEqual({value: 'something', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.function.misc.scss']});
      expect(tokens[9]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
      expect(tokens[10]).toEqual({value: '$wow', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[11]).toEqual({value: ',', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.separator.delimiter.scss']});
      expect(tokens[13]).toEqual({value: '3', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[14]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});

      ({tokens} = grammar.tokenizeLine('.a { hello: something(very.$wow, 3) }'));

      expect(tokens[8]).toEqual({value: 'something', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.function.misc.scss']});
      expect(tokens[9]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
      expect(tokens[10]).toEqual({value: 'very', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[11]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.access.module.scss']});
      expect(tokens[12]).toEqual({value: '$wow', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[13]).toEqual({value: ',', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.separator.delimiter.scss']});
      expect(tokens[15]).toEqual({value: '3', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[16]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
  });

    it('tokenizes functions with parentheses in them', function() {
      let {tokens} = grammar.tokenizeLine('.a { hello: something((a: $b)) }');

      expect(tokens[8]).toEqual({value: 'something', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.function.misc.scss']});
      expect(tokens[9]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
      expect(tokens[10]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.begin.bracket.round.scss']});
      expect(tokens[11]).toEqual({value: 'a', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss']});
      expect(tokens[12]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[14]).toEqual({value: '$b', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[15]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.end.bracket.round.scss']});
      expect(tokens[16]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});

      ({tokens} = grammar.tokenizeLine('.a { hello: something((a: m.$b)) }'));

      expect(tokens[8]).toEqual({value: 'something', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.function.misc.scss']});
      expect(tokens[9]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
      expect(tokens[10]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.begin.bracket.round.scss']});
      expect(tokens[11]).toEqual({value: 'a', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss']});
      expect(tokens[12]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[14]).toEqual({value: 'm', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[15]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.access.module.scss']});
      expect(tokens[16]).toEqual({value: '$b', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[17]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.end.bracket.round.scss']});
      expect(tokens[18]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
  });

    it('tokenizes functions from module imports', function() {
      const {tokens} = grammar.tokenizeLine('.a { hello: foo.something((a: m.$b)) }');

      expect(tokens[8]).toEqual({value: 'foo', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[9]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.access.module.scss']});
      expect(tokens[10]).toEqual({value: 'something', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.function.misc.scss']});
      expect(tokens[11]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
      expect(tokens[12]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.begin.bracket.round.scss']});
      expect(tokens[13]).toEqual({value: 'a', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss']});
      expect(tokens[14]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[16]).toEqual({value: 'm', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[17]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.access.module.scss']});
      expect(tokens[18]).toEqual({value: '$b', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
      expect(tokens[19]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.definition.end.bracket.round.scss']});
      expect(tokens[20]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
  });
});

  describe('variable setting', function() {
    it('parses all tokens', function() {
      let {tokens} = grammar.tokenizeLine('$font-size: $normal-font-size;');

      expect(tokens[0]).toEqual({value: '$font-size', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'variable.scss']});
      expect(tokens[1]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[2]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.definition.variable.scss']});
      expect(tokens[3]).toEqual({value: '$normal-font-size', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'variable.scss']});
      expect(tokens[4]).toEqual({value: ';', scopes: ['source.css.scss', 'punctuation.terminator.rule.scss']});

      ({tokens} = grammar.tokenizeLine(' $font-family-sans-serif: "Helvetica Neue", Roboto, Arial, sans-serif;'));

      expect(tokens[0]).toEqual({value: ' ', scopes: ['source.css.scss']});
      expect(tokens[1]).toEqual({value: '$font-family-sans-serif', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'variable.scss']});
      expect(tokens[4]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'string.quoted.double.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[7]).toEqual({value: ',', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'punctuation.separator.delimiter.scss']});
      expect(tokens[8]).toEqual({value: ' Roboto', scopes: ['source.css.scss', 'meta.definition.variable.scss']});
      expect(tokens[9]).toEqual({value: ',', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'punctuation.separator.delimiter.scss']});
      expect(tokens[14]).toEqual({value: 'sans-serif', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'support.constant.font-name.css']});
      expect(tokens[15]).toEqual({value: ';', scopes: ['source.css.scss', 'punctuation.terminator.rule.scss']});

      ({tokens} = grammar.tokenizeLine('$font-weight: config.$font-weight;'));

      expect(tokens[0]).toEqual({value: '$font-weight', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'variable.scss']});
      expect(tokens[1]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[2]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.definition.variable.scss']});
      expect(tokens[3]).toEqual({value: 'config', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'variable.scss']});
      expect(tokens[4]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'punctuation.access.module.scss']});
      expect(tokens[5]).toEqual({value: '$font-weight', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'variable.scss']});
      expect(tokens[6]).toEqual({value: ';', scopes: ['source.css.scss', 'punctuation.terminator.rule.scss']});
  });


    it("parses css variables", function() {
      const {tokens} = grammar.tokenizeLine(".foo { --spacing-unit: 6px; }");
      expect(tokens).toHaveLength(13);
      expect(tokens[0]).toEqual({value: ".", scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
      expect(tokens[1]).toEqual({value: "foo", scopes: ['source.css.scss', 'entity.other.attribute-name.class.css']});
      expect(tokens[2]).toEqual({value: " ", scopes: ['source.css.scss']});
      expect(tokens[3]).toEqual({value: "{", scopes: [ 'source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
      expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[5]).toEqual({value: "--spacing-unit", scopes: ['source.css.scss', 'meta.property-list.scss', 'variable.scss']});
      expect(tokens[6]).toEqual({value: ":", scopes: [ 'source.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[7]).toEqual({value: " ", scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[8]).toEqual({value: "6", scopes: [ 'source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css']});
      expect(tokens[9]).toEqual({value: "px", scopes: [ 'source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'constant.numeric.css', 'keyword.other.unit.px.css']});
      expect(tokens[10]).toEqual({value: ";", scopes: [ 'source.css.scss', 'meta.property-list.scss', 'punctuation.terminator.rule.scss']});
      expect(tokens[11]).toEqual({value: " ", scopes: ['source.css.scss', 'meta.property-list.scss']});
      expect(tokens[12]).toEqual({value: "}", scopes: [ 'source.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.end.bracket.curly.scss']});
  });

    it('tokenizes maps', function() {
      const {tokens} = grammar.tokenizeLine('$map: (medium: value, header-height: 10px);');

      expect(tokens[0]).toEqual({value: '$map', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'variable.scss']});
      expect(tokens[1]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[2]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.definition.variable.scss']});
      expect(tokens[3]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'punctuation.definition.map.begin.bracket.round.scss']});
      expect(tokens[4]).toEqual({value: 'medium', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'support.type.map.key.scss']});
      expect(tokens[5]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[6]).toEqual({value: ' value', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss']});
      expect(tokens[7]).toEqual({value: ',', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'punctuation.separator.delimiter.scss']});
      expect(tokens[8]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss']});
      expect(tokens[9]).toEqual({value: 'header-height', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'support.type.map.key.scss']});
      expect(tokens[10]).toEqual({value: ':', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'punctuation.separator.key-value.scss']});
      expect(tokens[11]).toEqual({value: ' ', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss']});
      expect(tokens[12]).toEqual({value: '10', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'constant.numeric.css']});
      expect(tokens[14]).toEqual({value: ')', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'punctuation.definition.map.end.bracket.round.scss']});
      expect(tokens[15]).toEqual({value: ';', scopes: ['source.css.scss', 'punctuation.terminator.rule.scss']});
  });

    it('tokenizes variables in maps', function() {
      const {tokens} = grammar.tokenizeLine('$map: (gutters: $grid-content-gutters)');

      expect(tokens[7]).toEqual({value: '$grid-content-gutters', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'variable.scss']});
  });

    it('tokenizes module variables in maps', function() {
      const {tokens} = grammar.tokenizeLine('$map: (gutters: grid.$gutters)');

      expect(tokens[7]).toEqual({value: 'grid', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'variable.scss']});
      expect(tokens[8]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'punctuation.access.module.scss']});
      expect(tokens[9]).toEqual({value: '$gutters', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'variable.scss']});
  });

    it('tokenizes maps inside maps', function() {
      const tokens = grammar.tokenizeLines(`\
$custom-palettes: (
  alr: (
    alr-blue: (
      x-light: rgb(240, 243, 246)
    )
  )
);\
`
      );

      expect(tokens[1][1]).toEqual({value: 'alr', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'support.type.map.key.scss']});
      expect(tokens[2][1]).toEqual({value: 'alr-blue', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'meta.definition.variable.map.scss', 'support.type.map.key.scss']});
      expect(tokens[3][1]).toEqual({value: 'x-light', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'meta.definition.variable.map.scss', 'meta.definition.variable.map.scss', 'support.type.map.key.scss']});
  });

    it('tokenizes comments', function() {
      let {tokens} = grammar.tokenizeLine('$font-size: // comment');

      expect(tokens[3]).toEqual({value: '//', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'comment.line.scss', 'punctuation.definition.comment.scss']});

      ({tokens} = grammar.tokenizeLine('$font-size: /* comment */'));

      expect(tokens[3]).toEqual({value: '/*', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'comment.block.scss', 'punctuation.definition.comment.scss']});
  });

    it('tokenizes comments in maps', function() {
      const {tokens} = grammar.tokenizeLine('$map: (/* comment */ key: // comment)');

      expect(tokens[4]).toEqual({value: '/*', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'comment.block.scss', 'punctuation.definition.comment.scss']});
      expect(tokens[11]).toEqual({value: '//', scopes: ['source.css.scss', 'meta.definition.variable.scss', 'meta.definition.variable.map.scss', 'comment.line.scss', 'punctuation.definition.comment.scss']});
  });
});

  describe('interpolation', function() {
    it('is tokenized within single quotes', function() {
      let {tokens} = grammar.tokenizeLine("body { font-family: '#\{$family}'; }"); // escaping CoffeeScript's interpolation

      expect(tokens[8]).toEqual({value: '#{', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[9]).toEqual({value: '$family', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine("body { font-family: '#\{font.$family}'; }")); // escaping CoffeeScript's interpolation

      expect(tokens[8]).toEqual({value: '#{', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[9]).toEqual({value: 'font', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[10]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'variable.interpolation.scss', 'punctuation.access.module.scss']});
      expect(tokens[11]).toEqual({value: '$family', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[12]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});
  });

    it('is tokenized within double quotes', function() {
      let {tokens} = grammar.tokenizeLine('body { font-family: "#\{$family}"; }');

      expect(tokens[8]).toEqual({value: '#{', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[9]).toEqual({value: '$family', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine('body { font-family: "#\{font.$family}"; }'));

      expect(tokens[8]).toEqual({value: '#{', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[9]).toEqual({value: 'font', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[10]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'variable.interpolation.scss', 'punctuation.access.module.scss']});
      expect(tokens[11]).toEqual({value: '$family', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[12]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});
  });

    it('is tokenized without quotes', function() {
      let {tokens} = grammar.tokenizeLine('body { font-family: #\{$family}; }');

      expect(tokens[7]).toEqual({value: '#{', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[8]).toEqual({value: '$family', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[9]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine('body { font-family: #\{font.$family}; }'));

      expect(tokens[7]).toEqual({value: '#{', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[8]).toEqual({value: 'font', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[9]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.interpolation.scss', 'punctuation.access.module.scss']});
      expect(tokens[10]).toEqual({value: '$family', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[11]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});
  });

    it('is tokenized as a class name', function() {
      let {tokens} = grammar.tokenizeLine('body.#\{$class} {}');

      expect(tokens[2]).toEqual({value: '#{', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[3]).toEqual({value: '$class', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[4]).toEqual({value: '}', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine('body.#\{special.$class} {}'));

      expect(tokens[2]).toEqual({value: '#{', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[3]).toEqual({value: 'special', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[4]).toEqual({value: '.', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'variable.interpolation.scss', 'punctuation.access.module.scss']});
      expect(tokens[5]).toEqual({value: '$class', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[6]).toEqual({value: '}', scopes: ['source.css.scss', 'entity.other.attribute-name.class.css', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});
  });

    it('is tokenized as a keyframe', function() {
      let {tokens} = grammar.tokenizeLine('@keyframes anim { #\{$keyframe} {} }');

      expect(tokens[7]).toEqual({value: '#{', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[8]).toEqual({value: '$keyframe', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[9]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});

      ({tokens} = grammar.tokenizeLine('@keyframes anim { #\{animations.$keyframe} {} }'));

      expect(tokens[7]).toEqual({value: '#{', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.begin.bracket.curly.scss']});
      expect(tokens[8]).toEqual({value: 'animations', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[9]).toEqual({value: '.', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'variable.interpolation.scss', 'punctuation.access.module.scss']});
      expect(tokens[10]).toEqual({value: '$keyframe', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'variable.interpolation.scss', 'variable.scss']});
      expect(tokens[11]).toEqual({value: '}', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'variable.interpolation.scss', 'punctuation.definition.interpolation.end.bracket.curly.scss']});
  });

    it('does not tokenize anything after the closing bracket as interpolation', function() {
      const {tokens} = grammar.tokenizeLine('#\{variable}hi');

      expect(tokens[3]).not.toEqual({value: 'hi', scopes: ['source.css.scss', 'variable.interpolation.scss']});
  });
});

  describe('strings', function() {
    it('tokenizes single-quote strings', function() {
      const {tokens} = grammar.tokenizeLine(".a { content: 'hi' }");

      expect(tokens[8]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[9]).toEqual({value: 'hi', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss']});
      expect(tokens[10]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'punctuation.definition.string.end.scss']});
  });

    it('tokenizes double-quote strings', function() {
      const {tokens} = grammar.tokenizeLine('.a { content: "hi" }');

      expect(tokens[8]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[9]).toEqual({value: 'hi', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss']});
      expect(tokens[10]).toEqual({value: '"', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'punctuation.definition.string.end.scss']});
  });

    it('tokenizes escape characters', function() {
      let {tokens} = grammar.tokenizeLine(".a { content: '\\abcdef' }");

      expect(tokens[9]).toEqual({value: '\\abcdef', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.single.scss', 'constant.character.escape.scss']});

      ({tokens} = grammar.tokenizeLine('.a { content: "\\abcdef" }'));

      expect(tokens[9]).toEqual({value: '\\abcdef', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'string.quoted.double.scss', 'constant.character.escape.scss']});
  });
});

  describe('comments', function() {
    it('tokenizes line comments', function() {
      const {tokens} = grammar.tokenizeLine('//Wow a comment!');

      expect(tokens[0]).toEqual({value: '//', scopes: ['source.css.scss', 'comment.line.scss', 'punctuation.definition.comment.scss']});
      expect(tokens[1]).toEqual({value: 'Wow a comment!', scopes: ['source.css.scss', 'comment.line.scss']});
  });

    it('tokenizes block comments', function() {
      const {tokens} = grammar.tokenizeLine('/*Pretty blocky*/');

      expect(tokens[0]).toEqual({value: '/*', scopes: ['source.css.scss', 'comment.block.scss', 'punctuation.definition.comment.scss']});
      expect(tokens[1]).toEqual({value: 'Pretty blocky', scopes: ['source.css.scss', 'comment.block.scss']});
      expect(tokens[2]).toEqual({value: '*/', scopes: ['source.css.scss', 'comment.block.scss', 'punctuation.definition.comment.scss']});
  });

    it("doesn't tokenize URLs as comments", function() {
      const tokens = grammar.tokenizeLines(`\
.a {
    background: transparent url(//url/goes/here) 0 0 / cover no-repeat;
}\
`
      );

      expect(tokens[1][8]).toEqual({value: '//url/goes/here', scopes: ['source.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.parameter.url.scss']});
  });

    it('tokenizes comments in @keyframes', function() {
      const tokens = grammar.tokenizeLines(`\
@keyframes foo {
  // comment
  /* comment */
}\
`
      );

      expect(tokens[1][1]).toEqual({value: '//', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'comment.line.scss', 'punctuation.definition.comment.scss']});
      expect(tokens[2][1]).toEqual({value: '/*', scopes: ['source.css.scss', 'meta.at-rule.keyframes.scss', 'comment.block.scss', 'punctuation.definition.comment.scss']});
  });
});

  describe('@use', function() {
    it('tokenizes solitary @use correctly', function() {
      const {tokens} = grammar.tokenizeLine('@use');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'use', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss']});
  });

    it('tokenizes @use with path correctly', function() {
      const {tokens} = grammar.tokenizeLine("@use 'module';");

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'use', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss']});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'module', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'string.quoted.single.scss']});
  });

    it('tokenizes @use with explicit namespace correctly', function() {
      const {tokens} = grammar.tokenizeLine("@use 'module' as m-_;");

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'use', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss']});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'module', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'string.quoted.single.scss']});
      expect(tokens[7]).toEqual({value: 'as', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.operator']});
      expect(tokens[9]).toEqual({value: 'm-_', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'variable.scss']});
  });

    it('tokenizes @use with expanded namespace correctly', function() {
      const {tokens} = grammar.tokenizeLine("@use 'module' as *;");

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'use', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss']});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'module', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'string.quoted.single.scss']});
      expect(tokens[7]).toEqual({value: 'as', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.operator']});
      expect(tokens[9]).toEqual({value: '*', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'variable.language.expanded-namespace.scss']});
  });

    it('tokenizes @use with configuration correctly', function() {
      const {tokens} = grammar.tokenizeLine("@use 'module' with ($black: #222, $border-radius: 0.1rem)");

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'use', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.at-rule.use.scss']});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'module', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'string.quoted.single.scss']});
      expect(tokens[7]).toEqual({value: 'with', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'keyword.control.operator']});
      expect(tokens[9]).toEqual({value: '(', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'punctuation.definition.parameters.begin.bracket.round.scss']});
      expect(tokens[10]).toEqual({value: '$black', scopes: ['source.css.scss', 'meta.at-rule.use.scss', 'variable.scss']});
  });
});

  describe('@forward', function() {
    it('tokenizes solitary @forward correctly', function() {
      const {tokens} = grammar.tokenizeLine('@forward');

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'forward', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss']});
  });

    it('tokenizes @forward with path correctly', function() {
      const {tokens} = grammar.tokenizeLine("@forward 'module'");

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'forward', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss']});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'module', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'string.quoted.single.scss']});
  });

    it('tokenizes @forward with prefix correctly', function() {
      const {tokens} = grammar.tokenizeLine("@forward 'module' as prefix*");

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'forward', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss']});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'module', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'string.quoted.single.scss']});
      expect(tokens[7]).toEqual({value: 'as', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.operator']});
      expect(tokens[9]).toEqual({value: 'prefix', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'entity.other.attribute-name.module.scss']});
      expect(tokens[10]).toEqual({value: '*', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'punctuation.definition.wildcard.scss']});
  });

    it('tokenizes @forward with hide correctly', function() {
      const {tokens} = grammar.tokenizeLine("@forward 'module' hide a-mixin $private-variable");

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'forward', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss']});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'module', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'string.quoted.single.scss']});
      expect(tokens[7]).toEqual({value: 'hide', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.operator']});
      expect(tokens[9]).toEqual({value: 'a-mixin', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'entity.name.function.scss']});
      expect(tokens[11]).toEqual({value: '$private-variable', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'variable.scss']});
  });

    it('tokenizes @forward with show correctly', function() {
      const {tokens} = grammar.tokenizeLine("@forward 'module' show public-mixin $public-variable");

      expect(tokens[0]).toEqual({value: '@', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss', 'punctuation.definition.keyword.scss']});
      expect(tokens[1]).toEqual({value: 'forward', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.at-rule.forward.scss']});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'string.quoted.single.scss', 'punctuation.definition.string.begin.scss']});
      expect(tokens[4]).toEqual({value: 'module', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'string.quoted.single.scss']});
      expect(tokens[7]).toEqual({value: 'show', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'keyword.control.operator']});
      expect(tokens[9]).toEqual({value: 'public-mixin', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'entity.name.function.scss']});
      expect(tokens[11]).toEqual({value: '$public-variable', scopes: ['source.css.scss', 'meta.at-rule.forward.scss', 'variable.scss']});
  });
});
});
