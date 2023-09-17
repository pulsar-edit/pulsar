
const path = require('path');

describe('Hyperlink grammar', function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage('language-hyperlink'));

    runs(() => grammar = atom.grammars.grammarForScopeName('text.hyperlink'));
  });

  it('parses the grammar', function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe('text.hyperlink');
  });

  it('parses http: and https: links', function() {
    const plainGrammar = atom.grammars.selectGrammar();

    let {tokens} = plainGrammar.tokenizeLine('http://github.com');
    expect(tokens[0]).toEqual({value: 'http://github.com', scopes: ['text.plain.null-grammar', 'markup.underline.link.http.hyperlink']});

    ({tokens} = plainGrammar.tokenizeLine('https://github.com'));
    expect(tokens[0]).toEqual({value: 'https://github.com', scopes: ['text.plain.null-grammar', 'markup.underline.link.https.hyperlink']});

    ({tokens} = plainGrammar.tokenizeLine('http://twitter.com/#!/AtomEditor'));
    expect(tokens[0]).toEqual({value: 'http://twitter.com/#!/AtomEditor', scopes: ['text.plain.null-grammar', 'markup.underline.link.http.hyperlink']});

    ({tokens} = plainGrammar.tokenizeLine('https://github.com/atom/brightray_example'));
    expect(tokens[0]).toEqual({value: 'https://github.com/atom/brightray_example', scopes: ['text.plain.null-grammar', 'markup.underline.link.https.hyperlink']});
});

  it('parses http: and https: links that contains unicode characters', function() {
    const plainGrammar = atom.grammars.selectGrammar();

    const {tokens} = plainGrammar.tokenizeLine('https://sv.wikipedia.org/wiki/Mañana');
    expect(tokens[0]).toEqual({value: 'https://sv.wikipedia.org/wiki/Mañana', scopes: ['text.plain.null-grammar', 'markup.underline.link.https.hyperlink']});
});

  it('parses other links', function() {
    const plainGrammar = atom.grammars.selectGrammar();

    let {tokens} = plainGrammar.tokenizeLine('mailto:noreply@example.com');
    expect(tokens[0]).toEqual({value: 'mailto:noreply@example.com', scopes: ['text.plain.null-grammar', 'markup.underline.link.mailto.hyperlink']});

    ({tokens} = plainGrammar.tokenizeLine('x-man-page://tar'));
    expect(tokens[0]).toEqual({value: 'x-man-page://tar', scopes: ['text.plain.null-grammar', 'markup.underline.link.x-man-page.hyperlink']});

    ({tokens} = plainGrammar.tokenizeLine('atom://core/open/file?filename=urlEncodedFileName&line=n&column=n'));
    expect(tokens[0]).toEqual({value: 'atom://core/open/file?filename=urlEncodedFileName&line=n&column=n', scopes: ['text.plain.null-grammar', 'markup.underline.link.atom.hyperlink']});
});

  it('does not parse links in a regex string', function() {
    const testGrammar = atom.grammars.loadGrammarSync(path.join(__dirname, 'fixtures', 'test-grammar.cson'));

    const {tokens} = testGrammar.tokenizeLine('regexp:http://github.com');
    expect(tokens[1]).toEqual({value: 'http://github.com', scopes: ['source.test', 'string.regexp.test']});
});

  describe('parsing PHP strings', () => it('does not parse links in a regex string', function() {
    // PHP is unique in that its root scope is `text.html.php`, meaning that even though
    // `string - string.regexp` won't match in a regex string, `text` still will.
    // This is the reason the injection selector is `text - string.regexp` instead.
    // https://github.com/atom/language-php/issues/219

    waitsForPromise(() => atom.packages.activatePackage('language-php'));

    runs(function() {
      const phpGrammar = atom.grammars.grammarForScopeName('text.html.php');

      const {tokens} = phpGrammar.tokenizeLine('<?php "/mailto:/" ?>');
      expect(tokens[3]).toEqual({value: 'mailto:', scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'string.regexp.double-quoted.php']});});
}));

  describe('parsing cfml strings', function() {
    it('does not include anything between (and including) pound signs', function() {
      const plainGrammar = atom.grammars.selectGrammar();
      const {tokens} = plainGrammar.tokenizeLine('http://github.com/#username#');
      expect(tokens[0]).toEqual({value: 'http://github.com/', scopes: ['text.plain.null-grammar', 'markup.underline.link.http.hyperlink']});
  });

    it('still includes single pound signs', function() {
      const plainGrammar = atom.grammars.selectGrammar();
      const {tokens} = plainGrammar.tokenizeLine('http://github.com/atom/#start-of-content');
      expect(tokens[0]).toEqual({value: 'http://github.com/atom/#start-of-content', scopes: ['text.plain.null-grammar', 'markup.underline.link.http.hyperlink']});
  });
});

  describe('parsing matching parentheses', function() {
    it('still includes matching parentheses', function() {
      const plainGrammar = atom.grammars.selectGrammar();
      const {tokens} = plainGrammar.tokenizeLine('https://en.wikipedia.org/wiki/Atom_(text_editor)');
      expect(tokens[0]).toEqual({value: 'https://en.wikipedia.org/wiki/Atom_(text_editor)', scopes: ['text.plain.null-grammar', 'markup.underline.link.https.hyperlink']});
  });

    it('does not include wrapping parentheses', function() {
      const plainGrammar = atom.grammars.selectGrammar();
      const {tokens} = plainGrammar.tokenizeLine('(https://en.wikipedia.org/wiki/Atom_(text_editor))');
      expect(tokens[1]).toEqual({value: 'https://en.wikipedia.org/wiki/Atom_(text_editor)', scopes: ['text.plain.null-grammar', 'markup.underline.link.https.hyperlink']});
  });
});
});
