
const path = require('path');
const grammarTest = require('atom-grammar-test');

describe('TextMate HTML grammar', function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.packages.activatePackage('language-html'));

    runs(() => grammar = atom.grammars.grammarForScopeName('text.html.basic'));
  });

  it('parses the grammar', function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe('text.html.basic');
  });

  describe('style tags', function() {
    beforeEach(() => waitsForPromise(() => atom.packages.activatePackage('language-css')));

    it('tokenizes the tag attributes', function() {
      const lines = grammar.tokenizeLines(`\
<style id="id" class="very-classy">
</style>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(lines[0][1]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']});
      expect(lines[0][3]).toEqual({value: 'id', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'entity.other.attribute-name.id.html']});
      expect(lines[0][4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'punctuation.separator.key-value.html']});
      expect(lines[0][5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(lines[0][6]).toEqual({value: 'id', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'meta.toc-list.id.html']});
      expect(lines[0][7]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[0][9]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(lines[0][10]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(lines[0][11]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(lines[0][12]).toEqual({value: 'very-classy', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html']});
      expect(lines[0][13]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[0][14]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(lines[1][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(lines[1][1]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']});
      expect(lines[1][2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes multiline tag attributes', function() {
      const lines = grammar.tokenizeLines(`\
<style id="id"
 class="very-classy"
>
</style>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(lines[0][1]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']});
      expect(lines[0][3]).toEqual({value: 'id', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'entity.other.attribute-name.id.html']});
      expect(lines[0][4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'punctuation.separator.key-value.html']});
      expect(lines[0][5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(lines[0][6]).toEqual({value: 'id', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'meta.toc-list.id.html']});
      expect(lines[0][7]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[1][1]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(lines[1][5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[2][0]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(lines[3][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(lines[3][1]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']});
      expect(lines[3][2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes the content inside the tag as CSS', function() {
      const lines = grammar.tokenizeLines(`\
<style class="very-classy">
  span { color: red; }
</style>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(lines[1][0]).toEqual({value: '  ', scopes: ['text.html.basic', 'meta.tag.style.html', 'source.css.embedded.html']});
      expect(lines[1][1]).toEqual({value: 'span', scopes: ['text.html.basic', 'meta.tag.style.html', 'source.css.embedded.html', 'meta.selector.css', 'entity.name.tag.css']});
      expect(lines[2][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes multiline tags', function() {
      const lines = grammar.tokenizeLines(`\
<style
 class="very-classy">
  span { color: red; }
</style>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(lines[2][1]).toEqual({value: 'span', scopes: ['text.html.basic', 'meta.tag.style.html', 'source.css.embedded.html', 'meta.selector.css', 'entity.name.tag.css']});
      expect(lines[3][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
  });
});

  describe('script tags', function() {
    it('tokenizes the tag attributes', function() {
      const lines = grammar.tokenizeLines(`\
<script id="id" type="text/html">
</script>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[0][1]).toEqual({value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']});
      expect(lines[0][3]).toEqual({value: 'id', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'entity.other.attribute-name.id.html']});
      expect(lines[0][4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'punctuation.separator.key-value.html']});
      expect(lines[0][5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(lines[0][6]).toEqual({value: 'id', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'meta.toc-list.id.html']});
      expect(lines[0][7]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[0][9]).toEqual({value: 'type', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']});
      expect(lines[0][10]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']});
      expect(lines[0][11]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(lines[0][12]).toEqual({value: 'text/html', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});
      expect(lines[0][13]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[0][14]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[1][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[1][1]).toEqual({value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']});
      expect(lines[1][2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes multiline tag attributes', function() {
      const lines = grammar.tokenizeLines(`\
<script id="id" type="text/html"
 class="very-classy"
>
</script>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[0][1]).toEqual({value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']});
      expect(lines[0][3]).toEqual({value: 'id', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'entity.other.attribute-name.id.html']});
      expect(lines[0][4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'punctuation.separator.key-value.html']});
      expect(lines[0][5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(lines[0][6]).toEqual({value: 'id', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'meta.toc-list.id.html']});
      expect(lines[0][7]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[0][9]).toEqual({value: 'type', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']});
      expect(lines[0][10]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']});
      expect(lines[0][11]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(lines[0][12]).toEqual({value: 'text/html', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});
      expect(lines[0][13]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[1][1]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(lines[1][5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[2][0]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[3][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[3][1]).toEqual({value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']});
      expect(lines[3][2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });
});

  describe('template script tags', function() {
    it('tokenizes the content inside the tag as HTML', function() {
      const lines = grammar.tokenizeLines(`\
<script id='id' type='text/template'>
  <div>test</div>
</script>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[1][0]).toEqual({value: '  ', scopes: ['text.html.basic', 'meta.tag.script.html', 'text.embedded.html']});
      expect(lines[1][1]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'text.embedded.html', 'meta.tag.block.div.html', 'punctuation.definition.tag.begin.html']});
      expect(lines[2][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes multiline tags', function() {
      const lines = grammar.tokenizeLines(`\
<script id='id' type='text/template'
 class='very-classy'>
  <div>test</div>
</script>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[2][1]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'text.embedded.html', 'meta.tag.block.div.html', 'punctuation.definition.tag.begin.html']});
      expect(lines[3][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });
});

  describe('CoffeeScript script tags', function() {
    beforeEach(() => waitsForPromise(() => atom.packages.activatePackage('language-coffee-script')));

    it('tokenizes the content inside the tag as CoffeeScript', function() {
      const lines = grammar.tokenizeLines(`\
<script id='id' type='text/coffeescript'>
  -> console.log 'hi'
</script>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[1][0]).toEqual({value: '  ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html']});

      expect(lines[1][1]).toEqual({value: '->', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'meta.function.inline.coffee', 'storage.type.function.coffee']});
      expect(lines[2][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes multiline tags', function() {
      const lines = grammar.tokenizeLines(`\
<script id='id' type='text/coffeescript'
 class='very-classy'>
  -> console.log 'hi'
</script>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});

      expect(lines[2][1]).toEqual({value: '->', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'meta.function.inline.coffee', 'storage.type.function.coffee']});
      expect(lines[3][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });

    it('recognizes closing script tags in comments', function() {
      let lines = grammar.tokenizeLines(`\
<script id='id' type='text/coffeescript'>
  # comment </script>\
`
      );

      expect(lines[1][1]).toEqual({value: '#', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'comment.line.number-sign.coffee', 'punctuation.definition.comment.coffee']});
      expect(lines[1][2]).toEqual({value: ' comment ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'comment.line.number-sign.coffee']});
      expect(lines[1][3]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});

      lines = grammar.tokenizeLines(`\
<script id='id' type='text/coffeescript'>
  ###
  comment </script>\
`
      );

      expect(lines[1][1]).toEqual({value: '###', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'comment.block.coffee', 'punctuation.definition.comment.coffee']});
      expect(lines[2][0]).toEqual({value: '  comment ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'comment.block.coffee']});
      expect(lines[2][1]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });
});

  describe('JavaScript script tags', function() {
    beforeEach(() => waitsForPromise(() => atom.packages.activatePackage('language-javascript')));

    it('tokenizes the content inside the tag as JavaScript', function() {
      const lines = grammar.tokenizeLines(`\
<script id='id' type='text/javascript'>
  var hi = 'hi'
</script>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[1][0]).toEqual({value: '  ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html']});
      expect(lines[1][1]).toEqual({value: 'var', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'storage.type.var.js']});
      expect(lines[2][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes multiline tags', function() {
      const lines = grammar.tokenizeLines(`\
<script id='id'
 class='very-classy'>
  var hi = 'hi'
</script>\
`
      );

      expect(lines[0][0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(lines[2][1]).toEqual({value: 'var', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'storage.type.var.js']});
      expect(lines[3][0]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });

    it('recognizes closing script tags in comments', function() {
      let lines = grammar.tokenizeLines(`\
<script id='id' type='text/javascript'>
  // comment </script>\
`
      );

      expect(lines[1][1]).toEqual({value: '//', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']});
      expect(lines[1][2]).toEqual({value: ' comment ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'comment.line.double-slash.js']});
      expect(lines[1][3]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});

      lines = grammar.tokenizeLines(`\
<script id='id' type='text/javascript'>
  /*
  comment </script>\
`
      );

      expect(lines[1][1]).toEqual({value: '/*', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'comment.block.js', 'punctuation.definition.comment.begin.js']});
      expect(lines[2][0]).toEqual({value: '  comment ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'comment.block.js']});
      expect(lines[2][1]).toEqual({value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });
});

  describe('comments', () => it('tokenizes -- as an error', function() {
    let {tokens} = grammar.tokenizeLine('<!-- some comment --->');

    expect(tokens[0]).toEqual({value: '<!--', scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html']});
    expect(tokens[1]).toEqual({value: ' some comment -', scopes: ['text.html.basic', 'comment.block.html']});
    expect(tokens[2]).toEqual({value: '-->', scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html']});

    ({tokens} = grammar.tokenizeLine('<!-- -- -->'));

    expect(tokens[0]).toEqual({value: '<!--', scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html']});
    expect(tokens[1]).toEqual({value: ' ', scopes: ['text.html.basic', 'comment.block.html']});
    expect(tokens[2]).toEqual({value: '--', scopes: ['text.html.basic', 'comment.block.html', 'invalid.illegal.bad-comments-or-CDATA.html']});
    expect(tokens[3]).toEqual({value: ' ', scopes: ['text.html.basic', 'comment.block.html']});
    expect(tokens[4]).toEqual({value: '-->', scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html']});
}));

  grammarTest(path.join(__dirname, 'fixtures/syntax_test_html.html'));
  grammarTest(path.join(__dirname, 'fixtures/syntax_test_html_template_fragments.html'));

  describe('attributes', function() {
    it('recognizes a single attribute with a quoted value', function() {
      let {tokens} = grammar.tokenizeLine('<span class="foo">');

      expect(tokens[3]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(tokens[5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[6]).toEqual({value: 'foo', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html']});
      expect(tokens[7]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(tokens[8]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});

      ({tokens} = grammar.tokenizeLine("<span class='foo'>"));

      expect(tokens[3]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(tokens[5]).toEqual({value: "'", scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.single.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[6]).toEqual({value: 'foo', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.single.html']});
      expect(tokens[7]).toEqual({value: "'", scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.single.html', 'punctuation.definition.string.end.html']});
      expect(tokens[8]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
  });

    it('recognizes a single attribute with spaces around the equals sign', function() {
      let {tokens} = grammar.tokenizeLine('<span class   ="foo">');

      expect(tokens[3]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(tokens[4]).toEqual({value: '   ', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html']});
      expect(tokens[5]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(tokens[6]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[7]).toEqual({value: 'foo', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html']});
      expect(tokens[8]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(tokens[9]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});

      ({tokens} = grammar.tokenizeLine('<span class=   "foo">'));

      expect(tokens[3]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(tokens[5]).toEqual({value: '   ', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html']});
      expect(tokens[6]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[7]).toEqual({value: 'foo', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html']});
      expect(tokens[8]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(tokens[9]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});

      ({tokens} = grammar.tokenizeLine('<span class   =   "foo">'));

      expect(tokens[3]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(tokens[4]).toEqual({value: '   ', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html']});
      expect(tokens[5]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(tokens[6]).toEqual({value: '   ', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html']});
      expect(tokens[7]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[8]).toEqual({value: 'foo', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html']});
      expect(tokens[9]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(tokens[10]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
  });

    it('recognizes a single attribute with an unquoted value', function() {
      const {tokens} = grammar.tokenizeLine('<span class=foo-3+5@>');

      expect(tokens[3]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(tokens[5]).toEqual({value: 'foo-3+5@', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.unquoted.html']});
      expect(tokens[6]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
  });

    it('recognizes a single attribute with no value', function() {
      const {tokens} = grammar.tokenizeLine('<span class>');

      expect(tokens[3]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-without-value.html', 'entity.other.attribute-name.html']});
      expect(tokens[4]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
  });

    it('recognizes multiple attributes with varying values', function() {
      const {tokens} = grammar.tokenizeLine("<span class='btn' disabled spellcheck=true>");

      expect(tokens[3]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(tokens[5]).toEqual({value: "'", scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.single.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[6]).toEqual({value: 'btn', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.single.html']});
      expect(tokens[7]).toEqual({value: "'", scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.single.html', 'punctuation.definition.string.end.html']});
      expect(tokens[8]).toEqual({value: ' ', scopes: ['text.html.basic', 'meta.tag.inline.span.html']});
      expect(tokens[9]).toEqual({value: 'disabled', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-without-value.html', 'entity.other.attribute-name.html']});
      expect(tokens[10]).toEqual({value: ' ', scopes: ['text.html.basic', 'meta.tag.inline.span.html']});
      expect(tokens[11]).toEqual({value: 'spellcheck', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']});
      expect(tokens[12]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']});
      expect(tokens[13]).toEqual({value: 'true', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.html', 'string.unquoted.html']});
      expect(tokens[14]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
  });

    it('recognizes attributes that are not on the same line as the tag name', function() {
      const lines = grammar.tokenizeLines(`\
<span
 class="foo"
 disabled>\
`
      );

      expect(lines[1][1]).toEqual({value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']});
      expect(lines[1][2]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'punctuation.separator.key-value.html']});
      expect(lines[1][5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.class.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(lines[2][1]).toEqual({value: 'disabled', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-without-value.html', 'entity.other.attribute-name.html']});
      expect(lines[2][2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
  });

    it('tokenizes only one attribute value in a row', function() {
      // The following line is invalid per HTML specification, however some browsers parse the 'world' as attribute for compatibility reasons.
      const {tokens} = grammar.tokenizeLine('<span attr="hello"world>');

      expect(tokens[3]).toEqual({value: 'attr', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']});
      expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']});
      expect(tokens[5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[6]).toEqual({value: 'hello', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});
      expect(tokens[7]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(tokens[8]).toEqual({value: 'world', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-without-value.html', 'entity.other.attribute-name.html']});
      expect(tokens[9]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
  });

    describe("the 'style' attribute", function() {
      let quote, type;
      beforeEach(() => waitsForPromise(() => atom.packages.activatePackage('language-css')));

      const quotes = {
        '"': 'double',
        "'": 'single'
      };

      for (quote in quotes) {
        type = quotes[quote];
        it(`tokenizes ${type}-quoted style attribute values as CSS property lists`, function() {
          let {tokens} = grammar.tokenizeLine(`<span style=${quote}display: none;${quote}>`);

          expect(tokens[3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
          expect(tokens[5]).toEqual({value: quote, scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'punctuation.definition.string.begin.html']});
          expect(tokens[6]).toEqual({value: 'display', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
          expect(tokens[9]).toEqual({value: 'none', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
          expect(tokens[10]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
          expect(tokens[11]).toEqual({value: quote, scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'punctuation.definition.string.end.html']});
          expect(tokens[12]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});

          ({tokens} = grammar.tokenizeLine(`<span style=${quote}display: none; z-index: 10;${quote}>`));

          expect(tokens[3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
          expect(tokens[5]).toEqual({value: quote, scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'punctuation.definition.string.begin.html']});
          expect(tokens[6]).toEqual({value: 'display', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
          expect(tokens[9]).toEqual({value: 'none', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
          expect(tokens[10]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
          expect(tokens[12]).toEqual({value: 'z-index', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
          expect(tokens[15]).toEqual({value: '10', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']});
          expect(tokens[16]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
          expect(tokens[17]).toEqual({value: quote, scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'punctuation.definition.string.end.html']});
          expect(tokens[18]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
      });

        it(`tokenizes ${type}-quoted multiline attributes`, function() {
          const lines = grammar.tokenizeLines(`\
<span style=${quote}display: none;
z-index: 10;${quote}>\
`
          );

          expect(lines[0][3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
          expect(lines[0][5]).toEqual({value: quote, scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'punctuation.definition.string.begin.html']});
          expect(lines[0][6]).toEqual({value: 'display', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
          expect(lines[0][9]).toEqual({value: 'none', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
          expect(lines[0][10]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
          expect(lines[1][0]).toEqual({value: 'z-index', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
          expect(lines[1][3]).toEqual({value: '10', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']});
          expect(lines[1][4]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
          expect(lines[1][5]).toEqual({value: quote, scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'punctuation.definition.string.end.html']});
          expect(lines[1][6]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
      });
      }

      it('tokenizes incomplete property lists', function() {
        const {tokens} = grammar.tokenizeLine('<span style="display: none">');

        expect(tokens[3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
        expect(tokens[5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
        expect(tokens[6]).toEqual({value: 'display', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.quoted.double.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
        expect(tokens[9]).toEqual({value: 'none', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.quoted.double.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
        expect(tokens[10]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
        expect(tokens[11]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});

        const lines = grammar.tokenizeLines(`\
<span style=${quote}display: none;
z-index: 10${quote}>\
`
        );

        expect(lines[0][3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
        expect(lines[0][5]).toEqual({value: quote, scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'punctuation.definition.string.begin.html']});
        expect(lines[0][6]).toEqual({value: 'display', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
        expect(lines[0][9]).toEqual({value: 'none', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
        expect(lines[0][10]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
        expect(lines[1][0]).toEqual({value: 'z-index', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
        expect(lines[1][3]).toEqual({value: '10', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']});
        expect(lines[1][4]).toEqual({value: quote, scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', `string.quoted.${type}.html`, 'punctuation.definition.string.end.html']});
        expect(lines[1][5]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
    });

      it('ends invalid quoted property lists correctly', function() {
        const {tokens} = grammar.tokenizeLine('<span style="s:">');

        expect(tokens[3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
        expect(tokens[5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
        expect(tokens[6]).toEqual({value: 's', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.quoted.double.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css']});
        expect(tokens[7]).toEqual({value: ':', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.quoted.double.html', 'source.css.style.html', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
        expect(tokens[8]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
        expect(tokens[9]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
    });

      it('tokenizes unquoted property lists', function() {
        let {tokens} = grammar.tokenizeLine('<span style=display:none;></span>');

        expect(tokens[3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
        expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'punctuation.separator.key-value.html']});
        expect(tokens[5]).toEqual({value: 'display', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
        expect(tokens[7]).toEqual({value: 'none', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
        expect(tokens[8]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
        expect(tokens[9]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});

        ({tokens} = grammar.tokenizeLine('<span style=display:none;z-index:10></span>'));

        expect(tokens[3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
        expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'punctuation.separator.key-value.html']});
        expect(tokens[5]).toEqual({value: 'display', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
        expect(tokens[7]).toEqual({value: 'none', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
        expect(tokens[8]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
        expect(tokens[9]).toEqual({value: 'z-index', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
        expect(tokens[11]).toEqual({value: '10', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']});
        expect(tokens[12]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
    });

      it('ends invalid unquoted property lists correctly', function() {
        let {tokens} = grammar.tokenizeLine('<span style=s:></span>');

        expect(tokens[3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
        expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'punctuation.separator.key-value.html']});
        expect(tokens[5]).toEqual({value: 's', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css']});
        expect(tokens[6]).toEqual({value: ':', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
        expect(tokens[7]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});

        ({tokens} = grammar.tokenizeLine('<span style=display: none></span>'));

        expect(tokens[3]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'entity.other.attribute-name.style.html']});
        expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'punctuation.separator.key-value.html']});
        expect(tokens[5]).toEqual({value: 'display', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'meta.property-name.css', 'support.type.property-name.css']});
        expect(tokens[6]).toEqual({value: ':', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-with-value.style.html', 'string.unquoted.html', 'source.css.style.html', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
        expect(tokens[7]).toEqual({value: ' ', scopes: ['text.html.basic', 'meta.tag.inline.span.html']});
        expect(tokens[8]).toEqual({value: 'none', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'meta.attribute-without-value.html', 'entity.other.attribute-name.html']});
        expect(tokens[9]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
    });
  });
});

  describe('character references', function() {
    it('tokenizes & and characters after it', function() {
      // NOTE: &a should NOT be tokenized as a character reference as there is no semicolon following it
      // We have no way of knowing if there will ever be a semicolon so we play conservatively.
      const {tokens} = grammar.tokenizeLine('& &amp; &a');

      expect(tokens[0]).toEqual({value: '& ', scopes: ['text.html.basic']});
      expect(tokens[1]).toEqual({value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']});
      expect(tokens[2]).toEqual({value: 'amp', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']});
      expect(tokens[3]).toEqual({value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']});
      expect(tokens[4]).toEqual({value: ' &a', scopes: ['text.html.basic']});

      const lines = grammar.tokenizeLines('&\n');
      expect(lines[0][0]).toEqual({value: '&', scopes: ['text.html.basic']});
  });

    it('tokenizes hexadecimal and digit character references', function() {
      const {tokens} = grammar.tokenizeLine('&#x00022; &#X00022; &#34;');

      expect(tokens[0]).toEqual({value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']});
      expect(tokens[1]).toEqual({value: '#x00022', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']});
      expect(tokens[2]).toEqual({value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']});
      expect(tokens[4]).toEqual({value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']});
      expect(tokens[5]).toEqual({value: '#X00022', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']});
      expect(tokens[6]).toEqual({value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']});
      expect(tokens[8]).toEqual({value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']});
      expect(tokens[9]).toEqual({value: '#34', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']});
      expect(tokens[10]).toEqual({value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']});
  });

    it('tokenizes invalid ampersands', function() {
      let {tokens} = grammar.tokenizeLine('PSE&>');
      expect(tokens[0]).toEqual({value: 'PSE', scopes: ['text.html.basic']});
      expect(tokens[1]).toEqual({value: '&', scopes: ['text.html.basic', 'invalid.illegal.bad-ampersand.html']});
      expect(tokens[2]).toEqual({value: '>', scopes: ['text.html.basic']});

      ({tokens} = grammar.tokenizeLine('PSE&'));
      expect(tokens[0]).toEqual({value: 'PSE&', scopes: ['text.html.basic']});

      ({tokens} = grammar.tokenizeLine('&<'));
      expect(tokens[0]).toEqual({value: '&<', scopes: ['text.html.basic']});

      ({tokens} = grammar.tokenizeLine('& '));
      expect(tokens[0]).toEqual({value: '& ', scopes: ['text.html.basic']});

      ({tokens} = grammar.tokenizeLine('&'));
      expect(tokens[0]).toEqual({value: '&', scopes: ['text.html.basic']});

      ({tokens} = grammar.tokenizeLine('&&'));
      expect(tokens[0]).toEqual({value: '&&', scopes: ['text.html.basic']});
  });

    it('tokenizes character references in attributes', function() {
      const {tokens} = grammar.tokenizeLine('<a href="http://example.com?&amp;">');
      expect(tokens[7]).toEqual({value: '&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']});
      expect(tokens[8]).toEqual({value: 'amp', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'constant.character.entity.html', 'entity.name.entity.other.html']});
      expect(tokens[9]).toEqual({value: ';', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']});
  });

    it('does not tokenize query parameters as character references', function() {
      const {tokens} = grammar.tokenizeLine('<a href="http://example.com?one=1&type=json&topic=css">');
      expect(tokens[6]).toEqual({value: 'http://example.com?one=1&type=json&topic=css', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});
  });

    it('does not tokenize multiple ampersands followed by alphabetical characters as character references', function() {
      const {tokens} = grammar.tokenizeLine('<a href="http://example.com?price&something&yummy:&wow">');
      expect(tokens[6]).toEqual({value: 'http://example.com?price&something&yummy:&wow', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});
  });

    it('tokenizes invalid ampersands in attributes', function() {
      // Note: in order to replicate the following tests' behaviors, make sure you have language-hyperlink disabled
      let {tokens} = grammar.tokenizeLine('<a href="http://example.com?&">');
      expect(tokens[7]).toEqual({value: '&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'invalid.illegal.bad-ampersand.html']});

      ({tokens} = grammar.tokenizeLine('<a href="http://example.com?&=">'));
      expect(tokens[7]).toEqual({value: '&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'invalid.illegal.bad-ampersand.html']});

      ({tokens} = grammar.tokenizeLine('<a href="http://example.com?& ">'));
      expect(tokens[6]).toEqual({value: 'http://example.com?& ', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});

      const lines = grammar.tokenizeLines('<a href="http://example.com?&\n">');
      expect(lines[0][6]).toEqual({value: 'http://example.com?&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});

      ({tokens} = grammar.tokenizeLine('<a href="http://example.com?&&">'));
      expect(tokens[6]).toEqual({value: 'http://example.com?&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});
      expect(tokens[7]).toEqual({value: '&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'invalid.illegal.bad-ampersand.html']});
  });
});

  describe('firstLineMatch', function() {
    it('recognises HTML5 doctypes', function() {
      expect(grammar.firstLineRegex.findNextMatchSync('<!DOCTYPE html>')).not.toBeNull();
      expect(grammar.firstLineRegex.findNextMatchSync('<!doctype HTML>')).not.toBeNull();
    });

    it('recognises Emacs modelines', function() {
      let line;
      const valid = `\
#-*- HTML -*-
#-*- mode: HTML -*-
/* -*-html-*- */
// -*- HTML -*-
/* -*- mode:HTML -*- */
// -*- font:bar;mode:HTML -*-
// -*- font:bar;mode:HTML;foo:bar; -*-
// -*-font:mode;mode:HTML-*-
// -*- foo:bar mode: html bar:baz -*-
" -*-foo:bar;mode:html;bar:foo-*- ";
" -*-font-mode:foo;mode:html;foo-bar:quux-*-"
"-*-font:x;foo:bar; mode : HTML; bar:foo;foooooo:baaaaar;fo:ba;-*-";
"-*- font:x;foo : bar ; mode : HtML ; bar : foo ; foooooo:baaaaar;fo:ba-*-";\
`;
      for (line of Array.from(valid.split(/\n/))) {
        expect(grammar.firstLineRegex.findNextMatchSync(line)).not.toBeNull();
      }

      const invalid = `\
/* --*html-*- */
/* -*-- HTML -*-
/* -*- -- HTML -*-
/* -*- HTM -;- -*-
// -*- xHTML -*-
// -*- HTML; -*-
// -*- html-stuff -*-
/* -*- model:html -*-
/* -*- indent-mode:html -*-
// -*- font:mode;html -*-
// -*- HTimL -*-
// -*- mode: -*- HTML
// -*- mode: -html -*-
// -*-font:mode;mode:html--*-\
`;
      return (() => {
        const result = [];
        for (line of invalid.split(/\n/)) {
          result.push(expect(grammar.firstLineRegex.findNextMatchSync(line)).toBeNull());
        }
        return result;
      })();
    });

    it('recognises Vim modelines', function() {
      let line;
      const valid = `\
vim: se filetype=html:
# vim: se ft=html:
# vim: set ft=HTML:
# vim: set filetype=XHTML:
# vim: ft=XHTML
# vim: syntax=HTML
# vim: se syntax=xhtml:
# ex: syntax=HTML
# vim:ft=html
# vim600: ft=xhtml
# vim>600: set ft=html:
# vi:noai:sw=3 ts=6 ft=html
# vi::::::::::noai:::::::::::: ft=html
# vim:ts=4:sts=4:sw=4:noexpandtab:ft=html
# vi:: noai : : : : sw   =3 ts   =6 ft  =html
# vim: ts=4: pi sts=4: ft=html: noexpandtab: sw=4:
# vim: ts=4 sts=4: ft=html noexpandtab:
# vim:noexpandtab sts=4 ft=html ts=4
# vim:noexpandtab:ft=html
# vim:ts=4:sts=4 ft=html:noexpandtab:\x20
# vim:noexpandtab titlestring=hi\|there\\\\ ft=html ts=4\
`;
      for (line of valid.split(/\n/)) {
        expect(grammar.firstLineRegex.findNextMatchSync(line)).not.toBeNull();
      }

      const invalid = `\
ex: se filetype=html:
_vi: se filetype=HTML:
 vi: se filetype=HTML
# vim set ft=html5
# vim: soft=html
# vim: clean-syntax=html:
# vim set ft=html:
# vim: setft=HTML:
# vim: se ft=html backupdir=tmp
# vim: set ft=HTML set cmdheight=1
# vim:noexpandtab sts:4 ft:HTML ts:4
# vim:noexpandtab titlestring=hi\\|there\\ ft=HTML ts=4
# vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=HTML ts=4\
`;
      return (() => {
        const result = [];
        for (line of Array.from(invalid.split(/\n/))) {
          result.push(expect(grammar.firstLineRegex.findNextMatchSync(line)).toBeNull());
        }
        return result;
      })();
    });
  });

  describe('tags', function() {
    it('tokenizes style tags as such', function() {
      const {tokens} = grammar.tokenizeLine('<style>');
      expect(tokens[0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
      expect(tokens[1]).toEqual({value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']});
      expect(tokens[2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes script tags as such', function() {
      const {tokens} = grammar.tokenizeLine('<script>');
      expect(tokens[0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
      expect(tokens[1]).toEqual({value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']});
      expect(tokens[2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes structure tags as such', function() {
      const {tokens} = grammar.tokenizeLine('<html>');
      expect(tokens[0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.structure.html.html', 'punctuation.definition.tag.html']});
      expect(tokens[1]).toEqual({value: 'html', scopes: ['text.html.basic', 'meta.tag.structure.html.html', 'entity.name.tag.structure.html.html']});
      expect(tokens[2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.structure.html.html', 'punctuation.definition.tag.html']});
  });

    it('tokenizes block tags as such', function() {
      const {tokens} = grammar.tokenizeLine('<div>');
      expect(tokens[0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.block.div.html', 'punctuation.definition.tag.begin.html']});
      expect(tokens[1]).toEqual({value: 'div', scopes: ['text.html.basic', 'meta.tag.block.div.html', 'entity.name.tag.block.div.html']});
      expect(tokens[2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.block.div.html', 'punctuation.definition.tag.end.html']});
  });

    it('tokenizes inline tags as such', function() {
      const {tokens} = grammar.tokenizeLine('<span>');
      expect(tokens[0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.begin.html']});
      expect(tokens[1]).toEqual({value: 'span', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'entity.name.tag.inline.span.html']});
      expect(tokens[2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']});
  });

    it('does not tokenize XML namespaces as tags if the prefix is a valid style tag', function() {
      const {tokens} = grammar.tokenizeLine('<style:foo>');
      expect(tokens[1].value).toNotEqual('style');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('does not tokenize XML namespaces as tags if the prefix is a valid script tag', function() {
      const {tokens} = grammar.tokenizeLine('<script:foo>');
      expect(tokens[1].value).toNotEqual('script');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('does not tokenize XML namespaces as tags if the prefix is a valid structure tag', function() {
      const {tokens} = grammar.tokenizeLine('<html:foo>');
      expect(tokens[1].value).toNotEqual('html');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('does not tokenize XML namespaces as tags if the prefix is a valid block tag', function() {
      const {tokens} = grammar.tokenizeLine('<div:foo>');
      expect(tokens[1].value).toNotEqual('div');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('does not tokenize XML namespaces as tags if the prefix is a valid inline tag', function() {
      const {tokens} = grammar.tokenizeLine('<span:foo>');
      expect(tokens[1].value).toNotEqual('span');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('it does not treat only the part before a hyphen as tag name if this part is a is a valid style tag', function() {
      const {tokens} = grammar.tokenizeLine('<style-foo>');
      expect(tokens[1].value).toNotEqual('style');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('it does not treat only the part before a hyphen as tag name if this part is a is a valid script tag', function() {
      const {tokens} = grammar.tokenizeLine('<script-foo>');
      expect(tokens[1].value).toNotEqual('script');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('it does not treat only the part before a hyphen as tag name if this part is a is a valid structure tag', function() {
      const {tokens} = grammar.tokenizeLine('<html-foo>');
      expect(tokens[1].value).toNotEqual('html');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('it does not treat only the part before a hyphen as tag name if this part is a is a valid block tag', function() {
      const {tokens} = grammar.tokenizeLine('<div-foo>');
      expect(tokens[1].value).toNotEqual('div');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('it does not treat only the part before a hyphen as tag name if this part is a is a valid inline tag', function() {
      const {tokens} = grammar.tokenizeLine('<span-foo>');
      expect(tokens[1].value).toNotEqual('span');
      expect(tokens[1].scopes).toEqual(['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']);
  });

    it('tokenizes other tags as such', function() {
      const {tokens} = grammar.tokenizeLine('<foo>');
      expect(tokens[0]).toEqual({value: '<', scopes: ['text.html.basic', 'meta.tag.other.html', 'punctuation.definition.tag.begin.html']});
      expect(tokens[1]).toEqual({value: 'foo', scopes: ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']});
      expect(tokens[2]).toEqual({value: '>', scopes: ['text.html.basic', 'meta.tag.other.html', 'punctuation.definition.tag.end.html']});
  });

    it('tolerates colons in other tag names', function() {
      const {tokens} = grammar.tokenizeLine('<foo:bar>');
      expect(tokens[1]).toEqual({value: 'foo:bar', scopes: ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']});
  });

    it('tolerates hyphens in other tag names', function() {
      const {tokens} = grammar.tokenizeLine('<foo-bar>');
      expect(tokens[1]).toEqual({value: 'foo-bar', scopes: ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']});
  });

    it('tokenizes XML declaration correctly', function() {
      const {tokens} = grammar.tokenizeLine('<?xml version="1.0" encoding="UTF-8"?>');

      expect(tokens[0]).toEqual({value: '<?', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'punctuation.definition.tag.html']});
      expect(tokens[1]).toEqual({value: 'xml', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'entity.name.tag.xml.html']});
      expect(tokens[2]).toEqual({value: ' ', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html']});
      expect(tokens[3]).toEqual({value: 'version', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']});
      expect(tokens[4]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']});
      expect(tokens[5]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[6]).toEqual({value: '1.0', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});
      expect(tokens[7]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(tokens[8]).toEqual({value: ' ', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html']});
      expect(tokens[9]).toEqual({value: 'encoding', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']});
      expect(tokens[10]).toEqual({value: '=', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']});
      expect(tokens[11]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']});
      expect(tokens[12]).toEqual({value: 'UTF-8', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']});
      expect(tokens[13]).toEqual({value: '"', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']});
      expect(tokens[14]).toEqual({value: '?>', scopes: ['text.html.basic', 'meta.tag.preprocessor.xml.html', 'punctuation.definition.tag.html']});
  });
});

  describe('snippets', function() {
    let snippetsModule = null;

    beforeEach(function() {
      // FIXME: This should just be atom.packages.loadPackage('snippets'),
      // but a bug in PackageManager::resolvePackagePath where it finds language-html's
      // `snippets` directory before the actual package necessitates passing an absolute path
      // See https://github.com/atom/atom/issues/15953
      const snippetsPath = path.join(atom.packages.resourcePath, 'node_modules', 'snippets');
      snippetsModule = require(atom.packages.loadPackage(snippetsPath).getMainModulePath());

      // Disable loading of user snippets before the package is activated
      spyOn(snippetsModule, 'loadUserSnippets').andCallFake(callback => callback({}));

      snippetsModule.activate();

      waitsFor('snippets to load', done => snippetsModule.onDidLoadSnippets(done));
    });

    it('suggests snippets', () => expect(Object.keys(snippetsModule.parsedSnippetsForScopes(['.text.html'])).length).toBeGreaterThan(10));

    it('does not suggest any HTML snippets when in embedded scripts', () => expect(Object.keys(snippetsModule.parsedSnippetsForScopes(['.text.html .source.js.embedded.html'])).length).toBe(0));
  });
});
