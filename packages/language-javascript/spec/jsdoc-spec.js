
describe("JSDoc grammar", function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.packages.activatePackage("language-javascript"));

    runs(() => grammar = atom.grammars.grammarForScopeName("source.js"));
  });

  describe("inline tags", function() {
    it("tokenises tags without descriptions", function() {
      const {tokens} = grammar.tokenizeLine('/** Text {@link target} text */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[1]).toEqual({value: ' Text ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[2]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[3]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[4]).toEqual({value: 'link', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[6]).toEqual({value: 'target', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[8]).toEqual({value: ' text ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[9]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises tags with an embedded trailing description", function() {
      let {tokens} = grammar.tokenizeLine('/** Text {@linkplain target|Description text} */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[1]).toEqual({value: ' Text ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[2]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[3]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[4]).toEqual({value: 'linkplain', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[6]).toEqual({value: 'target', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[7]).toEqual({value: '|', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.separator.pipe.jsdoc']});
      expect(tokens[8]).toEqual({value: 'Description text', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** Text {@linkcode target Description text} */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[1]).toEqual({value: ' Text ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[2]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[3]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[4]).toEqual({value: 'linkcode', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[6]).toEqual({value: 'target', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[7]).toEqual({value: ' Description text', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[10]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises tags with a preceding description", function() {
      let {tokens} = grammar.tokenizeLine('/** Text [Description text]{@link target} */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[1]).toEqual({value: ' Text ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[2]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc', 'punctuation.definition.bracket.square.begin.jsdoc']});
      expect(tokens[3]).toEqual({value: 'Description text', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc']});
      expect(tokens[4]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc', 'punctuation.definition.bracket.square.end.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[7]).toEqual({value: 'link', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[9]).toEqual({value: 'target', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[12]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** Text [Description text]{@tutorial target|Description} */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[1]).toEqual({value: ' Text ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[2]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc', 'punctuation.definition.bracket.square.begin.jsdoc']});
      expect(tokens[3]).toEqual({value: 'Description text', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc']});
      expect(tokens[4]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc', 'punctuation.definition.bracket.square.end.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[7]).toEqual({value: 'tutorial', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[9]).toEqual({value: 'target', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[10]).toEqual({value: '|', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.separator.pipe.jsdoc']});
      expect(tokens[11]).toEqual({value: 'Description', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[12]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[14]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises inline tags which follow block tags", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {object} variable - this is a {@link linked} description */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' - this is a ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[12]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[13]).toEqual({value: 'link', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[15]).toEqual({value: 'linked', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[16]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[17]).toEqual({value: ' description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[18]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} variable - this is a {@link linked#description}. */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' - this is a ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[12]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[13]).toEqual({value: 'link', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[15]).toEqual({value: 'linked#description', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[16]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[17]).toEqual({value: '. ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[18]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} variable - this is a [description with a]{@link example}. */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' - this is a ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc', 'punctuation.definition.bracket.square.begin.jsdoc']});
      expect(tokens[12]).toEqual({value: 'description with a', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc']});
      expect(tokens[13]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'constant.other.description.jsdoc', 'punctuation.definition.bracket.square.end.jsdoc']});
      expect(tokens[14]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[15]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[16]).toEqual({value: 'link', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[18]).toEqual({value: 'example', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[19]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[20]).toEqual({value: '. ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[21]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises inline tags within default @param values", function() {
      const {tokens} = grammar.tokenizeLine('/** @param {EntityType} [typeHint={@link EntityType.FILE}] */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'EntityType', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: 'typeHint', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
      expect(tokens[12]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[13]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[14]).toEqual({value: 'link', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[16]).toEqual({value: 'EntityType.FILE', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[17]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[18]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
      expect(tokens[20]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });
});

  describe("block tags", function() {
    it("tokenises simple tags", function() {
      let {tokens} = grammar.tokenizeLine('/** @mixins */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'mixins', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[4]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[5]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @global @static */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'global', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[4]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[5]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[6]).toEqual({value: 'static', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[7]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[8]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises @see tags with basic links", function() {
      let {tokens} = grammar.tokenizeLine('/** @see name#path */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'see', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[4]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[5]).toEqual({value: 'name#path', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[6]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[7]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @see http://atom.io/ */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'see', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[4]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[5]).toEqual({value: 'http://atom.io/', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.link.underline.jsdoc']});
      expect(tokens[6]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[7]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises @see tags with {@link} tags", function() {
      let {tokens} = grammar.tokenizeLine('/** @see {@link text|Description} */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'see', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[7]).toEqual({value: 'link', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[9]).toEqual({value: 'text', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[10]).toEqual({value: '|', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.separator.pipe.jsdoc']});
      expect(tokens[11]).toEqual({value: 'Description', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[12]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[14]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @see [Description]{@link name#path} */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'see', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '[Description]', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[6]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[7]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.inline.tag.jsdoc']});
      expect(tokens[8]).toEqual({value: 'link', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[10]).toEqual({value: 'name#path', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'variable.other.description.jsdoc']});
      expect(tokens[11]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[13]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises tags with type expressions", function() {
      let {tokens} = grammar.tokenizeLine('/** @const {object} */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'const', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[4]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[8]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[9]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @define {object} */'));
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'define', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
  });

    it("tokenises unnamed @param tags", function() {
      const {tokens} = grammar.tokenizeLine('/** @param {object} */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[1]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[8]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[9]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises @param tags", function() {
      const {tokens} = grammar.tokenizeLine('/** @param {object} variable */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises @param tags with a description", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {object} variable this is the description */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @arg {object} variable this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'arg', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @argument {object} variable this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'argument', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} variable - this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' - this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} $variable this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '$variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises @param tags marked optional", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {object} [variable] this is the description */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
      expect(tokens[12]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[13]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} [ variable ] this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: ' variable ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
      expect(tokens[12]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
  });

    describe("default @param values", function() {
      it("tokenises unquoted values", function() {
        let {tokens} = grammar.tokenizeLine('/** @param {object} [variable=default value] this is the description */');
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[13]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[14]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {object} [variable = default value] this is the description */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[14]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[15]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {object} [ variable = default value ] this is the description */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: ' variable ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[13]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[14]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[16]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {object} [variable=default.value] this is the description */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: 'default', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'variable.other.object.js']});
        expect(tokens[13]).toEqual({value: '.', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.property.period.js']});
        expect(tokens[14]).toEqual({value: 'value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'support.variable.property.dom.js']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[16]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
    });

      it("tokenises quoted values", function() {
        let {tokens} = grammar.tokenizeLine('/** @param {object} [variable="default value"] this is the description */');
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[13]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[14]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[16]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {object} [variable = "default value"] this is the description */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[14]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[15]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[16]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[17]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {object} [ variable = " default value " ] this is the description */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: ' variable ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[14]).toEqual({value: ' default value ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[15]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[17]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[18]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine("/** @param {object} [variable='default value'] this is the description */"));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[13]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js']});
        expect(tokens[14]).toEqual({value: '\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[16]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine("/** @param {object} [variable = 'default value'] this is the description */"));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: '\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[14]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js']});
        expect(tokens[15]).toEqual({value: '\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']});
        expect(tokens[16]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[17]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine("/** @param {object} [ variable = ' default value ' ] this is the description */"));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: ' variable ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: '\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[14]).toEqual({value: ' default value ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js']});
        expect(tokens[15]).toEqual({value: '\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']});
        expect(tokens[17]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[18]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
    });

      it("tokenises object literals", function() {
        let {tokens} = grammar.tokenizeLine('/** @param {Object} [variable={a: "b"}] - An object */');
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[13]).toEqual({value: 'a', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[14]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
        expect(tokens[16]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[17]).toEqual({value: 'b', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[18]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[19]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[20]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[21]).toEqual({value: ' - An object ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Object} [ variable =  {  a : "b"  } ] - An object */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: ' variable ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[14]).toEqual({value: '  a ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[15]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
        expect(tokens[17]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[18]).toEqual({value: 'b', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[19]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[21]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[23]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[24]).toEqual({value: ' - An object ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Object} [variable={}] - Empty object */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'punctuation.section.scope.begin.js']});
        expect(tokens[13]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'punctuation.section.scope.end.js']});
        expect(tokens[14]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[15]).toEqual({value: ' - Empty object ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Object} [  variable  =  {  }  ] - Empty object */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: '  variable  ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[15]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[17]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[18]).toEqual({value: ' - Empty object ', scopes: ['source.js', 'comment.block.documentation.js']});
    });

      it("tokenises arrays", function() {
        let {tokens} = grammar.tokenizeLine('/** @param {Array} [variable=[1,2,3]] - An array */');
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Array', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[13]).toEqual({value: '1', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[14]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[15]).toEqual({value: '2', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[16]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[17]).toEqual({value: '3', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[18]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[19]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[20]).toEqual({value: ' - An array ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Array} [  variable   = [ 1 , 2 , 3  ] ] - An array */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Array', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: '  variable   ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[15]).toEqual({value: '1', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[17]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[19]).toEqual({value: '2', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[21]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[23]).toEqual({value: '3', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[25]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[27]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[28]).toEqual({value: ' - An array ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Array} [variable=[]] - Empty array */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Array', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[13]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[14]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[15]).toEqual({value: ' - Empty array ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Array} [  variable  =  [  ]  ] - Empty array */'));
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Array', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: '  variable  ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[13]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[17]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[18]).toEqual({value: ' - Empty array ', scopes: ['source.js', 'comment.block.documentation.js']});
    });

      it("tokenizes arrays inside object literals", function() {
        const {tokens} = grammar.tokenizeLine('/** @param {Object} [thing={a: [], b: [0, 2], c: "String"}] [Not Highlighted] [] [] [] */');
        expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
        expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
        expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'thing', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[13]).toEqual({value: 'a', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[14]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
        expect(tokens[16]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[17]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[18]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[19]).toEqual({value: ' b', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[20]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
        expect(tokens[22]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[23]).toEqual({value: '0', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[24]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[26]).toEqual({value: '2', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[27]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[28]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[29]).toEqual({value: ' c', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[30]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
        expect(tokens[32]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[33]).toEqual({value: 'String', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[34]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[35]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[36]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[37]).toEqual({value: ' [Not Highlighted] [] [] [] ', scopes: ['source.js', 'comment.block.documentation.js']});
        expect(tokens[38]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
    });

      it("flags any description text touching the closing bracket", function() {
        const {tokens} = grammar.tokenizeLine('/** @param {Object} [thing={a: [], b: [0, 2], c: "String"}][Bad Description] [] [] [] */');
        expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
        expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
        expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'thing', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[13]).toEqual({value: 'a', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[14]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
        expect(tokens[16]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[17]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[18]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[19]).toEqual({value: ' b', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[20]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
        expect(tokens[22]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[23]).toEqual({value: '0', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[24]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[26]).toEqual({value: '2', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
        expect(tokens[27]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
        expect(tokens[28]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
        expect(tokens[29]).toEqual({value: ' c', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
        expect(tokens[30]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
        expect(tokens[32]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[33]).toEqual({value: 'String', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[34]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[35]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
        expect(tokens[36]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[37]).toEqual({value: '[Bad', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'invalid.illegal.syntax.jsdoc']});
        expect(tokens[38]).toEqual({value: ' Description] [] [] [] ', scopes: ['source.js', 'comment.block.documentation.js']});
        expect(tokens[39]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
    });

      it("does not tokenise arrays inside strings", function() {
        let {tokens} = grammar.tokenizeLine('/** @param {Object} [thing=\'{a: [], b: [0, 2], c: "String"}][Quoted Description] [\'] [Unquoted Description] */');
        expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
        expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
        expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'thing', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: "'", scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[13]).toEqual({value: '{a: [], b: [0, 2], c: "String"}][Quoted Description] [', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js']});
        expect(tokens[14]).toEqual({value: "'", scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[16]).toEqual({value: ' [Unquoted Description] ', scopes: ['source.js', 'comment.block.documentation.js']});
        expect(tokens[17]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Object} [thing="{a: [], b: [0, 2], c: \'String\'}][Quoted Description] ["] [] [] */'));
        expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
        expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
        expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'Object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'thing', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[13]).toEqual({value: '{a: [], b: [0, 2], c: \'String\'}][Quoted Description] [', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[14]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[16]).toEqual({value: ' [] [] ', scopes: ['source.js', 'comment.block.documentation.js']});
        expect(tokens[17]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Object} [thing="{a: [], b: [0, 2], c: \'String\'}][Quoted Description] ["][Bad Description] [] */'));
        expect(tokens[14]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[16]).toEqual({value: '[Bad', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'invalid.illegal.syntax.jsdoc']});
        expect(tokens[17]).toEqual({value: ' Description] [] ', scopes: ['source.js', 'comment.block.documentation.js']});

        ({tokens} = grammar.tokenizeLine('/** @param {Object} [thing=\'{a: [], b: [0, 2], c: "String"}][Quoted Description] [\'][Bad_Unquoted Description] */'));
        expect(tokens[14]).toEqual({value: "'", scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']});
        expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[16]).toEqual({value: '[Bad_Unquoted', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'invalid.illegal.syntax.jsdoc']});
        expect(tokens[17]).toEqual({value: ' Description] ', scopes: ['source.js', 'comment.block.documentation.js']});
        expect(tokens[18]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
    });

      it("tokenises escape sequences inside strings", function() {
        let {tokens} = grammar.tokenizeLine('/** @param {String} [key="a[\\"]z"] */');
        expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
        expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
        expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'String', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'key', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[13]).toEqual({value: 'a[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[14]).toEqual({value: '\\"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'constant.character.escape.js']});
        expect(tokens[15]).toEqual({value: ']z', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
        expect(tokens[16]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
        expect(tokens[17]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[19]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

        ({tokens} = grammar.tokenizeLine("/** @param {String} [key='a[\\']z'] */"));
        expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
        expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
        expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
        expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
        expect(tokens[6]).toEqual({value: 'String', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
        expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
        expect(tokens[10]).toEqual({value: 'key', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
        expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
        expect(tokens[12]).toEqual({value: '\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']});
        expect(tokens[13]).toEqual({value: 'a[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js']});
        expect(tokens[14]).toEqual({value: '\\\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'constant.character.escape.js']});
        expect(tokens[15]).toEqual({value: ']z', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js']});
        expect(tokens[16]).toEqual({value: '\'', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']});
        expect(tokens[17]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
        expect(tokens[19]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
    });
  });

    it("tokenises @param tags with accessor-style names", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {object} parameter.property this is the description */');
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'parameter.property', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} [parameter.property] this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: 'parameter.property', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
      expect(tokens[12]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} [ parameter.property ] this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: ' parameter.property ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
      expect(tokens[12]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} [parameter.property=default value] this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: 'parameter.property', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
      expect(tokens[12]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
      expect(tokens[13]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
      expect(tokens[14]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} [parameter.property = default value] this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: 'parameter.property ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
      expect(tokens[12]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[13]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
      expect(tokens[14]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
      expect(tokens[15]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {object} [ parameter.property = default value ] this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: ' parameter.property ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
      expect(tokens[12]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[13]).toEqual({value: 'default value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
      expect(tokens[14]).toEqual({value: ' ', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[15]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.end.bracket.square.jsdoc']});
      expect(tokens[16]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
  });

    it("tokenises @param tags with wildcard types", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {*} variable this is the description */');
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '*', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      ({tokens} = grammar.tokenizeLine('/** @param {?} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '?', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
  });

    it("tokenises @param tags with qualified types", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {myNamespace.MyClass} variable this is the description */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'myNamespace.MyClass', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {Foo~cb} variable this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Foo~cb', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises @param tags with multiple types", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {function|string} variable this is the description */');
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function|string', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {string[]|number} variable this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'string', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: '|number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[12]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[13]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {string|number[]} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'string|number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[11]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {(number|function)} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(number|function)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {(string[]|number)} variable this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(string', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: '|number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[12]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[13]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[14]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {(string|number[])} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(string|number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[12]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[13]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
  });

    it("tokenises @param tags marked nullable or non-nullable", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {?number} variable this is the description */');
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '?number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {!number} variable this is the description */'));
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '!number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
  });

    it("tokenises @param tags marked as variable-length", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {...number} variable this is the description */');
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '...number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {...*} remainder */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '...*', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'remainder', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {...?} remainder */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '...?', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'remainder', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises @param tags using Google Closure Compiler syntax", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {number=} variable this is the description */');
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'number=', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {number[]} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[11]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {Foo[].bar} variable this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Foo', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: '.bar', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[12]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[13]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[14]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {Array<number>} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Array<number>', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {Array.<number>} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Array.<number>', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {Array<number>|Array<string>} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Array<number>|Array<string>', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {Array.<number>|Array.<string>} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Array.<number>|Array.<string>', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {(Array<number>|Array<string>)} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(Array<number>|Array<string>)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {(Array.<number>|Array.<string>)} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(Array.<number>|Array.<string>)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {Object<string, number>} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Object<string, number>', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {Object.<string, number>} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Object.<string, number>', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {Object<string, number>|Array<number>} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Object<string, number>|Array<number>', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {Object.<string, number>|Array.<number>} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Object.<string, number>|Array.<number>', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[10]).toEqual({value: ' this is the description ', scopes: ['source.js', 'comment.block.documentation.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {(Array<number>|Object<string, number>)} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(Array<number>|Object<string, number>)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {(Array.<number>|Object.<string, number>)} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(Array.<number>|Object.<string, number>)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function()} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function()', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function ()} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function ()', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function ( )} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function ( )', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(string)} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(string, number)} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string, number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(...string)} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(...string)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(string, ...number)} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string, ...number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(string, number, ...number)} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string, number, ...number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(!string)} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(!string)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(?string, !number)} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(?string, !number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(string[], number=)} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: ', number=)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[12]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function():number} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function():number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(string): number} variable this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string): number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @param {function(string) : number} variable this is the description */'));
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string) : number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'variable', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
  });

    it("tokenises @return tags without descriptions", function() {
      let {tokens} = grammar.tokenizeLine('/** @return {object} */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @returns {object} */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'returns', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises @return tags with trailing descriptions", function() {
      let {tokens} = grammar.tokenizeLine('/** @returns {object} this is the description */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'returns', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'this', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[10]).toEqual({value: ' is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @return {object} this is the description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'object', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: 'this', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[10]).toEqual({value: ' is the description ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      ({tokens} = grammar.tokenizeLine('/** @returns {(Something)} */'));
      expect(tokens[3]).toEqual({value: 'returns', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(Something)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
  });

    it("tokenises @return tags with multiple types", function() {
      let {tokens} = grammar.tokenizeLine('/** @return {Some|Thing} Something to return */');
      expect(tokens[3]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Some|Thing', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {(String[]|Number[])} Description */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '(String', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: '|Number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[10]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[11]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[12]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[13]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[15]).toEqual({value: 'Description', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(tokens[17]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises function-type @return tags", function() {
      let {tokens} = grammar.tokenizeLine('/** @return {function()} this is the description */');
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function()', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function ()} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function ()', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function ( )} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function ( )', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(string)} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(string, number)} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string, number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(...string)} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(...string)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(string, ...number)} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string, ...number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(string, number, ...number)} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string, number, ...number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(!string)} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(!string)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(?string, !number)} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(?string, !number)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(string[], number=)} this is the description */'));
      expect(tokens[3]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[8]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[9]).toEqual({value: ', number=)', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[10]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function():number} this is the description */'));
      expect(tokens[3]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function():number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(string): number} this is the description */'));
      expect(tokens[3]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string): number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});

      ({tokens} = grammar.tokenizeLine('/** @return {function(string) : number} this is the description */'));
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'function(string) : number', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
  });
});

  describe("highlighted JavaScript examples", function() {
    it("highlights JavaScript after an @example tag", function() {
      let lines = grammar.tokenizeLines(`\
/**
 * @example foo("bar");
 */\
`
      );
      expect(lines[1][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(lines[1][1]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(lines[1][2]).toEqual({value: 'example', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc']});
      expect(lines[1][4]).toEqual({value: 'foo', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'entity.name.function.js']});
      expect(lines[1][5]).toEqual({value: '(', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']});
      expect(lines[1][6]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
      expect(lines[1][7]).toEqual({value: 'bar', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js']});
      expect(lines[1][8]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
      expect(lines[1][9]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']});
      expect(lines[1][10]).toEqual({value: ';', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'punctuation.terminator.statement.js']});
      expect(lines[2][1]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      lines = grammar.tokenizeLines(`\
/**
 * @example
 * foo("bar");
 */\
`
      );
      expect(lines[1][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(lines[1][1]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(lines[1][2]).toEqual({value: 'example', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc']});
      expect(lines[1][3]).toEqual({value: '', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc']});
      expect(lines[2][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc']});
      expect(lines[2][1]).toEqual({value: 'foo', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'entity.name.function.js']});
      expect(lines[2][2]).toEqual({value: '(', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']});
      expect(lines[2][3]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
      expect(lines[2][4]).toEqual({value: 'bar', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js']});
      expect(lines[2][5]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
      expect(lines[2][6]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']});
      expect(lines[2][7]).toEqual({value: ';', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'punctuation.terminator.statement.js']});
      expect(lines[3][1]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      lines = grammar.tokenizeLines(`\
/**
 * @example foo("bar");
 * foo(foo("bar")); // Comment
 * 4 + 50;
 */\
`
      );
      expect(lines[1][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(lines[1][1]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(lines[1][2]).toEqual({value: 'example', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc']});
      expect(lines[1][4]).toEqual({value: 'foo', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'entity.name.function.js']});
      expect(lines[1][5]).toEqual({value: '(', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']});
      expect(lines[1][6]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
      expect(lines[1][7]).toEqual({value: 'bar', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js']});
      expect(lines[1][8]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
      expect(lines[1][9]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']});
      expect(lines[1][10]).toEqual({value: ';', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'punctuation.terminator.statement.js']});
      expect(lines[2][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc']});
      expect(lines[2][1]).toEqual({value: 'foo', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'entity.name.function.js']});
      expect(lines[2][2]).toEqual({value: '(', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']});
      expect(lines[2][3]).toEqual({value: 'foo', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'entity.name.function.js']});
      expect(lines[2][4]).toEqual({value: '(', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']});
      expect(lines[2][5]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
      expect(lines[2][6]).toEqual({value: 'bar', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js']});
      expect(lines[2][7]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
      expect(lines[2][8]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']});
      expect(lines[2][9]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']});
      expect(lines[2][10]).toEqual({value: ';', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'punctuation.terminator.statement.js']});
      expect(lines[2][12]).toEqual({value: '//', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']});
      expect(lines[2][13]).toEqual({value: ' Comment', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'comment.line.double-slash.js']});
      expect(lines[3][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc']});
      expect(lines[3][1]).toEqual({value: '4', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
      expect(lines[3][3]).toEqual({value: '+', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'keyword.operator.js']});
      expect(lines[3][5]).toEqual({value: '50', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'constant.numeric.decimal.js']});
      expect(lines[3][6]).toEqual({value: ';', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'punctuation.terminator.statement.js']});
      expect(lines[4][1]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });

    it("tokenises <caption> tags at the start of an example block", function() {
      const {tokens} = grammar.tokenizeLine('/** @example <caption>Text</caption> */');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'example', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '<', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc', 'punctuation.definition.bracket.angle.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'caption', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc']});
      expect(tokens[7]).toEqual({value: '>', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc', 'punctuation.definition.bracket.angle.end.jsdoc']});
      expect(tokens[8]).toEqual({value: 'Text', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'constant.other.description.jsdoc']});
      expect(tokens[9]).toEqual({value: '</', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc', 'punctuation.definition.bracket.angle.begin.jsdoc']});
      expect(tokens[10]).toEqual({value: 'caption', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc']});
      expect(tokens[11]).toEqual({value: '>', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc', 'punctuation.definition.bracket.angle.end.jsdoc']});
      expect(tokens[13]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});

      const lines = grammar.tokenizeLines(`\
/**
 * @example <caption>Text</caption>
 * foo("bar");
 * @return {String}
 */\
`
      );
      expect(lines[0][0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(lines[1][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(lines[1][1]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(lines[1][2]).toEqual({value: 'example', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc']});
      expect(lines[1][4]).toEqual({value: '<', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc', 'punctuation.definition.bracket.angle.begin.jsdoc']});
      expect(lines[1][5]).toEqual({value: 'caption', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc']});
      expect(lines[1][6]).toEqual({value: '>', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc', 'punctuation.definition.bracket.angle.end.jsdoc']});
      expect(lines[1][7]).toEqual({value: 'Text', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'constant.other.description.jsdoc']});
      expect(lines[1][8]).toEqual({value: '</', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc', 'punctuation.definition.bracket.angle.begin.jsdoc']});
      expect(lines[1][9]).toEqual({value: 'caption', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc']});
      expect(lines[1][10]).toEqual({value: '>', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'entity.name.tag.inline.jsdoc', 'punctuation.definition.bracket.angle.end.jsdoc']});
      expect(lines[2][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc']});
      expect(lines[2][1]).toEqual({value: 'foo', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'entity.name.function.js']});
      expect(lines[2][2]).toEqual({value: '(', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']});
      expect(lines[2][3]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
      expect(lines[2][4]).toEqual({value: 'bar', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js']});
      expect(lines[2][5]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
      expect(lines[2][6]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']});
      expect(lines[2][7]).toEqual({value: ';', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'punctuation.terminator.statement.js']});
      expect(lines[3][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc']});
      expect(lines[3][1]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(lines[3][2]).toEqual({value: 'return', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(lines[3][4]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(lines[3][5]).toEqual({value: 'String', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(lines[3][6]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(lines[3][7]).toEqual({value: '', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(lines[4][1]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
  });
});


  describe("when the containing comment ends unexpectedly", function() {
    it("terminates any unclosed tags", function() {
      let {tokens} = grammar.tokenizeLine('/** @param {String */ aa');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'String ', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
      expect(tokens[8]).toEqual({value: ' aa', scopes: ['source.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {*} [name={value: {a:[{*/}}]}] */'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: '*', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: 'name', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
      expect(tokens[12]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
      expect(tokens[13]).toEqual({value: 'value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
      expect(tokens[14]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
      expect(tokens[16]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
      expect(tokens[17]).toEqual({value: 'a', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
      expect(tokens[18]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
      expect(tokens[19]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
      expect(tokens[20]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
      expect(tokens[21]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
      expect(tokens[22]).toEqual({value: '}}', scopes: ['source.js']});
      expect(tokens[23]).toEqual({value: ']', scopes: ['source.js', 'meta.brace.square.js']});
      expect(tokens[24]).toEqual({value: '}', scopes: ['source.js']});
      expect(tokens[25]).toEqual({value: ']', scopes: ['source.js', 'meta.brace.square.js']});
      expect(tokens[27]).toEqual({value: '*', scopes: ['source.js', 'keyword.operator.js']});
      expect(tokens[28]).toEqual({value: '/', scopes: ['source.js', 'keyword.operator.js']});

      ({tokens} = grammar.tokenizeLine('/** @param {string="Foo*/oo"} bar'));
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'string="Foo', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
      expect(tokens[8]).toEqual({value: 'oo', scopes: ['source.js']});
      expect(tokens[9]).toEqual({value: '"', scopes: ['source.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
      expect(tokens[10]).toEqual({value: '} bar', scopes: ['source.js', 'string.quoted.double.js']});
  });

    it("terminates any embedded JavaScript code", function() {
      const lines = grammar.tokenizeLines(`\
/**
 * @example
 * foo("bar"); /* Comment */
 * @return {String}
 */\
`
      );
      expect(lines[0][0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(lines[1][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js']});
      expect(lines[1][1]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(lines[1][2]).toEqual({value: 'example', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'storage.type.class.jsdoc']});
      expect(lines[1][3]).toEqual({value: '', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc']});
      expect(lines[2][0]).toEqual({value: ' * ', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc']});
      expect(lines[2][1]).toEqual({value: 'foo', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'entity.name.function.js']});
      expect(lines[2][2]).toEqual({value: '(', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']});
      expect(lines[2][3]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
      expect(lines[2][4]).toEqual({value: 'bar', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js']});
      expect(lines[2][5]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
      expect(lines[2][6]).toEqual({value: ')', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']});
      expect(lines[2][7]).toEqual({value: ';', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'punctuation.terminator.statement.js']});
      expect(lines[2][9]).toEqual({value: '/*', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']});
      expect(lines[2][10]).toEqual({value: ' Comment ', scopes: ['source.js', 'comment.block.documentation.js', 'meta.example.jsdoc', 'source.embedded.js', 'comment.block.js']});
      expect(lines[2][11]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
      expect(lines[3][1]).toEqual({value: '*', scopes: ['source.js', 'keyword.operator.js']});
      expect(lines[3][2]).toEqual({value: ' @', scopes: ['source.js']});
      expect(lines[3][3]).toEqual({value: 'return', scopes: ['source.js', 'keyword.control.js']});
      expect(lines[3][5]).toEqual({value: '{', scopes: ['source.js', 'meta.brace.curly.js']});
      expect(lines[3][6]).toEqual({value: 'String', scopes: ['source.js', 'support.class.js']});
      expect(lines[3][7]).toEqual({value: '}', scopes: ['source.js', 'meta.brace.curly.js']});
      expect(lines[4][1]).toEqual({value: '*', scopes: ['source.js', 'keyword.operator.js']});
      expect(lines[4][2]).toEqual({value: '/', scopes: ['source.js', 'keyword.operator.js']});

      const {tokens} = grammar.tokenizeLine('/** @param {Something} [value={key: [value, ["22"}] */ 20;');
      expect(tokens[0]).toEqual({value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.js', 'comment.block.documentation.js', 'storage.type.class.jsdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.begin.jsdoc']});
      expect(tokens[6]).toEqual({value: 'Something', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'entity.name.type.instance.jsdoc', 'punctuation.definition.bracket.curly.end.jsdoc']});
      expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'punctuation.definition.optional-value.begin.bracket.square.jsdoc']});
      expect(tokens[10]).toEqual({value: 'value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc']});
      expect(tokens[11]).toEqual({value: '=', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'keyword.operator.assignment.jsdoc']});
      expect(tokens[12]).toEqual({value: '{', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
      expect(tokens[13]).toEqual({value: 'key', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
      expect(tokens[14]).toEqual({value: ':', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'keyword.operator.assignment.js']});
      expect(tokens[16]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
      expect(tokens[17]).toEqual({value: 'value', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js']});
      expect(tokens[18]).toEqual({value: ',', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.delimiter.object.comma.js']});
      expect(tokens[20]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
      expect(tokens[21]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']});
      expect(tokens[22]).toEqual({value: '22', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js']});
      expect(tokens[23]).toEqual({value: '"', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']});
      expect(tokens[24]).toEqual({value: '}', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.curly.js']});
      expect(tokens[25]).toEqual({value: ']', scopes: ['source.js', 'comment.block.documentation.js', 'variable.other.jsdoc', 'source.embedded.js', 'meta.brace.square.js']});
      expect(tokens[27]).toEqual({value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']});
      expect(tokens[29]).toEqual({value: '20', scopes: ['source.js', 'constant.numeric.decimal.js']});
      expect(tokens[30]).toEqual({value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']});
  });
});

  describe("when the line ends without a closing bracket", () => it("does not attempt to match the optional value (regression)", function() {
    const {tokens} = grammar.tokenizeLine('/** @param {array} [bar = "x" REMOVE THE CLOSE BRACKET HERE.');
    expect(tokens[9]).toEqual({value: '[', scopes: ['source.js', 'comment.block.documentation.js']});
    expect(tokens[11]).toEqual({value: ' = "x" REMOVE THE CLOSE BRACKET HERE.', scopes: ['source.js', 'comment.block.documentation.js']});
}));
});
