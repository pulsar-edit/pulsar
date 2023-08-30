
const path = require('path');
const grammarTest = require('atom-grammar-test');

describe("Python grammar", function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.packages.activatePackage("language-python"));

    runs(() => grammar = atom.grammars.grammarForScopeName("source.python"));
  });

  it("recognises shebang on firstline", function() {
    expect(grammar.firstLineRegex.findNextMatchSync("#!/usr/bin/env python")).not.toBeNull();
    expect(grammar.firstLineRegex.findNextMatchSync("#! /usr/bin/env python")).not.toBeNull();
  });

  it("parses the grammar", function() {
    expect(grammar).toBeDefined();
    expect(grammar.scopeName).toBe("source.python");
  });

  it("tokenizes `yield`", function() {
    const {tokens} = grammar.tokenizeLine('yield v');

    expect(tokens[0]).toEqual({value: 'yield', scopes: ['source.python', 'keyword.control.statement.python']});
});

  it("tokenizes `yield from`", function() {
    const {tokens} = grammar.tokenizeLine('yield from v');

    expect(tokens[0]).toEqual({value: 'yield from', scopes: ['source.python', 'keyword.control.statement.python']});
});

  it("tokenizes multi-line strings", function() {
    const tokens = grammar.tokenizeLines('"1\\\n2"');

    // Line 0
    expect(tokens[0][0].value).toBe('"');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']);

    expect(tokens[0][1].value).toBe('1');
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python']);

    expect(tokens[0][2].value).toBe('\\');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.newline.python']);

    expect(tokens[0][3]).not.toBeDefined();

    // Line 1
    expect(tokens[1][0].value).toBe('2');
    expect(tokens[1][0].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python']);

    expect(tokens[1][1].value).toBe('"');
    expect(tokens[1][1].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']);

    expect(tokens[1][2]).not.toBeDefined();
  });

  it("terminates a single-quoted raw string containing opening parenthesis at closing quote", function() {
    const tokens = grammar.tokenizeLines("r'%d(' #foo");

    expect(tokens[0][0].value).toBe('r');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'storage.type.string.python']);
    expect(tokens[0][1].value).toBe("'");
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][2].value).toBe('%d');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.placeholder.python']);
    expect(tokens[0][3].value).toBe('(');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']);
    expect(tokens[0][4].value).toBe("'");
    expect(tokens[0][4].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.end.python']);
    expect(tokens[0][5].value).toBe(' ');
    expect(tokens[0][5].scopes).toEqual(['source.python']);
    expect(tokens[0][6].value).toBe('#');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']);
    expect(tokens[0][7].value).toBe('foo');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'comment.line.number-sign.python']);
});

  it("terminates a single-quoted raw string containing opening bracket at closing quote", function() {
    const tokens = grammar.tokenizeLines("r'%d[' #foo");

    expect(tokens[0][0].value).toBe('r');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'storage.type.string.python']);
    expect(tokens[0][1].value).toBe("'");
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][2].value).toBe('%d');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.placeholder.python']);
    expect(tokens[0][3].value).toBe('[');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']);
    expect(tokens[0][4].value).toBe("'");
    expect(tokens[0][4].scopes).toEqual(['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.end.python']);
    expect(tokens[0][5].value).toBe(' ');
    expect(tokens[0][5].scopes).toEqual(['source.python']);
    expect(tokens[0][6].value).toBe('#');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']);
    expect(tokens[0][7].value).toBe('foo');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'comment.line.number-sign.python']);
});

  it("terminates a double-quoted raw string containing opening parenthesis at closing quote", function() {
    const tokens = grammar.tokenizeLines('r"%d(" #foo');

    expect(tokens[0][0].value).toBe('r');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'storage.type.string.python']);
    expect(tokens[0][1].value).toBe('"');
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][2].value).toBe('%d');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.placeholder.python']);
    expect(tokens[0][3].value).toBe('(');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']);
    expect(tokens[0][4].value).toBe('"');
    expect(tokens[0][4].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.end.python']);
    expect(tokens[0][5].value).toBe(' ');
    expect(tokens[0][5].scopes).toEqual(['source.python']);
    expect(tokens[0][6].value).toBe('#');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']);
    expect(tokens[0][7].value).toBe('foo');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'comment.line.number-sign.python']);
});

  it("terminates a double-quoted raw string containing opening bracket at closing quote", function() {
    const tokens = grammar.tokenizeLines('r"%d[" #foo');

    expect(tokens[0][0].value).toBe('r');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'storage.type.string.python']);
    expect(tokens[0][1].value).toBe('"');
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][2].value).toBe('%d');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.placeholder.python']);
    expect(tokens[0][3].value).toBe('[');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']);
    expect(tokens[0][4].value).toBe('"');
    expect(tokens[0][4].scopes).toEqual(['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.end.python']);
    expect(tokens[0][5].value).toBe(' ');
    expect(tokens[0][5].scopes).toEqual(['source.python']);
    expect(tokens[0][6].value).toBe('#');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']);
    expect(tokens[0][7].value).toBe('foo');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'comment.line.number-sign.python']);
});

  it("terminates a unicode single-quoted raw string containing opening parenthesis at closing quote", function() {
    const tokens = grammar.tokenizeLines("ur'%d(' #foo");

    expect(tokens[0][0].value).toBe('ur');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'storage.type.string.python']);
    expect(tokens[0][1].value).toBe("'");
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][2].value).toBe('%d');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']);
    expect(tokens[0][3].value).toBe('(');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']);
    expect(tokens[0][4].value).toBe("'");
    expect(tokens[0][4].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']);
    expect(tokens[0][5].value).toBe(' ');
    expect(tokens[0][5].scopes).toEqual(['source.python']);
    expect(tokens[0][6].value).toBe('#');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']);
    expect(tokens[0][7].value).toBe('foo');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'comment.line.number-sign.python']);
});

  it("terminates a unicode single-quoted raw string containing opening bracket at closing quote", function() {
    const tokens = grammar.tokenizeLines("ur'%d[' #foo");

    expect(tokens[0][0].value).toBe('ur');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'storage.type.string.python']);
    expect(tokens[0][1].value).toBe("'");
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][2].value).toBe('%d');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']);
    expect(tokens[0][3].value).toBe('[');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']);
    expect(tokens[0][4].value).toBe("'");
    expect(tokens[0][4].scopes).toEqual(['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']);
    expect(tokens[0][5].value).toBe(' ');
    expect(tokens[0][5].scopes).toEqual(['source.python']);
    expect(tokens[0][6].value).toBe('#');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']);
    expect(tokens[0][7].value).toBe('foo');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'comment.line.number-sign.python']);
});

  it("terminates a unicode double-quoted raw string containing opening parenthesis at closing quote", function() {
    const tokens = grammar.tokenizeLines('ur"%d(" #foo');

    expect(tokens[0][0].value).toBe('ur');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'storage.type.string.python']);
    expect(tokens[0][1].value).toBe('"');
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][2].value).toBe('%d');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']);
    expect(tokens[0][3].value).toBe('(');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']);
    expect(tokens[0][4].value).toBe('"');
    expect(tokens[0][4].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']);
    expect(tokens[0][5].value).toBe(' ');
    expect(tokens[0][5].scopes).toEqual(['source.python']);
    expect(tokens[0][6].value).toBe('#');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']);
    expect(tokens[0][7].value).toBe('foo');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'comment.line.number-sign.python']);
});

  it("terminates a unicode double-quoted raw string containing opening bracket at closing quote", function() {
    const tokens = grammar.tokenizeLines('ur"%d[" #foo');

    expect(tokens[0][0].value).toBe('ur');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'storage.type.string.python']);
    expect(tokens[0][1].value).toBe('"');
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][2].value).toBe('%d');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']);
    expect(tokens[0][3].value).toBe('[');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']);
    expect(tokens[0][4].value).toBe('"');
    expect(tokens[0][4].scopes).toEqual(['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']);
    expect(tokens[0][5].value).toBe(' ');
    expect(tokens[0][5].scopes).toEqual(['source.python']);
    expect(tokens[0][6].value).toBe('#');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']);
    expect(tokens[0][7].value).toBe('foo');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'comment.line.number-sign.python']);
});

  it("terminates referencing an item in a list variable after a sequence of a closing and opening bracket", function() {
    const tokens = grammar.tokenizeLines('foo[i[0]][j[0]]');

    expect(tokens[0][0].value).toBe('foo');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'meta.item-access.python']);
    expect(tokens[0][1].value).toBe('[');
    expect(tokens[0][1].scopes).toEqual(['source.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']);
    expect(tokens[0][2].value).toBe('i');
    expect(tokens[0][2].scopes).toEqual(['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python']);
    expect(tokens[0][3].value).toBe('[');
    expect(tokens[0][3].scopes).toEqual(['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']);
    expect(tokens[0][4].value).toBe('0');
    expect(tokens[0][4].scopes).toEqual(['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'constant.numeric.integer.decimal.python']);
    expect(tokens[0][5].value).toBe(']');
    expect(tokens[0][5].scopes).toEqual(['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']);
    expect(tokens[0][6].value).toBe(']');
    expect(tokens[0][6].scopes).toEqual(['source.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']);
    expect(tokens[0][7].value).toBe('[');
    expect(tokens[0][7].scopes).toEqual(['source.python', 'meta.structure.list.python', 'punctuation.definition.list.begin.python']);
    expect(tokens[0][8].value).toBe('j');
    expect(tokens[0][8].scopes).toEqual(['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python']);
    expect(tokens[0][9].value).toBe('[');
    expect(tokens[0][9].scopes).toEqual(['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']);
    expect(tokens[0][10].value).toBe('0');
    expect(tokens[0][10].scopes).toEqual(['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'constant.numeric.integer.decimal.python']);
    expect(tokens[0][11].value).toBe(']');
    expect(tokens[0][11].scopes).toEqual(['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']);
    expect(tokens[0][12].value).toBe(']');
    expect(tokens[0][12].scopes).toEqual(['source.python', 'meta.structure.list.python', 'punctuation.definition.list.end.python']);
});

  it("tokenizes a hex escape inside a string", function() {
    let tokens = grammar.tokenizeLines('"\\x5A"');

    expect(tokens[0][0].value).toBe('"');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][1].value).toBe('\\x5A');
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.hex.python']);

    tokens = grammar.tokenizeLines('"\\x9f"');

    expect(tokens[0][0].value).toBe('"');
    expect(tokens[0][0].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']);
    expect(tokens[0][1].value).toBe('\\x9f');
    expect(tokens[0][1].scopes).toEqual(['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.hex.python']);
});

  describe("f-strings", function() {
    it("tokenizes them", function() {
      const {tokens} = grammar.tokenizeLine("f'hello'");

      expect(tokens[0]).toEqual({value: 'f', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'storage.type.string.python']});
      expect(tokens[1]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.format.python", 'punctuation.definition.string.begin.python']});
      expect(tokens[2]).toEqual({value: 'hello', scopes: ['source.python', "string.quoted.single.single-line.format.python"]});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.format.python", 'punctuation.definition.string.end.python']});
  });

    it("tokenizes {{ and }} as escape characters", function() {
      const {tokens} = grammar.tokenizeLine("f'he}}l{{lo'");

      expect(tokens[0]).toEqual({value: 'f', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'storage.type.string.python']});
      expect(tokens[1]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.format.python", 'punctuation.definition.string.begin.python']});
      expect(tokens[2]).toEqual({value: 'he', scopes: ['source.python', "string.quoted.single.single-line.format.python"]});
      expect(tokens[3]).toEqual({value: '}}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'constant.character.escape.curly-bracket.python']});
      expect(tokens[4]).toEqual({value: 'l', scopes: ['source.python', "string.quoted.single.single-line.format.python"]});
      expect(tokens[5]).toEqual({value: '{{', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'constant.character.escape.curly-bracket.python']});
      expect(tokens[6]).toEqual({value: 'lo', scopes: ['source.python', "string.quoted.single.single-line.format.python"]});
      expect(tokens[7]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.format.python", 'punctuation.definition.string.end.python']});
  });

    it("tokenizes unmatched closing curly brackets as invalid", function() {
      const {tokens} = grammar.tokenizeLine("f'he}llo'");

      expect(tokens[0]).toEqual({value: 'f', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'storage.type.string.python']});
      expect(tokens[1]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.format.python", 'punctuation.definition.string.begin.python']});
      expect(tokens[2]).toEqual({value: 'he', scopes: ['source.python', "string.quoted.single.single-line.format.python"]});
      expect(tokens[3]).toEqual({value: '}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'invalid.illegal.closing-curly-bracket.python']});
      expect(tokens[4]).toEqual({value: 'llo', scopes: ['source.python', "string.quoted.single.single-line.format.python"]});
      expect(tokens[5]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.format.python", 'punctuation.definition.string.end.python']});
  });

    describe("in expressions", function() {
      it("tokenizes variables", function() {
        const {tokens} = grammar.tokenizeLine("f'{abc}'");

        expect(tokens[2]).toEqual({value: '{', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']});
        expect(tokens[3]).toEqual({value: 'abc', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python']});
        expect(tokens[4]).toEqual({value: '}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']});
    });

      it("tokenizes arithmetic", function() {
        const {tokens} = grammar.tokenizeLine("f'{5 - 3}'");

        expect(tokens[2]).toEqual({value: '{', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']});
        expect(tokens[3]).toEqual({value: '5', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'constant.numeric.integer.decimal.python']});
        expect(tokens[5]).toEqual({value: '-', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'keyword.operator.arithmetic.python']});
        expect(tokens[7]).toEqual({value: '3', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'constant.numeric.integer.decimal.python']});
        expect(tokens[8]).toEqual({value: '}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']});
    });

      it("tokenizes function and method calls", function() {
        const {tokens} = grammar.tokenizeLine("f'{name.decode(\"utf-8\").lower()}'");

        expect(tokens[2]).toEqual({value: '{', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']});
        expect(tokens[3]).toEqual({value: 'name', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'variable.other.object.python']});
        expect(tokens[4]).toEqual({value: '.', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'punctuation.separator.method.period.python']});
        expect(tokens[5]).toEqual({value: 'decode', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'entity.name.function.python']});
        expect(tokens[6]).toEqual({value: '(', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'punctuation.definition.arguments.begin.bracket.round.python']});
        expect(tokens[7]).toEqual({value: '"', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'meta.method-call.arguments.python', "string.quoted.double.single-line.python", 'punctuation.definition.string.begin.python']});
        expect(tokens[8]).toEqual({value: 'utf-8', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'meta.method-call.arguments.python', "string.quoted.double.single-line.python"]});
        expect(tokens[9]).toEqual({value: '"', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'meta.method-call.arguments.python', "string.quoted.double.single-line.python", 'punctuation.definition.string.end.python']});
        expect(tokens[10]).toEqual({value: ')', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'punctuation.definition.arguments.end.bracket.round.python']});
        expect(tokens[11]).toEqual({value: '.', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'punctuation.separator.method.period.python']});
        expect(tokens[12]).toEqual({value: 'lower', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'entity.name.function.python']});
        expect(tokens[13]).toEqual({value: '(', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'punctuation.definition.arguments.begin.bracket.round.python']});
        expect(tokens[14]).toEqual({value: ')', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.method-call.python', 'punctuation.definition.arguments.end.bracket.round.python']});
        expect(tokens[15]).toEqual({value: '}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']});
    });

      it("tokenizes conversion flags", function() {
        const {tokens} = grammar.tokenizeLine("f'{abc!r}'");

        expect(tokens[2]).toEqual({value: '{', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']});
        expect(tokens[3]).toEqual({value: 'abc', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python']});
        expect(tokens[4]).toEqual({value: '!r', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'constant.other.placeholder.python']});
        expect(tokens[5]).toEqual({value: '}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']});
    });

      it("tokenizes format specifiers", function() {
        const {tokens} = grammar.tokenizeLine("f'{abc:^d}'");

        expect(tokens[2]).toEqual({value: '{', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']});
        expect(tokens[3]).toEqual({value: 'abc', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python']});
        expect(tokens[4]).toEqual({value: ':^d', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'constant.other.placeholder.python']});
        expect(tokens[5]).toEqual({value: '}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']});
    });

      it("tokenizes nested replacement fields in top-level format specifiers", function() {
        const {tokens} = grammar.tokenizeLine("f'{abc:{align}d}'");

        expect(tokens[2]).toEqual({value: '{', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']});
        expect(tokens[3]).toEqual({value: 'abc', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python']});
        expect(tokens[4]).toEqual({value: ':', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'constant.other.placeholder.python']});
        expect(tokens[5]).toEqual({value: '{align}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'constant.other.placeholder.python', 'constant.other.placeholder.python']});
        expect(tokens[6]).toEqual({value: 'd', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'constant.other.placeholder.python']});
        expect(tokens[7]).toEqual({value: '}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']});
    });

      it("tokenizes backslashes as invalid", function() {
        const {tokens} = grammar.tokenizeLine("f'{ab\\n}'");

        expect(tokens[2]).toEqual({value: '{', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']});
        expect(tokens[3]).toEqual({value: 'ab', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python']});
        expect(tokens[4]).toEqual({value: '\\', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'meta.embedded.python', 'invalid.illegal.backslash.python']});
        expect(tokens[6]).toEqual({value: '}', scopes: ['source.python', "string.quoted.single.single-line.format.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']});
    });
  });
});

  describe("binary strings", function() {
    it("tokenizes them", function() {
      const {tokens} = grammar.tokenizeLine("b'test'");

      expect(tokens[0]).toEqual({value: 'b', scopes: ['source.python', "string.quoted.single.single-line.binary.python", 'storage.type.string.python']});
      expect(tokens[1]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.binary.python", 'punctuation.definition.string.begin.python']});
      expect(tokens[2]).toEqual({value: 'test', scopes: ['source.python', "string.quoted.single.single-line.binary.python"]});
      expect(tokens[3]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.binary.python", 'punctuation.definition.string.end.python']});
  });

    it("tokenizes invalid characters", function() {
      const {tokens} = grammar.tokenizeLine("b'tést'");

      expect(tokens[0]).toEqual({value: 'b', scopes: ['source.python', "string.quoted.single.single-line.binary.python", 'storage.type.string.python']});
      expect(tokens[1]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.binary.python", 'punctuation.definition.string.begin.python']});
      expect(tokens[2]).toEqual({value: 't', scopes: ['source.python', "string.quoted.single.single-line.binary.python"]});
      expect(tokens[3]).toEqual({value: 'é', scopes: ['source.python', "string.quoted.single.single-line.binary.python", 'invalid.illegal.character-out-of-range.python']});
      expect(tokens[4]).toEqual({value: 'st', scopes: ['source.python', "string.quoted.single.single-line.binary.python"]});
      expect(tokens[5]).toEqual({value: "'", scopes: ['source.python', "string.quoted.single.single-line.binary.python", 'punctuation.definition.string.end.python']});
  });
});

  describe("docstrings", () => it("tokenizes them", function() {
    let lines = grammar.tokenizeLines(`\
"""
  Bla bla bla "wow" what's this?
"""\
`
    );

    expect(lines[0][0]).toEqual({value: '"""', scopes: ['source.python', 'string.quoted.double.block.python', 'punctuation.definition.string.begin.python']});
    expect(lines[1][0]).toEqual({value: '  Bla bla bla "wow" what\'s this?', scopes: ['source.python', 'string.quoted.double.block.python']});
    expect(lines[2][0]).toEqual({value: '"""', scopes: ['source.python', 'string.quoted.double.block.python', 'punctuation.definition.string.end.python']});

    lines = grammar.tokenizeLines(`\
'''
  Bla bla bla "wow" what's this?
'''\
`
    );

    expect(lines[0][0]).toEqual({value: "'''", scopes: ['source.python', 'string.quoted.single.block.python', 'punctuation.definition.string.begin.python']});
    expect(lines[1][0]).toEqual({value: '  Bla bla bla "wow" what\'s this?', scopes: ['source.python', 'string.quoted.single.block.python']});
    expect(lines[2][0]).toEqual({value: "'''", scopes: ['source.python', 'string.quoted.single.block.python', 'punctuation.definition.string.end.python']});
}));


  describe("string formatting", function() {
    describe("%-style formatting", function() {
      it("tokenizes the conversion type", function() {
        const {tokens} = grammar.tokenizeLine('"%d"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '%d', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes an optional mapping key", function() {
        const {tokens} = grammar.tokenizeLine('"%(key)x"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '%(key)x', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes an optional conversion flag", function() {
        const {tokens} = grammar.tokenizeLine('"% F"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '% F', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes an optional field width", function() {
        const {tokens} = grammar.tokenizeLine('"%11s"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '%11s', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes * as the optional field width", function() {
        const {tokens} = grammar.tokenizeLine('"%*g"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '%*g', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes an optional precision", function() {
        const {tokens} = grammar.tokenizeLine('"%.4r"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '%.4r', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes * as the optional precision", function() {
        const {tokens} = grammar.tokenizeLine('"%.*%"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '%.*%', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes an optional length modifier", function() {
        const {tokens} = grammar.tokenizeLine('"%Lo"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '%Lo', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes complex formats", function() {
        const {tokens} = grammar.tokenizeLine('"%(key)#5.*hc"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '%(key)#5.*hc', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });
  });

    describe("{}-style formatting", function() {
      it("tokenizes the empty replacement field", function() {
        const {tokens} = grammar.tokenizeLine('"{}"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes a number as the field name", function() {
        const {tokens} = grammar.tokenizeLine('"{1}"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{1}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes a variable name as the field name", function() {
        const {tokens} = grammar.tokenizeLine('"{key}"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{key}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes field name attributes", function() {
        let {tokens} = grammar.tokenizeLine('"{key.length}"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{key.length}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});

        ({tokens} = grammar.tokenizeLine('"{4.width}"'));

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{4.width}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});

        ({tokens} = grammar.tokenizeLine('"{python2[\'3\']}"'));

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{python2[\'3\']}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});

        ({tokens} = grammar.tokenizeLine('"{2[4]}"'));

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{2[4]}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes multiple field name attributes", function() {
        const {tokens} = grammar.tokenizeLine('"{nested.a[2][\'val\'].value}"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{nested.a[2][\'val\'].value}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes conversions", function() {
        const {tokens} = grammar.tokenizeLine('"{!r}"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{!r}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      describe("format specifiers", function() {
        it("tokenizes alignment", function() {
          let {tokens} = grammar.tokenizeLine('"{:<}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:<}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});

          ({tokens} = grammar.tokenizeLine('"{:a^}"'));

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:a^}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });

        it("tokenizes signs", function() {
          let {tokens} = grammar.tokenizeLine('"{:+}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:+}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});

          ({tokens} = grammar.tokenizeLine('"{: }"'));

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{: }', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });

        it("tokenizes the alternate form indicator", function() {
          const {tokens} = grammar.tokenizeLine('"{:#}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:#}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });

        it("tokenizes 0", function() {
          const {tokens} = grammar.tokenizeLine('"{:0}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:0}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });

        it("tokenizes the width", function() {
          const {tokens} = grammar.tokenizeLine('"{:34}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:34}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });

        it("tokenizes the grouping option", function() {
          const {tokens} = grammar.tokenizeLine('"{:,}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:,}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });

        it("tokenizes the precision", function() {
          const {tokens} = grammar.tokenizeLine('"{:.5}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:.5}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });

        it("tokenizes the type", function() {
          const {tokens} = grammar.tokenizeLine('"{:b}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:b}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });

        it("tokenizes nested replacement fields", function() {
          const {tokens} = grammar.tokenizeLine('"{:{align}-.{precision}%}"');

          expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
          expect(tokens[1]).toEqual({value: '{:', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[2]).toEqual({value: '{align}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python', 'constant.other.placeholder.python']});
          expect(tokens[3]).toEqual({value: '-.', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[4]).toEqual({value: '{precision}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python', 'constant.other.placeholder.python']});
          expect(tokens[5]).toEqual({value: '%}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
          expect(tokens[6]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
      });
    });

      it("tokenizes complex formats", function() {
        const {tokens} = grammar.tokenizeLine('"{0.players[2]!a:2>-#01_.3d}"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{0.players[2]!a:2>-#01_.3d}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']});
        expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });

      it("tokenizes {{ and }} as escape characters and not formatters", function() {
        const {tokens} = grammar.tokenizeLine('"{{hello}}"');

        expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
        expect(tokens[1]).toEqual({value: '{{', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.curly-bracket.python']});
        expect(tokens[2]).toEqual({value: 'hello', scopes: ['source.python', 'string.quoted.double.single-line.python']});
        expect(tokens[3]).toEqual({value: '}}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.curly-bracket.python']});
        expect(tokens[4]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
    });
  });
});

  it("tokenizes properties of self as self-type variables", function() {
    const tokens = grammar.tokenizeLines('self.foo');

    expect(tokens[0][0]).toEqual({value: 'self', scopes: ['source.python', 'variable.language.self.python']});
    expect(tokens[0][1]).toEqual({value: '.', scopes: ['source.python', 'punctuation.separator.property.period.python']});
    expect(tokens[0][2]).toEqual({value: 'foo', scopes: ['source.python', 'variable.other.property.python']});
});

  it("tokenizes cls as a self-type variable", function() {
    const tokens = grammar.tokenizeLines('cls.foo');

    expect(tokens[0][0]).toEqual({value: 'cls', scopes: ['source.python', 'variable.language.self.python']});
    expect(tokens[0][1]).toEqual({value: '.', scopes: ['source.python', 'punctuation.separator.property.period.python']});
    expect(tokens[0][2]).toEqual({value: 'foo', scopes: ['source.python', 'variable.other.property.python']});
});

  it("tokenizes properties of a variable as variables", function() {
    const tokens = grammar.tokenizeLines('bar.foo');

    expect(tokens[0][0]).toEqual({value: 'bar', scopes: ['source.python', 'variable.other.object.python']});
    expect(tokens[0][1]).toEqual({value: '.', scopes: ['source.python', 'punctuation.separator.property.period.python']});
    expect(tokens[0][2]).toEqual({value: 'foo', scopes: ['source.python', 'variable.other.property.python']});
});

  // Add the grammar test fixtures
  grammarTest(path.join(__dirname, 'fixtures/grammar/syntax_test_python.py'));
  grammarTest(path.join(__dirname, 'fixtures/grammar/syntax_test_python_functions.py'));
  grammarTest(path.join(__dirname, 'fixtures/grammar/syntax_test_python_lambdas.py'));
  grammarTest(path.join(__dirname, 'fixtures/grammar/syntax_test_python_typing.py'));

  describe("SQL highlighting", function() {
    beforeEach(() => waitsForPromise(() => atom.packages.activatePackage('language-sql')));

    it("tokenizes SQL inline highlighting on blocks", function() {
      const delimsByScope = {
        "string.quoted.double.block.sql.python": '"""',
        "string.quoted.single.block.sql.python": "'''"
      };

      return (() => {
        const result = [];
        for (let delim = 0; delim < delimsByScope.length; delim++) {
          const scope = delimsByScope[delim];
          const tokens = grammar.tokenizeLines(
            delim +
            `SELECT bar \
FROM foo`,
            + delim
          );

          expect(tokens[0][0]).toEqual({value: delim, scopes: ['source.python', scope, 'punctuation.definition.string.begin.python']});
          expect(tokens[1][0]).toEqual({value: 'SELECT', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.DML.sql']});
          expect(tokens[1][1]).toEqual({value: ' bar', scopes: ['source.python', scope, 'meta.embedded.sql']});
          expect(tokens[2][0]).toEqual({value: 'FROM', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.DML.sql']});
          expect(tokens[2][1]).toEqual(value(' foo', {scopes: ['source.python', scope, 'meta.embedded.sql']}));
          result.push(expect(tokens[3][0]).toEqual({value: delim, scopes: ['source.python', scope, 'punctuation.definition.string.end.python']}));
        }
        return result;
      })();
  });

    it("tokenizes SQL inline highlighting on blocks with a CTE", function() {
      // Note that these scopes do not contain .sql because we can't definitively tell
      // if the string contains SQL or not
      const delimsByScope = {
        "string.quoted.double.block.python": '"""',
        "string.quoted.single.block.python": "'''"
      };

      return (() => {
        const result = [];
        for (let scope in delimsByScope) {
          const delim = delimsByScope[scope];
          const tokens = grammar.tokenizeLines(`\
${delim}
WITH example_cte AS (
SELECT bar
FROM foo
GROUP BY bar
)

SELECT COUNT(*)
FROM example_cte
${delim}\
`);

          expect(tokens[0][0]).toEqual({value: delim, scopes: ['source.python', scope, 'punctuation.definition.string.begin.python']});
          expect(tokens[1][0]).toEqual({value: 'WITH', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.DML.sql']});
          expect(tokens[1][1]).toEqual({value: ' example_cte ', scopes: ['source.python', scope, 'meta.embedded.sql']});
          expect(tokens[1][2]).toEqual({value: 'AS', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.alias.sql']});
          expect(tokens[1][3]).toEqual({value: ' ', scopes: ['source.python', scope, 'meta.embedded.sql']});
          expect(tokens[1][4]).toEqual({value: '(', scopes: ['source.python', scope, 'meta.embedded.sql', 'punctuation.definition.section.bracket.round.begin.sql']});
          expect(tokens[2][0]).toEqual({value: 'SELECT', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.DML.sql']});
          expect(tokens[2][1]).toEqual({value: ' bar', scopes: ['source.python', scope, 'meta.embedded.sql']});
          expect(tokens[3][0]).toEqual({value: 'FROM', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.DML.sql']});
          expect(tokens[3][1]).toEqual({value: ' foo', scopes: ['source.python', scope, 'meta.embedded.sql']});
          expect(tokens[4][0]).toEqual({value: 'GROUP BY', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.DML.sql']});
          expect(tokens[4][1]).toEqual({value: ' bar', scopes: ['source.python', scope, 'meta.embedded.sql']});
          expect(tokens[5][0]).toEqual({value: ')', scopes: ['source.python', scope, 'meta.embedded.sql', 'punctuation.definition.section.bracket.round.end.sql']});
          expect(tokens[7][0]).toEqual({value: 'SELECT', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.DML.sql']});
          expect(tokens[8][0]).toEqual({value: 'FROM', scopes: ['source.python', scope, 'meta.embedded.sql', 'keyword.other.DML.sql']});
          result.push(expect(tokens[9][0]).toEqual({value: delim, scopes: ['source.python', scope, 'punctuation.definition.string.end.python']}));
        }
        return result;
      })();
  });

    it("tokenizes SQL inline highlighting on single line with a CTE", function() {
      const {tokens} = grammar.tokenizeLine('\'WITH example_cte AS (SELECT bar FROM foo) SELECT COUNT(*) FROM example_cte\'');

      expect(tokens[0]).toEqual({value: '\'', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'punctuation.definition.string.begin.python']});
      expect(tokens[1]).toEqual({value: 'WITH', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'keyword.other.DML.sql']});
      expect(tokens[2]).toEqual({value: ' example_cte ', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql']});
      expect(tokens[3]).toEqual({value: 'AS', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'keyword.other.alias.sql']});
      expect(tokens[4]).toEqual({value: ' ', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql']});
      expect(tokens[5]).toEqual({value: '(', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'punctuation.definition.section.bracket.round.begin.sql']});
      expect(tokens[6]).toEqual({value: 'SELECT', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'keyword.other.DML.sql']});
      expect(tokens[7]).toEqual({value: ' bar ', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql']});
      expect(tokens[8]).toEqual({value: 'FROM', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'keyword.other.DML.sql']});
      expect(tokens[9]).toEqual({value: ' foo', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql']});
      expect(tokens[10]).toEqual({value: ')', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'punctuation.definition.section.bracket.round.end.sql']});
      expect(tokens[11]).toEqual({value: ' ', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql']});
      expect(tokens[12]).toEqual({value: 'SELECT', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'keyword.other.DML.sql']});
      expect(tokens[13]).toEqual({value: ' ', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql']});
      expect(tokens[14]).toEqual({value: 'COUNT', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'support.function.aggregate.sql']});
      expect(tokens[15]).toEqual({value: '(', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'punctuation.definition.section.bracket.round.begin.sql']});
      expect(tokens[16]).toEqual({value: '*', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'keyword.operator.star.sql']});
      expect(tokens[17]).toEqual({value: ')', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'punctuation.definition.section.bracket.round.end.sql']});
      expect(tokens[18]).toEqual({value: ' ', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql']});
      expect(tokens[19]).toEqual({value: 'FROM', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql', 'keyword.other.DML.sql']});
      expect(tokens[20]).toEqual({value: ' example_cte', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'meta.embedded.sql']});
      expect(tokens[21]).toEqual({value: '\'', scopes: ['source.python', 'string.quoted.single.single-line.sql.python', 'punctuation.definition.string.end.python']});
  });

    it("tokenizes Python escape characters and formatting specifiers in SQL strings", function() {
      const {tokens} = grammar.tokenizeLine('"INSERT INTO url (image_uri) VALUES (\\\'%s\\\');" % values');

      expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.sql.python', 'punctuation.definition.string.begin.python']});
      expect(tokens[10]).toEqual({value: '\\\'', scopes: ['source.python', 'string.quoted.double.single-line.sql.python', 'meta.embedded.sql', 'constant.character.escape.single-quote.python']});
      expect(tokens[11]).toEqual({value: '%s', scopes: ['source.python', 'string.quoted.double.single-line.sql.python', 'meta.embedded.sql', 'constant.other.placeholder.python']});
      expect(tokens[12]).toEqual({value: '\\\'', scopes: ['source.python', 'string.quoted.double.single-line.sql.python', 'meta.embedded.sql', 'constant.character.escape.single-quote.python']});
      expect(tokens[13]).toEqual({value: ')', scopes: ['source.python', 'string.quoted.double.single-line.sql.python', 'meta.embedded.sql', 'punctuation.definition.section.bracket.round.end.sql']});
      expect(tokens[15]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.sql.python', 'punctuation.definition.string.end.python']});
      expect(tokens[17]).toEqual({value: '%', scopes: ['source.python', 'keyword.operator.arithmetic.python']});
  });

    it("recognizes DELETE as an HTTP method", function() {
      const {tokens} = grammar.tokenizeLine('"DELETE /api/v1/endpoint"');

      expect(tokens[0]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']});
      expect(tokens[1]).toEqual({value: 'DELETE /api/v1/endpoint', scopes: ['source.python', 'string.quoted.double.single-line.python']});
      expect(tokens[2]).toEqual({value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']});
  });
});
});
