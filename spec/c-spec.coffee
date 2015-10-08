{TextEditor} = require 'atom'

describe 'Language-C', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-c')

  describe "C", ->
    beforeEach ->
      grammar = atom.grammars.grammarForScopeName('source.c')

    it 'parses the grammar', ->
      expect(grammar).toBeTruthy()
      expect(grammar.scopeName).toBe 'source.c'

    it 'tokenizes functions', ->
      lines = grammar.tokenizeLines '''
        int something() {
          return 0;
        }
      '''

      expect(lines[0][0]).toEqual value: 'int', scopes: ["source.c", "storage.type.c"]
      expect(lines[0][2]).toEqual value: 'something', scopes: ["source.c", "meta.function.c", "entity.name.function.c"]
      expect(lines[0][3]).toEqual value: '(', scopes: ["source.c", "meta.function.c", "meta.parens.c", "punctuation.section.parens.begin.c"]
      expect(lines[0][6]).toEqual value: '{', scopes: ["source.c", "meta.function.c", "meta.block.c", "punctuation.section.block.begin.c"]

    it 'tokenizes if-true-else preprocessor blocks', ->
      lines = grammar.tokenizeLines '''
        #if 1
        int something() {
          return 0;
        }
        #else
        int something() {
          return 0;
        }
        #endif
      '''

      expect(lines[0][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c']
      expect(lines[0][1]).toEqual value: 'if', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.import.if.c']
      expect(lines[0][3]).toEqual value: '1', scopes: ['source.c', 'meta.preprocessor.c', 'constant.numeric.preprocessor.c']
      expect(lines[1][0]).toEqual value: 'int', scopes: ['source.c', 'storage.type.c']
      expect(lines[1][2]).toEqual value: 'something', scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
      expect(lines[5][0]).toEqual value: 'int something() {', scopes: ['source.c', 'comment.block.preprocessor.else-branch']

    it 'tokenizes various _t types', ->
      {tokens} = grammar.tokenizeLine("size_t var;")
      expect(tokens[0]).toEqual value: 'size_t', scopes: ['source.c', 'support.type.sys-types.c']

      {tokens} = grammar.tokenizeLine("pthread_t var;")
      expect(tokens[0]).toEqual value: 'pthread_t', scopes: ['source.c', 'support.type.pthread.c']

      {tokens} = grammar.tokenizeLine("int32_t var;")
      expect(tokens[0]).toEqual value: 'int32_t', scopes: ['source.c', 'support.type.stdint.c']

      {tokens} = grammar.tokenizeLine("myType_t var;")
      expect(tokens[0]).toEqual value: 'myType_t', scopes: ['source.c', 'support.type.posix-reserved.c']

    describe "indentation", ->
      editor = null

      beforeEach ->
        editor = new TextEditor({})
        editor.setGrammar(grammar)

      expectPreservedIndentation = (text) ->
        editor.setText(text)
        editor.autoIndentBufferRows(0, editor.getLineCount() - 1)

        expectedLines = text.split("\n")
        actualLines = editor.getText().split("\n")
        for actualLine, i in actualLines
          expect([
            actualLine,
            editor.indentLevelForLine(actualLine)
          ]).toEqual([
            expectedLines[i],
            editor.indentLevelForLine(expectedLines[i])
          ])

      it "indents allman-style curly braces", ->
        expectPreservedIndentation """
          if (a)
          {
            for (;;)
            {
              do
              {
                while (b)
                {
                  c();
                }
              }
              while (d)
            }
          }
        """

      it "indents non-allman-style curly braces", ->
        expectPreservedIndentation """
          if (a) {
            for (;;) {
              do {
                while (b) {
                  c();
                }
              } while (d)
            }
          }
        """

      it "indents function arguments", ->
        expectPreservedIndentation """
          a(
            b,
            c(
              d
            )
          );
        """

      it "indents array and struct literals", ->
        expectPreservedIndentation """
          some_t a[3] = {
            { .b = c },
            { .b = c, .d = {1, 2} },
          };
        """

  describe "C++", ->
    beforeEach ->
      grammar = atom.grammars.grammarForScopeName('source.cpp')

    it 'parses the grammar', ->
      expect(grammar).toBeTruthy()
      expect(grammar.scopeName).toBe 'source.cpp'

    it 'tokenizes this with `.this` class', ->
      {tokens} = grammar.tokenizeLine 'this.x'

      expect(tokens[0]).toEqual value: 'this', scopes: ['source.cpp', 'variable.language.this.cpp']

    it 'tokenizes classes', ->
      lines = grammar.tokenizeLines '''
        class Thing {
          int x;
        }
      '''

      expect(lines[0][0]).toEqual value: 'class', scopes: ["source.cpp", "meta.class-struct-block.cpp", "storage.type.cpp"]
      expect(lines[0][2]).toEqual value: 'Thing', scopes: ["source.cpp", "meta.class-struct-block.cpp", "entity.name.type.cpp"]
