
describe("YAML grammar", function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage("language-yaml"));

    runs(() => grammar = atom.grammars.grammarForScopeName('source.yaml'));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe("source.yaml");
  });

  it("selects the grammar for cloud config files", function() {
    waitsForPromise(() => atom.workspace.open('cloud.config'));

    return runs(function() {});
  });
      // TODO: While this seems to return a Grammar Registery, they do not match exactly and this should be further reviewed.
      //expect(atom.workspace.getActiveTextEditor().getGrammar()).toBe grammar

  describe("strings", function() {
    describe("double quoted", function() {
      it("parses escaped quotes", function() {
        let {tokens} = grammar.tokenizeLine("\"I am \\\"escaped\\\"\"");
        expect(tokens[0]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
        expect(tokens[1]).toEqual({value: "I am ", scopes: ["source.yaml", "string.quoted.double.yaml"]});
        expect(tokens[2]).toEqual({value: "\\\"", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[3]).toEqual({value: "escaped", scopes: ["source.yaml", "string.quoted.double.yaml"]});
        expect(tokens[4]).toEqual({value: "\\\"", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[5]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});

        ({tokens} = grammar.tokenizeLine("key: \"I am \\\"escaped\\\"\""));
        expect(tokens[0]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(tokens[1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(tokens[2]).toEqual({value: " ", scopes: ["source.yaml"]});
        expect(tokens[3]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
        expect(tokens[4]).toEqual({value: "I am ", scopes: ["source.yaml", "string.quoted.double.yaml"]});
        expect(tokens[5]).toEqual({value: "\\\"", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[6]).toEqual({value: "escaped", scopes: ["source.yaml", "string.quoted.double.yaml"]});
        expect(tokens[7]).toEqual({value: "\\\"", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[8]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});
    });

      it("parses other escape sequences", function() {
        let {tokens} = grammar.tokenizeLine("\"I am \\escaped\"");
        expect(tokens[0]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
        expect(tokens[1]).toEqual({value: "I am ", scopes: ["source.yaml", "string.quoted.double.yaml"]});
        expect(tokens[2]).toEqual({value: "\\e", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[3]).toEqual({value: "scaped", scopes: ["source.yaml", "string.quoted.double.yaml"]});
        expect(tokens[4]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});

        ({tokens} = grammar.tokenizeLine('"\\uAb123"'));
        expect(tokens[1]).toEqual({value: "\\uAb12", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[2]).toEqual({value: "3", scopes: ["source.yaml", "string.quoted.double.yaml"]});

        ({tokens} = grammar.tokenizeLine('"\\UAb123Fe90"'));
        expect(tokens[1]).toEqual({value: "\\UAb123Fe9", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[2]).toEqual({value: "0", scopes: ["source.yaml", "string.quoted.double.yaml"]});

        ({tokens} = grammar.tokenizeLine('"\\x200"'));
        expect(tokens[1]).toEqual({value: "\\x20", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[2]).toEqual({value: "0", scopes: ["source.yaml", "string.quoted.double.yaml"]});

        ({tokens} = grammar.tokenizeLine('"\\ hi"'));
        expect(tokens[1]).toEqual({value: "\\ ", scopes: ["source.yaml", "string.quoted.double.yaml", "constant.character.escape.yaml"]});
        expect(tokens[2]).toEqual({value: "hi", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    });

      it("parses invalid escape sequences", function() {
        let {tokens} = grammar.tokenizeLine('"\\uqerww"');
        expect(tokens[1]).toEqual({value: "\\uqerw", scopes: ["source.yaml", "string.quoted.double.yaml", "invalid.illegal.escape.yaml"]});
        expect(tokens[2]).toEqual({value: "w", scopes: ["source.yaml", "string.quoted.double.yaml"]});

        ({tokens} = grammar.tokenizeLine('"\\U0123456GF"'));
        expect(tokens[1]).toEqual({value: "\\U0123456G", scopes: ["source.yaml", "string.quoted.double.yaml", "invalid.illegal.escape.yaml"]});
        expect(tokens[2]).toEqual({value: "F", scopes: ["source.yaml", "string.quoted.double.yaml"]});

        ({tokens} = grammar.tokenizeLine('"\\x2Q1"'));
        expect(tokens[1]).toEqual({value: "\\x2Q", scopes: ["source.yaml", "string.quoted.double.yaml", "invalid.illegal.escape.yaml"]});
        expect(tokens[2]).toEqual({value: "1", scopes: ["source.yaml", "string.quoted.double.yaml"]});

        ({tokens} = grammar.tokenizeLine('"\\c3"'));
        expect(tokens[1]).toEqual({value: "\\c", scopes: ["source.yaml", "string.quoted.double.yaml", "invalid.illegal.escape.yaml"]});
        expect(tokens[2]).toEqual({value: "3", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    });
  });

    describe("single quoted", function() {
      it("parses escaped single quotes", function() {
        let {tokens} = grammar.tokenizeLine("'I am ''escaped'''");
        expect(tokens[0]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
        expect(tokens[1]).toEqual({value: "I am ", scopes: ["source.yaml", "string.quoted.single.yaml"]});
        expect(tokens[2]).toEqual({value: "''", scopes: ["source.yaml", "string.quoted.single.yaml", "constant.character.escape.yaml"]});
        expect(tokens[3]).toEqual({value: "escaped", scopes: ["source.yaml", "string.quoted.single.yaml"]});
        expect(tokens[4]).toEqual({value: "''", scopes: ["source.yaml", "string.quoted.single.yaml", "constant.character.escape.yaml"]});
        expect(tokens[5]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.end.yaml"]});

        ({tokens} = grammar.tokenizeLine("key: 'I am ''escaped'''"));
        expect(tokens[0]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(tokens[1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(tokens[2]).toEqual({value: " ", scopes: ["source.yaml"]});
        expect(tokens[3]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
        expect(tokens[4]).toEqual({value: "I am ", scopes: ["source.yaml", "string.quoted.single.yaml"]});
        expect(tokens[5]).toEqual({value: "''", scopes: ["source.yaml", "string.quoted.single.yaml", "constant.character.escape.yaml"]});
        expect(tokens[6]).toEqual({value: "escaped", scopes: ["source.yaml", "string.quoted.single.yaml"]});
        expect(tokens[7]).toEqual({value: "''", scopes: ["source.yaml", "string.quoted.single.yaml", "constant.character.escape.yaml"]});
        expect(tokens[8]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.end.yaml"]});
    });

      it("does not recognize backslashes as escape characters", function() {
        const {tokens} = grammar.tokenizeLine("'I am not \\escaped'");
        expect(tokens[0]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
        expect(tokens[1]).toEqual({value: "I am not \\escaped", scopes: ["source.yaml", "string.quoted.single.yaml"]});
        expect(tokens[2]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.end.yaml"]});
    });
  });

    describe("text blocks", function() {
      it("parses simple content", function() {
        const lines = grammar.tokenizeLines(`\
key: |
  content here
  second line\
`
        );
        expect(lines[0][0]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "  second line", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("parses content with empty lines", function() {
        const lines = grammar.tokenizeLines(`\
key: |
  content here

  second line\
`
        );
        expect(lines[0][0]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[3][0]).toEqual({value: "  second line", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("parses keys with decimals", function() {
        const lines = grammar.tokenizeLines(`\
2.0: |
  content here
  second line\
`
        );
        expect(lines[0][0]).toEqual({value: "2.0", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "  second line", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("parses keys with quotes", function() {
        const lines = grammar.tokenizeLines(`\
single'quotes': |
  content here
double"quotes": >
  content here\
`
        );
        expect(lines[0][0]).toEqual({value: "single'quotes'", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "double\"quotes\"", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[2][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[3][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("parses keys with quotes in sequences", function() {
        const lines = grammar.tokenizeLines(`\
- single'quotes': |
  content here
- double"quotes": >
  content here\
`
        );
        expect(lines[0][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[0][2]).toEqual({value: "single'quotes'", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[2][2]).toEqual({value: "double\"quotes\"", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[2][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[3][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("parses keys with quotes in sequences even when not using | or >", function() {
        const lines = grammar.tokenizeLines(`\
- single'quotes':
  content here
- double"quotes":
  content here\
`
        );
        expect(lines[0][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[0][2]).toEqual({value: "single'quotes'", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][1]).toEqual({value: "content here", scopes: ["source.yaml", "string.unquoted.yaml"]});
        expect(lines[2][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[2][2]).toEqual({value: "double\"quotes\"", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[2][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[3][1]).toEqual({value: "content here", scopes: ["source.yaml", "string.unquoted.yaml"]});
    });

      it("parses keys with spaces", function() {
        const lines = grammar.tokenizeLines(`\
a space: |
  content here
more than one space: >
  content here
space after : |
  content here\
`
        );
        expect(lines[0][0]).toEqual({value: "a space", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "more than one space", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[2][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[3][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[4][0]).toEqual({value: "space after", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[4][2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[5][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("parses keys with spaces in sequences", function() {
        const lines = grammar.tokenizeLines(`\
- a space: |
  content here
- more than one space: >
  content here
- space after : |
  content here\
`
        );
        expect(lines[0][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[0][2]).toEqual({value: "a space", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[2][2]).toEqual({value: "more than one space", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[2][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[3][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[4][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[4][2]).toEqual({value: "space after", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[4][4]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[5][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("properly parses through pound signs in blocks", function() {
        const lines = grammar.tokenizeLines(`\
key: |
  # this is not a legit comment
  unquoted block
  ### this is just a markdown header
  another unquoted block\
`
        );
        expect(lines[0][0]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "  # this is not a legit comment", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "  unquoted block", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[3][0]).toEqual({value: "  ### this is just a markdown header", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[4][0]).toEqual({value: "  another unquoted block", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("parses keys following blocks in sequences", function() {
        const lines = grammar.tokenizeLines(`\
- textblock: >
    multiline
    text
  key with spaces: following text\
`
        );
        expect(lines[0][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[0][2]).toEqual({value: "textblock", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "    multiline", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "    text", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[3][0]).toEqual({value: "  ", scopes: ["source.yaml"]});
        expect(lines[3][1]).toEqual({value: "key with spaces", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[3][2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[3][3]).toEqual({value: " ", scopes: ["source.yaml"]});
        expect(lines[3][4]).toEqual({value: "following text", scopes: ["source.yaml", "string.unquoted.yaml"]});
    });

      it("ignores key-like structures in block content", function() {
        const lines = grammar.tokenizeLines(`\
- textblock: >
    am i a key: nope
    text\
`
        );
        expect(lines[0][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[0][2]).toEqual({value: "textblock", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][0]).toEqual({value: "    am i a key: nope", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
        expect(lines[2][0]).toEqual({value: "    text", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    });

      it("parses content even when not using | or >", function() {
        const lines = grammar.tokenizeLines(`\
- textblock:
    multiline
    text
  key: following text\
`
        );
        expect(lines[0][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
        expect(lines[0][2]).toEqual({value: "textblock", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[1][1]).toEqual({value: "multiline", scopes: ["source.yaml", "string.unquoted.yaml"]});
        expect(lines[2][1]).toEqual({value: "text", scopes: ["source.yaml", "string.unquoted.yaml"]});
        expect(lines[3][0]).toEqual({value: "  ", scopes: ["source.yaml"]});
        expect(lines[3][1]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
        expect(lines[3][2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
        expect(lines[3][3]).toEqual({value: " ", scopes: ["source.yaml"]});
        expect(lines[3][4]).toEqual({value: "following text", scopes: ["source.yaml", "string.unquoted.yaml"]});
    });

      describe("parses content with unindented empty lines", function() {
        it("ending the content", function() {
          const lines = grammar.tokenizeLines(`\
key: |
  content here

  second line\
`
          );
          expect(lines[0][0]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
          expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
          expect(lines[0][3]).toEqual({value: "|", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[2][0]).toEqual({value: "", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[3][0]).toEqual({value: "  second line", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
      });

        it("ending with new element", function() {
          const lines = grammar.tokenizeLines(`\
key: |
  content here

  second line
other: hi\
`
          );
          expect(lines[0][0]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
          expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
          expect(lines[0][3]).toEqual({value: "|", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[1][0]).toEqual({value: "  content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[2][0]).toEqual({value: "", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[3][0]).toEqual({value: "  second line", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[4][0]).toEqual({value: "other", scopes: ["source.yaml", "entity.name.tag.yaml"]});
          expect(lines[4][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
          expect(lines[4][2]).toEqual({value: " ", scopes: ["source.yaml"]});
          expect(lines[4][3]).toEqual({value: "hi", scopes: ["source.yaml", "string.unquoted.yaml"]});
      });

        it("ending with new element, part of list", function() {
          const lines = grammar.tokenizeLines(`\
- key: |
    content here

    second line
- other: hi\
`
          );
          expect(lines[0][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
          expect(lines[0][2]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
          expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
          expect(lines[0][5]).toEqual({value: "|", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[1][0]).toEqual({value: "    content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[2][0]).toEqual({value: "", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[3][0]).toEqual({value: "    second line", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[4][0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
          expect(lines[4][1]).toEqual({value: " ", scopes: ["source.yaml"]});
          expect(lines[4][2]).toEqual({value: "other", scopes: ["source.yaml", "entity.name.tag.yaml"]});
          expect(lines[4][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
          expect(lines[4][4]).toEqual({value: " ", scopes: ["source.yaml"]});
          expect(lines[4][5]).toEqual({value: "hi", scopes: ["source.yaml", "string.unquoted.yaml"]});
      });

        it("ending with twice unindented new element", function() {
          const lines = grammar.tokenizeLines(`\
root:
  key: |
    content here

    second line
other: hi\
`
          );
          expect(lines[1][1]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
          expect(lines[1][2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
          expect(lines[1][4]).toEqual({value: "|", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[2][0]).toEqual({value: "    content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[3][0]).toEqual({value: "", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[4][0]).toEqual({value: "    second line", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[5][0]).toEqual({value: "other", scopes: ["source.yaml", "entity.name.tag.yaml"]});
          expect(lines[5][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
          expect(lines[5][2]).toEqual({value: " ", scopes: ["source.yaml"]});
          expect(lines[5][3]).toEqual({value: "hi", scopes: ["source.yaml", "string.unquoted.yaml"]});
      });

        it("ending with an indented comment", function() {
          const lines = grammar.tokenizeLines(`\
root:
  key: |
    content here

    second line
  # hi\
`
          );
          expect(lines[1][1]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
          expect(lines[1][2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
          expect(lines[1][4]).toEqual({value: "|", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[2][0]).toEqual({value: "    content here", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[3][0]).toEqual({value: "", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[4][0]).toEqual({value: "    second line", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
          expect(lines[5][0]).toEqual({value: "  ", scopes: ["source.yaml"]});
          expect(lines[5][1]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
          expect(lines[5][2]).toEqual({value: " hi", scopes: ["source.yaml", "comment.line.number-sign.yaml"]});
      });
    });
  });

    it("does not confuse keys and strings", function() {
      const {tokens} = grammar.tokenizeLine("- 'Section 2.4: 3, 6abc, 12ab, 30, 32a'");
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[2]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
      expect(tokens[3]).toEqual({value: "Section 2.4: 3, 6abc, 12ab, 30, 32a", scopes: ["source.yaml", "string.quoted.single.yaml"]});
  });
});

  it("parses the non-specific tag indicator before values", function() {
    const {tokens} = grammar.tokenizeLine("key: ! 'hi'");
    expect(tokens[0]).toEqual({value: "key", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(tokens[1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[3]).toEqual({value: "!", scopes: ["source.yaml", "punctuation.definition.tag.non-specific.yaml"]});
    expect(tokens[5]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(tokens[6]).toEqual({value: "hi", scopes: ["source.yaml", "string.quoted.single.yaml"]});
    expect(tokens[7]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml",  "punctuation.definition.string.end.yaml"]});
});

  it("parses nested keys", function() {
    const lines = grammar.tokenizeLines(`\
first:
  second:
    third: 3
    fourth: "4th"\
`
    );

    expect(lines[0][0]).toEqual({value: "first", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});

    expect(lines[1][0]).toEqual({value: "  ", scopes: ["source.yaml"]});
    expect(lines[1][1]).toEqual({value: "second", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[1][2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});

    expect(lines[2][0]).toEqual({value: "    ", scopes: ["source.yaml"]});
    expect(lines[2][1]).toEqual({value: "third", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[2][2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[2][3]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[2][4]).toEqual({value: "3", scopes: ["source.yaml", "constant.numeric.integer.yaml"]});

    expect(lines[3][0]).toEqual({value: "    ", scopes: ["source.yaml"]});
    expect(lines[3][1]).toEqual({value: "fourth", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[3][2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[3][3]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[3][4]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[3][5]).toEqual({value: "4th", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    expect(lines[3][6]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});
});

  it("parses multiple blocks", function() {
    const lines = grammar.tokenizeLines(`\
stuff:
  - long_string: |-
    hello
    hello
  - second_string:
    - key: b\
`
    );

    expect(lines[1][1]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(lines[1][3]).toEqual({value: "long_string", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[2][0]).toEqual({value: "    hello", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    expect(lines[4][1]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(lines[4][3]).toEqual({value: "second_string", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[5][1]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
});

  it("parses keys and values", function() {
    const lines = grammar.tokenizeLines(`\
first: 1st
second: 2nd
third: th{ree}
fourth:invalid\
`
    );

    expect(lines[0][0]).toEqual({value: "first", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[0][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[0][3]).toEqual({value: "1st", scopes: ["source.yaml", "string.unquoted.yaml"]});

    expect(lines[1][0]).toEqual({value: "second", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[1][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[1][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[1][3]).toEqual({value: "2nd", scopes: ["source.yaml", "string.unquoted.yaml"]});

    expect(lines[2][0]).toEqual({value: "third", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[2][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[2][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[2][3]).toEqual({value: "th{ree}", scopes: ["source.yaml", "string.unquoted.yaml"]});

    expect(lines[3][0]).toEqual({value: "fourth:invalid", scopes: ["source.yaml", "string.unquoted.yaml"]});
});

  it("parses quoted keys", function() {
    let lines = grammar.tokenizeLines(`\
'G@role:deployer':
  - deployer\
`
    );

    expect(lines[0][0]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[0][1]).toEqual({value: "G@role:deployer", scopes: ["source.yaml", "string.quoted.single.yaml", "entity.name.tag.yaml"]});
    expect(lines[0][2]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.end.yaml"]});
    expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});

    lines = grammar.tokenizeLines(`\
"G@role:deployer":
  - deployer\
`
    );

    expect(lines[0][0]).toEqual({value: '"', scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[0][1]).toEqual({value: "G@role:deployer", scopes: ["source.yaml", "string.quoted.double.yaml", "entity.name.tag.yaml"]});
    expect(lines[0][2]).toEqual({value: '"', scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});
    expect(lines[0][3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
});

  it("parses comments at the beginning of lines", function() {
    const lines = grammar.tokenizeLines(`\
# first: 1
  # second
##\
`
    );

    expect(lines[0][0]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(lines[0][1]).toEqual({value: " first: 1", scopes: ["source.yaml", "comment.line.number-sign.yaml"]});

    expect(lines[1][0]).toEqual({value: "  ", scopes: ["source.yaml"]});
    expect(lines[1][1]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(lines[1][2]).toEqual({value: " second", scopes: ["source.yaml", "comment.line.number-sign.yaml"]});

    expect(lines[2][0]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(lines[2][1]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml"]});
});

  it("parses comments at the end of lines", function() {
    let lines = grammar.tokenizeLines(`\
first: 1 # foo
second: 2nd  #bar
third: "3"
fourth: four#\
`
    );

    expect(lines[0][0]).toEqual({value: "first", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[0][3]).toEqual({value: "1", scopes: ["source.yaml", "constant.numeric.integer.yaml"]});
    expect(lines[0][5]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(lines[0][6]).toEqual({value: " foo", scopes: ["source.yaml", "comment.line.number-sign.yaml"]});

    expect(lines[1][0]).toEqual({value: "second", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[1][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[1][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[1][3]).toEqual({value: "2nd  ", scopes: ["source.yaml", "string.unquoted.yaml"]});
    expect(lines[1][4]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(lines[1][5]).toEqual({value: "bar", scopes: ["source.yaml", "comment.line.number-sign.yaml"]});

    expect(lines[2][0]).toEqual({value: "third", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[2][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[2][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[2][3]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[2][4]).toEqual({value: "3", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    expect(lines[2][5]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});

    expect(lines[3][0]).toEqual({value: "fourth", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[3][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[3][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[3][3]).toEqual({value: "four#", scopes: ["source.yaml", "string.unquoted.yaml"]});

    lines = grammar.tokenizeLines(`\
multiline: # comment!
  This should still be a string # another comment!
  Ditto
  # Guess what this is
  String
# comment\
`
    );

    expect(lines[0][3]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(lines[1][1]).toEqual({value: "This should still be a string ", scopes: ["source.yaml", "string.unquoted.yaml"]});
    expect(lines[1][2]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(lines[2][1]).toEqual({value: "Ditto", scopes: ["source.yaml", "string.unquoted.yaml"]});
    expect(lines[3][1]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(lines[4][1]).toEqual({value: "String", scopes: ["source.yaml", "string.unquoted.yaml"]});
    expect(lines[5][0]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
});

  it("parses comments on the same line as a multiline tag", function() {
    let {tokens} = grammar.tokenizeLine("# condition: >");
    expect(tokens[0]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});

    ({tokens} = grammar.tokenizeLine("condition: > # comment"));
    expect(tokens[4]).toEqual({value: "#", scopes: ["source.yaml", "string.unquoted.block.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
});

  it("ignores comments in proper multiline tags", function() {
    const lines = grammar.tokenizeLines(`\
multiline: >
  This should still be a string # not a comment!
  Ditto
  # Guess what this is
  String
# comment\
`
    );

    expect(lines[1][0]).toEqual({value: "  This should still be a string # not a comment!", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    expect(lines[3][0]).toEqual({value: "  # Guess what this is", scopes: ["source.yaml", "string.unquoted.block.yaml"]});
    expect(lines[5][0]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
});

  it("does not confuse keys and comments", function() {
    const {tokens} = grammar.tokenizeLine("- Entry 2 # This colon breaks syntax highlighting: see?");
    expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(tokens[3]).toEqual({value: "#", scopes: ["source.yaml", "comment.line.number-sign.yaml", "punctuation.definition.comment.yaml"]});
    expect(tokens[4]).toEqual({value: " This colon breaks syntax highlighting: see?", scopes: ["source.yaml", "comment.line.number-sign.yaml"]});
});

  it("does not confuse keys and unquoted strings", function() {
    const {tokens} = grammar.tokenizeLine("- { role: common }");
    expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(tokens[2]).toEqual({value: "{ role: common }", scopes: ["source.yaml", "string.unquoted.yaml"]});
});

  it("parses colons in key names", function() {
    const lines = grammar.tokenizeLines(`\
colon::colon: 1
colon::colon: 2nd
colon::colon: "3"
colon: "this is another : colon"
colon: "this is another :colon"\
`
    );

    expect(lines[0][0]).toEqual({value: "colon::colon", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[0][3]).toEqual({value: "1", scopes: ["source.yaml", "constant.numeric.integer.yaml"]});

    expect(lines[1][0]).toEqual({value: "colon::colon", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[1][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[1][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[1][3]).toEqual({value: "2nd", scopes: ["source.yaml", "string.unquoted.yaml"]});

    expect(lines[2][0]).toEqual({value: "colon::colon", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[2][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[2][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[2][3]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[2][4]).toEqual({value: "3", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    expect(lines[2][5]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});

    expect(lines[3][0]).toEqual({value: "colon", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[3][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[3][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[3][3]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[3][4]).toEqual({value: "this is another : colon", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    expect(lines[3][5]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});

    expect(lines[4][0]).toEqual({value: "colon", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[4][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[4][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[4][3]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[4][4]).toEqual({value: "this is another :colon", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    expect(lines[4][5]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});
});

  it("parses spaces in key names", function() {
    const lines = grammar.tokenizeLines(`\
spaced out: 1
more        spaces: 2nd
with quotes: "3"\
`
    );

    expect(lines[0][0]).toEqual({value: "spaced out", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[0][3]).toEqual({value: "1", scopes: ["source.yaml", "constant.numeric.integer.yaml"]});

    expect(lines[1][0]).toEqual({value: "more        spaces", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[1][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[1][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[1][3]).toEqual({value: "2nd", scopes: ["source.yaml", "string.unquoted.yaml"]});

    expect(lines[2][0]).toEqual({value: "with quotes", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[2][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[2][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[2][3]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[2][4]).toEqual({value: "3", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    expect(lines[2][5]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});
});

  it("parses quotes in unquoted key names", function() {
    const lines = grammar.tokenizeLines(`\
General Tso's Chicken: 1
Dwayne "The Rock" Johnson: 2nd
possessives': "3"
Conan "the Barbarian": '4'\
`
    );

    expect(lines[0][0]).toEqual({value: "General Tso's Chicken", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[0][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[0][3]).toEqual({value: "1", scopes: ["source.yaml", "constant.numeric.integer.yaml"]});

    expect(lines[1][0]).toEqual({value: "Dwayne \"The Rock\" Johnson", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[1][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[1][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[1][3]).toEqual({value: "2nd", scopes: ["source.yaml", "string.unquoted.yaml"]});

    expect(lines[2][0]).toEqual({value: "possessives'", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[2][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[2][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[2][3]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[2][4]).toEqual({value: "3", scopes: ["source.yaml", "string.quoted.double.yaml"]});
    expect(lines[2][5]).toEqual({value: "\"", scopes: ["source.yaml", "string.quoted.double.yaml", "punctuation.definition.string.end.yaml"]});

    expect(lines[3][0]).toEqual({value: "Conan \"the Barbarian\"", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(lines[3][1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(lines[3][2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(lines[3][3]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(lines[3][4]).toEqual({value: "4", scopes: ["source.yaml", "string.quoted.single.yaml"]});
    expect(lines[3][5]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.end.yaml"]});
});

  it("parses the merge-key tag", function() {
    let {tokens} = grammar.tokenizeLine("<<: *variable");
    expect(tokens[0]).toEqual({value: "<<", scopes: ["source.yaml", "entity.name.tag.merge.yaml"]});
    expect(tokens[1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[3]).toEqual({value: "*", scopes: ["source.yaml", "variable.other.yaml", "punctuation.definition.variable.yaml"]});
    expect(tokens[4]).toEqual({value: "variable", scopes: ["source.yaml", "variable.other.yaml"]});

    ({tokens} = grammar.tokenizeLine("<< : *variable"));
    expect(tokens[0]).toEqual({value: "<<", scopes: ["source.yaml", "entity.name.tag.merge.yaml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[2]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[4]).toEqual({value: "*", scopes: ["source.yaml", "variable.other.yaml", "punctuation.definition.variable.yaml"]});
    expect(tokens[5]).toEqual({value: "variable", scopes: ["source.yaml", "variable.other.yaml"]});

    ({tokens} = grammar.tokenizeLine("<<:*variable"));
    expect(tokens[0]).toEqual({value: "<<:*variable", scopes: ["source.yaml", "string.unquoted.yaml"]});
});

  it("parses local tags", function() {
    let {tokens} = grammar.tokenizeLine("multiline: !something >");
    expect(tokens[3]).toEqual({value: "!", scopes: ["source.yaml", "keyword.other.tag.local.yaml", "punctuation.definition.tag.local.yaml"]});
    expect(tokens[4]).toEqual({value: "something", scopes: ["source.yaml", "keyword.other.tag.local.yaml"]});
    expect(tokens[6]).toEqual({value: ">", scopes: ["source.yaml", "string.unquoted.block.yaml"]});

    ({tokens} = grammar.tokenizeLine("- !tag"));
    expect(tokens[2]).toEqual({value: "!", scopes: ["source.yaml", "keyword.other.tag.local.yaml", "punctuation.definition.tag.local.yaml"]});
    expect(tokens[3]).toEqual({value: "tag", scopes: ["source.yaml", "keyword.other.tag.local.yaml"]});

    ({tokens} = grammar.tokenizeLine("- !"));
    expect(tokens[0]).toEqual({value: "- !", scopes: ["source.yaml", "string.unquoted.yaml"]});

    ({tokens} = grammar.tokenizeLine("- !!"));
    expect(tokens[0]).toEqual({value: "- !!", scopes: ["source.yaml", "string.unquoted.yaml"]});
});

  it("parses the !!omap directive", function() {
    let {tokens} = grammar.tokenizeLine("hello: !!omap");
    expect(tokens[0]).toEqual({value: "hello", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(tokens[1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[3]).toEqual({value: "!!", scopes: ["source.yaml", "keyword.other.omap.yaml", "punctuation.definition.tag.omap.yaml"]});
    expect(tokens[4]).toEqual({value: "omap", scopes: ["source.yaml", "keyword.other.omap.yaml"]});

    ({tokens} = grammar.tokenizeLine("- 'hello': !!omap"));
    expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[2]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(tokens[3]).toEqual({value: "hello", scopes: ["source.yaml", "string.quoted.single.yaml", "entity.name.tag.yaml"]});
    expect(tokens[4]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.end.yaml"]});
    expect(tokens[5]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(tokens[6]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[7]).toEqual({value: "!!", scopes: ["source.yaml", "keyword.other.omap.yaml", "punctuation.definition.tag.omap.yaml"]});
    expect(tokens[8]).toEqual({value: "omap", scopes: ["source.yaml", "keyword.other.omap.yaml"]});

    ({tokens} = grammar.tokenizeLine("hello:!!omap"));
    expect(tokens[0]).toEqual({value: "hello:!!omap", scopes: ["source.yaml", "string.unquoted.yaml"]});
});

  it("parses dates in YYYY-MM-DD format", function() {
    let {tokens} = grammar.tokenizeLine("- date: 2001-01-01");
    expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[2]).toEqual({value: "date", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(tokens[3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[5]).toEqual({value: "2001-01-01", scopes: ["source.yaml", "constant.other.date.yaml"]});

    ({tokens} = grammar.tokenizeLine("apocalypse: 2012-12-21"));
    expect(tokens[0]).toEqual({value: "apocalypse", scopes: ["source.yaml", "entity.name.tag.yaml"]});
    expect(tokens[1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[3]).toEqual({value: "2012-12-21", scopes: ["source.yaml", "constant.other.date.yaml"]});

    ({tokens} = grammar.tokenizeLine("'the apocalypse is nigh': 2012-12-21"));
    expect(tokens[0]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.begin.yaml"]});
    expect(tokens[1]).toEqual({value: "the apocalypse is nigh", scopes: ["source.yaml", "string.quoted.single.yaml", "entity.name.tag.yaml"]});
    expect(tokens[2]).toEqual({value: "'", scopes: ["source.yaml", "string.quoted.single.yaml", "punctuation.definition.string.end.yaml"]});
    expect(tokens[3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[5]).toEqual({value: "2012-12-21", scopes: ["source.yaml", "constant.other.date.yaml"]});

    const lines = grammar.tokenizeLines(`\
multiline:
  - 2001-01-01
    2001-01-01\
`
    );
    expect(lines[1][3]).toEqual({value: "2001-01-01", scopes: ["source.yaml", "constant.other.date.yaml"]});
    expect(lines[2][1]).toEqual({value: "2001-01-01", scopes: ["source.yaml", "constant.other.date.yaml"]});

    ({tokens} = grammar.tokenizeLine("- 2001-01-01"));
    expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[2]).toEqual({value: "2001-01-01", scopes: ["source.yaml", "constant.other.date.yaml"]});

    ({tokens} = grammar.tokenizeLine("- 07-04-1776"));
    expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[2]).toEqual({value: "07-04-1776", scopes: ["source.yaml", "string.unquoted.yaml"]});

    ({tokens} = grammar.tokenizeLine("- nope 2001-01-01"));
    expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[2]).toEqual({value: "nope 2001-01-01", scopes: ["source.yaml", "string.unquoted.yaml"]});

    ({tokens} = grammar.tokenizeLine("- 2001-01-01 uh oh"));
    expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
    expect(tokens[2]).toEqual({value: "2001-01-01 uh oh", scopes: ["source.yaml", "string.unquoted.yaml"]});
});

  describe("numbers", function() {
    it("parses integers", function() {
      let {tokens} = grammar.tokenizeLine("- meaning of life: 42");
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "meaning of life", scopes: ["source.yaml", "entity.name.tag.yaml"]});
      expect(tokens[3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
      expect(tokens[4]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[5]).toEqual({value: "42", scopes: ["source.yaml", "constant.numeric.integer.yaml"]});

      ({tokens} = grammar.tokenizeLine("- positive: +42"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "positive", scopes: ["source.yaml", "entity.name.tag.yaml"]});
      expect(tokens[3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
      expect(tokens[4]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[5]).toEqual({value: "+42", scopes: ["source.yaml", "constant.numeric.integer.yaml"]});

      ({tokens} = grammar.tokenizeLine("- negative: -42"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "negative", scopes: ["source.yaml", "entity.name.tag.yaml"]});
      expect(tokens[3]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
      expect(tokens[4]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[5]).toEqual({value: "-42", scopes: ["source.yaml", "constant.numeric.integer.yaml"]});
  });

    it("parses octals", function() {
      const {tokens} = grammar.tokenizeLine("octal: 0o664");
      expect(tokens[0]).toEqual({value: "octal", scopes: ["source.yaml", "entity.name.tag.yaml"]});
      expect(tokens[1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
      expect(tokens[2]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[3]).toEqual({value: "0o664", scopes: ["source.yaml", "constant.numeric.octal.yaml"]});
  });

    it("parses hexadecimals", function() {
      const {tokens} = grammar.tokenizeLine("hex: 0x726Fa");
      expect(tokens[0]).toEqual({value: "hex", scopes: ["source.yaml", "entity.name.tag.yaml"]});
      expect(tokens[1]).toEqual({value: ":", scopes: ["source.yaml", "punctuation.separator.key-value.yaml"]});
      expect(tokens[2]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[3]).toEqual({value: "0x726Fa", scopes: ["source.yaml", "constant.numeric.hexadecimal.yaml"]});
  });

    it("parses floats", function() {
      let {tokens} = grammar.tokenizeLine("- 0.7e-9001");
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "0.7e-9001", scopes: ["source.yaml", "constant.numeric.float.yaml"]});

      ({tokens} = grammar.tokenizeLine("- +0.7E-9001"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "+0.7E-9001", scopes: ["source.yaml", "constant.numeric.float.yaml"]});

      ({tokens} = grammar.tokenizeLine("- -0.7e9001"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "-0.7e9001", scopes: ["source.yaml", "constant.numeric.float.yaml"]});
  });

    it("parses infinities", function() {
      let {tokens} = grammar.tokenizeLine("- .inf");
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: ".inf", scopes: ["source.yaml", "constant.numeric.float.yaml"]});

      ({tokens} = grammar.tokenizeLine("- -.Inf"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "-.Inf", scopes: ["source.yaml", "constant.numeric.float.yaml"]});

      ({tokens} = grammar.tokenizeLine("- +.INF"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "+.INF", scopes: ["source.yaml", "constant.numeric.float.yaml"]});
  });

    it("parses NaNs", function() {
      let {tokens} = grammar.tokenizeLine("- .nan");
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: ".nan", scopes: ["source.yaml", "constant.numeric.float.yaml"]});

      ({tokens} = grammar.tokenizeLine("- .NaN"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: ".NaN", scopes: ["source.yaml", "constant.numeric.float.yaml"]});

      ({tokens} = grammar.tokenizeLine("- .NAN"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: ".NAN", scopes: ["source.yaml", "constant.numeric.float.yaml"]});
  });

    it("parses multiple numbers", function() {
      const lines = grammar.tokenizeLines(`\
multiline:
  - 3.14
    3.14\
`
      );
      expect(lines[1][3]).toEqual({value: "3.14", scopes: ["source.yaml", "constant.numeric.float.yaml"]});
      expect(lines[2][1]).toEqual({value: "3.14", scopes: ["source.yaml", "constant.numeric.float.yaml"]});
  });

    it("does not parse numbers surrounded by other characters", function() {
      let {tokens} = grammar.tokenizeLine("- pi 3.14");
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "pi 3.14", scopes: ["source.yaml", "string.unquoted.yaml"]});

      ({tokens} = grammar.tokenizeLine("- 3.14 uh oh"));
      expect(tokens[0]).toEqual({value: "-", scopes: ["source.yaml", "punctuation.definition.entry.yaml"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.yaml"]});
      expect(tokens[2]).toEqual({value: "3.14 uh oh", scopes: ["source.yaml", "string.unquoted.yaml"]});
  });
});

  describe("variables", () => it("tokenizes them", function() {
    let {tokens} = grammar.tokenizeLine("&variable");
    expect(tokens[0]).toEqual({value: "&", scopes: ["source.yaml", "variable.other.yaml", "punctuation.definition.variable.yaml"]});
    expect(tokens[1]).toEqual({value: "variable", scopes: ["source.yaml", "variable.other.yaml"]});

    ({tokens} = grammar.tokenizeLine("*variable"));
    expect(tokens[0]).toEqual({value: "*", scopes: ["source.yaml", "variable.other.yaml", "punctuation.definition.variable.yaml"]});
    expect(tokens[1]).toEqual({value: "variable", scopes: ["source.yaml", "variable.other.yaml"]});

    ({tokens} = grammar.tokenizeLine("&v3ryc001"));
    expect(tokens[0]).toEqual({value: "&", scopes: ["source.yaml", "variable.other.yaml", "punctuation.definition.variable.yaml"]});
    expect(tokens[1]).toEqual({value: "v3ryc001", scopes: ["source.yaml", "variable.other.yaml"]});

    ({tokens} = grammar.tokenizeLine("& variable"));
    expect(tokens[0]).toEqual({value: "& variable", scopes: ["source.yaml", "string.unquoted.yaml"]});

    ({tokens} = grammar.tokenizeLine("&variable hey"));
    expect(tokens[0]).toEqual({value: "&variable hey", scopes: ["source.yaml", "string.unquoted.yaml"]});
}));

  describe("constants", function() {
    it("tokenizes true, false, and null as constants", function() {
      let {tokens} = grammar.tokenizeLine("key: true");
      expect(tokens[3]).toEqual({value: "true", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: false"));
      expect(tokens[3]).toEqual({value: "false", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: null"));
      expect(tokens[3]).toEqual({value: "null", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: True"));
      expect(tokens[3]).toEqual({value: "True", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: False"));
      expect(tokens[3]).toEqual({value: "False", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: Null"));
      expect(tokens[3]).toEqual({value: "Null", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: TRUE"));
      expect(tokens[3]).toEqual({value: "TRUE", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: FALSE"));
      expect(tokens[3]).toEqual({value: "FALSE", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: NULL"));
      expect(tokens[3]).toEqual({value: "NULL", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: ~"));
      expect(tokens[3]).toEqual({value: "~", scopes: ["source.yaml", "constant.language.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: true$"));
      expect(tokens[3]).toEqual({value: "true$", scopes: ["source.yaml", "string.unquoted.yaml"]});

      ({tokens} = grammar.tokenizeLine("key: true false"));
      expect(tokens[3]).toEqual({value: "true false", scopes: ["source.yaml", "string.unquoted.yaml"]});
  });

    it("does not tokenize keys as constants", function() {
      const {tokens} = grammar.tokenizeLine("true: something");
      expect(tokens[0]).toEqual({value: "true", scopes: ["source.yaml", "entity.name.tag.yaml"]});
  });
});

  describe("structures", function() {
    it("tokenizes directives end markers", function() {
      let {tokens} = grammar.tokenizeLine("---");
      expect(tokens[0]).toEqual({value: "---", scopes: ["source.yaml", "punctuation.definition.directives.end.yaml"]});

      ({tokens} = grammar.tokenizeLine(" ---"));
      expect(tokens[1]).not.toEqual({value: "---", scopes: ["source.yaml", "punctuation.definition.directives.end.yaml"]});
  });

    it("tokenizes document end markers", function() {
      const {tokens} = grammar.tokenizeLine("...");
      expect(tokens[0]).toEqual({value: "...", scopes: ["source.yaml", "punctuation.definition.document.end.yaml"]});
  });

    it("tokenizes structures in an actual YAML document", function() {
      const lines = grammar.tokenizeLines(`\
---
time: 20:03:20
player: Sammy Sosa
action: strike (miss)
...
---
time: 20:03:47
player: Sammy Sosa
action: grand slam
...\
`
      );
      expect(lines[0][0]).toEqual({value: "---", scopes: ["source.yaml", "punctuation.definition.directives.end.yaml"]});
      expect(lines[4][0]).toEqual({value: "...", scopes: ["source.yaml", "punctuation.definition.document.end.yaml"]});
      expect(lines[5][0]).toEqual({value: "---", scopes: ["source.yaml", "punctuation.definition.directives.end.yaml"]});
      expect(lines[9][0]).toEqual({value: "...", scopes: ["source.yaml", "punctuation.definition.document.end.yaml"]});
  });
});

  describe("tabs", () => it("marks them as invalid", function() {
    const {tokens} = grammar.tokenizeLine("\t\ttabs:");
    expect(tokens[0]).toEqual({value: '\t\t', scopes: ['source.yaml', 'invalid.illegal.whitespace.yaml']});
}));
});
