
describe('SassDoc grammar', function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage('language-sass'));

    runs(() => grammar = atom.grammars.grammarForScopeName('source.css.scss'));
  });

  describe('block tags', function() {
    it('tokenises simple tags', function() {
      const {tokens} = grammar.tokenizeLine('/// @deprecated');
      expect(tokens[0]).toEqual({value: '///', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'punctuation.definition.comment.scss']});
      expect(tokens[1]).toEqual({value: ' ', scopes: ['source.css.scss', 'comment.block.documentation.scss']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'storage.type.class.sassdoc', 'punctuation.definition.block.tag.sassdoc']});
      expect(tokens[3]).toEqual({value: 'deprecated', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'storage.type.class.sassdoc']});
  });

    it('tokenises @param tags with a description', function() {
      const {tokens} = grammar.tokenizeLine('/// @param {type} $name - Description');
      expect(tokens[0]).toEqual({value: '///', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'punctuation.definition.comment.scss']});
      expect(tokens[2]).toEqual({value: '@', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'storage.type.class.sassdoc', 'punctuation.definition.block.tag.sassdoc']});
      expect(tokens[3]).toEqual({value: 'param', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'storage.type.class.sassdoc']});
      expect(tokens[5]).toEqual({value: '{', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'entity.name.type.instance.sassdoc', 'punctuation.definition.bracket.curly.begin.sassdoc']});
      expect(tokens[6]).toEqual({value: 'type', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'entity.name.type.instance.sassdoc']});
      expect(tokens[7]).toEqual({value: '}', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'entity.name.type.instance.sassdoc', 'punctuation.definition.bracket.curly.end.sassdoc']});
      expect(tokens[9]).toEqual({value: '$name', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'variable.other.sassdoc']});
      expect(tokens[10]).toEqual({value: ' - Description', scopes: ['source.css.scss', 'comment.block.documentation.scss']});
  });
});

  describe('highlighted examples', () => it('highlights SCSS after an @example tag', function() {
    const lines = grammar.tokenizeLines(`\
///
/// @example scss - Description
///   .class{top:clamp(42,$min: 13)}
///\
`
    );
    expect(lines[1][0]).toEqual({value: '///', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'punctuation.definition.comment.scss']});
    expect(lines[1][1]).toEqual({value: ' ', scopes: ['source.css.scss', 'comment.block.documentation.scss']});
    expect(lines[1][2]).toEqual({value: '@', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'storage.type.class.sassdoc', 'punctuation.definition.block.tag.sassdoc']});
    expect(lines[1][3]).toEqual({value: 'example', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'storage.type.class.sassdoc']});
    expect(lines[1][4]).toEqual({value: ' ', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc']});
    expect(lines[1][5]).toEqual({value: 'scss', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'variable.other.sassdoc']});
    expect(lines[1][6]).toEqual({value: ' ', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc']});
    expect(lines[1][7]).toEqual({value: '- Description', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss']});

    expect(lines[2][0]).toEqual({value: '///   ', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc']});
    expect(lines[2][1]).toEqual({value: '.', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(lines[2][2]).toEqual({value: 'class', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'entity.other.attribute-name.class.css']});
    expect(lines[2][3]).toEqual({value: '{', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.begin.bracket.curly.scss']});
    expect(lines[2][4]).toEqual({value: 'top', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-name.scss']});
    expect(lines[2][5]).toEqual({value: ':', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'punctuation.separator.key-value.scss']});
    expect(lines[2][6]).toEqual({value: 'clamp', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'support.function.misc.scss']});
    expect(lines[2][7]).toEqual({value: '(', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
    expect(lines[2][8]).toEqual({value: '42', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.parameter.url.scss']});
    expect(lines[2][9]).toEqual({value: ',', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.separator.delimiter.scss']});
    expect(lines[2][10]).toEqual({value: '$min', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.scss']});
    expect(lines[2][11]).toEqual({value: ':', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.parameter.url.scss']});
    expect(lines[2][12]).toEqual({value: ' ', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss']});
    expect(lines[2][13]).toEqual({value: '13', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'variable.parameter.url.scss']});
    expect(lines[2][14]).toEqual({value: ')', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'meta.property-value.scss', 'punctuation.section.function.scss']});
    expect(lines[2][15]).toEqual({value: '}', scopes: ['source.css.scss', 'comment.block.documentation.scss', 'meta.example.css.scss.sassdoc', 'source.embedded.css.scss', 'meta.property-list.scss', 'punctuation.section.property-list.end.bracket.curly.scss']});
}));
});
