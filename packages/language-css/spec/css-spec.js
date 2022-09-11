(function() {
  describe('CSS grammar', function() {
    var grammar;
    grammar = null;
    beforeEach(function() {
      atom.config.set('core.useTreeSitterParsers', false);
      waitsForPromise(function() {
        return atom.packages.activatePackage('language-css');
      });
      return runs(function() {
        return grammar = atom.grammars.grammarForScopeName('source.css');
      });
    });
    it('parses the grammar', function() {
      expect(grammar).toBeTruthy();
      return expect(grammar.scopeName).toBe('source.css');
    });
    describe('selectors', function() {
      it('tokenizes type selectors', function() {
        var tokens;
        tokens = grammar.tokenizeLine('p {}').tokens;
        return expect(tokens[0]).toEqual({
          value: 'p',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
      });
      it('tokenizes the universal selector', function() {
        var tokens;
        tokens = grammar.tokenizeLine('*').tokens;
        return expect(tokens[0]).toEqual({
          value: '*',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.wildcard.css']
        });
      });
      it('tokenises combinators', function() {
        var tokens;
        tokens = grammar.tokenizeLine('a > b + * ~ :not(.nah)').tokens;
        expect(tokens[2]).toEqual({
          value: '>',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
        expect(tokens[6]).toEqual({
          value: '+',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
        return expect(tokens[10]).toEqual({
          value: '~',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
      });
      it('highlights deprecated combinators', function() {
        var tokens;
        tokens = grammar.tokenizeLine('.sooo /deep/ >>>_.>>>').tokens;
        expect(tokens[3]).toEqual({
          value: '/deep/',
          scopes: ['source.css', 'invalid.deprecated.combinator.css']
        });
        return expect(tokens[5]).toEqual({
          value: '>>>',
          scopes: ['source.css', 'invalid.deprecated.combinator.css']
        });
      });
      it('tokenizes complex selectors', function() {
        var lines, tokens;
        tokens = grammar.tokenizeLine('[disabled], [disabled] + p').tokens;
        expect(tokens[0]).toEqual({
          value: '[',
          scopes: ["source.css", "meta.selector.css", "meta.attribute-selector.css", "punctuation.definition.entity.begin.bracket.square.css"]
        });
        expect(tokens[1]).toEqual({
          value: 'disabled',
          scopes: ["source.css", "meta.selector.css", "meta.attribute-selector.css", "entity.other.attribute-name.css"]
        });
        expect(tokens[2]).toEqual({
          value: ']',
          scopes: ["source.css", "meta.selector.css", "meta.attribute-selector.css", "punctuation.definition.entity.end.bracket.square.css"]
        });
        expect(tokens[3]).toEqual({
          value: ',',
          scopes: ["source.css", "meta.selector.css", "punctuation.separator.list.comma.css"]
        });
        expect(tokens[5]).toEqual({
          value: '[',
          scopes: ["source.css", "meta.selector.css", "meta.attribute-selector.css", "punctuation.definition.entity.begin.bracket.square.css"]
        });
        expect(tokens[6]).toEqual({
          value: 'disabled',
          scopes: ["source.css", "meta.selector.css", "meta.attribute-selector.css", "entity.other.attribute-name.css"]
        });
        expect(tokens[7]).toEqual({
          value: ']',
          scopes: ["source.css", "meta.selector.css", "meta.attribute-selector.css", "punctuation.definition.entity.end.bracket.square.css"]
        });
        expect(tokens[9]).toEqual({
          value: '+',
          scopes: ["source.css", "meta.selector.css", "keyword.operator.combinator.css"]
        });
        expect(tokens[11]).toEqual({
          value: 'p',
          scopes: ["source.css", "meta.selector.css", "entity.name.tag.css"]
        });
        lines = grammar.tokenizeLines("[disabled]:not(:first-child)::before:hover\n  ~ div.object\n  + #id.thing:hover > strong ~ p::before,\na::last-of-type,/*Comment*/::selection > html[lang^=en-AU],\n*>em.i.ly[data-name|=\"Life\"] { }");
        expect(lines[0][0]).toEqual({
          value: '[',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
        });
        expect(lines[0][1]).toEqual({
          value: 'disabled',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
        });
        expect(lines[0][2]).toEqual({
          value: ']',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
        });
        expect(lines[0][3]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[0][4]).toEqual({
          value: 'not',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
        });
        expect(lines[0][5]).toEqual({
          value: '(',
          scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
        });
        expect(lines[0][6]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[0][7]).toEqual({
          value: 'first-child',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
        });
        expect(lines[0][8]).toEqual({
          value: ')',
          scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
        });
        expect(lines[0][9]).toEqual({
          value: '::',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
        });
        expect(lines[0][10]).toEqual({
          value: 'before',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
        });
        expect(lines[0][11]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[0][12]).toEqual({
          value: 'hover',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
        });
        expect(lines[1][1]).toEqual({
          value: '~',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
        expect(lines[1][3]).toEqual({
          value: 'div',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(lines[1][4]).toEqual({
          value: '.',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[1][5]).toEqual({
          value: 'object',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
        });
        expect(lines[2][1]).toEqual({
          value: '+',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
        expect(lines[2][3]).toEqual({
          value: '#',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
        });
        expect(lines[2][4]).toEqual({
          value: 'id',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
        });
        expect(lines[2][5]).toEqual({
          value: '.',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[2][6]).toEqual({
          value: 'thing',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
        });
        expect(lines[2][7]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[2][8]).toEqual({
          value: 'hover',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
        });
        expect(lines[2][10]).toEqual({
          value: '>',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
        expect(lines[2][12]).toEqual({
          value: 'strong',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(lines[2][14]).toEqual({
          value: '~',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
        expect(lines[2][16]).toEqual({
          value: 'p',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(lines[2][17]).toEqual({
          value: '::',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
        });
        expect(lines[2][18]).toEqual({
          value: 'before',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
        });
        expect(lines[2][19]).toEqual({
          value: ',',
          scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.list.comma.css']
        });
        expect(lines[3][0]).toEqual({
          value: 'a',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(lines[3][1]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[3][2]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'invalid.illegal.colon.css']
        });
        expect(lines[3][3]).toEqual({
          value: 'last-of-type',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
        });
        expect(lines[3][4]).toEqual({
          value: ',',
          scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.list.comma.css']
        });
        expect(lines[3][5]).toEqual({
          value: '/*',
          scopes: ['source.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(lines[3][6]).toEqual({
          value: 'Comment',
          scopes: ['source.css', 'comment.block.css']
        });
        expect(lines[3][7]).toEqual({
          value: '*/',
          scopes: ['source.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        expect(lines[3][8]).toEqual({
          value: '::',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
        });
        expect(lines[3][9]).toEqual({
          value: 'selection',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
        });
        expect(lines[3][11]).toEqual({
          value: '>',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
        expect(lines[3][13]).toEqual({
          value: 'html',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(lines[3][14]).toEqual({
          value: '[',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
        });
        expect(lines[3][15]).toEqual({
          value: 'lang',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
        });
        expect(lines[3][16]).toEqual({
          value: '^=',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
        });
        expect(lines[3][17]).toEqual({
          value: 'en-AU',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
        });
        expect(lines[3][18]).toEqual({
          value: ']',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
        });
        expect(lines[3][19]).toEqual({
          value: ',',
          scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.list.comma.css']
        });
        expect(lines[4][0]).toEqual({
          value: '*',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.wildcard.css']
        });
        expect(lines[4][1]).toEqual({
          value: '>',
          scopes: ['source.css', 'meta.selector.css', 'keyword.operator.combinator.css']
        });
        expect(lines[4][2]).toEqual({
          value: 'em',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(lines[4][3]).toEqual({
          value: '.',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[4][4]).toEqual({
          value: 'i',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
        });
        expect(lines[4][5]).toEqual({
          value: '.',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
        });
        expect(lines[4][6]).toEqual({
          value: 'ly',
          scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
        });
        expect(lines[4][7]).toEqual({
          value: '[',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
        });
        expect(lines[4][8]).toEqual({
          value: 'data-name',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
        });
        expect(lines[4][9]).toEqual({
          value: '|=',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
        });
        expect(lines[4][10]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        expect(lines[4][11]).toEqual({
          value: 'Life',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
        });
        expect(lines[4][12]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
        });
        expect(lines[4][13]).toEqual({
          value: ']',
          scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
        });
        expect(lines[4][15]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        return expect(lines[4][17]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      describe('custom elements (as type selectors)', function() {
        it('only tokenizes identifiers beginning with [a-z]', function() {
          var tokens;
          tokens = grammar.tokenizeLine('pearl-1941 1941-pearl -pearl-1941').tokens;
          expect(tokens[0]).toEqual({
            value: 'pearl-1941',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
          });
          return expect(tokens[1]).toEqual({
            value: ' 1941-pearl -pearl-1941',
            scopes: ['source.css', 'meta.selector.css']
          });
        });
        it('tokenizes custom elements containing non-ASCII letters', function() {
          var tokens;
          tokens = grammar.tokenizeLine('pokémon-ピカチュウ').tokens;
          return expect(tokens[0]).toEqual({
            value: 'pokémon-ピカチュウ',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
          });
        });
        it('does not tokenize identifiers containing [A-Z]', function() {
          var tokens;
          tokens = grammar.tokenizeLine('Basecamp-schedule basecamp-Schedule').tokens;
          return expect(tokens[0]).toEqual({
            value: 'Basecamp-schedule basecamp-Schedule',
            scopes: ['source.css', 'meta.selector.css']
          });
        });
        it('does not tokenize identifiers containing no hyphens', function() {
          var tokens;
          tokens = grammar.tokenizeLine('halo_night').tokens;
          return expect(tokens[0]).toEqual({
            value: 'halo_night',
            scopes: ['source.css', 'meta.selector.css']
          });
        });
        it('does not tokenise identifiers following an @ symbol', function() {
          var tokens;
          tokens = grammar.tokenizeLine('@some-weird-new-feature').tokens;
          expect(tokens[0]).toEqual({
            value: '@',
            scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css', 'punctuation.definition.keyword.css']
          });
          return expect(tokens[1]).toEqual({
            value: 'some-weird-new-feature',
            scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
          });
        });
        return it('does not tokenise identifiers in unfamiliar functions', function() {
          var tokens;
          tokens = grammar.tokenizeLine('some-edgy-new-function()').tokens;
          expect(tokens[0]).toEqual({
            value: 'some-edgy-new-function(',
            scopes: ['source.css', 'meta.selector.css']
          });
          return expect(tokens[1]).toEqual({
            value: ')',
            scopes: ['source.css']
          });
        });
      });
      describe('attribute selectors', function() {
        it('tokenizes attribute selectors without values', function() {
          var tokens;
          tokens = grammar.tokenizeLine('[title]').tokens;
          expect(tokens[0]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[1]).toEqual({
            value: 'title',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          return expect(tokens[2]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenizes attribute selectors with identifier values', function() {
          var tokens;
          tokens = grammar.tokenizeLine('[hreflang|=fr]').tokens;
          expect(tokens[0]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[1]).toEqual({
            value: 'hreflang',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[2]).toEqual({
            value: '|=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[3]).toEqual({
            value: 'fr',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          return expect(tokens[4]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenizes attribute selectors with string values', function() {
          var tokens;
          tokens = grammar.tokenizeLine('[href^="http://www.w3.org/"]').tokens;
          expect(tokens[0]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[1]).toEqual({
            value: 'href',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[2]).toEqual({
            value: '^=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[3]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[4]).toEqual({
            value: 'http://www.w3.org/',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
          });
          expect(tokens[5]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
          });
          return expect(tokens[6]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenizes CSS qualified attribute names with wildcard prefix', function() {
          var tokens;
          tokens = grammar.tokenizeLine('[*|title]').tokens;
          expect(tokens[0]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[1]).toEqual({
            value: '*',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[2]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.separator.css']
          });
          expect(tokens[3]).toEqual({
            value: 'title',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          return expect(tokens[4]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenizes CSS qualified attribute names with namespace prefix', function() {
          var tokens;
          tokens = grammar.tokenizeLine('[marvel|origin=radiation]').tokens;
          expect(tokens[0]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[1]).toEqual({
            value: 'marvel',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[2]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.separator.css']
          });
          expect(tokens[3]).toEqual({
            value: 'origin',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[4]).toEqual({
            value: '=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[5]).toEqual({
            value: 'radiation',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          return expect(tokens[6]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenizes CSS qualified attribute names without namespace prefix', function() {
          var tokens;
          tokens = grammar.tokenizeLine('[|data-hp="75"]').tokens;
          expect(tokens[0]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[1]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.separator.css']
          });
          expect(tokens[2]).toEqual({
            value: 'data-hp',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[3]).toEqual({
            value: '=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[4]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[5]).toEqual({
            value: '75',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
          });
          expect(tokens[6]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
          });
          return expect(tokens[7]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenises compound ID/attribute selectors', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#div[id="0"]{ }').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'div',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
          expect(tokens[2]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[3]).toEqual({
            value: 'id',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[8]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          tokens = grammar.tokenizeLine('.bar#div[id="0"]').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'bar',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
          expect(tokens[2]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[3]).toEqual({
            value: 'div',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
          expect(tokens[4]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          return expect(tokens[5]).toEqual({
            value: 'id',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
        });
        it('tokenises compound class/attribute selectors', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.div[id="0"]{ }').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'div',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
          expect(tokens[2]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[3]).toEqual({
            value: 'id',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[8]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          tokens = grammar.tokenizeLine('#bar.div[id]').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'bar',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
          expect(tokens[2]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[3]).toEqual({
            value: 'div',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
          expect(tokens[4]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[5]).toEqual({
            value: 'id',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          return expect(tokens[6]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('allows whitespace to be inserted between tokens', function() {
          var tokens;
          tokens = grammar.tokenizeLine('span[  er|lang  |=   "%%"   ]').tokens;
          expect(tokens[1]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[2]).toEqual({
            value: '  ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[3]).toEqual({
            value: 'er',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[4]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.separator.css']
          });
          expect(tokens[5]).toEqual({
            value: 'lang',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[6]).toEqual({
            value: '  ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[7]).toEqual({
            value: '|=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[8]).toEqual({
            value: '   ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[9]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[10]).toEqual({
            value: '%%',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
          });
          expect(tokens[11]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[12]).toEqual({
            value: '   ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          return expect(tokens[13]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenises escape sequences inside attribute selectors', function() {
          var tokens;
          tokens = grammar.tokenizeLine('a[name\\[0\\]="value"]').tokens;
          expect(tokens[2]).toEqual({
            value: 'name',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[3]).toEqual({
            value: '\\[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css', 'constant.character.escape.css']
          });
          expect(tokens[4]).toEqual({
            value: '0',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[5]).toEqual({
            value: '\\]',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css', 'constant.character.escape.css']
          });
          expect(tokens[6]).toEqual({
            value: '=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          return expect(tokens[10]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenises escape sequences inside namespace prefixes', function() {
          var tokens;
          tokens = grammar.tokenizeLine('a[name\\ space|Get\\ It\\?="kek"]').tokens;
          expect(tokens[2]).toEqual({
            value: 'name',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[3]).toEqual({
            value: '\\ ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css', 'constant.character.escape.css']
          });
          expect(tokens[4]).toEqual({
            value: 'space',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[5]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.separator.css']
          });
          expect(tokens[6]).toEqual({
            value: 'Get',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[7]).toEqual({
            value: '\\ ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css', 'constant.character.escape.css']
          });
          expect(tokens[8]).toEqual({
            value: 'It',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(tokens[9]).toEqual({
            value: '\\?',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css', 'constant.character.escape.css']
          });
          expect(tokens[10]).toEqual({
            value: '=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          return expect(tokens[14]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenises comments inside attribute selectors', function() {
          var tokens;
          tokens = grammar.tokenizeLine('span[/*]*/lang]').tokens;
          expect(tokens[0]).toEqual({
            value: 'span',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(tokens[1]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[2]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(tokens[3]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css']
          });
          expect(tokens[4]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(tokens[5]).toEqual({
            value: 'lang',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          return expect(tokens[6]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenises quoted strings in attribute selectors', function() {
          var tokens;
          tokens = grammar.tokenizeLine('a[href^="#"] a[href^= "#"] a[href^="#" ]').tokens;
          expect(tokens[4]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[5]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
          });
          expect(tokens[6]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[12]).toEqual({
            value: '^=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[13]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[14]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[15]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
          });
          expect(tokens[16]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[23]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[24]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
          });
          expect(tokens[25]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[26]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[27]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          tokens = grammar.tokenizeLine("a[href^='#'] a[href^=  '#'] a[href^='#' ]").tokens;
          expect(tokens[4]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[5]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css']
          });
          expect(tokens[6]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[12]).toEqual({
            value: '^=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[13]).toEqual({
            value: '  ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[14]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[15]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css']
          });
          expect(tokens[16]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[23]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[24]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css']
          });
          expect(tokens[25]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[26]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          return expect(tokens[27]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenises unquoted strings in attribute selectors', function() {
          var tokens;
          tokens = grammar.tokenizeLine('span[class~=Java]').tokens;
          expect(tokens[3]).toEqual({
            value: '~=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[4]).toEqual({
            value: 'Java',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          expect(tokens[5]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          tokens = grammar.tokenizeLine('span[class^=  0xDEADCAFE=|~BEEFBABE  ]').tokens;
          expect(tokens[3]).toEqual({
            value: '^=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[4]).toEqual({
            value: '  ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[5]).toEqual({
            value: '0xDEADCAFE=|~BEEFBABE',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          expect(tokens[6]).toEqual({
            value: '  ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          return expect(tokens[7]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        it('tokenises escape sequences in unquoted strings', function() {
          var tokens;
          tokens = grammar.tokenizeLine('a[name\\[0\\]=a\\BAD\\AF\\]a\\ i] {}').tokens;
          expect(tokens[6]).toEqual({
            value: '=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[7]).toEqual({
            value: 'a',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          expect(tokens[8]).toEqual({
            value: '\\BAD',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css', 'constant.character.escape.codepoint.css']
          });
          expect(tokens[9]).toEqual({
            value: '\\AF',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css', 'constant.character.escape.codepoint.css']
          });
          expect(tokens[10]).toEqual({
            value: '\\]',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css', 'constant.character.escape.css']
          });
          expect(tokens[11]).toEqual({
            value: 'a',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          expect(tokens[12]).toEqual({
            value: '\\ ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css', 'constant.character.escape.css']
          });
          expect(tokens[13]).toEqual({
            value: 'i',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          expect(tokens[14]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          return expect(tokens[16]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('tokenises the ignore-case modifier at the end of a selector', function() {
          var tokens;
          tokens = grammar.tokenizeLine('a[attr=val i] a[attr="val" i] a[attr=\'val\'I] a[val^=  \'"\'i] a[attr= i] a[attr= i i]').tokens;
          expect(tokens[6]).toEqual({
            value: 'i',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'storage.modifier.ignore-case.css']
          });
          expect(tokens[7]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          expect(tokens[16]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[17]).toEqual({
            value: 'i',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'storage.modifier.ignore-case.css']
          });
          expect(tokens[26]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[27]).toEqual({
            value: 'I',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'storage.modifier.ignore-case.css']
          });
          expect(tokens[28]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          expect(tokens[34]).toEqual({
            value: '  ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[35]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
          });
          expect(tokens[36]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css']
          });
          expect(tokens[37]).toEqual({
            value: "'",
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
          });
          expect(tokens[38]).toEqual({
            value: 'i',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'storage.modifier.ignore-case.css']
          });
          expect(tokens[39]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          expect(tokens[44]).toEqual({
            value: '=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[45]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[46]).toEqual({
            value: 'i',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          expect(tokens[47]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          expect(tokens[52]).toEqual({
            value: '=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(tokens[53]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[54]).toEqual({
            value: 'i',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.unquoted.attribute-value.css']
          });
          expect(tokens[55]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(tokens[56]).toEqual({
            value: 'i',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'storage.modifier.ignore-case.css']
          });
          return expect(tokens[57]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
        return it('tokenises attribute selectors spanning multiple lines', function() {
          var lines;
          lines = grammar.tokenizeLines("span[\n  \\x20{2}\n  ns|lang/**/\n  |=\n\"pt\"]");
          expect(lines[0][0]).toEqual({
            value: 'span',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(lines[0][1]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(lines[1][0]).toEqual({
            value: '  ',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css']
          });
          expect(lines[2][1]).toEqual({
            value: 'ns',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(lines[2][2]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.separator.css']
          });
          expect(lines[2][3]).toEqual({
            value: 'lang',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(lines[2][4]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[2][5]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[3][1]).toEqual({
            value: '|=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(lines[4][0]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
          });
          expect(lines[4][1]).toEqual({
            value: 'pt',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
          });
          expect(lines[4][2]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
          });
          expect(lines[4][3]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
          lines = grammar.tokenizeLines("span[/*===\n==|span[/*}\n====*/*|lang/*]=*/~=/*\"|\"*/\"en-AU\"/*\n |\n*/\ni]");
          expect(lines[0][2]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[0][3]).toEqual({
            value: '===',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css']
          });
          expect(lines[1][0]).toEqual({
            value: '==|span[/*}',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css']
          });
          expect(lines[2][0]).toEqual({
            value: '====',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css']
          });
          expect(lines[2][1]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[2][2]).toEqual({
            value: '*',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(lines[2][3]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.separator.css']
          });
          expect(lines[2][4]).toEqual({
            value: 'lang',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
          expect(lines[2][5]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[2][6]).toEqual({
            value: ']=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css']
          });
          expect(lines[2][7]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[2][8]).toEqual({
            value: '~=',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
          });
          expect(lines[2][9]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[2][10]).toEqual({
            value: '"|"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css']
          });
          expect(lines[2][11]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[2][12]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
          });
          expect(lines[2][13]).toEqual({
            value: 'en-AU',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
          });
          expect(lines[2][14]).toEqual({
            value: '"',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
          });
          expect(lines[2][15]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[3][0]).toEqual({
            value: ' |',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css']
          });
          expect(lines[4][0]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[5][0]).toEqual({
            value: 'i',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'storage.modifier.ignore-case.css']
          });
          return expect(lines[5][1]).toEqual({
            value: ']',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
          });
        });
      });
      describe('class selectors', function() {
        it('tokenizes class selectors containing non-ASCII letters', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.étendard').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'étendard',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
          tokens = grammar.tokenizeLine('.スポンサー').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[1]).toEqual({
            value: 'スポンサー',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
        });
        it('tokenizes a class selector consisting of two hypens', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.--').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[1]).toEqual({
            value: '--',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
        });
        it('tokenizes class selectors consisting of one (valid) character', function() {
          var tokens;
          tokens = grammar.tokenizeLine('._').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[1]).toEqual({
            value: '_',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
        });
        it('tokenises class selectors starting with an escape sequence', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.\\33\\44-model {').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '\\33',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'constant.character.escape.codepoint.css']
          });
          expect(tokens[2]).toEqual({
            value: '\\44',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'constant.character.escape.codepoint.css']
          });
          expect(tokens[3]).toEqual({
            value: '-model',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
          return expect(tokens[5]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('tokenises class selectors ending with an escape sequence', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.la\\{tex\\} {').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'la',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
          expect(tokens[2]).toEqual({
            value: '\\{',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'constant.character.escape.css']
          });
          expect(tokens[3]).toEqual({
            value: 'tex',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
          expect(tokens[4]).toEqual({
            value: '\\}',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'constant.character.escape.css']
          });
          return expect(tokens[6]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('marks a class invalid if it contains unescaped ASCII punctuation or symbols other than "-" and "_"', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.B&W{').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'B&W',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css']
          });
          return expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('marks a class invalid if it starts with ASCII digits ([0-9])', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.666{').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '666',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css']
          });
          return expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('marks a class invalid if it starts with "-" followed by ASCII digits', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.-911-{').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '-911-',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css']
          });
          return expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        return it('marks a class invalid if it consists of only one hyphen', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.-{').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '-',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css']
          });
          return expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
      });
      describe('id selectors', function() {
        it('tokenizes id selectors consisting of ASCII letters', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#unicorn').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[1]).toEqual({
            value: 'unicorn',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
        });
        it('tokenizes id selectors containing non-ASCII letters', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#洪荒之力').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[1]).toEqual({
            value: '洪荒之力',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
        });
        it('tokenizes id selectors containing [0-9], "-", or "_"', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#_zer0-day').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[1]).toEqual({
            value: '_zer0-day',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
        });
        it('tokenizes id selectors beginning with two hyphens', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#--d3bug--').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[1]).toEqual({
            value: '--d3bug--',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
        });
        it('marks an id invalid if it contains ASCII punctuation or symbols other than "-" and "_"', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#sort!{').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'sort!',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css']
          });
          return expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('marks an id invalid if it starts with ASCII digits ([0-9])', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#666{').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '666',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css']
          });
          return expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('marks an id invalid if it starts with "-" followed by ASCII digits', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#-911-{').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '-911-',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css']
          });
          return expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('marks an id invalid if it consists of one hyphen only', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#-{').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '-',
            scopes: ['source.css', 'meta.selector.css', 'invalid.illegal.bad-identifier.css']
          });
          return expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        it('tokenises ID selectors starting with an escape sequence', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#\\33\\44-model {').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '\\33',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'constant.character.escape.codepoint.css']
          });
          expect(tokens[2]).toEqual({
            value: '\\44',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'constant.character.escape.codepoint.css']
          });
          expect(tokens[3]).toEqual({
            value: '-model',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
          return expect(tokens[5]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
        return it('tokenises ID selectors ending with an escape sequence', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#la\\{tex\\} {').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'la',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
          expect(tokens[2]).toEqual({
            value: '\\{',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'constant.character.escape.css']
          });
          expect(tokens[3]).toEqual({
            value: 'tex',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
          });
          expect(tokens[4]).toEqual({
            value: '\\}',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'constant.character.escape.css']
          });
          return expect(tokens[6]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
        });
      });
      describe('namespace prefixes', function() {
        it('tokenises arbitrary namespace prefixes', function() {
          var tokens;
          tokens = grammar.tokenizeLine('foo|h1 { }').tokens;
          expect(tokens[0]).toEqual({
            value: 'foo',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[1]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.css']
          });
          expect(tokens[2]).toEqual({
            value: 'h1',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(tokens[3]).toEqual({
            value: ' ',
            scopes: ['source.css']
          });
          expect(tokens[4]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          return expect(tokens[6]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
        });
        it('tokenises anonymous namespace prefixes', function() {
          var tokens;
          tokens = grammar.tokenizeLine('*|abbr {}').tokens;
          expect(tokens[0]).toEqual({
            value: '*',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[1]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.css']
          });
          expect(tokens[2]).toEqual({
            value: 'abbr',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(tokens[3]).toEqual({
            value: ' ',
            scopes: ['source.css']
          });
          expect(tokens[4]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          expect(tokens[5]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
          tokens = grammar.tokenizeLine('*|* {}').tokens;
          expect(tokens[0]).toEqual({
            value: '*',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[1]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.css']
          });
          expect(tokens[2]).toEqual({
            value: '*',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.wildcard.css']
          });
          expect(tokens[3]).toEqual({
            value: ' ',
            scopes: ['source.css']
          });
          expect(tokens[4]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          expect(tokens[5]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
          tokens = grammar.tokenizeLine('foo|*  { }').tokens;
          expect(tokens[0]).toEqual({
            value: 'foo',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[1]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.css']
          });
          expect(tokens[2]).toEqual({
            value: '*',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.wildcard.css']
          });
          expect(tokens[4]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          expect(tokens[6]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
          tokens = grammar.tokenizeLine('|[svg|attr=name]{}').tokens;
          expect(tokens[0]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.css']
          });
          expect(tokens[1]).toEqual({
            value: '[',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
          });
          expect(tokens[2]).toEqual({
            value: 'svg',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.namespace-prefix.css']
          });
          expect(tokens[3]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.separator.css']
          });
          return expect(tokens[4]).toEqual({
            value: 'attr',
            scopes: ['source.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
          });
        });
        it('tokenises the "no-namespace" prefix', function() {
          var tokens;
          tokens = grammar.tokenizeLine('|h1   { }').tokens;
          expect(tokens[0]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.css']
          });
          expect(tokens[1]).toEqual({
            value: 'h1',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(tokens[3]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          return expect(tokens[5]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
        });
        return it("doesn't tokenise prefixes without a selector", function() {
          var tokens;
          tokens = grammar.tokenizeLine('*| { }').tokens;
          expect(tokens[0]).toEqual({
            value: '*',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.wildcard.css']
          });
          expect(tokens[1]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css']
          });
          expect(tokens[2]).toEqual({
            value: ' ',
            scopes: ['source.css']
          });
          expect(tokens[3]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          expect(tokens[5]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
          tokens = grammar.tokenizeLine('*|{ }').tokens;
          expect(tokens[0]).toEqual({
            value: '*',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.wildcard.css']
          });
          expect(tokens[1]).toEqual({
            value: '|',
            scopes: ['source.css', 'meta.selector.css']
          });
          expect(tokens[2]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          return expect(tokens[4]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
        });
      });
      describe('at-rules', function() {
        describe('@charset', function() {
          it('tokenises @charset rules at the start of a file', function() {
            var lines;
            lines = grammar.tokenizeLines('@charset "US-ASCII";');
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'charset',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css']
            });
            expect(lines[0][2]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.charset.css']
            });
            expect(lines[0][3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[0][4]).toEqual({
              value: 'US-ASCII',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css']
            });
            expect(lines[0][5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[0][6]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'punctuation.terminator.rule.css']
            });
            lines = grammar.tokenizeLines('/* Not the first line */\n@charset "UTF-8";');
            expect(lines[0][0]).toEqual({
              value: '/*',
              scopes: ['source.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[0][1]).toEqual({
              value: ' Not the first line ',
              scopes: ['source.css', 'comment.block.css']
            });
            expect(lines[0][2]).toEqual({
              value: '*/',
              scopes: ['source.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[1][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css', 'punctuation.definition.keyword.css']
            });
            return expect(lines[1][1]).toEqual({
              value: 'charset',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
            });
          });
          return it('highlights invalid @charset statements', function() {
            var lines;
            lines = grammar.tokenizeLines(" @charset 'US-ASCII';");
            expect(lines[0][0]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'invalid.illegal.leading-whitespace.charset.css']
            });
            expect(lines[0][1]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][2]).toEqual({
              value: 'charset',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css']
            });
            expect(lines[0][4]).toEqual({
              value: "'US-ASCII'",
              scopes: ['source.css', 'meta.at-rule.charset.css', 'invalid.illegal.not-double-quoted.charset.css']
            });
            expect(lines[0][5]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'punctuation.terminator.rule.css']
            });
            lines = grammar.tokenizeLines('@charset  "iso-8859-15";');
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'charset',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css']
            });
            expect(lines[0][2]).toEqual({
              value: '  ',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'invalid.illegal.whitespace.charset.css']
            });
            expect(lines[0][3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[0][4]).toEqual({
              value: 'iso-8859-15',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css']
            });
            expect(lines[0][5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[0][6]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'punctuation.terminator.rule.css']
            });
            lines = grammar.tokenizeLines('@charset"US-ASCII";');
            expect(lines[0][0]).toEqual({
              value: '@charset"US-ASCII"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'invalid.illegal.no-whitespace.charset.css']
            });
            expect(lines[0][1]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'punctuation.terminator.rule.css']
            });
            lines = grammar.tokenizeLines('@charset "UTF-8" ;');
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'charset',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css']
            });
            expect(lines[0][2]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.charset.css']
            });
            expect(lines[0][3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[0][4]).toEqual({
              value: 'UTF-8',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css']
            });
            expect(lines[0][5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[0][6]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'invalid.illegal.unexpected-characters.charset.css']
            });
            expect(lines[0][7]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'punctuation.terminator.rule.css']
            });
            lines = grammar.tokenizeLines('@charset "WTF-8" /* Nope */ ;');
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'charset',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css']
            });
            expect(lines[0][2]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.charset.css']
            });
            expect(lines[0][3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[0][4]).toEqual({
              value: 'WTF-8',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css']
            });
            expect(lines[0][5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[0][6]).toEqual({
              value: ' /* Nope */ ',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'invalid.illegal.unexpected-characters.charset.css']
            });
            expect(lines[0][7]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'punctuation.terminator.rule.css']
            });
            lines = grammar.tokenizeLines('@charset "UTF-8');
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'charset',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'keyword.control.at-rule.charset.css']
            });
            expect(lines[0][2]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.charset.css']
            });
            expect(lines[0][3]).toEqual({
              value: '"UTF-8',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'invalid.illegal.unclosed-string.charset.css']
            });
            lines = grammar.tokenizeLines("@CHARSET 'US-ASCII';");
            expect(lines[0][0]).toEqual({
              value: '@CHARSET',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'invalid.illegal.not-lowercase.charset.css']
            });
            expect(lines[0][1]).toEqual({
              value: " 'US-ASCII'",
              scopes: ['source.css', 'meta.at-rule.charset.css']
            });
            return expect(lines[0][2]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.charset.css', 'punctuation.terminator.rule.css']
            });
          });
        });
        describe('@import', function() {
          it('tokenises @import statements', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@import url("file.css");').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(tokens[3]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(tokens[4]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[6]).toEqual({
              value: 'file.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css']
            });
            expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[8]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[9]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
            tokens = grammar.tokenizeLine('@import "file.css";').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(tokens[3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[4]).toEqual({
              value: 'file.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[6]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
            tokens = grammar.tokenizeLine("@import 'file.css';").tokens;
            expect(tokens[3]).toEqual({
              value: "'",
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[4]).toEqual({
              value: 'file.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.single.css']
            });
            return expect(tokens[5]).toEqual({
              value: "'",
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
            });
          });
          it("doesn't let injected comments impact parameter matching", function() {
            var tokens;
            tokens = grammar.tokenizeLine('@import /* url("name"); */ "1.css";').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(tokens[3]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[4]).toEqual({
              value: ' url("name"); ',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css']
            });
            expect(tokens[5]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[8]).toEqual({
              value: '1.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css']
            });
            expect(tokens[9]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[10]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
            tokens = grammar.tokenizeLine('@import/* Comment */"2.css";').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(tokens[2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[3]).toEqual({
              value: ' Comment ',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css']
            });
            expect(tokens[4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[6]).toEqual({
              value: '2.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css']
            });
            expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            return expect(tokens[8]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
          });
          it('correctly handles word boundaries', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@import"file.css";').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(tokens[2]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[3]).toEqual({
              value: 'file.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css']
            });
            expect(tokens[4]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[5]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
            tokens = grammar.tokenizeLine('@import-file.css;').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import-file',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
            });
            expect(tokens[2]).toEqual({
              value: '.css',
              scopes: ['source.css', 'meta.at-rule.header.css']
            });
            return expect(tokens[3]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.header.css', 'punctuation.terminator.rule.css']
            });
          });
          it('matches a URL that starts on the next line', function() {
            var lines;
            lines = grammar.tokenizeLines('@import\nurl("file.css");');
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(lines[0][2]).toEqual({
              value: '',
              scopes: ['source.css', 'meta.at-rule.import.css']
            });
            expect(lines[1][0]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(lines[1][1]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[1][2]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[1][3]).toEqual({
              value: 'file.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css']
            });
            expect(lines[1][4]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[1][5]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            return expect(lines[1][6]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
          });
          it('matches comments inside query lists', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@import url("1.css") print /* url(";"); */ all;').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(tokens[3]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(tokens[4]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[6]).toEqual({
              value: '1.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css']
            });
            expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[8]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[10]).toEqual({
              value: 'print',
              scopes: ['source.css', 'meta.at-rule.import.css', 'support.constant.media.css']
            });
            expect(tokens[12]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[13]).toEqual({
              value: ' url(";"); ',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css']
            });
            expect(tokens[14]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[16]).toEqual({
              value: 'all',
              scopes: ['source.css', 'meta.at-rule.import.css', 'support.constant.media.css']
            });
            return expect(tokens[17]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
          });
          it('highlights deprecated media types', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@import "astral.css" projection;').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(tokens[3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[4]).toEqual({
              value: 'astral.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[7]).toEqual({
              value: 'projection',
              scopes: ['source.css', 'meta.at-rule.import.css', 'invalid.deprecated.constant.media.css']
            });
            return expect(tokens[8]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
          });
          return it('highlights media features in query lists', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@import url(\'landscape.css\') screen and (orientation:landscape);').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
            });
            expect(tokens[3]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(tokens[4]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[5]).toEqual({
              value: '\'',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[6]).toEqual({
              value: 'landscape.css',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.single.css']
            });
            expect(tokens[7]).toEqual({
              value: '\'',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[8]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[10]).toEqual({
              value: 'screen',
              scopes: ['source.css', 'meta.at-rule.import.css', 'support.constant.media.css']
            });
            expect(tokens[12]).toEqual({
              value: 'and',
              scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.operator.logical.and.media.css']
            });
            expect(tokens[14]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[15]).toEqual({
              value: 'orientation',
              scopes: ['source.css', 'meta.at-rule.import.css', 'support.type.property-name.media.css']
            });
            expect(tokens[16]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[17]).toEqual({
              value: 'landscape',
              scopes: ['source.css', 'meta.at-rule.import.css', 'support.constant.property-value.css']
            });
            expect(tokens[18]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            return expect(tokens[19]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
            });
          });
        });
        describe('@media', function() {
          it('tokenises @media keywords correctly', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@media(max-width: 37.5em) { }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[3]).toEqual({
              value: 'max-width',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
            });
            expect(tokens[4]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[6]).toEqual({
              value: '37.5',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
            });
            expect(tokens[7]).toEqual({
              value: 'em',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
            });
            expect(tokens[8]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            expect(tokens[9]).toEqual({
              value: ' ',
              scopes: ['source.css']
            });
            expect(tokens[10]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            expect(tokens[12]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('@media not print and (max-width: 37.5em){ }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[3]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.not.media.css']
            });
            expect(tokens[5]).toEqual({
              value: 'print',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
            });
            expect(tokens[7]).toEqual({
              value: 'and',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.and.media.css']
            });
            expect(tokens[9]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[10]).toEqual({
              value: 'max-width',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
            });
            expect(tokens[11]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[13]).toEqual({
              value: '37.5',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
            });
            expect(tokens[14]).toEqual({
              value: 'em',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
            });
            expect(tokens[15]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            expect(tokens[16]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            return expect(tokens[18]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
            });
          });
          it('highlights deprecated media types', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@media (max-device-width: 2px){ }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: 'max-device-width',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
            });
            expect(tokens[5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[7]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
            });
            expect(tokens[8]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(tokens[9]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            expect(tokens[10]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            return expect(tokens[12]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
            });
          });
          it('highlights vendored media features', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@media (-webkit-foo: bar){ b{ } }').tokens;
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: '-webkit-foo',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.vendored.property-name.media.css']
            });
            expect(tokens[5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[6]).toEqual({
              value: ' bar',
              scopes: ['source.css', 'meta.at-rule.media.header.css']
            });
            expect(tokens[7]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            expect(tokens[8]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('@media screen and (-ms-high-contrast:black-on-white){ }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[3]).toEqual({
              value: 'screen',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
            });
            expect(tokens[5]).toEqual({
              value: 'and',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.and.media.css']
            });
            expect(tokens[7]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[8]).toEqual({
              value: '-ms-high-contrast',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.vendored.property-name.media.css']
            });
            expect(tokens[9]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[10]).toEqual({
              value: 'black-on-white',
              scopes: ['source.css', 'meta.at-rule.media.header.css']
            });
            expect(tokens[11]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            expect(tokens[12]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            expect(tokens[14]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('@media (_moz-a:b){}').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: '_moz-a',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.vendored.property-name.media.css']
            });
            expect(tokens[5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[6]).toEqual({
              value: 'b',
              scopes: ['source.css', 'meta.at-rule.media.header.css']
            });
            expect(tokens[7]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            tokens = grammar.tokenizeLine('@media (-hp-foo:bar){}').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: '-hp-foo',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.vendored.property-name.media.css']
            });
            expect(tokens[5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[6]).toEqual({
              value: 'bar',
              scopes: ['source.css', 'meta.at-rule.media.header.css']
            });
            expect(tokens[7]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            tokens = grammar.tokenizeLine('@media (mso-page-size:wide){}').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: 'mso-page-size',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.vendored.property-name.media.css']
            });
            expect(tokens[5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[6]).toEqual({
              value: 'wide',
              scopes: ['source.css', 'meta.at-rule.media.header.css']
            });
            return expect(tokens[7]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
          });
          it('tokenises @media immediately following a closing brace', function() {
            var tokens;
            tokens = grammar.tokenizeLine('h1 { }@media only screen { } h2 { }').tokens;
            expect(tokens[0]).toEqual({
              value: 'h1',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[4]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(tokens[5]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[6]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[8]).toEqual({
              value: 'only',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.only.media.css']
            });
            expect(tokens[10]).toEqual({
              value: 'screen',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
            });
            expect(tokens[12]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            expect(tokens[14]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
            });
            expect(tokens[16]).toEqual({
              value: 'h2',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[18]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[20]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('h1 { }@media only screen { }h2 { }').tokens;
            expect(tokens[0]).toEqual({
              value: 'h1',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[4]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(tokens[5]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[6]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[8]).toEqual({
              value: 'only',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.only.media.css']
            });
            expect(tokens[10]).toEqual({
              value: 'screen',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
            });
            expect(tokens[12]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            expect(tokens[14]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
            });
            expect(tokens[15]).toEqual({
              value: 'h2',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[17]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            return expect(tokens[19]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
          it('tokenises level 4 media-query syntax', function() {
            var lines;
            lines = grammar.tokenizeLines("@media (min-width >= 0px)\n   and (max-width <= 400)\n   and (min-height > 400)\n   and (max-height < 200)");
            expect(lines[0][6]).toEqual({
              value: '>=',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.comparison.css']
            });
            expect(lines[1][6]).toEqual({
              value: '<=',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.comparison.css']
            });
            expect(lines[2][6]).toEqual({
              value: '>',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.comparison.css']
            });
            return expect(lines[3][6]).toEqual({
              value: '<',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.comparison.css']
            });
          });
          it('tokenises comments between media types', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@media/* */only/* */screen/* */and (min-width:1100px){}').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[5]).toEqual({
              value: 'only',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.only.media.css']
            });
            expect(tokens[6]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[8]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[9]).toEqual({
              value: 'screen',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
            });
            expect(tokens[10]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[12]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[13]).toEqual({
              value: 'and',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.and.media.css']
            });
            expect(tokens[15]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[16]).toEqual({
              value: 'min-width',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
            });
            expect(tokens[17]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[18]).toEqual({
              value: '1100',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
            });
            expect(tokens[19]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(tokens[20]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            expect(tokens[21]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            return expect(tokens[22]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
            });
          });
          return it('tokenises comments between media features', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@media/*=*/(max-width:/**/37.5em)/*=*/and/*=*/(/*=*/min-height/*:*/:/*=*/1.2em/*;*/){}').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'media',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
            });
            expect(tokens[2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[3]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
            });
            expect(tokens[4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[5]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[6]).toEqual({
              value: 'max-width',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
            });
            expect(tokens[7]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[8]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[9]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[10]).toEqual({
              value: '37.5',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
            });
            expect(tokens[11]).toEqual({
              value: 'em',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
            });
            expect(tokens[12]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            expect(tokens[13]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[14]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
            });
            expect(tokens[15]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[16]).toEqual({
              value: 'and',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.and.media.css']
            });
            expect(tokens[17]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[18]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
            });
            expect(tokens[19]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[20]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
            });
            expect(tokens[21]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[22]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
            });
            expect(tokens[23]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[24]).toEqual({
              value: 'min-height',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
            });
            expect(tokens[25]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[26]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
            });
            expect(tokens[27]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[28]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[29]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[30]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
            });
            expect(tokens[31]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[32]).toEqual({
              value: '1.2',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
            });
            expect(tokens[33]).toEqual({
              value: 'em',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
            });
            expect(tokens[34]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[35]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
            });
            expect(tokens[36]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[37]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
            });
            expect(tokens[38]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
            });
            return expect(tokens[39]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
            });
          });
        });
        it('matches media queries across lines', function() {
          var lines;
          lines = grammar.tokenizeLines("@media only screen and (min-width : /* 40 */\n  320px),\n  not print and (max-width: 480px)  /* kek */ and (-webkit-min-device-pixel-ratio /*:*/ : 2),\nonly speech and (min-width: 10em),  /* wat */     (-webkit-min-device-pixel-ratio: 2) { }");
          expect(lines[0][0]).toEqual({
            value: '@',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
          });
          expect(lines[0][1]).toEqual({
            value: 'media',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
          });
          expect(lines[0][3]).toEqual({
            value: 'only',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.only.media.css']
          });
          expect(lines[0][5]).toEqual({
            value: 'screen',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
          });
          expect(lines[0][7]).toEqual({
            value: 'and',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.and.media.css']
          });
          expect(lines[0][9]).toEqual({
            value: '(',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
          });
          expect(lines[0][10]).toEqual({
            value: 'min-width',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
          });
          expect(lines[0][12]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
          });
          expect(lines[0][14]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[0][15]).toEqual({
            value: ' 40 ',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
          });
          expect(lines[0][16]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[1][1]).toEqual({
            value: '320',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
          });
          expect(lines[1][2]).toEqual({
            value: 'px',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
          });
          expect(lines[1][3]).toEqual({
            value: ')',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
          });
          expect(lines[1][4]).toEqual({
            value: ',',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.list.comma.css']
          });
          expect(lines[2][1]).toEqual({
            value: 'not',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.not.media.css']
          });
          expect(lines[2][3]).toEqual({
            value: 'print',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
          });
          expect(lines[2][5]).toEqual({
            value: 'and',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.and.media.css']
          });
          expect(lines[2][7]).toEqual({
            value: '(',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
          });
          expect(lines[2][8]).toEqual({
            value: 'max-width',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
          });
          expect(lines[2][9]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
          });
          expect(lines[2][11]).toEqual({
            value: '480',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
          });
          expect(lines[2][12]).toEqual({
            value: 'px',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
          });
          expect(lines[2][13]).toEqual({
            value: ')',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
          });
          expect(lines[2][15]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[2][16]).toEqual({
            value: ' kek ',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
          });
          expect(lines[2][17]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[2][19]).toEqual({
            value: 'and',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.and.media.css']
          });
          expect(lines[2][21]).toEqual({
            value: '(',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
          });
          expect(lines[2][22]).toEqual({
            value: '-webkit-min-device-pixel-ratio',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.vendored.property-name.media.css']
          });
          expect(lines[2][24]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[2][25]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
          });
          expect(lines[2][26]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[2][28]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
          });
          expect(lines[2][30]).toEqual({
            value: '2',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
          });
          expect(lines[2][31]).toEqual({
            value: ')',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
          });
          expect(lines[2][32]).toEqual({
            value: ',',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.list.comma.css']
          });
          expect(lines[3][0]).toEqual({
            value: 'only',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.only.media.css']
          });
          expect(lines[3][2]).toEqual({
            value: 'speech',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
          });
          expect(lines[3][4]).toEqual({
            value: 'and',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.operator.logical.and.media.css']
          });
          expect(lines[3][6]).toEqual({
            value: '(',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
          });
          expect(lines[3][7]).toEqual({
            value: 'min-width',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
          });
          expect(lines[3][8]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
          });
          expect(lines[3][10]).toEqual({
            value: '10',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
          });
          expect(lines[3][11]).toEqual({
            value: 'em',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
          });
          expect(lines[3][12]).toEqual({
            value: ')',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
          });
          expect(lines[3][13]).toEqual({
            value: ',',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.list.comma.css']
          });
          expect(lines[3][15]).toEqual({
            value: '/*',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
          });
          expect(lines[3][16]).toEqual({
            value: ' wat ',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
          });
          expect(lines[3][17]).toEqual({
            value: '*/',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
          });
          expect(lines[3][19]).toEqual({
            value: '(',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
          });
          expect(lines[3][20]).toEqual({
            value: '-webkit-min-device-pixel-ratio',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.vendored.property-name.media.css']
          });
          expect(lines[3][21]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
          });
          expect(lines[3][23]).toEqual({
            value: '2',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
          });
          expect(lines[3][24]).toEqual({
            value: ')',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
          });
          expect(lines[3][26]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
          });
          return expect(lines[3][28]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
          });
        });
        it('highlights invalid commas', function() {
          var tokens;
          tokens = grammar.tokenizeLine('@media , {}').tokens;
          expect(tokens[0]).toEqual({
            value: '@',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
          });
          expect(tokens[1]).toEqual({
            value: 'media',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
          });
          expect(tokens[3]).toEqual({
            value: ',',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'invalid.illegal.comma.css']
          });
          expect(tokens[5]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
          });
          expect(tokens[6]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
          });
          tokens = grammar.tokenizeLine('@media , ,screen {}').tokens;
          expect(tokens[0]).toEqual({
            value: '@',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
          });
          expect(tokens[1]).toEqual({
            value: 'media',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
          });
          expect(tokens[3]).toEqual({
            value: ', ,',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'invalid.illegal.comma.css']
          });
          expect(tokens[4]).toEqual({
            value: 'screen',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.constant.media.css']
          });
          expect(tokens[6]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.begin.bracket.curly.css']
          });
          return expect(tokens[7]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.at-rule.media.body.css', 'punctuation.section.media.end.bracket.curly.css']
          });
        });
        it('allows spaces inside ratio values', function() {
          var tokens;
          tokens = grammar.tokenizeLine('@media (min-aspect-ratio: 3 / 4) and (max-aspect-ratio: 20   /   17) {}').tokens;
          expect(tokens[7]).toEqual({
            value: '3',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css', 'constant.numeric.css']
          });
          expect(tokens[8]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css']
          });
          expect(tokens[9]).toEqual({
            value: '/',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css', 'keyword.operator.arithmetic.css']
          });
          expect(tokens[10]).toEqual({
            value: ' ',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css']
          });
          expect(tokens[11]).toEqual({
            value: '4',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css', 'constant.numeric.css']
          });
          expect(tokens[20]).toEqual({
            value: '20',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css', 'constant.numeric.css']
          });
          expect(tokens[21]).toEqual({
            value: '   ',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css']
          });
          expect(tokens[22]).toEqual({
            value: '/',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css', 'keyword.operator.arithmetic.css']
          });
          expect(tokens[23]).toEqual({
            value: '   ',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css']
          });
          return expect(tokens[24]).toEqual({
            value: '17',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'meta.ratio.css', 'constant.numeric.css']
          });
        });
        describe('@keyframes', function() {
          it('tokenises keyframe lists correctly', function() {
            var lines;
            lines = grammar.tokenizeLines("@keyframes important1 {\n  from { margin-top: 50px;\n         margin-bottom: 100px }\n  50%  { margin-top: 150px !important; } /* Ignored */\n  to   { margin-top: 100px; }\n}");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'keyframes',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css']
            });
            expect(lines[0][3]).toEqual({
              value: 'important1',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'variable.parameter.keyframe-list.css']
            });
            expect(lines[0][4]).toEqual({
              value: ' ',
              scopes: ['source.css']
            });
            expect(lines[0][5]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'punctuation.section.keyframes.begin.bracket.curly.css']
            });
            expect(lines[1][1]).toEqual({
              value: 'from',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.css']
            });
            expect(lines[1][3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[1][5]).toEqual({
              value: 'margin-top',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[1][6]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[1][8]).toEqual({
              value: '50',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[1][9]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[1][10]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'margin-bottom',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[2][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[2][4]).toEqual({
              value: '100',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[2][5]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[2][7]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[3][1]).toEqual({
              value: '50%',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.percentage.css']
            });
            expect(lines[3][3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[3][5]).toEqual({
              value: 'margin-top',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[3][6]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[3][8]).toEqual({
              value: '150',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[3][9]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[3][11]).toEqual({
              value: '!important',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'keyword.other.important.css']
            });
            expect(lines[3][12]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[3][14]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[3][16]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[3][17]).toEqual({
              value: ' Ignored ',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'comment.block.css']
            });
            expect(lines[3][18]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[4][1]).toEqual({
              value: 'to',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.css']
            });
            expect(lines[4][3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[4][5]).toEqual({
              value: 'margin-top',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[4][6]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[4][8]).toEqual({
              value: '100',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[4][9]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[4][10]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[4][12]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            return expect(lines[5][0]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'punctuation.section.keyframes.end.bracket.curly.css']
            });
          });
          it('matches injected comments', function() {
            var lines;
            lines = grammar.tokenizeLines("@keyframes/*{*/___IDENT__/*}\n  { Nah { margin-top: 2em; }\n*/{ from");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'keyframes',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css']
            });
            expect(lines[0][2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[0][3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'comment.block.css']
            });
            expect(lines[0][4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[0][5]).toEqual({
              value: '___IDENT__',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'variable.parameter.keyframe-list.css']
            });
            expect(lines[0][6]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[0][7]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'comment.block.css']
            });
            expect(lines[1][0]).toEqual({
              value: '  { Nah { margin-top: 2em; }',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'comment.block.css']
            });
            expect(lines[2][0]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[2][1]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'punctuation.section.keyframes.begin.bracket.curly.css']
            });
            return expect(lines[2][3]).toEqual({
              value: 'from',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.css']
            });
          });
          it('matches offset keywords case-insensitively', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@keyframes Give-them-both { fROm { } To {} }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'keyframes',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css']
            });
            expect(tokens[3]).toEqual({
              value: 'Give-them-both',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'variable.parameter.keyframe-list.css']
            });
            expect(tokens[4]).toEqual({
              value: ' ',
              scopes: ['source.css']
            });
            expect(tokens[5]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'punctuation.section.keyframes.begin.bracket.curly.css']
            });
            expect(tokens[7]).toEqual({
              value: 'fROm',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.css']
            });
            expect(tokens[9]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[11]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(tokens[13]).toEqual({
              value: 'To',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.css']
            });
            expect(tokens[15]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[16]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            return expect(tokens[18]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'punctuation.section.keyframes.end.bracket.curly.css']
            });
          });
          it('matches percentile offsets', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@keyframes identifier { -50.2% } @keyframes ident2 { .25%}').tokens;
            expect(tokens[7]).toEqual({
              value: '-50.2%',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.percentage.css']
            });
            return expect(tokens[18]).toEqual({
              value: '.25%',
              scopes: ['source.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.percentage.css']
            });
          });
          return it('highlights escape sequences inside identifiers', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@keyframes A\\1F602Z').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'keyframes',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css']
            });
            expect(tokens[3]).toEqual({
              value: 'A',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'variable.parameter.keyframe-list.css']
            });
            expect(tokens[4]).toEqual({
              value: '\\1F602',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'variable.parameter.keyframe-list.css', 'constant.character.escape.codepoint.css']
            });
            return expect(tokens[5]).toEqual({
              value: 'Z',
              scopes: ['source.css', 'meta.at-rule.keyframes.header.css', 'variable.parameter.keyframe-list.css']
            });
          });
        });
        describe('@supports', function() {
          it('tokenises feature queries', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@supports (font-size: 1em) { }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'supports',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css']
            });
            expect(tokens[2]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.supports.header.css']
            });
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: 'font-size',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[7]).toEqual({
              value: '1',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(tokens[8]).toEqual({
              value: 'em',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
            });
            expect(tokens[9]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(tokens[10]).toEqual({
              value: ' ',
              scopes: ['source.css']
            });
            expect(tokens[11]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.begin.bracket.curly.css']
            });
            return expect(tokens[13]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.end.bracket.curly.css']
            });
          });
          it('matches logical operators', function() {
            var lines;
            lines = grammar.tokenizeLines("@supports not (font-size: 1em){ }\n@supports (font-size: 1em) and (font-size: 1em){ }\n@supports (font-size: 1em) or (font-size: 1em){ }");
            expect(lines[0][3]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.not.css']
            });
            expect(lines[1][11]).toEqual({
              value: 'and',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.and.css']
            });
            return expect(lines[2][11]).toEqual({
              value: 'or',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.or.css']
            });
          });
          it('matches custom variables in feature queries', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@supports (--foo: green){}').tokens;
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: '--foo',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'variable.css']
            });
            expect(tokens[5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[7]).toEqual({
              value: 'green',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.color.w3c-standard-color-name.css']
            });
            return expect(tokens[8]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
          });
          it("doesn't mistake brackets in string literals for feature queries", function() {
            var lines;
            lines = grammar.tokenizeLines("@supports not ((tab-size:4) or (-moz-tab-size:4)){\n  body::before{content: \"Come on, Microsoft (Get it together already)…\"; }\n}");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'supports',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css']
            });
            expect(lines[0][3]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.not.css']
            });
            expect(lines[0][7]).toEqual({
              value: 'tab-size',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[0][12]).toEqual({
              value: 'or',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'keyword.operator.logical.feature.or.css']
            });
            expect(lines[0][15]).toEqual({
              value: '-moz-tab-size',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.vendored.property-name.css']
            });
            expect(lines[0][20]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.begin.bracket.curly.css']
            });
            expect(lines[1][1]).toEqual({
              value: 'body',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(lines[1][2]).toEqual({
              value: '::',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
            });
            expect(lines[1][3]).toEqual({
              value: 'before',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
            });
            expect(lines[1][4]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[1][5]).toEqual({
              value: 'content',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[1][6]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[1][8]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[1][9]).toEqual({
              value: 'Come on, Microsoft (Get it together already)…',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']
            });
            expect(lines[1][10]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[1][11]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[1][13]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            return expect(lines[2][0]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.end.bracket.curly.css']
            });
          });
          it('tokenises multiple feature queries', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@supports (display:table-cell) or ((display:list-item) and (display:run-in)){').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'supports',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css']
            });
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: 'display',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[6]).toEqual({
              value: 'table-cell',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(tokens[7]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(tokens[9]).toEqual({
              value: 'or',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.or.css']
            });
            expect(tokens[11]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(tokens[12]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(tokens[13]).toEqual({
              value: 'display',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[14]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[15]).toEqual({
              value: 'list-item',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(tokens[16]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(tokens[18]).toEqual({
              value: 'and',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'keyword.operator.logical.feature.and.css']
            });
            expect(tokens[20]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(tokens[21]).toEqual({
              value: 'display',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[22]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[23]).toEqual({
              value: 'run-in',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(tokens[24]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(tokens[25]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            return expect(tokens[26]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.begin.bracket.curly.css']
            });
          });
          it('embeds rulesets and other at-rules', function() {
            var lines;
            lines = grammar.tokenizeLines("@supports (animation-name: test) {\n  #node {\n    animation-name: test;\n  }\n  body > header[data-name=\"attr\"] ~ *:not(:first-child){\n    content: \"😂👌\"\n  }\n  @keyframes important1 {\n    from {\n      margin-top: 50px;\n      margin-bottom: 100px\n    }\n    50%  { margin-top: 150px !important; } /* Ignored */\n    to   { margin-top: 100px; }\n  }\n}");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'supports',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css']
            });
            expect(lines[0][3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(lines[0][4]).toEqual({
              value: 'animation-name',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[0][5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[0][7]).toEqual({
              value: 'test',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css']
            });
            expect(lines[0][8]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(lines[0][10]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.begin.bracket.curly.css']
            });
            expect(lines[1][1]).toEqual({
              value: '#',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.id.css', 'punctuation.definition.entity.css']
            });
            expect(lines[1][2]).toEqual({
              value: 'node',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.id.css']
            });
            expect(lines[1][4]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'animation-name',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[2][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[2][4]).toEqual({
              value: 'test',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-value.css']
            });
            expect(lines[2][5]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[3][1]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[4][1]).toEqual({
              value: 'body',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(lines[4][3]).toEqual({
              value: '>',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'keyword.operator.combinator.css']
            });
            expect(lines[4][5]).toEqual({
              value: 'header',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(lines[4][6]).toEqual({
              value: '[',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.begin.bracket.square.css']
            });
            expect(lines[4][7]).toEqual({
              value: 'data-name',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'meta.attribute-selector.css', 'entity.other.attribute-name.css']
            });
            expect(lines[4][8]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'meta.attribute-selector.css', 'keyword.operator.pattern.css']
            });
            expect(lines[4][9]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[4][10]).toEqual({
              value: 'attr',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css']
            });
            expect(lines[4][11]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'meta.attribute-selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[4][12]).toEqual({
              value: ']',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'meta.attribute-selector.css', 'punctuation.definition.entity.end.bracket.square.css']
            });
            expect(lines[4][14]).toEqual({
              value: '~',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'keyword.operator.combinator.css']
            });
            expect(lines[4][16]).toEqual({
              value: '*',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.name.tag.wildcard.css']
            });
            expect(lines[4][17]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(lines[4][18]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(lines[4][19]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[4][20]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(lines[4][21]).toEqual({
              value: 'first-child',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(lines[4][22]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[4][23]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[5][1]).toEqual({
              value: 'content',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[5][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[5][4]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[5][5]).toEqual({
              value: '😂👌',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']
            });
            expect(lines[5][6]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[6][1]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[7][1]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[7][2]).toEqual({
              value: 'keyframes',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.header.css', 'keyword.control.at-rule.keyframes.css']
            });
            expect(lines[7][4]).toEqual({
              value: 'important1',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.header.css', 'variable.parameter.keyframe-list.css']
            });
            expect(lines[7][6]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'punctuation.section.keyframes.begin.bracket.curly.css']
            });
            expect(lines[8][1]).toEqual({
              value: 'from',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.css']
            });
            expect(lines[8][3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[9][1]).toEqual({
              value: 'margin-top',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[9][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[9][4]).toEqual({
              value: '50',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[9][5]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[9][6]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[10][1]).toEqual({
              value: 'margin-bottom',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[10][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[10][4]).toEqual({
              value: '100',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[10][5]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[11][1]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[12][1]).toEqual({
              value: '50%',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.percentage.css']
            });
            expect(lines[12][3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[12][5]).toEqual({
              value: 'margin-top',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[12][6]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[12][8]).toEqual({
              value: '150',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[12][9]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[12][11]).toEqual({
              value: '!important',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'keyword.other.important.css']
            });
            expect(lines[12][12]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[12][14]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[12][16]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[12][17]).toEqual({
              value: ' Ignored ',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'comment.block.css']
            });
            expect(lines[12][18]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[13][1]).toEqual({
              value: 'to',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'entity.other.keyframe-offset.css']
            });
            expect(lines[13][3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[13][5]).toEqual({
              value: 'margin-top',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[13][6]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[13][8]).toEqual({
              value: '100',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[13][9]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[13][10]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[13][12]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[14][1]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.at-rule.keyframes.body.css', 'punctuation.section.keyframes.end.bracket.curly.css']
            });
            return expect(lines[15][0]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.end.bracket.curly.css']
            });
          });
          it('matches injected comments', function() {
            var lines;
            lines = grammar.tokenizeLines("@supports/*===*/not/*==****************|\n==*/(display:table-cell)/*============*/ and (display: list-item)/*}*/{}");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'supports',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css']
            });
            expect(lines[0][2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[0][3]).toEqual({
              value: '===',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css']
            });
            expect(lines[0][4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[0][5]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.not.css']
            });
            expect(lines[0][6]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[0][7]).toEqual({
              value: '==****************|',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css']
            });
            expect(lines[1][0]).toEqual({
              value: '==',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css']
            });
            expect(lines[1][1]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[1][2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(lines[1][3]).toEqual({
              value: 'display',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[1][4]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[1][5]).toEqual({
              value: 'table-cell',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(lines[1][6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(lines[1][7]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[1][8]).toEqual({
              value: '============',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css']
            });
            expect(lines[1][9]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[1][11]).toEqual({
              value: 'and',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.and.css']
            });
            expect(lines[1][13]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(lines[1][19]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[1][20]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css']
            });
            expect(lines[1][21]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[1][22]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.begin.bracket.curly.css']
            });
            return expect(lines[1][23]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.end.bracket.curly.css']
            });
          });
          return it('matches feature queries across multiple lines', function() {
            var lines;
            lines = grammar.tokenizeLines("@supports\n  (box-shadow: 0 0 2px rgba(0,0,0,.5) inset) or\n  (-moz-box-shadow: 0 0 2px black inset) or\n  (-webkit-box-shadow: 0 0 2px black inset) or\n  (-o-box-shadow: 0 0 2px black inset)\n{ .noticebox { } }");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'supports',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.control.at-rule.supports.css']
            });
            expect(lines[1][1]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(lines[1][2]).toEqual({
              value: 'box-shadow',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[1][3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[1][5]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[1][7]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[1][9]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[1][10]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[1][12]).toEqual({
              value: 'rgba',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']
            });
            expect(lines[1][13]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[1][14]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
            });
            expect(lines[1][15]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
            });
            expect(lines[1][16]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
            });
            expect(lines[1][17]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
            });
            expect(lines[1][18]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
            });
            expect(lines[1][19]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
            });
            expect(lines[1][20]).toEqual({
              value: '.5',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
            });
            expect(lines[1][21]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[1][23]).toEqual({
              value: 'inset',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(lines[1][24]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(lines[1][26]).toEqual({
              value: 'or',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.or.css']
            });
            expect(lines[2][1]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(lines[2][2]).toEqual({
              value: '-moz-box-shadow',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.vendored.property-name.css']
            });
            expect(lines[2][3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[2][5]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[2][7]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[2][9]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[2][10]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[2][12]).toEqual({
              value: 'black',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.color.w3c-standard-color-name.css']
            });
            expect(lines[2][14]).toEqual({
              value: 'inset',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(lines[2][15]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(lines[2][17]).toEqual({
              value: 'or',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.or.css']
            });
            expect(lines[3][1]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(lines[3][2]).toEqual({
              value: '-webkit-box-shadow',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.vendored.property-name.css']
            });
            expect(lines[3][3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[3][5]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[3][7]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[3][9]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[3][10]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[3][12]).toEqual({
              value: 'black',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.color.w3c-standard-color-name.css']
            });
            expect(lines[3][14]).toEqual({
              value: 'inset',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(lines[3][15]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(lines[3][17]).toEqual({
              value: 'or',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'keyword.operator.logical.feature.or.css']
            });
            expect(lines[4][1]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.begin.bracket.round.css']
            });
            expect(lines[4][2]).toEqual({
              value: '-o-box-shadow',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-name.css', 'support.type.vendored.property-name.css']
            });
            expect(lines[4][3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[4][5]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[4][7]).toEqual({
              value: '0',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[4][9]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[4][10]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(lines[4][12]).toEqual({
              value: 'black',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.color.w3c-standard-color-name.css']
            });
            expect(lines[4][14]).toEqual({
              value: 'inset',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(lines[4][15]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.supports.header.css', 'meta.feature-query.css', 'punctuation.definition.condition.end.bracket.round.css']
            });
            expect(lines[5][0]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.begin.bracket.curly.css']
            });
            expect(lines[5][2]).toEqual({
              value: '.',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
            });
            expect(lines[5][3]).toEqual({
              value: 'noticebox',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
            });
            expect(lines[5][5]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[5][7]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            return expect(lines[5][9]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.supports.body.css', 'punctuation.section.supports.end.bracket.curly.css']
            });
          });
        });
        describe('@namespace', function() {
          it('tokenises @namespace statements correctly', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@namespace "XML";').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'namespace',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
            });
            expect(tokens[2]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.namespace.css']
            });
            expect(tokens[3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[4]).toEqual({
              value: 'XML',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[6]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'punctuation.terminator.rule.css']
            });
            tokens = grammar.tokenizeLine('@namespace  prefix  "XML"  ;').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'namespace',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
            });
            expect(tokens[2]).toEqual({
              value: '  ',
              scopes: ['source.css', 'meta.at-rule.namespace.css']
            });
            expect(tokens[3]).toEqual({
              value: 'prefix',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'entity.name.function.namespace-prefix.css']
            });
            expect(tokens[4]).toEqual({
              value: '  ',
              scopes: ['source.css', 'meta.at-rule.namespace.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[6]).toEqual({
              value: 'XML',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css']
            });
            expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[8]).toEqual({
              value: '  ',
              scopes: ['source.css', 'meta.at-rule.namespace.css']
            });
            expect(tokens[9]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'punctuation.terminator.rule.css']
            });
            tokens = grammar.tokenizeLine('@namespace url("http://a.bc/");').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'namespace',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
            });
            expect(tokens[2]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.namespace.css']
            });
            expect(tokens[3]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(tokens[4]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[6]).toEqual({
              value: 'http://a.bc/',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css']
            });
            expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[8]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            return expect(tokens[9]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'punctuation.terminator.rule.css']
            });
          });
          it("doesn't confuse a prefix of 'url' as a function", function() {
            var tokens;
            tokens = grammar.tokenizeLine('@namespace url url("http://a.bc/");').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'namespace',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
            });
            expect(tokens[3]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'entity.name.function.namespace-prefix.css']
            });
            expect(tokens[5]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(tokens[6]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[8]).toEqual({
              value: 'http://a.bc/',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css']
            });
            expect(tokens[9]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[10]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            return expect(tokens[11]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'punctuation.terminator.rule.css']
            });
          });
          it('permits injected comments between tokens', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@namespace/*=*/pre/*=*/"url"/*=*/;').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'namespace',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
            });
            expect(tokens[2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[3]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css']
            });
            expect(tokens[4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[5]).toEqual({
              value: 'pre',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'entity.name.function.namespace-prefix.css']
            });
            expect(tokens[6]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[7]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css']
            });
            expect(tokens[8]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[9]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[10]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css']
            });
            expect(tokens[11]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[12]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[13]).toEqual({
              value: '=',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css']
            });
            expect(tokens[14]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            return expect(tokens[15]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'punctuation.terminator.rule.css']
            });
          });
          it('allows no spaces between "@namespace" and quoted URLs', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@namespace"XML";').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'namespace',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
            });
            expect(tokens[2]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[3]).toEqual({
              value: 'XML',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css']
            });
            expect(tokens[4]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            return expect(tokens[5]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'punctuation.terminator.rule.css']
            });
          });
          it('tokenises escape sequences in prefixes', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@namespace pre\\ fix "http://url/";').tokens;
            expect(tokens[3]).toEqual({
              value: 'pre',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'entity.name.function.namespace-prefix.css']
            });
            expect(tokens[4]).toEqual({
              value: '\\ ',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'entity.name.function.namespace-prefix.css', 'constant.character.escape.css']
            });
            expect(tokens[5]).toEqual({
              value: 'fix',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'entity.name.function.namespace-prefix.css']
            });
            return expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
          });
          return it('allows arguments to span multiple lines', function() {
            var lines;
            lines = grammar.tokenizeLines("@namespace\nprefix\"XML\";");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'namespace',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
            });
            expect(lines[1][0]).toEqual({
              value: 'prefix',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'entity.name.function.namespace-prefix.css']
            });
            expect(lines[1][1]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[1][2]).toEqual({
              value: 'XML',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css']
            });
            expect(lines[1][3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[1][4]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'punctuation.terminator.rule.css']
            });
            lines = grammar.tokenizeLines("@namespace\n\n  prefix\n\nurl(\"http://a.bc/\");");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'namespace',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'prefix',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'entity.name.function.namespace-prefix.css']
            });
            expect(lines[4][0]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(lines[4][1]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[4][2]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[4][3]).toEqual({
              value: 'http://a.bc/',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css']
            });
            expect(lines[4][4]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[4][5]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            return expect(lines[4][6]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.namespace.css', 'punctuation.terminator.rule.css']
            });
          });
        });
        describe('font-feature declarations', function() {
          it('tokenises font-feature blocks', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@font-feature-values Font name 2 { }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'keyword.control.at-rule.font-feature-values.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'font-feature-values',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'keyword.control.at-rule.font-feature-values.css']
            });
            expect(tokens[2]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.at-rule.font-features.css']
            });
            expect(tokens[3]).toEqual({
              value: 'Font name 2',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css']
            });
            expect(tokens[4]).toEqual({
              value: ' ',
              scopes: ['source.css']
            });
            expect(tokens[5]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            return expect(tokens[7]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
          it('allows font-feature names to start on a different line', function() {
            var lines;
            lines = grammar.tokenizeLines("@font-feature-values\nFont name 2\n{");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'keyword.control.at-rule.font-feature-values.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'font-feature-values',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'keyword.control.at-rule.font-feature-values.css']
            });
            expect(lines[1][0]).toEqual({
              value: 'Font name 2',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css']
            });
            return expect(lines[2][0]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
          });
          it('matches injected comments', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@font-feature-values/*{*/Font/*}*/name/*{*/2{').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'keyword.control.at-rule.font-feature-values.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'font-feature-values',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'keyword.control.at-rule.font-feature-values.css']
            });
            expect(tokens[2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css']
            });
            expect(tokens[4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[5]).toEqual({
              value: 'Font',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css']
            });
            expect(tokens[6]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[7]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css']
            });
            expect(tokens[8]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[9]).toEqual({
              value: 'name',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css']
            });
            expect(tokens[10]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[11]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css']
            });
            expect(tokens[12]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[13]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css']
            });
            return expect(tokens[14]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
          });
          it('tokenises at-rules for feature names', function() {
            var lines;
            lines = grammar.tokenizeLines("@swash{ swashy: 2; }\n@ornaments{ ident: 2; }\n@annotation{ ident: 1; }\n@stylistic{ stylish: 2; }\n@styleset{ sets: 2 3 4; }\n@character-variant{ charvar: 2 }");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'keyword.control.at-rule.swash.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'swash',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'keyword.control.at-rule.swash.css']
            });
            expect(lines[0][2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[0][4]).toEqual({
              value: 'swashy',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(lines[0][5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[0][7]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[0][8]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[0][10]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[1][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'keyword.control.at-rule.ornaments.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[1][1]).toEqual({
              value: 'ornaments',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'keyword.control.at-rule.ornaments.css']
            });
            expect(lines[1][2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[1][4]).toEqual({
              value: 'ident',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(lines[1][5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'meta.property-list.font-feature.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[1][7]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[1][8]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'meta.property-list.font-feature.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[1][10]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[2][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'keyword.control.at-rule.annotation.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'annotation',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'keyword.control.at-rule.annotation.css']
            });
            expect(lines[2][2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[2][4]).toEqual({
              value: 'ident',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(lines[2][5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'meta.property-list.font-feature.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[2][7]).toEqual({
              value: '1',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[2][8]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'meta.property-list.font-feature.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[2][10]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[3][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'keyword.control.at-rule.stylistic.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[3][1]).toEqual({
              value: 'stylistic',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'keyword.control.at-rule.stylistic.css']
            });
            expect(lines[3][2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[3][4]).toEqual({
              value: 'stylish',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(lines[3][5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'meta.property-list.font-feature.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[3][7]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[3][8]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'meta.property-list.font-feature.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[3][10]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[4][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'keyword.control.at-rule.styleset.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[4][1]).toEqual({
              value: 'styleset',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'keyword.control.at-rule.styleset.css']
            });
            expect(lines[4][2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[4][4]).toEqual({
              value: 'sets',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(lines[4][5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'meta.property-list.font-feature.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[4][7]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[4][9]).toEqual({
              value: '3',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[4][11]).toEqual({
              value: '4',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[4][12]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'meta.property-list.font-feature.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[4][14]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            expect(lines[5][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.character-variant.css', 'keyword.control.at-rule.character-variant.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[5][1]).toEqual({
              value: 'character-variant',
              scopes: ['source.css', 'meta.at-rule.character-variant.css', 'keyword.control.at-rule.character-variant.css']
            });
            expect(lines[5][2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.character-variant.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[5][4]).toEqual({
              value: 'charvar',
              scopes: ['source.css', 'meta.at-rule.character-variant.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(lines[5][5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.character-variant.css', 'meta.property-list.font-feature.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[5][7]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.at-rule.character-variant.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            return expect(lines[5][9]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.character-variant.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
          it('matches feature-name rules case-insensitively', function() {
            var lines;
            lines = grammar.tokenizeLines("@sWASH{ swashy: 2; }\n@ornaMENts{ ident: 2; }\n@anNOTatION{ ident: 1; }\n@styLISTic{ stylish: 2; }\n@STYLEset{ sets: 2 3 4; }\n@CHARacter-VARiant{ charvar: 2 }");
            expect(lines[0][1]).toEqual({
              value: 'sWASH',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'keyword.control.at-rule.swash.css']
            });
            expect(lines[1][1]).toEqual({
              value: 'ornaMENts',
              scopes: ['source.css', 'meta.at-rule.ornaments.css', 'keyword.control.at-rule.ornaments.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'anNOTatION',
              scopes: ['source.css', 'meta.at-rule.annotation.css', 'keyword.control.at-rule.annotation.css']
            });
            expect(lines[3][1]).toEqual({
              value: 'styLISTic',
              scopes: ['source.css', 'meta.at-rule.stylistic.css', 'keyword.control.at-rule.stylistic.css']
            });
            expect(lines[4][1]).toEqual({
              value: 'STYLEset',
              scopes: ['source.css', 'meta.at-rule.styleset.css', 'keyword.control.at-rule.styleset.css']
            });
            return expect(lines[5][1]).toEqual({
              value: 'CHARacter-VARiant',
              scopes: ['source.css', 'meta.at-rule.character-variant.css', 'keyword.control.at-rule.character-variant.css']
            });
          });
          it('matches comments inside feature-name rules', function() {
            var lines;
            lines = grammar.tokenizeLines("@font-feature-values Font name 2 {\n@swash{/*\n========*/swashy:/**/2;/**/}\n}");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'keyword.control.at-rule.font-feature-values.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'font-feature-values',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'keyword.control.at-rule.font-feature-values.css']
            });
            expect(lines[0][3]).toEqual({
              value: 'Font name 2',
              scopes: ['source.css', 'meta.at-rule.font-features.css', 'variable.parameter.font-name.css']
            });
            expect(lines[0][5]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[1][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'keyword.control.at-rule.swash.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[1][1]).toEqual({
              value: 'swash',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'keyword.control.at-rule.swash.css']
            });
            expect(lines[1][2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[1][3]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[2][0]).toEqual({
              value: '========',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'comment.block.css']
            });
            expect(lines[2][1]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[2][2]).toEqual({
              value: 'swashy',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(lines[2][3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[2][4]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[2][5]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[2][6]).toEqual({
              value: '2',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[2][7]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[2][8]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[2][9]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[2][10]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            return expect(lines[3][0]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
          return it('highlights escape sequences inside feature-names', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@swash{ s\\000077a\\73hy: 1; }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'keyword.control.at-rule.swash.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'swash',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'keyword.control.at-rule.swash.css']
            });
            expect(tokens[4]).toEqual({
              value: 's',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(tokens[5]).toEqual({
              value: '\\000077',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css', 'constant.character.escape.codepoint.css']
            });
            expect(tokens[6]).toEqual({
              value: 'a',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
            expect(tokens[7]).toEqual({
              value: '\\73',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css', 'constant.character.escape.codepoint.css']
            });
            return expect(tokens[8]).toEqual({
              value: 'hy',
              scopes: ['source.css', 'meta.at-rule.swash.css', 'meta.property-list.font-feature.css', 'variable.font-feature.css']
            });
          });
        });
        describe('@page', function() {
          return it('tokenises @page blocks correctly', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@page :first { }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.page.css', 'keyword.control.at-rule.page.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'page',
              scopes: ['source.css', 'meta.at-rule.page.css', 'keyword.control.at-rule.page.css']
            });
            expect(tokens[2]).toEqual({
              value: ' ',
              scopes: ['source.css']
            });
            expect(tokens[3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[4]).toEqual({
              value: 'first',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[5]).toEqual({
              value: ' ',
              scopes: ['source.css']
            });
            expect(tokens[6]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[8]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('@page:right{}').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.page.css', 'keyword.control.at-rule.page.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'page',
              scopes: ['source.css', 'meta.at-rule.page.css', 'keyword.control.at-rule.page.css']
            });
            expect(tokens[2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[3]).toEqual({
              value: 'right',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[4]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[5]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('@page{}').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.page.css', 'keyword.control.at-rule.page.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'page',
              scopes: ['source.css', 'meta.at-rule.page.css', 'keyword.control.at-rule.page.css']
            });
            expect(tokens[2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            return expect(tokens[3]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
        });
        describe('@counter-style', function() {
          it('tokenises them and their contents correctly', function() {
            var lines;
            lines = grammar.tokenizeLines("@counter-style winners-list {\n  system: fixed;\n  symbols: url(gold-medal.svg) url(silver-medal.svg) url(bronze-medal.svg);\n  suffix: \" \";\n}");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'keyword.control.at-rule.counter-style.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'counter-style',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'keyword.control.at-rule.counter-style.css']
            });
            expect(lines[0][3]).toEqual({
              value: 'winners-list',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'variable.parameter.style-name.css']
            });
            expect(lines[0][5]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[1][1]).toEqual({
              value: 'system',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[1][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[1][4]).toEqual({
              value: 'fixed',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(lines[1][5]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'symbols',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[2][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[2][4]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(lines[2][5]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[2][6]).toEqual({
              value: 'gold-medal.svg',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'variable.parameter.url.css']
            });
            expect(lines[2][7]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[2][9]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(lines[2][10]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[2][11]).toEqual({
              value: 'silver-medal.svg',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'variable.parameter.url.css']
            });
            expect(lines[2][12]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[2][14]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(lines[2][15]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[2][16]).toEqual({
              value: 'bronze-medal.svg',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'variable.parameter.url.css']
            });
            expect(lines[2][17]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[2][18]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[3][1]).toEqual({
              value: 'suffix',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[3][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[3][4]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[3][6]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[3][7]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.terminator.rule.css']
            });
            return expect(lines[4][0]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
          it('matches injected comments', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@counter-style/*{*/winners-list/*}*/{ system: fixed; }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'keyword.control.at-rule.counter-style.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'counter-style',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'keyword.control.at-rule.counter-style.css']
            });
            expect(tokens[2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'comment.block.css']
            });
            expect(tokens[4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[5]).toEqual({
              value: 'winners-list',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'variable.parameter.style-name.css']
            });
            expect(tokens[6]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[7]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'comment.block.css']
            });
            expect(tokens[8]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[9]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[11]).toEqual({
              value: 'system',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[12]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[14]).toEqual({
              value: 'fixed',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(tokens[15]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.terminator.rule.css']
            });
            return expect(tokens[17]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.counter-style.body.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
          it("allows the counter-style's name to start on a different line", function() {
            var lines;
            lines = grammar.tokenizeLines("@counter-style\nwinners-list");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'keyword.control.at-rule.counter-style.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'counter-style',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'keyword.control.at-rule.counter-style.css']
            });
            return expect(lines[1][0]).toEqual({
              value: 'winners-list',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'variable.parameter.style-name.css']
            });
          });
          return it("highlights escape sequences inside the style's name", function() {
            var tokens;
            tokens = grammar.tokenizeLine('@counter-style A\\01F602z').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'keyword.control.at-rule.counter-style.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'counter-style',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'keyword.control.at-rule.counter-style.css']
            });
            expect(tokens[3]).toEqual({
              value: 'A',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'variable.parameter.style-name.css']
            });
            expect(tokens[4]).toEqual({
              value: '\\01F602',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'variable.parameter.style-name.css', 'constant.character.escape.codepoint.css']
            });
            return expect(tokens[5]).toEqual({
              value: 'z',
              scopes: ['source.css', 'meta.at-rule.counter-style.header.css', 'variable.parameter.style-name.css']
            });
          });
        });
        describe('@document', function() {
          return it('correctly tokenises @document rules', function() {
            var lines;
            lines = grammar.tokenizeLines("@document url(http://www.w3.org/),\n  url-prefix(http://www.w3.org/Style/), /* Comment */\n  domain(/**/mozilla.org),\n  regexp(\"https:.*\") {\n    body{ color: #f00; }\n  }");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'keyword.control.at-rule.document.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'document',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'keyword.control.at-rule.document.css']
            });
            expect(lines[0][3]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.url.css', 'support.function.url.css']
            });
            expect(lines[0][4]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[0][5]).toEqual({
              value: 'http://www.w3.org/',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.url.css', 'variable.parameter.url.css']
            });
            expect(lines[0][6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[0][7]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'punctuation.separator.list.comma.css']
            });
            expect(lines[1][1]).toEqual({
              value: 'url-prefix',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'support.function.document-rule.css']
            });
            expect(lines[1][2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[1][3]).toEqual({
              value: 'http://www.w3.org/Style/',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'variable.parameter.document-rule.css']
            });
            expect(lines[1][4]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[1][5]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'punctuation.separator.list.comma.css']
            });
            expect(lines[1][7]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[1][8]).toEqual({
              value: ' Comment ',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'comment.block.css']
            });
            expect(lines[1][9]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'domain',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'support.function.document-rule.css']
            });
            expect(lines[2][2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[2][3]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[2][4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[2][5]).toEqual({
              value: 'mozilla.org',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'variable.parameter.document-rule.css']
            });
            expect(lines[2][6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[2][7]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'punctuation.separator.list.comma.css']
            });
            expect(lines[3][1]).toEqual({
              value: 'regexp',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'support.function.document-rule.css']
            });
            expect(lines[3][2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[3][3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(lines[3][4]).toEqual({
              value: 'https:.*',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'string.quoted.double.css']
            });
            expect(lines[3][5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(lines[3][6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.at-rule.document.header.css', 'meta.function.document-rule.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[3][8]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'punctuation.section.document.begin.bracket.curly.css']
            });
            expect(lines[4][1]).toEqual({
              value: 'body',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(lines[4][2]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[4][4]).toEqual({
              value: 'color',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[4][5]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[4][7]).toEqual({
              value: '#',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.color.rgb-value.hex.css', 'punctuation.definition.constant.css']
            });
            expect(lines[4][8]).toEqual({
              value: 'f00',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.color.rgb-value.hex.css']
            });
            expect(lines[4][9]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[4][11]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            return expect(lines[5][1]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.at-rule.document.body.css', 'punctuation.section.document.end.bracket.curly.css']
            });
          });
        });
        describe('@viewport', function() {
          it('tokenises @viewport blocks correctly', function() {
            var tokens;
            tokens = grammar.tokenizeLine('@viewport { min-width: 640px; max-width: 800px; }').tokens;
            expect(tokens[0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'keyword.control.at-rule.viewport.css', 'punctuation.definition.keyword.css']
            });
            expect(tokens[1]).toEqual({
              value: 'viewport',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'keyword.control.at-rule.viewport.css']
            });
            expect(tokens[2]).toEqual({
              value: ' ',
              scopes: ['source.css']
            });
            expect(tokens[3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[5]).toEqual({
              value: 'min-width',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[6]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[8]).toEqual({
              value: '640',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(tokens[9]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(tokens[10]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(tokens[12]).toEqual({
              value: 'max-width',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[13]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[15]).toEqual({
              value: '800',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(tokens[16]).toEqual({
              value: 'px',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
            });
            expect(tokens[17]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            return expect(tokens[19]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
          it('tokenises them across lines', function() {
            var lines;
            lines = grammar.tokenizeLines("@-O-VIEWPORT\n{\n  zoom: 0.75;\n  min-zoom: 0.5;\n  max-zoom: 0.9;\n}");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'keyword.control.at-rule.viewport.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: '-O-VIEWPORT',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'keyword.control.at-rule.viewport.css']
            });
            expect(lines[1][0]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'zoom',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[2][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[2][4]).toEqual({
              value: '0.75',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[2][5]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[3][1]).toEqual({
              value: 'min-zoom',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[3][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[3][4]).toEqual({
              value: '0.5',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[3][5]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(lines[4][1]).toEqual({
              value: 'max-zoom',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[4][2]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[4][4]).toEqual({
              value: '0.9',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(lines[4][5]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            return expect(lines[5][0]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
          return it('tokenises injected comments', function() {
            var lines;
            lines = grammar.tokenizeLines("@-ms-viewport/*{*/{/*\n==*/orientation: landscape;\n}");
            expect(lines[0][0]).toEqual({
              value: '@',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'keyword.control.at-rule.viewport.css', 'punctuation.definition.keyword.css']
            });
            expect(lines[0][1]).toEqual({
              value: '-ms-viewport',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'keyword.control.at-rule.viewport.css']
            });
            expect(lines[0][2]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[0][3]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'comment.block.css']
            });
            expect(lines[0][4]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.at-rule.viewport.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[0][5]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(lines[0][6]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.property-list.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[1][0]).toEqual({
              value: '==',
              scopes: ['source.css', 'meta.property-list.css', 'comment.block.css']
            });
            expect(lines[1][1]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.property-list.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[1][2]).toEqual({
              value: 'orientation',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(lines[1][3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(lines[1][5]).toEqual({
              value: 'landscape',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
            });
            expect(lines[1][6]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            return expect(lines[2][0]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
        });
        return describe('unknown at-rules', function() {
          it('correctly parses single-line unknown at-rules closing with semicolons', function() {
            var lines;
            lines = grammar.tokenizeLines("@foo;\n@foo ;\n@foo a;\n@foo ();\n@foo (a);");
            expect(lines[0][1]).toEqual({
              value: 'foo',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
            });
            expect(lines[1][1]).toEqual({
              value: 'foo',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
            });
            expect(lines[2][1]).toEqual({
              value: 'foo',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
            });
            expect(lines[2][2]).toEqual({
              value: ' a',
              scopes: ['source.css', 'meta.at-rule.header.css']
            });
            expect(lines[3][1]).toEqual({
              value: 'foo',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
            });
            expect(lines[3][2]).toEqual({
              value: ' ()',
              scopes: ['source.css', 'meta.at-rule.header.css']
            });
            expect(lines[4][1]).toEqual({
              value: 'foo',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
            });
            return expect(lines[4][2]).toEqual({
              value: ' (a)',
              scopes: ['source.css', 'meta.at-rule.header.css']
            });
          });
          return it('correctly parses single-line unknown at-rules closing with ;', function() {
            var lines;
            lines = grammar.tokenizeLines("@foo bar;\n.foo");
            expect(lines[0][1]).toEqual({
              value: 'foo',
              scopes: ['source.css', 'meta.at-rule.header.css', 'keyword.control.at-rule.css']
            });
            expect(lines[1][0]).toEqual({
              value: '.',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
            });
            return expect(lines[1][1]).toEqual({
              value: 'foo',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
            });
          });
        });
      });
      describe('capitalisation', function() {
        it('ignores case in at-rules', function() {
          var lines;
          lines = grammar.tokenizeLines("@IMPoRT url(\"file.css\");\n@MEdIA (MAX-WIDTH: 2px){ }\n@pAgE :fIRST { }\n@NAMEspace \"A\";\n@foNT-FacE {}");
          expect(lines[0][1]).toEqual({
            value: 'IMPoRT',
            scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
          });
          expect(lines[1][1]).toEqual({
            value: 'MEdIA',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
          });
          expect(lines[1][4]).toEqual({
            value: 'MAX-WIDTH',
            scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
          });
          expect(lines[2][1]).toEqual({
            value: 'pAgE',
            scopes: ['source.css', 'meta.at-rule.page.css', 'keyword.control.at-rule.page.css']
          });
          expect(lines[2][4]).toEqual({
            value: 'fIRST',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
          });
          expect(lines[3][1]).toEqual({
            value: 'NAMEspace',
            scopes: ['source.css', 'meta.at-rule.namespace.css', 'keyword.control.at-rule.namespace.css']
          });
          return expect(lines[4][1]).toEqual({
            value: 'foNT-FacE',
            scopes: ['source.css', 'meta.at-rule.font-face.css', 'keyword.control.at-rule.font-face.css']
          });
        });
        it('ignores case in property names', function() {
          var lines;
          lines = grammar.tokenizeLines("a{ COLOR: #fff; }\na{ gRId-tEMPLaTe: none; }\na{ bACkgrOUND-iMAGE: none; }\na{ -MOZ-IMAGE: none; }");
          expect(lines[0][3]).toEqual({
            value: 'COLOR',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
          });
          expect(lines[1][3]).toEqual({
            value: 'gRId-tEMPLaTe',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
          });
          expect(lines[2][3]).toEqual({
            value: 'bACkgrOUND-iMAGE',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
          });
          return expect(lines[3][3]).toEqual({
            value: '-MOZ-IMAGE',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.vendored.property-name.css']
          });
        });
        it('ignores case in property keywords', function() {
          var lines;
          lines = grammar.tokenizeLines("a{ color: INItIaL; }\na{ color: trAnsPAREnT; }\na{ color: rED; }\na{ color: unSET; }\na{ color: NONe; }\na{ style: lOWER-lATIN; }\na{ color: -WebkIT-foo; }\na{ font: HelVETica; }");
          expect(lines[0][6]).toEqual({
            value: 'INItIaL',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
          });
          expect(lines[1][6]).toEqual({
            value: 'trAnsPAREnT',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
          });
          expect(lines[2][6]).toEqual({
            value: 'rED',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.color.w3c-standard-color-name.css']
          });
          expect(lines[3][6]).toEqual({
            value: 'unSET',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
          });
          expect(lines[4][6]).toEqual({
            value: 'NONe',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
          });
          expect(lines[5][6]).toEqual({
            value: 'lOWER-lATIN',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.list-style-type.css']
          });
          expect(lines[6][6]).toEqual({
            value: '-WebkIT-foo',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.vendored.property-value.css']
          });
          return expect(lines[7][6]).toEqual({
            value: 'HelVETica',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.font-name.css']
          });
        });
        it('ignores case in selectors', function() {
          var lines;
          lines = grammar.tokenizeLines("DIV:HOVER { }\n#id::BefORE { }\n#id::aFTEr { }\nTABle:nTH-cHILD(2N+1) {}\nhtML:NOT(.htiml) {}\nI::BACKDROP\nI::-mOZ-thing {}");
          expect(lines[0][0]).toEqual({
            value: 'DIV',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(lines[0][2]).toEqual({
            value: 'HOVER',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
          });
          expect(lines[1][3]).toEqual({
            value: 'BefORE',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
          expect(lines[2][3]).toEqual({
            value: 'aFTEr',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
          expect(lines[3][0]).toEqual({
            value: 'TABle',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(lines[3][2]).toEqual({
            value: 'nTH-cHILD',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
          });
          expect(lines[3][4]).toEqual({
            value: '2N+1',
            scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
          });
          expect(lines[4][0]).toEqual({
            value: 'htML',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(lines[4][2]).toEqual({
            value: 'NOT',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
          });
          expect(lines[5][0]).toEqual({
            value: 'I',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(lines[5][2]).toEqual({
            value: 'BACKDROP',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
          return expect(lines[6][2]).toEqual({
            value: '-mOZ-thing',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
        });
        it('ignores case in function names', function() {
          var lines;
          lines = grammar.tokenizeLines("a{ color: RGBa(); }\na{ color: hslA(); }\na{ color: URL(); }\na{ content: ATTr(); }\na{ content: CoUNTer(); }\na{ content: cuBIC-beZIER()}\na{ content: sTePs()}\na{ content: cALc(2 + 2)}");
          expect(lines[0][6]).toEqual({
            value: 'RGBa',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']
          });
          expect(lines[1][6]).toEqual({
            value: 'hslA',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']
          });
          expect(lines[2][6]).toEqual({
            value: 'URL',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.url.css', 'support.function.url.css']
          });
          expect(lines[3][6]).toEqual({
            value: 'ATTr',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
          });
          expect(lines[4][6]).toEqual({
            value: 'CoUNTer',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
          });
          expect(lines[5][6]).toEqual({
            value: 'cuBIC-beZIER',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'support.function.timing-function.css']
          });
          expect(lines[6][6]).toEqual({
            value: 'sTePs',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'support.function.timing-function.css']
          });
          return expect(lines[7][6]).toEqual({
            value: 'cALc',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'support.function.calc.css']
          });
        });
        return it('ignores case in unit names', function() {
          var lines;
          lines = grammar.tokenizeLines("a{width: 20EM; }\na{width: 20ReM; }\na{width: 8tURN; }\na{width: 20S; }\na{width: 20CM}\na{width: 2gRAd}");
          expect(lines[0][5]).toEqual({
            value: '20',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[0][6]).toEqual({
            value: 'EM',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
          });
          expect(lines[1][6]).toEqual({
            value: 'ReM',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.rem.css']
          });
          expect(lines[2][2]).toEqual({
            value: 'width',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
          });
          expect(lines[2][6]).toEqual({
            value: 'tURN',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.turn.css']
          });
          expect(lines[3][6]).toEqual({
            value: 'S',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.s.css']
          });
          expect(lines[4][5]).toEqual({
            value: '20',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[4][6]).toEqual({
            value: 'CM',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.cm.css']
          });
          return expect(lines[5][6]).toEqual({
            value: 'gRAd',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.grad.css']
          });
        });
      });
      describe('pseudo-classes', function() {
        it('tokenizes regular pseudo-classes', function() {
          var tokens;
          tokens = grammar.tokenizeLine('p:first-child').tokens;
          expect(tokens[0]).toEqual({
            value: 'p',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(tokens[1]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[2]).toEqual({
            value: 'first-child',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
          });
        });
        it("doesn't tokenise pseudo-classes if followed by a semicolon or closed bracket", function() {
          var tokens;
          tokens = grammar.tokenizeLine('p{ left:left }').tokens;
          expect(tokens[0]).toEqual({
            value: 'p',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(tokens[1]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          expect(tokens[3]).toEqual({
            value: 'left',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
          });
          expect(tokens[4]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
          });
          expect(tokens[5]).toEqual({
            value: 'left',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
          });
          return expect(tokens[7]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
        });
        describe(':dir()', function() {
          it('tokenises :dir() and its keywords', function() {
            var lines;
            lines = grammar.tokenizeLines("a:dir(ltr ){ }\n*:dir( rtl){ }");
            expect(lines[0][0]).toEqual({
              value: 'a',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(lines[0][1]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(lines[0][2]).toEqual({
              value: 'dir',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(lines[0][3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[0][4]).toEqual({
              value: 'ltr',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.text-direction.css']
            });
            expect(lines[0][5]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.selector.css']
            });
            expect(lines[0][6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(lines[1][0]).toEqual({
              value: '*',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.wildcard.css']
            });
            expect(lines[1][1]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(lines[1][2]).toEqual({
              value: 'dir',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(lines[1][3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[1][4]).toEqual({
              value: ' ',
              scopes: ['source.css', 'meta.selector.css']
            });
            expect(lines[1][5]).toEqual({
              value: 'rtl',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.text-direction.css']
            });
            return expect(lines[1][6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
          });
          return it('allows :dir() to include comments and newlines', function() {
            var lines;
            lines = grammar.tokenizeLines(":DIR(/**\n==*/ltr/*\n*/)");
            expect(lines[0][0]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(lines[0][1]).toEqual({
              value: 'DIR',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(lines[0][2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(lines[0][3]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[0][4]).toEqual({
              value: '*',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css']
            });
            expect(lines[1][0]).toEqual({
              value: '==',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css']
            });
            expect(lines[1][1]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(lines[1][2]).toEqual({
              value: 'ltr',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.text-direction.css']
            });
            expect(lines[1][3]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(lines[2][0]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            return expect(lines[2][1]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
          });
        });
        describe(':lang()', function() {
          it('tokenizes :lang()', function() {
            var tokens;
            tokens = grammar.tokenizeLine(':lang(zh-Hans-CN,es-419)').tokens;
            expect(tokens[0]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[1]).toEqual({
              value: 'lang',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[3]).toEqual({
              value: 'zh-Hans-CN',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.language-range.css']
            });
            expect(tokens[4]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.list.comma.css']
            });
            expect(tokens[5]).toEqual({
              value: 'es-419',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.language-range.css']
            });
            return expect(tokens[6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
          });
          it('does not tokenize unquoted language ranges containing asterisks', function() {
            var tokens;
            tokens = grammar.tokenizeLine(':lang(zh-*-CN)').tokens;
            return expect(tokens[3]).toEqual({
              value: 'zh-*-CN',
              scopes: ['source.css', 'meta.selector.css']
            });
          });
          return it('tokenizes language ranges containing asterisks quoted as strings', function() {
            var tokens;
            tokens = grammar.tokenizeLine(':lang("zh-*-CN",\'*-ab-\')').tokens;
            expect(tokens[3]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.selector.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[4]).toEqual({
              value: 'zh-*-CN',
              scopes: ['source.css', 'meta.selector.css', 'string.quoted.double.css', 'support.constant.language-range.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.selector.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[6]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.separator.list.comma.css']
            });
            expect(tokens[7]).toEqual({
              value: "'",
              scopes: ['source.css', 'meta.selector.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[8]).toEqual({
              value: '*-ab-',
              scopes: ['source.css', 'meta.selector.css', 'string.quoted.single.css', 'support.constant.language-range.css']
            });
            return expect(tokens[9]).toEqual({
              value: "'",
              scopes: ['source.css', 'meta.selector.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
            });
          });
        });
        describe(':not()', function() {
          it('tokenises other selectors inside :not()', function() {
            var tokens;
            tokens = grammar.tokenizeLine('*:not(.class-name):not(div) {}').tokens;
            expect(tokens[1]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[2]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: '.',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[5]).toEqual({
              value: 'class-name',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
            });
            expect(tokens[6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[7]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[8]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[9]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[10]).toEqual({
              value: 'div',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            return expect(tokens[11]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
          });
          return it('tokenises injected comments', function() {
            var tokens;
            tokens = grammar.tokenizeLine('*:not(/*(*/.class-name/*)*/):not(/*b*/) {}').tokens;
            expect(tokens[2]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[4]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[5]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css']
            });
            expect(tokens[6]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[7]).toEqual({
              value: '.',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[8]).toEqual({
              value: 'class-name',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
            });
            expect(tokens[9]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[10]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css']
            });
            expect(tokens[11]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            expect(tokens[12]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[13]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[14]).toEqual({
              value: 'not',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[15]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[16]).toEqual({
              value: '/*',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
            });
            expect(tokens[17]).toEqual({
              value: 'b',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css']
            });
            expect(tokens[18]).toEqual({
              value: '*/',
              scopes: ['source.css', 'meta.selector.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
            });
            return expect(tokens[19]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
          });
        });
        return describe(':nth-*()', function() {
          it('tokenizes :nth-child()', function() {
            var tokens;
            tokens = grammar.tokenizeLines(':nth-child(2n+1)\n:nth-child(2n -1)\n:nth-child(-2n+ 1)\n:nth-child(-2n - 1)\n:nth-child(odd)\n:nth-child(even)\n:nth-child(  odd   )\n:nth-child(  even  )');
            expect(tokens[0][0]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[0][1]).toEqual({
              value: 'nth-child',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[0][2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[0][3]).toEqual({
              value: '2n+1',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[0][4]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[1][3]).toEqual({
              value: '2n -1',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[2][3]).toEqual({
              value: '-2n+ 1',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[3][3]).toEqual({
              value: '-2n - 1',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[4][3]).toEqual({
              value: 'odd',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.parity.css']
            });
            expect(tokens[5][3]).toEqual({
              value: 'even',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.parity.css']
            });
            expect(tokens[6][3]).toEqual({
              value: '  ',
              scopes: ['source.css', 'meta.selector.css']
            });
            expect(tokens[6][4]).toEqual({
              value: 'odd',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.parity.css']
            });
            expect(tokens[7][4]).toEqual({
              value: 'even',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.parity.css']
            });
            return expect(tokens[7][5]).toEqual({
              value: '  ',
              scopes: ['source.css', 'meta.selector.css']
            });
          });
          it('tokenizes :nth-last-child()', function() {
            var tokens;
            tokens = grammar.tokenizeLines(':nth-last-child(2n)\n:nth-last-child( -2n)\n:nth-last-child( 2n )\n:nth-last-child(even)');
            expect(tokens[0][0]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[0][1]).toEqual({
              value: 'nth-last-child',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[0][2]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[0][3]).toEqual({
              value: '2n',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[0][4]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[1][4]).toEqual({
              value: '-2n',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[2][4]).toEqual({
              value: '2n',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[2][6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            return expect(tokens[3][3]).toEqual({
              value: 'even',
              scopes: ['source.css', 'meta.selector.css', 'support.constant.parity.css']
            });
          });
          it('tokenizes :nth-of-type()', function() {
            var tokens;
            tokens = grammar.tokenizeLines('img:nth-of-type(+n+1)\nimg:nth-of-type(-n+1)\nimg:nth-of-type(n+1)');
            expect(tokens[0][1]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[0][2]).toEqual({
              value: 'nth-of-type',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[0][3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[0][4]).toEqual({
              value: '+n+1',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[0][5]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[1][4]).toEqual({
              value: '-n+1',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            return expect(tokens[2][4]).toEqual({
              value: 'n+1',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
          });
          return it('tokenizes ::nth-last-of-type()', function() {
            var tokens;
            tokens = grammar.tokenizeLines('h1:nth-last-of-type(-1)\nh1:nth-last-of-type(+2)\nh1:nth-last-of-type(3)');
            expect(tokens[0][1]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
            });
            expect(tokens[0][2]).toEqual({
              value: 'nth-last-of-type',
              scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
            });
            expect(tokens[0][3]).toEqual({
              value: '(',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.begin.bracket.round.css']
            });
            expect(tokens[0][4]).toEqual({
              value: '-1',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            expect(tokens[0][5]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.selector.css', 'punctuation.section.function.end.bracket.round.css']
            });
            expect(tokens[1][4]).toEqual({
              value: '+2',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
            return expect(tokens[2][4]).toEqual({
              value: '3',
              scopes: ['source.css', 'meta.selector.css', 'constant.numeric.css']
            });
          });
        });
      });
      describe('pseudo-elements', function() {
        it('tokenizes both : and :: notations for pseudo-elements introduced in CSS 1 and 2', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.opening:first-letter').tokens;
          expect(tokens[0]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'opening',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
          expect(tokens[2]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[3]).toEqual({
            value: 'first-letter',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
          tokens = grammar.tokenizeLine('q::after').tokens;
          expect(tokens[0]).toEqual({
            value: 'q',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(tokens[1]).toEqual({
            value: '::',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[2]).toEqual({
            value: 'after',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
        });
        it('tokenizes both : and :: notations for vendor-prefixed pseudo-elements', function() {
          var tokens;
          tokens = grammar.tokenizeLine(':-ms-input-placeholder').tokens;
          expect(tokens[0]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: '-ms-input-placeholder',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
          tokens = grammar.tokenizeLine('::-webkit-input-placeholder').tokens;
          expect(tokens[0]).toEqual({
            value: '::',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[1]).toEqual({
            value: '-webkit-input-placeholder',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
        });
        return it('only tokenizes the :: notation for other pseudo-elements', function() {
          var tokens;
          tokens = grammar.tokenizeLine('::selection').tokens;
          expect(tokens[0]).toEqual({
            value: '::',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
          });
          expect(tokens[1]).toEqual({
            value: 'selection',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
          tokens = grammar.tokenizeLine(':selection').tokens;
          return expect(tokens[0]).toEqual({
            value: ':selection',
            scopes: ['source.css', 'meta.selector.css']
          });
        });
      });
      return describe('compound selectors', function() {
        it('tokenizes the combination of type selectors followed by class selectors', function() {
          var tokens;
          tokens = grammar.tokenizeLine('very-custom.class').tokens;
          expect(tokens[0]).toEqual({
            value: 'very-custom',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
          });
          expect(tokens[1]).toEqual({
            value: '.',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[2]).toEqual({
            value: 'class',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.class.css']
          });
        });
        it('tokenizes the combination of type selectors followed by pseudo-classes', function() {
          var tokens;
          tokens = grammar.tokenizeLine('very-custom:hover').tokens;
          expect(tokens[0]).toEqual({
            value: 'very-custom',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
          });
          expect(tokens[1]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[2]).toEqual({
            value: 'hover',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-class.css']
          });
        });
        return it('tokenizes the combination of type selectors followed by pseudo-elements', function() {
          var tokens;
          tokens = grammar.tokenizeLine('very-custom::shadow').tokens;
          expect(tokens[0]).toEqual({
            value: 'very-custom',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
          });
          expect(tokens[1]).toEqual({
            value: '::',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']
          });
          return expect(tokens[2]).toEqual({
            value: 'shadow',
            scopes: ['source.css', 'meta.selector.css', 'entity.other.attribute-name.pseudo-element.css']
          });
        });
      });
    });
    describe('property lists (declaration blocks)', function() {
      it('tokenizes inline property lists', function() {
        var tokens;
        tokens = grammar.tokenizeLine('div { font-size: inherit; }').tokens;
        expect(tokens[4]).toEqual({
          value: 'font-size',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[6]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[7]).toEqual({
          value: 'inherit',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[8]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        return expect(tokens[10]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      it('tokenizes compact inline property lists', function() {
        var tokens;
        tokens = grammar.tokenizeLine('div{color:inherit;float:left}').tokens;
        expect(tokens[2]).toEqual({
          value: 'color',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[3]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[4]).toEqual({
          value: 'inherit',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[5]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        expect(tokens[6]).toEqual({
          value: 'float',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[7]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[8]).toEqual({
          value: 'left',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        return expect(tokens[9]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      it('tokenizes multiple inline property lists', function() {
        var tokens;
        tokens = grammar.tokenizeLines('very-custom { color: inherit }\nanother-one  {  display  :  none  ;  }');
        expect(tokens[0][0]).toEqual({
          value: 'very-custom',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
        });
        expect(tokens[0][4]).toEqual({
          value: 'color',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[0][5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[0][7]).toEqual({
          value: 'inherit',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[0][8]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][9]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
        expect(tokens[1][0]).toEqual({
          value: 'another-one',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
        });
        expect(tokens[1][4]).toEqual({
          value: 'display',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[1][5]).toEqual({
          value: '  ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[1][6]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[1][8]).toEqual({
          value: 'none',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[1][9]).toEqual({
          value: '  ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[1][10]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        return expect(tokens[1][12]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      it('tokenizes custom properties', function() {
        var tokens;
        tokens = grammar.tokenizeLine(':root { --white: #FFF; }').tokens;
        return expect(tokens[5]).toEqual({
          value: '--white',
          scopes: ['source.css', 'meta.property-list.css', 'variable.css']
        });
      });
      it('tokenises commas between property values', function() {
        var tokens;
        tokens = grammar.tokenizeLine('a{ text-shadow: a, b; }').tokens;
        return expect(tokens[7]).toEqual({
          value: ',',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.separator.list.comma.css']
        });
      });
      it('tokenises superfluous semicolons', function() {
        var i, lines, _i;
        lines = grammar.tokenizeLines('.test{   width:  20em;;;;;;;;;\n;;;;;;;;;height: 10em; }');
        for (i = _i = 0; _i <= 8; i = ++_i) {
          expect(lines[0][i + 9]).toEqual({
            value: ';',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
          });
          expect(lines[1][i]).toEqual({
            value: ';',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
          });
        }
        return expect(lines[1][9]).toEqual({
          value: 'height',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
      });
      return describe('values', function() {
        it('tokenizes color keywords', function() {
          var tokens;
          tokens = grammar.tokenizeLine('#jon { color: snow; }').tokens;
          return expect(tokens[8]).toEqual({
            value: 'snow',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.color.w3c-extended-color-name.css']
          });
        });
        it('tokenises RGBA values in hex notation', function() {
          var tokens;
          tokens = grammar.tokenizeLine('p{ color: #f030; }').tokens;
          expect(tokens[6]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.color.rgb-value.hex.css', 'punctuation.definition.constant.css']
          });
          expect(tokens[7]).toEqual({
            value: 'f030',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.color.rgb-value.hex.css']
          });
          expect(tokens[8]).toEqual({
            value: ';',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
          });
          expect(tokens[10]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
          tokens = grammar.tokenizeLine('a{ color: #CAFEBABE; }').tokens;
          expect(tokens[0]).toEqual({
            value: 'a',
            scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
          });
          expect(tokens[1]).toEqual({
            value: '{',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
          });
          expect(tokens[3]).toEqual({
            value: 'color',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
          });
          expect(tokens[4]).toEqual({
            value: ':',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
          });
          expect(tokens[6]).toEqual({
            value: '#',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.color.rgb-value.hex.css', 'punctuation.definition.constant.css']
          });
          expect(tokens[7]).toEqual({
            value: 'CAFEBABE',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.color.rgb-value.hex.css']
          });
          expect(tokens[8]).toEqual({
            value: ';',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
          });
          expect(tokens[10]).toEqual({
            value: '}',
            scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
          });
          tokens = grammar.tokenizeLine('a{ color: #CAFEBABEF; }').tokens;
          return expect(tokens[6]).toEqual({
            value: '#CAFEBABEF',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
          });
        });
        it('tokenizes common font names', function() {
          var tokens;
          tokens = grammar.tokenizeLine('p { font-family: Verdana, Helvetica, sans-serif; }').tokens;
          expect(tokens[7]).toEqual({
            value: 'Verdana',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.font-name.css']
          });
          expect(tokens[10]).toEqual({
            value: 'Helvetica',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.font-name.css']
          });
          return expect(tokens[13]).toEqual({
            value: 'sans-serif',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.font-name.css']
          });
        });
        it('tokenizes predefined list style types', function() {
          var tokens;
          tokens = grammar.tokenizeLine('ol.myth { list-style-type: cjk-earthly-branch }').tokens;
          return expect(tokens[9]).toEqual({
            value: 'cjk-earthly-branch',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.list-style-type.css']
          });
        });
        it('tokenizes numeric values', function() {
          var tokens;
          tokens = grammar.tokenizeLine('div { font-size: 14px; }').tokens;
          expect(tokens[7]).toEqual({
            value: '14',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          return expect(tokens[8]).toEqual({
            value: 'px',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
          });
        });
        it('does not tokenize invalid numeric values', function() {
          var tokens;
          tokens = grammar.tokenizeLine('div { font-size: test14px; }').tokens;
          expect(tokens[7]).toEqual({
            value: 'test14px',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
          });
          tokens = grammar.tokenizeLine('div { font-size: test-14px; }').tokens;
          return expect(tokens[7]).toEqual({
            value: 'test-14px',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
          });
        });
        it('tokenizes vendor-prefixed values', function() {
          var tokens;
          tokens = grammar.tokenizeLine('.edge { cursor: -webkit-zoom-in; }').tokens;
          expect(tokens[8]).toEqual({
            value: '-webkit-zoom-in',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.vendored.property-value.css']
          });
          tokens = grammar.tokenizeLine('.edge { width: -moz-min-content; }').tokens;
          expect(tokens[8]).toEqual({
            value: '-moz-min-content',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.vendored.property-value.css']
          });
          tokens = grammar.tokenizeLine('.edge { display: -ms-grid; }').tokens;
          return expect(tokens[8]).toEqual({
            value: '-ms-grid',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.vendored.property-value.css']
          });
        });
        it('tokenizes custom variables', function() {
          var tokens;
          tokens = grammar.tokenizeLine('div { color: var(--primary-color) }').tokens;
          return expect(tokens[9]).toEqual({
            value: '--primary-color',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'variable.argument.css']
          });
        });
        it('tokenises numeric values correctly', function() {
          var lines;
          lines = grammar.tokenizeLines(".a   { a:       12em  }\n.a   { a:     4.01ex  }\n.a   { a:   -456.8ch  }\n.a   { a:      0.0REM }\n.a   { a:     +0.0vh  }\n.a   { a:     -0.0vw  }\n.a   { a:       .6px  }\n.a   { a:     10e3mm  }\n.a   { a:     10E3cm  }\n.a   { a:  -3.4e+2In  }\n.a   { a:  -3.4e-2ch  }\n.a   { a:    +.5E-2%  }\n.a   { a:   -3.4e-2%  }");
          expect(lines[0][8]).toEqual({
            value: '12',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[0][9]).toEqual({
            value: 'em',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
          });
          expect(lines[1][8]).toEqual({
            value: '4.01',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[1][9]).toEqual({
            value: 'ex',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.ex.css']
          });
          expect(lines[2][8]).toEqual({
            value: '-456.8',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[2][9]).toEqual({
            value: 'ch',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.ch.css']
          });
          expect(lines[3][8]).toEqual({
            value: '0.0',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[3][9]).toEqual({
            value: 'REM',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.rem.css']
          });
          expect(lines[4][8]).toEqual({
            value: '+0.0',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[4][9]).toEqual({
            value: 'vh',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.vh.css']
          });
          expect(lines[5][8]).toEqual({
            value: '-0.0',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[5][9]).toEqual({
            value: 'vw',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.vw.css']
          });
          expect(lines[6][8]).toEqual({
            value: '.6',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[6][9]).toEqual({
            value: 'px',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
          });
          expect(lines[7][8]).toEqual({
            value: '10e3',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[7][9]).toEqual({
            value: 'mm',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.mm.css']
          });
          expect(lines[8][8]).toEqual({
            value: '10E3',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[8][9]).toEqual({
            value: 'cm',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.cm.css']
          });
          expect(lines[9][8]).toEqual({
            value: '-3.4e+2',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[9][9]).toEqual({
            value: 'In',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.in.css']
          });
          expect(lines[10][8]).toEqual({
            value: '-3.4e-2',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[10][9]).toEqual({
            value: 'ch',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.ch.css']
          });
          expect(lines[11][8]).toEqual({
            value: '+.5E-2',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          expect(lines[11][9]).toEqual({
            value: '%',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
          });
          expect(lines[12][8]).toEqual({
            value: '-3.4e-2',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
          });
          return expect(lines[12][9]).toEqual({
            value: '%',
            scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
          });
        });
        describe('functional notation', function() {
          describe('attr()', function() {
            it('tokenises parameters correctly and case-insensitively', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{content:aTTr(data-width px, inherit)}').tokens;
              expect(tokens[4]).toEqual({
                value: 'aTTr',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(tokens[5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[6]).toEqual({
                value: 'data-width',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(tokens[8]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(tokens[9]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[11]).toEqual({
                value: 'inherit',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.constant.property-value.css']
              });
              expect(tokens[12]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              return expect(tokens[13]).toEqual({
                value: '}',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
              });
            });
            return it('matches variables', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{content:ATTR(VAR(--name) px, "N/A")}').tokens;
              expect(tokens[4]).toEqual({
                value: 'ATTR',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(tokens[5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[6]).toEqual({
                value: 'VAR',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[8]).toEqual({
                value: '--name',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(tokens[9]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(tokens[11]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(tokens[12]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[14]).toEqual({
                value: '"',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
              });
              expect(tokens[15]).toEqual({
                value: 'N/A',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css']
              });
              expect(tokens[16]).toEqual({
                value: '"',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
              });
              return expect(tokens[17]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
            });
          });
          describe('calc()', function() {
            it('tokenises calculations', function() {
              var lines;
              lines = grammar.tokenizeLines("a{\n  width: calc(3px + -1em);\n  width: calc(3px - -1em);\n  width: calc(3px * 2);\n  width: calc(3px / 2);\n}");
              expect(lines[1][4]).toEqual({
                value: 'calc',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'support.function.calc.css']
              });
              expect(lines[1][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[1][6]).toEqual({
                value: '3',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
              expect(lines[1][7]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(lines[1][9]).toEqual({
                value: '+',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'keyword.operator.arithmetic.css']
              });
              expect(lines[1][11]).toEqual({
                value: '-1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
              expect(lines[1][12]).toEqual({
                value: 'em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
              });
              expect(lines[1][13]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[2][9]).toEqual({
                value: '-',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'keyword.operator.arithmetic.css']
              });
              expect(lines[2][11]).toEqual({
                value: '-1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
              expect(lines[2][12]).toEqual({
                value: 'em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
              });
              expect(lines[3][7]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(lines[3][9]).toEqual({
                value: '*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'keyword.operator.arithmetic.css']
              });
              expect(lines[4][7]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(lines[4][9]).toEqual({
                value: '/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'keyword.operator.arithmetic.css']
              });
              return expect(lines[4][11]).toEqual({
                value: '2',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
            });
            it('requires whitespace around + and - operators', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ width: calc(3px+1em); }').tokens;
              expect(tokens[9]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[10]).toEqual({
                value: '+',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css']
              });
              expect(tokens[11]).toEqual({
                value: '1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
              expect(tokens[12]).toEqual({
                value: 'em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
              });
              tokens = grammar.tokenizeLine('a{ width: calc(3px--1em); height: calc(10-1em);}').tokens;
              expect(tokens[9]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[10]).toEqual({
                value: '--1em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css']
              });
              expect(tokens[19]).toEqual({
                value: '10',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
              return expect(tokens[20]).toEqual({
                value: '-1em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css']
              });
            });
            it('does not require whitespace around * and / operators', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ width: calc(3px*2); }').tokens;
              expect(tokens[9]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[10]).toEqual({
                value: '*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'keyword.operator.arithmetic.css']
              });
              expect(tokens[11]).toEqual({
                value: '2',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
              tokens = grammar.tokenizeLine('a{ width: calc(3px/2); }').tokens;
              expect(tokens[9]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[10]).toEqual({
                value: '/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'keyword.operator.arithmetic.css']
              });
              return expect(tokens[11]).toEqual({
                value: '2',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
            });
            return it('matches variable expansions inside calculations', function() {
              var tokens;
              tokens = grammar.tokenizeLine('.foo { margin-top: calc(var(--gap) + 1px); }').tokens;
              expect(tokens[8]).toEqual({
                value: 'calc',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'support.function.calc.css']
              });
              expect(tokens[9]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[10]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(tokens[11]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[12]).toEqual({
                value: '--gap',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(tokens[13]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(tokens[15]).toEqual({
                value: '+',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'keyword.operator.arithmetic.css']
              });
              expect(tokens[17]).toEqual({
                value: '1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css']
              });
              expect(tokens[18]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[19]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.calc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(tokens[20]).toEqual({
                value: ';',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
              });
              return expect(tokens[22]).toEqual({
                value: '}',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
              });
            });
          });
          describe('colours', function() {
            it('tokenises colour functions correctly', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ color: rgb(187,255,221); }').tokens;
              expect(tokens[6]).toEqual({
                value: 'rgb',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[8]).toEqual({
                value: '187',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[9]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[10]).toEqual({
                value: '255',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[11]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[12]).toEqual({
                value: '221',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[13]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              tokens = grammar.tokenizeLine('a{ color: RGBa( 100%, 0% ,20.17% ,.5 ); }').tokens;
              expect(tokens[6]).toEqual({
                value: 'RGBa',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[9]).toEqual({
                value: '100',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[10]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(tokens[11]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[13]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[14]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(tokens[16]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[17]).toEqual({
                value: '20.17',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[18]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(tokens[20]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[21]).toEqual({
                value: '.5',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[23]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              tokens = grammar.tokenizeLine('a{color:HSL(0,  00100%,50%)}').tokens;
              expect(tokens[4]).toEqual({
                value: 'HSL',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(tokens[5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[6]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[7]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[9]).toEqual({
                value: '00100',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[10]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(tokens[11]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[12]).toEqual({
                value: '50',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[13]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(tokens[14]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              tokens = grammar.tokenizeLine('a{color:HSLa(2,.0%,1%,.7)}').tokens;
              expect(tokens[4]).toEqual({
                value: 'HSLa',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(tokens[5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[6]).toEqual({
                value: '2',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[7]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[8]).toEqual({
                value: '.0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[9]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(tokens[10]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[11]).toEqual({
                value: '1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[12]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(tokens[13]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[14]).toEqual({
                value: '.7',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              return expect(tokens[15]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
            });
            it('matches variables as colour components', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ color: RGBA(var(--red), 0% , 20%, .2)}').tokens;
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[8]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(tokens[9]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[10]).toEqual({
                value: '--red',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(tokens[11]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
              return expect(tokens[12]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
            });
            it('matches comments between colour components', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ color: rgba(/**/255/*=*/,0,/*2.2%*/51/*,*/0.2)}').tokens;
              expect(tokens[8]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[9]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(tokens[10]).toEqual({
                value: '255',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[11]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[12]).toEqual({
                value: '=',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css']
              });
              expect(tokens[13]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(tokens[14]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[16]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[17]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[19]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(tokens[20]).toEqual({
                value: '51',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[21]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[22]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css']
              });
              expect(tokens[23]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              return expect(tokens[24]).toEqual({
                value: '0.2',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']
              });
            });
            return it('allows colour components to be split across lines', function() {
              var lines;
              lines = grammar.tokenizeLines(".frost{\n  background-color: rgba(\n    var(--red),    /* Red */\n    var(--green),  /* Green */\n    var(--blue),   /* Blue */\n    /* var(--test),\n    /**/var(--opacity) /* Transparency */\n  );\n}");
              expect(lines[1][4]).toEqual({
                value: 'rgba',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(lines[1][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[2][1]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(lines[2][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[2][3]).toEqual({
                value: '--red',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(lines[2][4]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[2][8]).toEqual({
                value: ' Red ',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css']
              });
              expect(lines[3][1]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(lines[3][3]).toEqual({
                value: '--green',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(lines[3][5]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[3][8]).toEqual({
                value: ' Green ',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css']
              });
              expect(lines[4][1]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(lines[4][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[4][3]).toEqual({
                value: '--blue',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(lines[4][4]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[4][5]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[4][8]).toEqual({
                value: ' Blue ',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css']
              });
              expect(lines[4][9]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(lines[5][1]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(lines[5][2]).toEqual({
                value: ' var(--test),',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css']
              });
              expect(lines[6][0]).toEqual({
                value: '    /*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css']
              });
              expect(lines[6][1]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(lines[6][2]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(lines[6][3]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[6][4]).toEqual({
                value: '--opacity',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(lines[6][5]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[6][7]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(lines[6][8]).toEqual({
                value: ' Transparency ',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css']
              });
              expect(lines[6][9]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              return expect(lines[7][1]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
            });
          });
          describe('gradients', function() {
            it('tokenises linear gradients', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ background-image: linear-gradient( 45deg, blue, red ); }').tokens;
              expect(tokens[6]).toEqual({
                value: 'linear-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[9]).toEqual({
                value: '45',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css']
              });
              expect(tokens[10]).toEqual({
                value: 'deg',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css', 'keyword.other.unit.deg.css']
              });
              expect(tokens[11]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[13]).toEqual({
                value: 'blue',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.color.w3c-standard-color-name.css']
              });
              expect(tokens[14]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[16]).toEqual({
                value: 'red',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.color.w3c-standard-color-name.css']
              });
              expect(tokens[18]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(tokens[19]).toEqual({
                value: ';',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
              });
              tokens = grammar.tokenizeLine('a{ background-image: LINear-graDIEnt( ellipse to left top, blue, red);').tokens;
              expect(tokens[6]).toEqual({
                value: 'LINear-graDIEnt',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']
              });
              expect(tokens[9]).toEqual({
                value: 'ellipse',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
              expect(tokens[11]).toEqual({
                value: 'to',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'keyword.operator.gradient.css']
              });
              expect(tokens[13]).toEqual({
                value: 'left',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
              expect(tokens[15]).toEqual({
                value: 'top',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
              expect(tokens[16]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[18]).toEqual({
                value: 'blue',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.color.w3c-standard-color-name.css']
              });
              expect(tokens[19]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.separator.list.comma.css']
              });
              return expect(tokens[21]).toEqual({
                value: 'red',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.color.w3c-standard-color-name.css']
              });
            });
            it('tokenises radial gradients', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ background-image: radial-gradient(farthest-corner at 45px 45px , #f00 0%, #00f 100%);}').tokens;
              expect(tokens[6]).toEqual({
                value: 'radial-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[8]).toEqual({
                value: 'farthest-corner',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
              expect(tokens[10]).toEqual({
                value: 'at',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'keyword.operator.gradient.css']
              });
              expect(tokens[12]).toEqual({
                value: '45',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css']
              });
              expect(tokens[13]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[15]).toEqual({
                value: '45',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css']
              });
              expect(tokens[16]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[18]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[20]).toEqual({
                value: '#',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css', 'punctuation.definition.constant.css']
              });
              expect(tokens[21]).toEqual({
                value: 'f00',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css']
              });
              expect(tokens[23]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css']
              });
              expect(tokens[24]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              tokens = grammar.tokenizeLine('a{ background-image: RADial-gradiENT(16px at 60px 50%,#000 0%, #000 14px, rgba(0,0,0,.3) 18px, transparent 19px)}').tokens;
              expect(tokens[6]).toEqual({
                value: 'RADial-gradiENT',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[8]).toEqual({
                value: '16',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css']
              });
              expect(tokens[9]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[11]).toEqual({
                value: 'at',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'keyword.operator.gradient.css']
              });
              expect(tokens[13]).toEqual({
                value: '60',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css']
              });
              expect(tokens[14]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(tokens[16]).toEqual({
                value: '50',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css']
              });
              expect(tokens[17]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(tokens[18]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[19]).toEqual({
                value: '#',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css', 'punctuation.definition.constant.css']
              });
              expect(tokens[20]).toEqual({
                value: '000',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css']
              });
              expect(tokens[33]).toEqual({
                value: 'rgba',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(tokens[34]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[35]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[36]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[41]).toEqual({
                value: '.3',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(tokens[42]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              return expect(tokens[48]).toEqual({
                value: 'transparent',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
            });
            it('matches gradients that span multiple lines with injected comments', function() {
              var lines;
              lines = grammar.tokenizeLines("a{\n  background-image: raDIAL-gradiENT(\n    ellipse farthest-corner/*@*/at/*@*/470px 47px,/*===\n========*/#FFFF80 20%, rgba(204, 153, 153, 0.4) 30%,/*))))))))}*/#E6E6FF 60%); }");
              expect(lines[1][4]).toEqual({
                value: 'raDIAL-gradiENT',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']
              });
              expect(lines[2][1]).toEqual({
                value: 'ellipse',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
              expect(lines[2][3]).toEqual({
                value: 'farthest-corner',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
              expect(lines[2][4]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(lines[2][5]).toEqual({
                value: '@',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css']
              });
              expect(lines[2][6]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(lines[2][7]).toEqual({
                value: 'at',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'keyword.operator.gradient.css']
              });
              expect(lines[2][8]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(lines[2][11]).toEqual({
                value: '470',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css']
              });
              expect(lines[2][12]).toEqual({
                value: 'px',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
              });
              expect(lines[2][16]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[2][17]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(lines[2][18]).toEqual({
                value: '===',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css']
              });
              expect(lines[3][0]).toEqual({
                value: '========',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css']
              });
              expect(lines[3][2]).toEqual({
                value: '#',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css', 'punctuation.definition.constant.css']
              });
              expect(lines[3][3]).toEqual({
                value: 'FFFF80',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css']
              });
              expect(lines[3][9]).toEqual({
                value: 'rgba',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(lines[3][10]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[3][20]).toEqual({
                value: '0.4',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(lines[3][21]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[3][26]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(lines[3][27]).toEqual({
                value: '))))))))}',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css']
              });
              expect(lines[3][28]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(lines[3][29]).toEqual({
                value: '#',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css', 'punctuation.definition.constant.css']
              });
              return expect(lines[3][30]).toEqual({
                value: 'E6E6FF',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css']
              });
            });
            it('highlights vendored gradient functions', function() {
              var lines;
              lines = grammar.tokenizeLines(".grad {\n  background-image: -webkit-linear-gradient(top,  /* For Chrome 25 and Safari 6, iOS 6.1, Android 4.3 */ hsl(0, 80%, 70%), #bada55);\n  background-image:    -moz-linear-gradient(top,  /* For Firefox (3.6 to 15) */ hsl(0, 80%, 70%), #bada55);\n  background-image:      -o-linear-gradient(top,  /* For old Opera (11.1 to 12.0) */  hsl(0, 80%, 70%), #bada55);\n}");
              expect(lines[1][4]).toEqual({
                value: '-webkit-linear-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']
              });
              expect(lines[1][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[1][6]).toEqual({
                value: 'top',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
              expect(lines[1][10]).toEqual({
                value: ' For Chrome 25 and Safari 6, iOS 6.1, Android 4.3 ',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css']
              });
              expect(lines[1][13]).toEqual({
                value: 'hsl',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(lines[1][22]).toEqual({
                value: '70',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(lines[1][23]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(lines[1][24]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[1][27]).toEqual({
                value: '#',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css', 'punctuation.definition.constant.css']
              });
              expect(lines[1][28]).toEqual({
                value: 'bada55',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'constant.other.color.rgb-value.hex.css']
              });
              expect(lines[1][29]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[2][4]).toEqual({
                value: '-moz-linear-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']
              });
              expect(lines[2][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[2][6]).toEqual({
                value: 'top',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.constant.property-value.css']
              });
              expect(lines[2][7]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[2][10]).toEqual({
                value: ' For Firefox (3.6 to 15) ',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css']
              });
              expect(lines[2][13]).toEqual({
                value: 'hsl',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(lines[2][14]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[2][24]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[2][29]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[3][4]).toEqual({
                value: '-o-linear-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']
              });
              expect(lines[3][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[3][10]).toEqual({
                value: ' For old Opera (11.1 to 12.0) ',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'comment.block.css']
              });
              expect(lines[3][13]).toEqual({
                value: 'hsl',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              return expect(lines[3][14]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
            });
            return it('highlights antique Webkit syntax as deprecated', function() {
              var lines;
              lines = grammar.tokenizeLines(".grad {\n  background-image: -webkit-gradient(linear, 0% 0%, 0% 100%,\n    from( rgb(0, 171, 235)),\n    color-stop(0.5, rgb(255, 255, 255)),\n    color-stop(0.5, rgb(102, 204, 0)),\n    to(rgb(255, 255, 255))),\n    -webkit-gradient(radial, 45 45, 10, 52 50, 30, from(#A7D30C), to(rgba(1,159,98,0)), color-stop(90%, #019F62)),\n        -webkit-gradient(radial, 105 105, 20, 112 120, 50, from(#ff5f98), to(rgba(255,1,136,0)), color-stop(75%, #ff0188)),\n        -webkit-gradient(radial, 95 15, 15, 102 20, 40, from(#00c9ff), to(rgba(0,201,255,0)), color-stop(80%, #00b5e2)),\n        -webkit-gradient(radial, 0 150, 50, 0 140, 90, from(#f4f201), to(rgba(228, 199,0,0)), color-stop(80%, #e4c700));\n}");
              expect(lines[1][4]).toEqual({
                value: '-webkit-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'invalid.deprecated.gradient.function.css']
              });
              expect(lines[1][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[1][6]).toEqual({
                value: 'linear',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'support.constant.property-value.css']
              });
              expect(lines[1][7]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[1][19]).toEqual({
                value: '100',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'constant.numeric.css']
              });
              expect(lines[1][20]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(lines[2][1]).toEqual({
                value: 'from',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'invalid.deprecated.function.css']
              });
              expect(lines[2][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[2][4]).toEqual({
                value: 'rgb',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(lines[2][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[2][9]).toEqual({
                value: '171',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(lines[2][10]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[2][14]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[3][1]).toEqual({
                value: 'color-stop',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'invalid.deprecated.function.css']
              });
              expect(lines[3][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[3][3]).toEqual({
                value: '0.5',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'constant.numeric.css']
              });
              expect(lines[3][4]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[3][16]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[3][17]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[4][1]).toEqual({
                value: 'color-stop',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'invalid.deprecated.function.css']
              });
              expect(lines[4][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[4][3]).toEqual({
                value: '0.5',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'constant.numeric.css']
              });
              expect(lines[4][4]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[4][6]).toEqual({
                value: 'rgb',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(lines[4][7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[4][8]).toEqual({
                value: '102',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(lines[4][9]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[4][11]).toEqual({
                value: '204',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(lines[4][12]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[4][14]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'constant.numeric.css']
              });
              expect(lines[4][15]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[4][16]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[4][17]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[5][1]).toEqual({
                value: 'to',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'invalid.deprecated.function.css']
              });
              expect(lines[5][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[5][12]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[5][13]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[5][14]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[5][15]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[6][1]).toEqual({
                value: '-webkit-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'invalid.deprecated.gradient.function.css']
              });
              expect(lines[6][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[6][3]).toEqual({
                value: 'radial',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'support.constant.property-value.css']
              });
              expect(lines[6][4]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[6][8]).toEqual({
                value: '45',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'constant.numeric.css']
              });
              expect(lines[6][31]).toEqual({
                value: 'rgba',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'meta.function.color.css', 'support.function.misc.css']
              });
              expect(lines[7][1]).toEqual({
                value: '-webkit-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'invalid.deprecated.gradient.function.css']
              });
              expect(lines[7][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[9][1]).toEqual({
                value: '-webkit-gradient',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'invalid.deprecated.gradient.function.css']
              });
              expect(lines[9][2]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[9][3]).toEqual({
                value: 'radial',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'support.constant.property-value.css']
              });
              expect(lines[9][4]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[9][6]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'constant.numeric.css']
              });
              expect(lines[9][8]).toEqual({
                value: '150',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'constant.numeric.css']
              });
              expect(lines[9][54]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.invalid.deprecated.gradient.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[9][55]).toEqual({
                value: ';',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
              });
              return expect(lines[10][0]).toEqual({
                value: '}',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
              });
            });
          });
          describe('other functions', function() {
            it('tokenises basic-shape functions', function() {
              var lines;
              lines = grammar.tokenizeLines("a{\n  shape-outside: circle(20em/*=*/at 50% 50%);\n  shape-outside: inset(1em, 1em, 1em, 1em);\n}");
              expect(lines[1][4]).toEqual({
                value: 'circle',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'support.function.shape.css']
              });
              expect(lines[1][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[1][6]).toEqual({
                value: '20',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css']
              });
              expect(lines[1][7]).toEqual({
                value: 'em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
              });
              expect(lines[1][8]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(lines[1][9]).toEqual({
                value: '=',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'comment.block.css']
              });
              expect(lines[1][10]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(lines[1][11]).toEqual({
                value: 'at',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'keyword.operator.shape.css']
              });
              expect(lines[1][13]).toEqual({
                value: '50',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css']
              });
              expect(lines[1][14]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(lines[1][16]).toEqual({
                value: '50',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css']
              });
              expect(lines[1][17]).toEqual({
                value: '%',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css', 'keyword.other.unit.percentage.css']
              });
              expect(lines[1][18]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[2][4]).toEqual({
                value: 'inset',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'support.function.shape.css']
              });
              expect(lines[2][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[2][6]).toEqual({
                value: '1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css']
              });
              expect(lines[2][7]).toEqual({
                value: 'em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
              });
              expect(lines[2][8]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[2][10]).toEqual({
                value: '1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css']
              });
              expect(lines[2][11]).toEqual({
                value: 'em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
              });
              expect(lines[2][12]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[2][14]).toEqual({
                value: '1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css']
              });
              expect(lines[2][15]).toEqual({
                value: 'em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
              });
              expect(lines[2][16]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[2][18]).toEqual({
                value: '1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css']
              });
              expect(lines[2][19]).toEqual({
                value: 'em',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
              });
              return expect(lines[2][20]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.shape.css', 'punctuation.section.function.end.bracket.round.css']
              });
            });
            it('tokenises OpenType feature functions', function() {
              var lines;
              lines = grammar.tokenizeLines(".font{\n  font-variant-alternates: stylistic(user-defined-ident);\n  font-variant-alternates: styleset(user-defined-ident);\n  font-variant-alternates: character-variant(user-defined-ident);\n  font-variant-alternates: swash(user-defined-ident);\n  font-variant-alternates: ornaments(user-defined-ident);\n  font-variant-alternates: annotation(user-defined-ident);\n  font-variant-alternates: swash(ident1) annotation(ident2);\n}");
              expect(lines[1][4]).toEqual({
                value: 'stylistic',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[1][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[1][6]).toEqual({
                value: 'user-defined-ident',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(lines[1][7]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[2][4]).toEqual({
                value: 'styleset',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[2][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[2][6]).toEqual({
                value: 'user-defined-ident',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(lines[2][7]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[3][4]).toEqual({
                value: 'character-variant',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[3][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[3][6]).toEqual({
                value: 'user-defined-ident',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(lines[3][7]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[4][4]).toEqual({
                value: 'swash',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[4][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[4][6]).toEqual({
                value: 'user-defined-ident',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(lines[4][7]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[5][4]).toEqual({
                value: 'ornaments',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[5][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[5][6]).toEqual({
                value: 'user-defined-ident',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(lines[5][7]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[6][4]).toEqual({
                value: 'annotation',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[6][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[6][6]).toEqual({
                value: 'user-defined-ident',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(lines[6][7]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[7][4]).toEqual({
                value: 'swash',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[7][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[7][6]).toEqual({
                value: 'ident1',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              expect(lines[7][7]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[7][9]).toEqual({
                value: 'annotation',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[7][10]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[7][11]).toEqual({
                value: 'ident2',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'variable.parameter.misc.css']
              });
              return expect(lines[7][12]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
            });
            return it('tokenises image-set()', function() {
              var lines;
              lines = grammar.tokenizeLines("a{\n    background-image: image-set( \"foo.png\" 1x,\n                                 \"foo-2x.png\" 2x,\n                                 \"foo-print.png\" 600dpi );\n}");
              expect(lines[0][0]).toEqual({
                value: 'a',
                scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
              });
              expect(lines[0][1]).toEqual({
                value: '{',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
              });
              expect(lines[1][1]).toEqual({
                value: 'background-image',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
              });
              expect(lines[1][2]).toEqual({
                value: ':',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
              });
              expect(lines[1][4]).toEqual({
                value: 'image-set',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'support.function.misc.css']
              });
              expect(lines[1][5]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(lines[1][7]).toEqual({
                value: '"',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
              });
              expect(lines[1][8]).toEqual({
                value: 'foo.png',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css']
              });
              expect(lines[1][9]).toEqual({
                value: '"',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
              });
              expect(lines[1][11]).toEqual({
                value: '1x',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'constant.numeric.other.density.css']
              });
              expect(lines[1][12]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[2][1]).toEqual({
                value: '"',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
              });
              expect(lines[2][2]).toEqual({
                value: 'foo-2x.png',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css']
              });
              expect(lines[2][3]).toEqual({
                value: '"',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
              });
              expect(lines[2][5]).toEqual({
                value: '2x',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'constant.numeric.other.density.css']
              });
              expect(lines[2][6]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.separator.list.comma.css']
              });
              expect(lines[3][1]).toEqual({
                value: '"',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
              });
              expect(lines[3][2]).toEqual({
                value: 'foo-print.png',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css']
              });
              expect(lines[3][3]).toEqual({
                value: '"',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
              });
              expect(lines[3][5]).toEqual({
                value: '600',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'constant.numeric.css']
              });
              expect(lines[3][6]).toEqual({
                value: 'dpi',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'constant.numeric.css', 'keyword.other.unit.dpi.css']
              });
              expect(lines[3][8]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.misc.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(lines[3][9]).toEqual({
                value: ';',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
              });
              return expect(lines[4][0]).toEqual({
                value: '}',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
              });
            });
          });
          describe('timing-functions', function() {
            it('tokenises them correctly', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ zoom: cubic-bezier(/**/1.2,/*=*/0,0,0/**/)}').tokens;
              expect(tokens[6]).toEqual({
                value: 'cubic-bezier',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'support.function.timing-function.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[8]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[9]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(tokens[10]).toEqual({
                value: '1.2',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'constant.numeric.css']
              });
              expect(tokens[11]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[12]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[13]).toEqual({
                value: '=',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'comment.block.css']
              });
              expect(tokens[14]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(tokens[15]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'constant.numeric.css']
              });
              expect(tokens[16]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[17]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'constant.numeric.css']
              });
              expect(tokens[18]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[19]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'constant.numeric.css']
              });
              expect(tokens[20]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[21]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              return expect(tokens[22]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'punctuation.section.function.end.bracket.round.css']
              });
            });
            return it('highlights the "start" and "end" keywords', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ before: steps(0, start); after: steps(1, end); }').tokens;
              expect(tokens[6]).toEqual({
                value: 'steps',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'support.function.timing-function.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[8]).toEqual({
                value: '0',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'constant.numeric.css']
              });
              expect(tokens[9]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[11]).toEqual({
                value: 'start',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'support.constant.step-direction.css']
              });
              expect(tokens[12]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'punctuation.section.function.end.bracket.round.css']
              });
              return expect(tokens[23]).toEqual({
                value: 'end',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.timing-function.css', 'support.constant.step-direction.css']
              });
            });
          });
          describe('variables', function() {
            it('scopes var() statements as variables', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{color: var(--name)}').tokens;
              expect(tokens[0]).toEqual({
                value: 'a',
                scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
              });
              expect(tokens[1]).toEqual({
                value: '{',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
              });
              expect(tokens[2]).toEqual({
                value: 'color',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
              });
              expect(tokens[3]).toEqual({
                value: ':',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
              });
              expect(tokens[5]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(tokens[6]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[7]).toEqual({
                value: '--name',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(tokens[8]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
              expect(tokens[9]).toEqual({
                value: '}',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
              });
              tokens = grammar.tokenizeLine('a{color: var(  --name  )}').tokens;
              expect(tokens[5]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(tokens[6]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[8]).toEqual({
                value: '--name',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              return expect(tokens[10]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
            });
            it('allows injected comments', function() {
              var tokens;
              tokens = grammar.tokenizeLine('a{ color: var( /*=*/ --something ) }').tokens;
              expect(tokens[6]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(tokens[7]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[9]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[10]).toEqual({
                value: '=',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'comment.block.css']
              });
              expect(tokens[11]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(tokens[13]).toEqual({
                value: '--something',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              return expect(tokens[15]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
            });
            return it('tokenises fallback values', function() {
              var tokens;
              tokens = grammar.tokenizeLine('.bar{ width: var(--page-width, /*;;;);*/ 2); }').tokens;
              expect(tokens[7]).toEqual({
                value: 'var',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'support.function.misc.css']
              });
              expect(tokens[8]).toEqual({
                value: '(',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.section.function.begin.bracket.round.css']
              });
              expect(tokens[9]).toEqual({
                value: '--page-width',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'variable.argument.css']
              });
              expect(tokens[10]).toEqual({
                value: ',',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.separator.list.comma.css']
              });
              expect(tokens[12]).toEqual({
                value: '/*',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
              });
              expect(tokens[13]).toEqual({
                value: ';;;);',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'comment.block.css']
              });
              expect(tokens[14]).toEqual({
                value: '*/',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
              });
              expect(tokens[16]).toEqual({
                value: '2',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'constant.numeric.css']
              });
              expect(tokens[17]).toEqual({
                value: ')',
                scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.variable.css', 'punctuation.section.function.end.bracket.round.css']
              });
              return expect(tokens[18]).toEqual({
                value: ';',
                scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
              });
            });
          });
          return it('does not tokenise functions with whitespace between name and parameters', function() {
            var tokens;
            tokens = grammar.tokenizeLine('a{ p: attr (title); }').tokens;
            expect(tokens[0]).toEqual({
              value: 'a',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[1]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[3]).toEqual({
              value: 'p',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css']
            });
            expect(tokens[4]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[6]).toEqual({
              value: 'attr (title',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
            });
            expect(tokens[7]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.property-list.css']
            });
            expect(tokens[8]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(tokens[10]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('a{url:url (s)}').tokens;
            expect(tokens[0]).toEqual({
              value: 'a',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[1]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[2]).toEqual({
              value: 'url',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css']
            });
            expect(tokens[3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[4]).toEqual({
              value: 'url (s',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
            });
            expect(tokens[5]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.property-list.css']
            });
            expect(tokens[6]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('a{content:url ("http://github.com/");}').tokens;
            expect(tokens[0]).toEqual({
              value: 'a',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[1]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[2]).toEqual({
              value: 'content',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[4]).toEqual({
              value: 'url (',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
            });
            expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
            });
            expect(tokens[6]).toEqual({
              value: 'http://github.com/',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']
            });
            expect(tokens[7]).toEqual({
              value: '"',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
            });
            expect(tokens[8]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.property-list.css']
            });
            expect(tokens[9]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            expect(tokens[10]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('a{content: url (http://a.pl/)}').tokens;
            expect(tokens[0]).toEqual({
              value: 'a',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[1]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[2]).toEqual({
              value: 'content',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[3]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[5]).toEqual({
              value: 'url (http://a.pl/',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
            });
            expect(tokens[6]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.property-list.css']
            });
            expect(tokens[7]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
            tokens = grammar.tokenizeLine('a{ color: rgb (187,255,221); }').tokens;
            expect(tokens[0]).toEqual({
              value: 'a',
              scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
            });
            expect(tokens[1]).toEqual({
              value: '{',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
            });
            expect(tokens[3]).toEqual({
              value: 'color',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
            });
            expect(tokens[4]).toEqual({
              value: ':',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
            });
            expect(tokens[6]).toEqual({
              value: 'rgb (',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
            });
            expect(tokens[7]).toEqual({
              value: '187',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(tokens[8]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.separator.list.comma.css']
            });
            expect(tokens[9]).toEqual({
              value: '255',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(tokens[10]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.separator.list.comma.css']
            });
            expect(tokens[11]).toEqual({
              value: '221',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
            });
            expect(tokens[12]).toEqual({
              value: ')',
              scopes: ['source.css', 'meta.property-list.css']
            });
            expect(tokens[13]).toEqual({
              value: ';',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
            });
            return expect(tokens[15]).toEqual({
              value: '}',
              scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
            });
          });
        });
        return describe('Unicode ranges', function() {
          it('tokenises single codepoints', function() {
            var tokens;
            tokens = grammar.tokenizeLine('a{ a: U+A5 }').tokens;
            return expect(tokens[6]).toEqual({
              value: 'U+A5',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
          });
          it('tokenises codepoint ranges', function() {
            var tokens;
            tokens = grammar.tokenizeLine('a{ a: U+0025-00FF }').tokens;
            expect(tokens[6]).toEqual({
              value: 'U+0025',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
            expect(tokens[7]).toEqual({
              value: '-',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css', 'punctuation.separator.dash.unicode-range.css']
            });
            expect(tokens[8]).toEqual({
              value: '00FF',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
            tokens = grammar.tokenizeLine('a{ unicode-range: u+0-7F }').tokens;
            expect(tokens[6]).toEqual({
              value: 'u+0',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
            expect(tokens[7]).toEqual({
              value: '-',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css', 'punctuation.separator.dash.unicode-range.css']
            });
            return expect(tokens[8]).toEqual({
              value: '7F',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
          });
          return it('tokenises wildcard ranges', function() {
            var tokens;
            tokens = grammar.tokenizeLine('a{ unicode-range: U+4?? }').tokens;
            expect(tokens[6]).toEqual({
              value: 'U+4??',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
            tokens = grammar.tokenizeLine('a{ unicode-range: U+0025-00FF, U+4?? }').tokens;
            expect(tokens[6]).toEqual({
              value: 'U+0025',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
            expect(tokens[7]).toEqual({
              value: '-',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css', 'punctuation.separator.dash.unicode-range.css']
            });
            expect(tokens[8]).toEqual({
              value: '00FF',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
            expect(tokens[9]).toEqual({
              value: ',',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.separator.list.comma.css']
            });
            return expect(tokens[11]).toEqual({
              value: 'U+4??',
              scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.unicode-range.css']
            });
          });
        });
      });
    });
    describe('escape sequences', function() {
      it('tokenizes escape sequences in single-quoted strings', function() {
        var tokens;
        tokens = grammar.tokenizeLine("very-custom { content: '\\c0ffee' }").tokens;
        expect(tokens[0]).toEqual({
          value: 'very-custom',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
        });
        expect(tokens[1]).toEqual({
          value: ' ',
          scopes: ['source.css']
        });
        expect(tokens[2]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        expect(tokens[3]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[4]).toEqual({
          value: 'content',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[6]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[7]).toEqual({
          value: "'",
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
        });
        return expect(tokens[8]).toEqual({
          value: '\\c0ffee',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'constant.character.escape.codepoint.css']
        });
      });
      it('tokenizes escape sequences in double-quoted strings', function() {
        var tokens;
        tokens = grammar.tokenizeLine('very-custom { content: "\\c0ffee" }').tokens;
        expect(tokens[0]).toEqual({
          value: 'very-custom',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.custom.css']
        });
        expect(tokens[1]).toEqual({
          value: ' ',
          scopes: ['source.css']
        });
        expect(tokens[2]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        expect(tokens[3]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[4]).toEqual({
          value: 'content',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[6]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[7]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        return expect(tokens[8]).toEqual({
          value: '\\c0ffee',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'constant.character.escape.codepoint.css']
        });
      });
      it('tokenises escape sequences in selectors', function() {
        var tokens;
        tokens = grammar.tokenizeLine('\\61 \\{ {  } \\}').tokens;
        expect(tokens[0]).toEqual({
          value: '\\61',
          scopes: ['source.css', 'constant.character.escape.codepoint.css']
        });
        expect(tokens[2]).toEqual({
          value: '\\{',
          scopes: ['source.css', 'constant.character.escape.css']
        });
        expect(tokens[4]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        expect(tokens[6]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
        expect(tokens[8]).toEqual({
          value: '\\}',
          scopes: ['source.css', 'constant.character.escape.css']
        });
        tokens = grammar.tokenizeLine('\\61\\ \\. \\@media {}').tokens;
        expect(tokens[0]).toEqual({
          value: '\\61',
          scopes: ['source.css', 'constant.character.escape.codepoint.css']
        });
        expect(tokens[1]).toEqual({
          value: '\\ ',
          scopes: ['source.css', 'constant.character.escape.css']
        });
        expect(tokens[2]).toEqual({
          value: '\\.',
          scopes: ['source.css', 'constant.character.escape.css']
        });
        expect(tokens[4]).toEqual({
          value: '\\@',
          scopes: ['source.css', 'constant.character.escape.css']
        });
        expect(tokens[5]).toEqual({
          value: 'media',
          scopes: ['source.css', 'meta.selector.css']
        });
        expect(tokens[6]).toEqual({
          value: ' ',
          scopes: ['source.css']
        });
        return expect(tokens[7]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
      });
      it('tokenises escape sequences in property lists', function() {
        var tokens;
        tokens = grammar.tokenizeLine('a { \\77\\69\\64\\74\\68: 20px; }').tokens;
        expect(tokens[4]).toEqual({
          value: '\\77',
          scopes: ['source.css', 'meta.property-list.css', 'constant.character.escape.codepoint.css']
        });
        expect(tokens[5]).toEqual({
          value: '\\69',
          scopes: ['source.css', 'meta.property-list.css', 'constant.character.escape.codepoint.css']
        });
        expect(tokens[6]).toEqual({
          value: '\\64',
          scopes: ['source.css', 'meta.property-list.css', 'constant.character.escape.codepoint.css']
        });
        expect(tokens[7]).toEqual({
          value: '\\74',
          scopes: ['source.css', 'meta.property-list.css', 'constant.character.escape.codepoint.css']
        });
        expect(tokens[8]).toEqual({
          value: '\\68',
          scopes: ['source.css', 'meta.property-list.css', 'constant.character.escape.codepoint.css']
        });
        return expect(tokens[9]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
      });
      return it('tokenises escape sequences in property values', function() {
        var tokens;
        tokens = grammar.tokenizeLine('a { content: \\1F764; }').tokens;
        expect(tokens[7]).toEqual({
          value: '\\1F764',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.character.escape.codepoint.css']
        });
        expect(tokens[8]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        return expect(tokens[10]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
    });
    describe('unclosed strings', function() {
      it('highlights an unterminated string as an error', function() {
        var tokens;
        tokens = grammar.tokenizeLine("a{ content: 'aaaa").tokens;
        expect(tokens[4]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[6]).toEqual({
          value: "'",
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
        });
        expect(tokens[7]).toEqual({
          value: 'aaaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'invalid.illegal.unclosed.string.css']
        });
        tokens = grammar.tokenizeLine('a{ content: "aaaa').tokens;
        expect(tokens[4]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[6]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        return expect(tokens[7]).toEqual({
          value: 'aaaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'invalid.illegal.unclosed.string.css']
        });
      });
      it("knows when a string is line-wrapped", function() {
        var lines;
        lines = grammar.tokenizeLines("a{\n  content: \"aaaaa\\\\\\\naaa\"; color: red;\n}");
        expect(lines[1][4]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        expect(lines[1][5]).toEqual({
          value: 'aaaaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']
        });
        expect(lines[1][6]).toEqual({
          value: '\\\\',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'constant.character.escape.css']
        });
        expect(lines[1][7]).toEqual({
          value: '\\',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'constant.character.escape.newline.css']
        });
        expect(lines[2][0]).toEqual({
          value: 'aaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']
        });
        expect(lines[2][1]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
        });
        expect(lines[2][2]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        expect(lines[2][4]).toEqual({
          value: 'color',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        lines = grammar.tokenizeLines("a{\n  content: 'aaaaa\\\\\\\naaa'; color: red;\n}");
        expect(lines[1][4]).toEqual({
          value: "'",
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
        });
        expect(lines[1][5]).toEqual({
          value: 'aaaaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css']
        });
        expect(lines[1][6]).toEqual({
          value: '\\\\',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'constant.character.escape.css']
        });
        expect(lines[1][7]).toEqual({
          value: '\\',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'constant.character.escape.newline.css']
        });
        expect(lines[2][0]).toEqual({
          value: 'aaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css']
        });
        expect(lines[2][1]).toEqual({
          value: "'",
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']
        });
        expect(lines[2][2]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        return expect(lines[2][4]).toEqual({
          value: 'color',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
      });
      it('highlights escape sequences inside invalid strings', function() {
        var tokens;
        tokens = grammar.tokenizeLine('a{ content: "aaa\\"aa').tokens;
        expect(tokens[6]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        expect(tokens[7]).toEqual({
          value: 'aaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'invalid.illegal.unclosed.string.css']
        });
        expect(tokens[8]).toEqual({
          value: '\\"',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'invalid.illegal.unclosed.string.css', 'constant.character.escape.css']
        });
        expect(tokens[9]).toEqual({
          value: 'aa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'invalid.illegal.unclosed.string.css']
        });
        tokens = grammar.tokenizeLine("a{ content: 'aaa\\'aa").tokens;
        expect(tokens[6]).toEqual({
          value: "'",
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']
        });
        expect(tokens[7]).toEqual({
          value: 'aaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'invalid.illegal.unclosed.string.css']
        });
        expect(tokens[8]).toEqual({
          value: "\\'",
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'invalid.illegal.unclosed.string.css', 'constant.character.escape.css']
        });
        return expect(tokens[9]).toEqual({
          value: 'aa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'invalid.illegal.unclosed.string.css']
        });
      });
      return it('highlights unclosed lines in line-wrapped strings', function() {
        var lines;
        lines = grammar.tokenizeLines("a{\n  content: \"aaa\\\"aa\\\naaaa\naaaa; color: red;\n}");
        expect(lines[1][4]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        expect(lines[1][5]).toEqual({
          value: 'aaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']
        });
        expect(lines[1][6]).toEqual({
          value: '\\"',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'constant.character.escape.css']
        });
        expect(lines[1][7]).toEqual({
          value: 'aa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']
        });
        expect(lines[1][8]).toEqual({
          value: '\\',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'constant.character.escape.newline.css']
        });
        expect(lines[2][0]).toEqual({
          value: 'aaaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'invalid.illegal.unclosed.string.css']
        });
        expect(lines[3][0]).toEqual({
          value: 'aaaa',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
        });
        expect(lines[3][1]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        expect(lines[3][3]).toEqual({
          value: 'color',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(lines[3][4]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(lines[3][6]).toEqual({
          value: 'red',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.color.w3c-standard-color-name.css']
        });
        expect(lines[3][7]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        return expect(lines[4][0]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
    });
    describe('comments', function() {
      it('tokenises comments inside @import statements', function() {
        var tokens;
        tokens = grammar.tokenizeLine('@import /* url("name"); */ "1.css";').tokens;
        expect(tokens[0]).toEqual({
          value: '@',
          scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
        });
        expect(tokens[1]).toEqual({
          value: 'import',
          scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
        });
        expect(tokens[3]).toEqual({
          value: '/*',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(tokens[4]).toEqual({
          value: ' url("name"); ',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css']
        });
        expect(tokens[5]).toEqual({
          value: '*/',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        expect(tokens[7]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        expect(tokens[8]).toEqual({
          value: '1.css',
          scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css']
        });
        expect(tokens[9]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
        });
        expect(tokens[10]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
        });
        tokens = grammar.tokenizeLine('@import/*";"*/ url("2.css");').tokens;
        expect(tokens[0]).toEqual({
          value: '@',
          scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
        });
        expect(tokens[1]).toEqual({
          value: 'import',
          scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
        });
        expect(tokens[2]).toEqual({
          value: '/*',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(tokens[3]).toEqual({
          value: '";"',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css']
        });
        expect(tokens[4]).toEqual({
          value: '*/',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        expect(tokens[6]).toEqual({
          value: 'url',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'support.function.url.css']
        });
        expect(tokens[7]).toEqual({
          value: '(',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
        });
        expect(tokens[8]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        expect(tokens[9]).toEqual({
          value: '2.css',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css']
        });
        expect(tokens[10]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
        });
        expect(tokens[11]).toEqual({
          value: ')',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
        });
        expect(tokens[12]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
        });
        tokens = grammar.tokenizeLine('@import url("3.css") print /* url(";"); */;').tokens;
        expect(tokens[0]).toEqual({
          value: '@',
          scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css', 'punctuation.definition.keyword.css']
        });
        expect(tokens[1]).toEqual({
          value: 'import',
          scopes: ['source.css', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.css']
        });
        expect(tokens[3]).toEqual({
          value: 'url',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'support.function.url.css']
        });
        expect(tokens[4]).toEqual({
          value: '(',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.begin.bracket.round.css']
        });
        expect(tokens[5]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']
        });
        expect(tokens[6]).toEqual({
          value: '3.css',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css']
        });
        expect(tokens[7]).toEqual({
          value: '"',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']
        });
        expect(tokens[8]).toEqual({
          value: ')',
          scopes: ['source.css', 'meta.at-rule.import.css', 'meta.function.url.css', 'punctuation.section.function.end.bracket.round.css']
        });
        expect(tokens[10]).toEqual({
          value: 'print',
          scopes: ['source.css', 'meta.at-rule.import.css', 'support.constant.media.css']
        });
        expect(tokens[12]).toEqual({
          value: '/*',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(tokens[13]).toEqual({
          value: ' url(";"); ',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css']
        });
        expect(tokens[14]).toEqual({
          value: '*/',
          scopes: ['source.css', 'meta.at-rule.import.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        return expect(tokens[15]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.at-rule.import.css', 'punctuation.terminator.rule.css']
        });
      });
      it('tokenises comments inside @font-face statements', function() {
        var tokens;
        tokens = grammar.tokenizeLine('@font-face/*"{;}"*/{}').tokens;
        expect(tokens[0]).toEqual({
          value: '@',
          scopes: ['source.css', 'meta.at-rule.font-face.css', 'keyword.control.at-rule.font-face.css', 'punctuation.definition.keyword.css']
        });
        expect(tokens[1]).toEqual({
          value: 'font-face',
          scopes: ['source.css', 'meta.at-rule.font-face.css', 'keyword.control.at-rule.font-face.css']
        });
        expect(tokens[2]).toEqual({
          value: '/*',
          scopes: ['source.css', 'meta.at-rule.font-face.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(tokens[3]).toEqual({
          value: '"{;}"',
          scopes: ['source.css', 'meta.at-rule.font-face.css', 'comment.block.css']
        });
        expect(tokens[4]).toEqual({
          value: '*/',
          scopes: ['source.css', 'meta.at-rule.font-face.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        expect(tokens[5]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        return expect(tokens[6]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      it('tokenizes comments before media queries', function() {
        var tokens;
        tokens = grammar.tokenizeLine('/* comment */ @media').tokens;
        expect(tokens[0]).toEqual({
          value: '/*',
          scopes: ['source.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(tokens[1]).toEqual({
          value: ' comment ',
          scopes: ['source.css', 'comment.block.css']
        });
        expect(tokens[2]).toEqual({
          value: '*/',
          scopes: ['source.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        expect(tokens[4]).toEqual({
          value: '@',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
        });
        return expect(tokens[5]).toEqual({
          value: 'media',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
        });
      });
      it('tokenizes comments after media queries', function() {
        var tokens;
        tokens = grammar.tokenizeLine('@media/* comment */ ()').tokens;
        expect(tokens[0]).toEqual({
          value: '@',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
        });
        expect(tokens[1]).toEqual({
          value: 'media',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
        });
        expect(tokens[2]).toEqual({
          value: '/*',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(tokens[3]).toEqual({
          value: ' comment ',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
        });
        return expect(tokens[4]).toEqual({
          value: '*/',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
      });
      it('tokenizes comments inside query lists', function() {
        var tokens;
        tokens = grammar.tokenizeLine('@media (max-height: 40em/* comment */)').tokens;
        expect(tokens[0]).toEqual({
          value: '@',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']
        });
        expect(tokens[1]).toEqual({
          value: 'media',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'keyword.control.at-rule.media.css']
        });
        expect(tokens[3]).toEqual({
          value: '(',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.begin.bracket.round.css']
        });
        expect(tokens[4]).toEqual({
          value: 'max-height',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'support.type.property-name.media.css']
        });
        expect(tokens[5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[7]).toEqual({
          value: '40',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css']
        });
        expect(tokens[8]).toEqual({
          value: 'em',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'constant.numeric.css', 'keyword.other.unit.em.css']
        });
        expect(tokens[9]).toEqual({
          value: '/*',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(tokens[10]).toEqual({
          value: ' comment ',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css']
        });
        expect(tokens[11]).toEqual({
          value: '*/',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        return expect(tokens[12]).toEqual({
          value: ')',
          scopes: ['source.css', 'meta.at-rule.media.header.css', 'punctuation.definition.parameters.end.bracket.round.css']
        });
      });
      it('tokenizes inline comments', function() {
        var tokens;
        tokens = grammar.tokenizeLine('section {border:4px/*padding:1px*/}').tokens;
        expect(tokens[0]).toEqual({
          value: 'section',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(tokens[1]).toEqual({
          value: ' ',
          scopes: ['source.css']
        });
        expect(tokens[2]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        expect(tokens[3]).toEqual({
          value: 'border',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[4]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[5]).toEqual({
          value: '4',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
        });
        expect(tokens[6]).toEqual({
          value: 'px',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
        });
        expect(tokens[7]).toEqual({
          value: '/*',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(tokens[8]).toEqual({
          value: 'padding:1px',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'comment.block.css']
        });
        expect(tokens[9]).toEqual({
          value: '*/',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        return expect(tokens[10]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      return it('tokenizes multi-line comments', function() {
        var lines;
        lines = grammar.tokenizeLines("  section {\n    border:4px /*1px;\n    padding:1px*/\n}");
        expect(lines[1][5]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
        });
        expect(lines[1][6]).toEqual({
          value: '/*',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'comment.block.css', 'punctuation.definition.comment.begin.css']
        });
        expect(lines[1][7]).toEqual({
          value: '1px;',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'comment.block.css']
        });
        expect(lines[2][0]).toEqual({
          value: '    padding:1px',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'comment.block.css']
        });
        expect(lines[2][1]).toEqual({
          value: '*/',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'comment.block.css', 'punctuation.definition.comment.end.css']
        });
        return expect(lines[3][0]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
    });
    describe('Animations', function() {
      return it('does not confuse animation names with predefined keywords', function() {
        var tokens;
        tokens = grammar.tokenizeLines('.animated {\n  animation-name: orphan-black;\n  animation-name: line-scale;\n}');
        expect(tokens[1][4]).toEqual({
          value: 'orphan-black',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
        });
        return expect(tokens[2][4]).toEqual({
          value: 'line-scale',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
        });
      });
    });
    describe('Transforms', function() {
      return it('tokenizes transform functions', function() {
        var tokens;
        tokens = grammar.tokenizeLines('.transformed {\n  transform: matrix(0, 1.5, -1.5, 0, 0, 100px);\n  transform: rotate(90deg) translateX(100px) scale(1.5);\n}');
        expect(tokens[1][1]).toEqual({
          value: 'transform',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[1][2]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[1][4]).toEqual({
          value: 'matrix',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.function.transform.css']
        });
        expect(tokens[1][5]).toEqual({
          value: '(',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.section.function.begin.bracket.round.css']
        });
        expect(tokens[1][6]).toEqual({
          value: '0',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
        });
        expect(tokens[1][7]).toEqual({
          value: ',',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.separator.list.comma.css']
        });
        expect(tokens[1][12]).toEqual({
          value: '-1.5',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
        });
        expect(tokens[1][22]).toEqual({
          value: 'px',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
        });
        expect(tokens[1][23]).toEqual({
          value: ')',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.section.function.end.bracket.round.css']
        });
        expect(tokens[2][4]).toEqual({
          value: 'rotate',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.function.transform.css']
        });
        expect(tokens[2][10]).toEqual({
          value: 'translateX',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.function.transform.css']
        });
        return expect(tokens[2][16]).toEqual({
          value: 'scale',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.function.transform.css']
        });
      });
    });
    describe("performance regressions", function() {
      it("does not hang when tokenizing invalid input preceding an equals sign", function() {
        var start;
        grammar = atom.grammars.grammarForScopeName('source.css');
        start = Date.now();
        grammar.tokenizeLine('<![CDATA[啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊"=');
        return expect(Date.now() - start).toBeLessThan(5000);
      });
      return it("does not hang when tokenizing accidental HTML tags", function() {
        var start;
        start = Date.now();
        grammar.tokenizeLines("<body>\n  [}~" + ('ÁÂÃÄÅÆÇÈÊËÍÎ'.repeat(100)) + "\n</body>");
        return expect(Date.now() - start).toBeLessThan(5000);
      });
    });
    describe("firstLineMatch", function() {
      it("recognises Emacs modelines", function() {
        var invalid, line, valid, _i, _j, _len, _len1, _ref, _ref1, _results;
        valid = "#-*- CSS -*-\n#-*- mode: CSS -*-\n/* -*-css-*- */\n// -*- CSS -*-\n/* -*- mode:CSS -*- */\n// -*- font:bar;mode:CSS -*-\n// -*- font:bar;mode:CSS;foo:bar; -*-\n// -*-font:mode;mode:CSS-*-\n// -*- foo:bar mode: css bar:baz -*-\n\" -*-foo:bar;mode:css;bar:foo-*- \";\n\" -*-font-mode:foo;mode:css;foo-bar:quux-*-\"\n\"-*-font:x;foo:bar; mode : CsS; bar:foo;foooooo:baaaaar;fo:ba;-*-\";\n\"-*- font:x;foo : bar ; mode : cSS ; bar : foo ; foooooo:baaaaar;fo:ba-*-\";";
        _ref = valid.split(/\n/);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          line = _ref[_i];
          expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull();
        }
        invalid = "/* --*css-*- */\n/* -*-- CSS -*-\n/* -*- -- CSS -*-\n/* -*- CSS -;- -*-\n// -*- CCSS -*-\n// -*- CSS; -*-\n// -*- css-stuff -*-\n/* -*- model:css -*-\n/* -*- indent-mode:css -*-\n// -*- font:mode;CSS -*-\n// -*- mode: -*- CSS\n// -*- mode: I-miss-plain-old-css -*-\n// -*-font:mode;mode:css--*-";
        _ref1 = invalid.split(/\n/);
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          line = _ref1[_j];
          _results.push(expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull());
        }
        return _results;
      });
      return it("recognises Vim modelines", function() {
        var invalid, line, valid, _i, _j, _len, _len1, _ref, _ref1, _results;
        valid = "vim: se filetype=css:\n# vim: se ft=css:\n# vim: set ft=CSS:\n# vim: set filetype=CSS:\n# vim: ft=CSS\n# vim: syntax=CSS\n# vim: se syntax=css:\n# ex: syntax=CSS\n# vim:ft=css\n# vim600: ft=css\n# vim>600: set ft=css:\n# vi:noai:sw=3 ts=6 ft=CSS\n# vi::::::::::noai:::::::::::: ft=CSS\n# vim:ts=4:sts=4:sw=4:noexpandtab:ft=cSS\n# vi:: noai : : : : sw   =3 ts   =6 ft  =Css\n# vim: ts=4: pi sts=4: ft=CSS: noexpandtab: sw=4:\n# vim: ts=4 sts=4: ft=css noexpandtab:\n# vim:noexpandtab sts=4 ft=css ts=4\n# vim:noexpandtab:ft=css\n# vim:ts=4:sts=4 ft=css:noexpandtab:\x20\n# vim:noexpandtab titlestring=hi\|there\\\\ ft=css ts=4";
        _ref = valid.split(/\n/);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          line = _ref[_i];
          expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull();
        }
        invalid = "ex: se filetype=css:\n_vi: se filetype=CSS:\n vi: se filetype=CSS\n# vim set ft=css3\n# vim: soft=css\n# vim: clean-syntax=css:\n# vim set ft=css:\n# vim: setft=CSS:\n# vim: se ft=css backupdir=tmp\n# vim: set ft=css set cmdheight=1\n# vim:noexpandtab sts:4 ft:CSS ts:4\n# vim:noexpandtab titlestring=hi\\|there\\ ft=CSS ts=4\n# vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=CSS ts=4";
        _ref1 = invalid.split(/\n/);
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          line = _ref1[_j];
          _results.push(expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull());
        }
        return _results;
      });
    });
    return describe("Missing supported properties regressions", function() {
      it("recognises place-items property as supported", function() {
        var tokens;
        tokens = grammar.tokenizeLines('a { place-items: center center; }');
        expect(tokens[0][0]).toEqual({
          value: 'a',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(tokens[0][1]).toEqual({
          value: ' ',
          scopes: ['source.css']
        });
        expect(tokens[0][2]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        expect(tokens[0][3]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][4]).toEqual({
          value: 'place-items',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[0][5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[0][6]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][7]).toEqual({
          value: 'center',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[0][8]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
        });
        expect(tokens[0][9]).toEqual({
          value: 'center',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[0][10]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        expect(tokens[0][11]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        return expect(tokens[0][12]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      it("recognises place-self property as supported", function() {
        var tokens;
        tokens = grammar.tokenizeLines('a { place-self: center center; }');
        expect(tokens[0][0]).toEqual({
          value: 'a',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(tokens[0][1]).toEqual({
          value: ' ',
          scopes: ['source.css']
        });
        expect(tokens[0][2]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        expect(tokens[0][3]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][4]).toEqual({
          value: 'place-self',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[0][5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[0][6]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][7]).toEqual({
          value: 'center',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[0][8]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
        });
        expect(tokens[0][9]).toEqual({
          value: 'center',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[0][10]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        expect(tokens[0][11]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        return expect(tokens[0][12]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      it("recognises place-content property as supported", function() {
        var tokens;
        tokens = grammar.tokenizeLines('a { place-content: center center; }');
        expect(tokens[0][0]).toEqual({
          value: 'a',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(tokens[0][1]).toEqual({
          value: ' ',
          scopes: ['source.css']
        });
        expect(tokens[0][2]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        expect(tokens[0][3]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][4]).toEqual({
          value: 'place-content',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[0][5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[0][6]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][7]).toEqual({
          value: 'center',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[0][8]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css']
        });
        expect(tokens[0][9]).toEqual({
          value: 'center',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']
        });
        expect(tokens[0][10]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        expect(tokens[0][11]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        return expect(tokens[0][12]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
      return it("recognises row-gap property as supported", function() {
        var tokens;
        tokens = grammar.tokenizeLines('a { row-gap: 5px; }');
        expect(tokens[0][0]).toEqual({
          value: 'a',
          scopes: ['source.css', 'meta.selector.css', 'entity.name.tag.css']
        });
        expect(tokens[0][1]).toEqual({
          value: ' ',
          scopes: ['source.css']
        });
        expect(tokens[0][2]).toEqual({
          value: '{',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']
        });
        expect(tokens[0][3]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][4]).toEqual({
          value: 'row-gap',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']
        });
        expect(tokens[0][5]).toEqual({
          value: ':',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']
        });
        expect(tokens[0][6]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        expect(tokens[0][7]).toEqual({
          value: '5',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']
        });
        expect(tokens[0][8]).toEqual({
          value: 'px',
          scopes: ['source.css', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']
        });
        expect(tokens[0][9]).toEqual({
          value: ';',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.terminator.rule.css']
        });
        expect(tokens[0][10]).toEqual({
          value: ' ',
          scopes: ['source.css', 'meta.property-list.css']
        });
        return expect(tokens[0][11]).toEqual({
          value: '}',
          scopes: ['source.css', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']
        });
      });
    });
  });

}).call(this);