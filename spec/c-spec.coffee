TextEditor = null
buildTextEditor = (params) ->
  if atom.workspace.buildTextEditor?
    atom.workspace.buildTextEditor(params)
  else
    TextEditor ?= require('atom').TextEditor
    new TextEditor(params)

describe "Language-C", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-c')

  describe "C", ->
    beforeEach ->
      grammar = atom.grammars.grammarForScopeName('source.c')

    it "parses the grammar", ->
      expect(grammar).toBeTruthy()
      expect(grammar.scopeName).toBe 'source.c'

    it "tokenizes functions", ->
      lines = grammar.tokenizeLines '''
        int something(int param) {
          return 0;
        }
      '''
      expect(lines[0][0]).toEqual value: 'int', scopes: ['source.c', 'storage.type.c']
      expect(lines[0][2]).toEqual value: 'something', scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
      expect(lines[0][3]).toEqual value: '(', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.begin.c']
      expect(lines[0][4]).toEqual value: 'int', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'storage.type.c']
      expect(lines[0][6]).toEqual value: ')', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.end.c']
      expect(lines[0][8]).toEqual value: '{', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'punctuation.section.block.begin.c']
      expect(lines[1][1]).toEqual value: 'return', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'keyword.control.c']
      expect(lines[1][3]).toEqual value: '0', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'constant.numeric.c']
      expect(lines[2][0]).toEqual value: '}', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'punctuation.section.block.end.c']

    it "tokenizes various _t types", ->
      {tokens} = grammar.tokenizeLine('size_t var;')
      expect(tokens[0]).toEqual value: 'size_t', scopes: ['source.c', 'support.type.sys-types.c']

      {tokens} = grammar.tokenizeLine('pthread_t var;')
      expect(tokens[0]).toEqual value: 'pthread_t', scopes: ['source.c', 'support.type.pthread.c']

      {tokens} = grammar.tokenizeLine('int32_t var;')
      expect(tokens[0]).toEqual value: 'int32_t', scopes: ['source.c', 'support.type.stdint.c']

      {tokens} = grammar.tokenizeLine('myType_t var;')
      expect(tokens[0]).toEqual value: 'myType_t', scopes: ['source.c', 'support.type.posix-reserved.c']

    describe "strings", ->
      it "tokenizes them", ->
        delimsByScope =
          'string.quoted.double.c': '"'
          'string.quoted.single.c': '\''

        for scope, delim of delimsByScope
          {tokens} = grammar.tokenizeLine delim + 'a' + delim
          expect(tokens[0]).toEqual value: delim, scopes: ['source.c', scope, 'punctuation.definition.string.begin.c']
          expect(tokens[1]).toEqual value: 'a', scopes: ['source.c', scope]
          expect(tokens[2]).toEqual value: delim, scopes: ['source.c', scope, 'punctuation.definition.string.end.c']

    describe "preprocessor directives", ->
      it "tokenizes '#line'", ->
        {tokens} = grammar.tokenizeLine '#line 151 "copy.c"'
        expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.line.c', 'punctuation.definition.directive.c']
        expect(tokens[1]).toEqual value: 'line', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.line.c']
        expect(tokens[3]).toEqual value: '151', scopes: ['source.c', 'meta.preprocessor.c', 'constant.numeric.c']
        expect(tokens[5]).toEqual value: '"', scopes: ['source.c', 'meta.preprocessor.c', 'string.quoted.double.c', 'punctuation.definition.string.begin.c']
        expect(tokens[6]).toEqual value: 'copy.c', scopes: ['source.c', 'meta.preprocessor.c', 'string.quoted.double.c']
        expect(tokens[7]).toEqual value: '"', scopes: ['source.c', 'meta.preprocessor.c', 'string.quoted.double.c', 'punctuation.definition.string.end.c']

      it "tokenizes '#undef'", ->
        {tokens} = grammar.tokenizeLine '#undef FOO'
        expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.undef.c', 'punctuation.definition.directive.c']
        expect(tokens[1]).toEqual value: 'undef', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.undef.c']
        expect(tokens[2]).toEqual value: ' FOO', scopes: ['source.c', 'meta.preprocessor.c']

      it "tokenizes '#pragma'", ->
        {tokens} = grammar.tokenizeLine '#pragma once'
        expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.pragma.c', 'punctuation.definition.directive.c']
        expect(tokens[1]).toEqual value: 'pragma', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.pragma.c']
        expect(tokens[2]).toEqual value: ' once', scopes: ['source.c', 'meta.preprocessor.c']

        {tokens} = grammar.tokenizeLine '#pragma clang diagnostic push'
        expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.pragma.c', 'punctuation.definition.directive.c']
        expect(tokens[1]).toEqual value: 'pragma', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.pragma.c']
        expect(tokens[2]).toEqual value: ' clang diagnostic push', scopes: ['source.c', 'meta.preprocessor.c']

        {tokens} = grammar.tokenizeLine '#pragma mark – Initialization'
        expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.section', 'meta.preprocessor.c', 'keyword.control.directive.pragma.pragma-mark.c',  'punctuation.definition.directive.c']
        expect(tokens[1]).toEqual value: 'pragma mark', scopes: ['source.c', 'meta.section',  'meta.preprocessor.c', 'keyword.control.directive.pragma.pragma-mark.c']
        expect(tokens[3]).toEqual value: '– Initialization', scopes: ['source.c', 'meta.section',  'meta.preprocessor.c', 'meta.toc-list.pragma-mark.c']

      describe "define", ->
        it "tokenizes '#define [identifier name]'", ->
          {tokens} = grammar.tokenizeLine '#define _FILE_NAME_H_'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
          expect(tokens[3]).toEqual value: '_FILE_NAME_H_', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']

        it "tokenizes '#define [identifier name] [value]'", ->
          {tokens} = grammar.tokenizeLine '#define WIDTH 80'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
          expect(tokens[3]).toEqual value: 'WIDTH', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
          expect(tokens[5]).toEqual value: '80', scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.numeric.c']

          {tokens} = grammar.tokenizeLine '#define ABC XYZ(1)'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
          expect(tokens[3]).toEqual value: 'ABC', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
          expect(tokens[4]).toEqual value: ' ', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'punctuation.whitespace.function.leading.c']
          expect(tokens[5]).toEqual value: 'XYZ', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'entity.name.function.c']
          expect(tokens[6]).toEqual value: '(', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.begin.c']
          expect(tokens[7]).toEqual value: '1', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'meta.parens.c', 'constant.numeric.c']
          expect(tokens[8]).toEqual value: ')', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.end.c']

          {tokens} = grammar.tokenizeLine '#define PI_PLUS_ONE (3.14 + 1)'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
          expect(tokens[3]).toEqual value: 'PI_PLUS_ONE', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
          expect(tokens[4]).toEqual value: ' (', scopes: ['source.c', 'meta.preprocessor.macro.c']
          expect(tokens[5]).toEqual value: '3.14', scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.numeric.c']
          expect(tokens[6]).toEqual value: ' + ', scopes: ['source.c', 'meta.preprocessor.macro.c']
          expect(tokens[7]).toEqual value: '1', scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.numeric.c']
          expect(tokens[8]).toEqual value: ')', scopes: ['source.c', 'meta.preprocessor.macro.c']

        describe "macros", ->
          it "tokenizes them", ->
            {tokens} = grammar.tokenizeLine '#define INCREMENT(x) x++'
            expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            expect(tokens[1]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            expect(tokens[3]).toEqual value: 'INCREMENT', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            expect(tokens[4]).toEqual value: '(', scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
            expect(tokens[5]).toEqual value: 'x', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
            expect(tokens[6]).toEqual value: ')', scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
            expect(tokens[7]).toEqual value: ' x++', scopes: ['source.c', 'meta.preprocessor.macro.c']

            {tokens} = grammar.tokenizeLine '#define MULT(x, y) (x) * (y)'
            expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            expect(tokens[1]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            expect(tokens[3]).toEqual value: 'MULT', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            expect(tokens[4]).toEqual value: '(', scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
            expect(tokens[5]).toEqual value: 'x', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
            expect(tokens[6]).toEqual value: ',', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c', 'punctuation.separator.parameters.c']
            expect(tokens[7]).toEqual value: ' y', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
            expect(tokens[8]).toEqual value: ')', scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
            expect(tokens[9]).toEqual value: ' (x) * (y)', scopes: ['source.c', 'meta.preprocessor.macro.c']

            {tokens} = grammar.tokenizeLine '#define SWAP(a, b)  do { a ^= b; b ^= a; a ^= b; } while ( 0 )'
            expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            expect(tokens[1]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            expect(tokens[3]).toEqual value: 'SWAP', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            expect(tokens[4]).toEqual value: '(', scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
            expect(tokens[5]).toEqual value: 'a', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
            expect(tokens[6]).toEqual value: ',', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c', 'punctuation.separator.parameters.c']
            expect(tokens[7]).toEqual value: ' b', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
            expect(tokens[8]).toEqual value: ')', scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
            expect(tokens[10]).toEqual value: 'do', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.c']
            expect(tokens[12]).toEqual value: '{', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.begin.c']
            expect(tokens[13]).toEqual value: ' a ^= b; b ^= a; a ^= b; ', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
            expect(tokens[14]).toEqual value: '}', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.end.c']
            expect(tokens[16]).toEqual value: 'while', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.c']
            expect(tokens[17]).toEqual value: ' ( ', scopes: ['source.c', 'meta.preprocessor.macro.c']
            expect(tokens[18]).toEqual value: '0', scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.numeric.c']
            expect(tokens[19]).toEqual value: ' )', scopes: ['source.c', 'meta.preprocessor.macro.c']

          it "tokenizes multiline macros", ->
            lines = grammar.tokenizeLines '''
              #define SWAP(a, b)  { \\
                a ^= b; \\
                b ^= a; \\
                a ^= b; \\
              }
            '''
            expect(lines[0][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            expect(lines[0][1]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            expect(lines[0][3]).toEqual value: 'SWAP', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            expect(lines[0][4]).toEqual value: '(', scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
            expect(lines[0][5]).toEqual value: 'a', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
            expect(lines[0][6]).toEqual value: ',', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c', 'punctuation.separator.parameters.c']
            expect(lines[0][7]).toEqual value: ' b', scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
            expect(lines[0][8]).toEqual value: ')', scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
            expect(lines[0][10]).toEqual value: '{', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.begin.c']
            expect(lines[0][11]).toEqual value: ' \\', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
            expect(lines[1][0]).toEqual value: '  a ^= b; \\', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
            expect(lines[2][0]).toEqual value: '  b ^= a; \\', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
            expect(lines[3][0]).toEqual value: '  a ^= b; \\', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
            expect(lines[4][0]).toEqual value: '}', scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.end.c']

      describe "includes", ->
        it "tokenizes '#include'", ->
          {tokens} = grammar.tokenizeLine '#include <stdio.h>'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'include', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
          expect(tokens[3]).toEqual value: '<', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.begin.c']
          expect(tokens[4]).toEqual value: 'stdio.h', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c']
          expect(tokens[5]).toEqual value: '>', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.end.c']

          {tokens} = grammar.tokenizeLine '#include "file"'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'include', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
          expect(tokens[3]).toEqual value: '"', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.begin.c']
          expect(tokens[4]).toEqual value: 'file', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c']
          expect(tokens[5]).toEqual value: '"', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.end.c']

        it "tokenizes '#import'", ->
          {tokens} = grammar.tokenizeLine '#import "file"'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.import.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'import', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.import.c']
          expect(tokens[3]).toEqual value: '"', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.begin.c']
          expect(tokens[4]).toEqual value: 'file', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c']
          expect(tokens[5]).toEqual value: '"', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.end.c']

      describe "diagnostics", ->
        it "tokenizes '#error'", ->
          {tokens} = grammar.tokenizeLine '#error C++ compiler required.'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'keyword.control.directive.diagnostic.error.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'error', scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'keyword.control.directive.diagnostic.error.c']
          expect(tokens[2]).toEqual value: ' C++ compiler required.', scopes: ['source.c', 'meta.preprocessor.diagnostic.c']

        it "tokenizes '#warning'", ->
          {tokens} = grammar.tokenizeLine '#warning This is a warning.'
          expect(tokens[0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'keyword.control.directive.diagnostic.warning.c', 'punctuation.definition.directive.c']
          expect(tokens[1]).toEqual value: 'warning', scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'keyword.control.directive.diagnostic.warning.c']
          expect(tokens[2]).toEqual value: ' This is a warning.', scopes: ['source.c', 'meta.preprocessor.diagnostic.c']

      describe "conditionals", ->
        it "tokenizes if-elif-else preprocessor blocks", ->
          lines = grammar.tokenizeLines '''
            #if defined(CREDIT)
                credit();
            #elif defined(DEBIT)
                debit();
            #else
                printerror();
            #endif
          '''
          expect(lines[0][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[0][1]).toEqual value: 'if', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[0][2]).toEqual value: ' defined(CREDIT)', scopes: ['source.c', 'meta.preprocessor.c']
          expect(lines[1][1]).toEqual value: 'credit', scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
          expect(lines[1][2]).toEqual value: '(', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.begin.c']
          expect(lines[1][3]).toEqual value: ')', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.end.c']
          expect(lines[2][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[2][1]).toEqual value: 'elif', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[2][2]).toEqual value: ' defined(DEBIT)', scopes: ['source.c', 'meta.preprocessor.c']
          expect(lines[3][1]).toEqual value: 'debit', scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
          expect(lines[3][2]).toEqual value: '(', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.begin.c']
          expect(lines[3][3]).toEqual value: ')', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.end.c']
          expect(lines[4][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[4][1]).toEqual value: 'else', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[5][1]).toEqual value: 'printerror', scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
          expect(lines[5][2]).toEqual value: '(', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.begin.c']
          expect(lines[5][3]).toEqual value: ')', scopes: ['source.c', 'meta.function.c', 'meta.parens.c', 'punctuation.section.parens.end.c']
          expect(lines[6][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[6][1]).toEqual value: 'endif', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']

        it "tokenizes if-true-else blocks", ->
          lines = grammar.tokenizeLines '''
            #if 1
            int something() {
              #if 1
                return 1;
              #else
                return 0;
              #endif
            }
            #else
            int something() {
              return 0;
            }
            #endif
          '''
          expect(lines[0][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[0][1]).toEqual value: 'if', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[0][3]).toEqual value: '1', scopes: ['source.c', 'meta.preprocessor.c', 'constant.numeric.preprocessor.c']
          expect(lines[1][0]).toEqual value: 'int', scopes: ['source.c', 'storage.type.c']
          expect(lines[1][2]).toEqual value: 'something', scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
          expect(lines[2][1]).toEqual value: '#', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[2][2]).toEqual value: 'if', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[2][4]).toEqual value: '1', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'constant.numeric.preprocessor.c']
          expect(lines[3][1]).toEqual value: 'return', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'keyword.control.c']
          expect(lines[3][3]).toEqual value: '1', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'constant.numeric.c']
          expect(lines[4][1]).toEqual value: '#', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[4][2]).toEqual value: 'else', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[5][0]).toEqual value: '    return 0;', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'comment.block.preprocessor.else-branch.in-block']
          expect(lines[6][1]).toEqual value: '#', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[6][2]).toEqual value: 'endif', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[8][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[8][1]).toEqual value: 'else', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[9][0]).toEqual value: 'int something() {', scopes: ['source.c', 'comment.block.preprocessor.else-branch']
          expect(lines[12][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[12][1]).toEqual value: 'endif', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']

        it "tokenizes if-false-else blocks", ->
          lines = grammar.tokenizeLines '''
            int something() {
              #if 0
                return 1;
              #else
                return 0;
              #endif
            }
          '''
          expect(lines[0][0]).toEqual value: 'int', scopes: ['source.c', 'storage.type.c']
          expect(lines[0][2]).toEqual value: 'something', scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
          expect(lines[1][1]).toEqual value: '#', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[1][2]).toEqual value: 'if', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[1][4]).toEqual value: '0', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'constant.numeric.preprocessor.c']
          expect(lines[2][0]).toEqual value: '    return 1;', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'comment.block.preprocessor.if-branch.in-block']
          expect(lines[3][1]).toEqual value: '#', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[3][2]).toEqual value: 'else', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[4][1]).toEqual value: 'return', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'keyword.control.c']
          expect(lines[4][3]).toEqual value: '0', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'constant.numeric.c']
          expect(lines[5][1]).toEqual value: '#', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[5][2]).toEqual value: 'endif', scopes: ['source.c', 'meta.function.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']

          lines = grammar.tokenizeLines '''
            #if 0
              something();
            #endif
          '''
          expect(lines[0][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[0][1]).toEqual value: 'if', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[0][3]).toEqual value: '0', scopes: ['source.c', 'meta.preprocessor.c', 'constant.numeric.preprocessor.c']
          expect(lines[1][0]).toEqual value: '  something();', scopes: ['source.c', 'comment.block.preprocessor.if-branch']
          expect(lines[2][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[2][1]).toEqual value: 'endif', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']

        it "tokenizes ifdef-elif blocks", ->
          lines = grammar.tokenizeLines '''
            #ifdef __unix__ /* is defined by compilers targeting Unix systems */
              # include <unistd.h>
            #elif defined _WIN32 /* is defined by compilers targeting Windows systems */
              # include <windows.h>
            #endif
          '''
          expect(lines[0][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[0][1]).toEqual value: 'ifdef', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[0][2]).toEqual value: ' __unix__ ', scopes: ['source.c', 'meta.preprocessor.c']
          expect(lines[0][3]).toEqual value: '/*', scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.begin.c']
          expect(lines[0][4]).toEqual value: ' is defined by compilers targeting Unix systems ', scopes: ['source.c', 'comment.block.c']
          expect(lines[0][5]).toEqual value: '*/', scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.end.c']
          expect(lines[1][1]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
          expect(lines[1][2]).toEqual value: ' include', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
          expect(lines[1][4]).toEqual value: '<', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.begin.c']
          expect(lines[1][5]).toEqual value: 'unistd.h', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c']
          expect(lines[1][6]).toEqual value: '>', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.end.c']
          expect(lines[2][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[2][1]).toEqual value: 'elif', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[2][2]).toEqual value: ' defined _WIN32 ', scopes: ['source.c', 'meta.preprocessor.c']
          expect(lines[2][3]).toEqual value: '/*', scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.begin.c']
          expect(lines[2][4]).toEqual value: ' is defined by compilers targeting Windows systems ', scopes: ['source.c', 'comment.block.c']
          expect(lines[2][5]).toEqual value: '*/', scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.end.c']
          expect(lines[3][1]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
          expect(lines[3][2]).toEqual value: ' include', scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
          expect(lines[3][4]).toEqual value: '<', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.begin.c']
          expect(lines[3][5]).toEqual value: 'windows.h', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c']
          expect(lines[3][6]).toEqual value: '>', scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.end.c']
          expect(lines[4][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[4][1]).toEqual value: 'endif', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']

        it "tokenizes ifndef blocks", ->
          lines = grammar.tokenizeLines '''
            #ifndef _INCL_GUARD
              #define _INCL_GUARD
            #endif
          '''
          expect(lines[0][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[0][1]).toEqual value: 'ifndef', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
          expect(lines[0][2]).toEqual value: ' _INCL_GUARD', scopes: ['source.c', 'meta.preprocessor.c']
          expect(lines[1][1]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
          expect(lines[1][2]).toEqual value: 'define', scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
          expect(lines[1][4]).toEqual value: '_INCL_GUARD', scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
          expect(lines[2][0]).toEqual value: '#', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
          expect(lines[2][1]).toEqual value: 'endif', scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']

    describe "indentation", ->
      editor = null

      beforeEach ->
        editor = buildTextEditor()
        editor.setGrammar(grammar)

      expectPreservedIndentation = (text) ->
        editor.setText(text)
        editor.autoIndentBufferRows(0, editor.getLineCount() - 1)

        expectedLines = text.split('\n')
        actualLines = editor.getText().split('\n')
        for actualLine, i in actualLines
          expect([
            actualLine,
            editor.indentLevelForLine(actualLine)
          ]).toEqual([
            expectedLines[i],
            editor.indentLevelForLine(expectedLines[i])
          ])

      it "indents allman-style curly braces", ->
        expectPreservedIndentation '''
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
        '''

      it "indents non-allman-style curly braces", ->
        expectPreservedIndentation '''
          if (a) {
            for (;;) {
              do {
                while (b) {
                  c();
                }
              } while (d)
            }
          }
        '''

      it "indents function arguments", ->
        expectPreservedIndentation '''
          a(
            b,
            c(
              d
            )
          );
        '''

      it "indents array and struct literals", ->
        expectPreservedIndentation '''
          some_t a[3] = {
            { .b = c },
            { .b = c, .d = {1, 2} },
          };
        '''

  describe "C++", ->
    beforeEach ->
      grammar = atom.grammars.grammarForScopeName('source.cpp')

    it "parses the grammar", ->
      expect(grammar).toBeTruthy()
      expect(grammar.scopeName).toBe 'source.cpp'

    it "tokenizes this with `.this` class", ->
      {tokens} = grammar.tokenizeLine 'this.x'
      expect(tokens[0]).toEqual value: 'this', scopes: ['source.cpp', 'variable.language.this.cpp']

    it "tokenizes classes", ->
      lines = grammar.tokenizeLines '''
        class Thing {
          int x;
        }
      '''
      expect(lines[0][0]).toEqual value: 'class', scopes: ['source.cpp', 'meta.class-struct-block.cpp', 'storage.type.cpp']
      expect(lines[0][2]).toEqual value: 'Thing', scopes: ['source.cpp', 'meta.class-struct-block.cpp', 'entity.name.type.cpp']
