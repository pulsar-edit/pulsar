(function() {
  var TextEditor, buildTextEditor;

  TextEditor = null;

  buildTextEditor = function(params) {
    if (atom.workspace.buildTextEditor != null) {
      return atom.workspace.buildTextEditor(params);
    } else {
      if (TextEditor == null) {
        TextEditor = require('atom').TextEditor;
      }
      return new TextEditor(params);
    }
  };

  describe("Language-C", function() {
    var grammar;
    grammar = null;
    beforeEach(function() {
      atom.config.set('core.useTreeSitterParsers', false);
      return waitsForPromise(function() {
        return atom.packages.activatePackage('language-c');
      });
    });
    describe("C", function() {
      beforeEach(function() {
        return grammar = atom.grammars.grammarForScopeName('source.c');
      });
      it("parses the grammar", function() {
        expect(grammar).toBeTruthy();
        return expect(grammar.scopeName).toBe('source.c');
      });
      it("tokenizes punctuation", function() {
        var tokens;
        tokens = grammar.tokenizeLine('hi;').tokens;
        expect(tokens[1]).toEqual({
          value: ';',
          scopes: ['source.c', 'punctuation.terminator.statement.c']
        });
        tokens = grammar.tokenizeLine('a[b]').tokens;
        expect(tokens[1]).toEqual({
          value: '[',
          scopes: ['source.c', 'punctuation.definition.begin.bracket.square.c']
        });
        expect(tokens[3]).toEqual({
          value: ']',
          scopes: ['source.c', 'punctuation.definition.end.bracket.square.c']
        });
        tokens = grammar.tokenizeLine('a, b').tokens;
        return expect(tokens[1]).toEqual({
          value: ',',
          scopes: ['source.c', 'punctuation.separator.delimiter.c']
        });
      });
      it("tokenizes functions", function() {
        var lines;
        lines = grammar.tokenizeLines('int something(int param) {\n  return 0;\n}');
        expect(lines[0][0]).toEqual({
          value: 'int',
          scopes: ['source.c', 'storage.type.c']
        });
        expect(lines[0][2]).toEqual({
          value: 'something',
          scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
        });
        expect(lines[0][3]).toEqual({
          value: '(',
          scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.begin.bracket.round.c']
        });
        expect(lines[0][4]).toEqual({
          value: 'int',
          scopes: ['source.c', 'meta.function.c', 'storage.type.c']
        });
        expect(lines[0][6]).toEqual({
          value: ')',
          scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.end.bracket.round.c']
        });
        expect(lines[0][8]).toEqual({
          value: '{',
          scopes: ['source.c', 'meta.block.c', 'punctuation.section.block.begin.bracket.curly.c']
        });
        expect(lines[1][1]).toEqual({
          value: 'return',
          scopes: ['source.c', 'meta.block.c', 'keyword.control.c']
        });
        expect(lines[1][3]).toEqual({
          value: '0',
          scopes: ['source.c', 'meta.block.c', 'constant.numeric.c']
        });
        return expect(lines[2][0]).toEqual({
          value: '}',
          scopes: ['source.c', 'meta.block.c', 'punctuation.section.block.end.bracket.curly.c']
        });
      });
      it("tokenizes varargs ellipses", function() {
        var tokens;
        tokens = grammar.tokenizeLine('void function(...);').tokens;
        expect(tokens[0]).toEqual({
          value: 'void',
          scopes: ['source.c', 'storage.type.c']
        });
        expect(tokens[2]).toEqual({
          value: 'function',
          scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
        });
        expect(tokens[3]).toEqual({
          value: '(',
          scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.begin.bracket.round.c']
        });
        expect(tokens[4]).toEqual({
          value: '...',
          scopes: ['source.c', 'meta.function.c', 'punctuation.vararg-ellipses.c']
        });
        return expect(tokens[5]).toEqual({
          value: ')',
          scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.end.bracket.round.c']
        });
      });
      it("tokenizes various _t types", function() {
        var tokens;
        tokens = grammar.tokenizeLine('size_t var;').tokens;
        expect(tokens[0]).toEqual({
          value: 'size_t',
          scopes: ['source.c', 'support.type.sys-types.c']
        });
        tokens = grammar.tokenizeLine('pthread_t var;').tokens;
        expect(tokens[0]).toEqual({
          value: 'pthread_t',
          scopes: ['source.c', 'support.type.pthread.c']
        });
        tokens = grammar.tokenizeLine('int32_t var;').tokens;
        expect(tokens[0]).toEqual({
          value: 'int32_t',
          scopes: ['source.c', 'support.type.stdint.c']
        });
        tokens = grammar.tokenizeLine('myType_t var;').tokens;
        return expect(tokens[0]).toEqual({
          value: 'myType_t',
          scopes: ['source.c', 'support.type.posix-reserved.c']
        });
      });
      it("tokenizes 'line continuation' character", function() {
        var tokens;
        tokens = grammar.tokenizeLine('ma' + '\\' + '\n' + 'in(){};').tokens;
        expect(tokens[0]).toEqual({
          value: 'ma',
          scopes: ['source.c']
        });
        expect(tokens[1]).toEqual({
          value: '\\',
          scopes: ['source.c', 'constant.character.escape.line-continuation.c']
        });
        return expect(tokens[3]).toEqual({
          value: 'in',
          scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
        });
      });
      describe("strings", function() {
        return it("tokenizes them", function() {
          var delim, delimsByScope, scope, tokens;
          delimsByScope = {
            'string.quoted.double.c': '"',
            'string.quoted.single.c': '\''
          };
          for (scope in delimsByScope) {
            delim = delimsByScope[scope];
            tokens = grammar.tokenizeLine(delim + 'a' + delim).tokens;
            expect(tokens[0]).toEqual({
              value: delim,
              scopes: ['source.c', scope, 'punctuation.definition.string.begin.c']
            });
            expect(tokens[1]).toEqual({
              value: 'a',
              scopes: ['source.c', scope]
            });
            expect(tokens[2]).toEqual({
              value: delim,
              scopes: ['source.c', scope, 'punctuation.definition.string.end.c']
            });
            tokens = grammar.tokenizeLine(delim + 'a' + '\\' + '\n' + 'b' + delim).tokens;
            expect(tokens[0]).toEqual({
              value: delim,
              scopes: ['source.c', scope, 'punctuation.definition.string.begin.c']
            });
            expect(tokens[1]).toEqual({
              value: 'a',
              scopes: ['source.c', scope]
            });
            expect(tokens[2]).toEqual({
              value: '\\',
              scopes: ['source.c', scope, 'constant.character.escape.line-continuation.c']
            });
            expect(tokens[4]).toEqual({
              value: 'b',
              scopes: ['source.c', scope]
            });
            expect(tokens[5]).toEqual({
              value: delim,
              scopes: ['source.c', scope, 'punctuation.definition.string.end.c']
            });
          }
          tokens = grammar.tokenizeLine('"%d"').tokens;
          expect(tokens[0]).toEqual({
            value: '"',
            scopes: ['source.c', 'string.quoted.double.c', 'punctuation.definition.string.begin.c']
          });
          expect(tokens[1]).toEqual({
            value: '%d',
            scopes: ['source.c', 'string.quoted.double.c', 'constant.other.placeholder.c']
          });
          expect(tokens[2]).toEqual({
            value: '"',
            scopes: ['source.c', 'string.quoted.double.c', 'punctuation.definition.string.end.c']
          });
          tokens = grammar.tokenizeLine('"%"').tokens;
          expect(tokens[0]).toEqual({
            value: '"',
            scopes: ['source.c', 'string.quoted.double.c', 'punctuation.definition.string.begin.c']
          });
          expect(tokens[1]).toEqual({
            value: '%',
            scopes: ['source.c', 'string.quoted.double.c', 'invalid.illegal.placeholder.c']
          });
          expect(tokens[2]).toEqual({
            value: '"',
            scopes: ['source.c', 'string.quoted.double.c', 'punctuation.definition.string.end.c']
          });
          tokens = grammar.tokenizeLine('"%" PRId32').tokens;
          expect(tokens[0]).toEqual({
            value: '"',
            scopes: ['source.c', 'string.quoted.double.c', 'punctuation.definition.string.begin.c']
          });
          expect(tokens[1]).toEqual({
            value: '%',
            scopes: ['source.c', 'string.quoted.double.c']
          });
          expect(tokens[2]).toEqual({
            value: '"',
            scopes: ['source.c', 'string.quoted.double.c', 'punctuation.definition.string.end.c']
          });
          tokens = grammar.tokenizeLine('"%" SCNd32').tokens;
          expect(tokens[0]).toEqual({
            value: '"',
            scopes: ['source.c', 'string.quoted.double.c', 'punctuation.definition.string.begin.c']
          });
          expect(tokens[1]).toEqual({
            value: '%',
            scopes: ['source.c', 'string.quoted.double.c']
          });
          return expect(tokens[2]).toEqual({
            value: '"',
            scopes: ['source.c', 'string.quoted.double.c', 'punctuation.definition.string.end.c']
          });
        });
      });
      describe("comments", function() {
        return it("tokenizes them", function() {
          var tokens;
          tokens = grammar.tokenizeLine('/**/').tokens;
          expect(tokens[0]).toEqual({
            value: '/*',
            scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.begin.c']
          });
          expect(tokens[1]).toEqual({
            value: '*/',
            scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.end.c']
          });
          tokens = grammar.tokenizeLine('/* foo */').tokens;
          expect(tokens[0]).toEqual({
            value: '/*',
            scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.begin.c']
          });
          expect(tokens[1]).toEqual({
            value: ' foo ',
            scopes: ['source.c', 'comment.block.c']
          });
          expect(tokens[2]).toEqual({
            value: '*/',
            scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.end.c']
          });
          tokens = grammar.tokenizeLine('*/*').tokens;
          return expect(tokens[0]).toEqual({
            value: '*/*',
            scopes: ['source.c', 'invalid.illegal.stray-comment-end.c']
          });
        });
      });
      describe("preprocessor directives", function() {
        it("tokenizes '#line'", function() {
          var tokens;
          tokens = grammar.tokenizeLine('#line 151 "copy.c"').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.line.c', 'punctuation.definition.directive.c']
          });
          expect(tokens[1]).toEqual({
            value: 'line',
            scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.line.c']
          });
          expect(tokens[3]).toEqual({
            value: '151',
            scopes: ['source.c', 'meta.preprocessor.c', 'constant.numeric.c']
          });
          expect(tokens[5]).toEqual({
            value: '"',
            scopes: ['source.c', 'meta.preprocessor.c', 'string.quoted.double.c', 'punctuation.definition.string.begin.c']
          });
          expect(tokens[6]).toEqual({
            value: 'copy.c',
            scopes: ['source.c', 'meta.preprocessor.c', 'string.quoted.double.c']
          });
          return expect(tokens[7]).toEqual({
            value: '"',
            scopes: ['source.c', 'meta.preprocessor.c', 'string.quoted.double.c', 'punctuation.definition.string.end.c']
          });
        });
        it("tokenizes '#undef'", function() {
          var tokens;
          tokens = grammar.tokenizeLine('#undef FOO').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.undef.c', 'punctuation.definition.directive.c']
          });
          expect(tokens[1]).toEqual({
            value: 'undef',
            scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.undef.c']
          });
          expect(tokens[2]).toEqual({
            value: ' ',
            scopes: ['source.c', 'meta.preprocessor.c']
          });
          return expect(tokens[3]).toEqual({
            value: 'FOO',
            scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
          });
        });
        it("tokenizes '#pragma'", function() {
          var tokens;
          tokens = grammar.tokenizeLine('#pragma once').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'keyword.control.directive.pragma.c', 'punctuation.definition.directive.c']
          });
          expect(tokens[1]).toEqual({
            value: 'pragma',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'keyword.control.directive.pragma.c']
          });
          expect(tokens[2]).toEqual({
            value: ' ',
            scopes: ['source.c', 'meta.preprocessor.pragma.c']
          });
          expect(tokens[3]).toEqual({
            value: 'once',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'entity.other.attribute-name.pragma.preprocessor.c']
          });
          tokens = grammar.tokenizeLine('#pragma clang diagnostic ignored "-Wunused-variable"').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'keyword.control.directive.pragma.c', 'punctuation.definition.directive.c']
          });
          expect(tokens[1]).toEqual({
            value: 'pragma',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'keyword.control.directive.pragma.c']
          });
          expect(tokens[2]).toEqual({
            value: ' ',
            scopes: ['source.c', 'meta.preprocessor.pragma.c']
          });
          expect(tokens[3]).toEqual({
            value: 'clang',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'entity.other.attribute-name.pragma.preprocessor.c']
          });
          expect(tokens[5]).toEqual({
            value: 'diagnostic',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'entity.other.attribute-name.pragma.preprocessor.c']
          });
          expect(tokens[7]).toEqual({
            value: 'ignored',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'entity.other.attribute-name.pragma.preprocessor.c']
          });
          expect(tokens[10]).toEqual({
            value: '-Wunused-variable',
            scopes: ['source.c', 'meta.preprocessor.pragma.c', 'string.quoted.double.c']
          });
          tokens = grammar.tokenizeLine('#pragma mark – Initialization').tokens;
          expect(tokens[0]).toEqual({
            value: '#',
            scopes: ['source.c', 'meta.section', 'meta.preprocessor.pragma.c', 'keyword.control.directive.pragma.pragma-mark.c', 'punctuation.definition.directive.c']
          });
          expect(tokens[1]).toEqual({
            value: 'pragma mark',
            scopes: ['source.c', 'meta.section', 'meta.preprocessor.pragma.c', 'keyword.control.directive.pragma.pragma-mark.c']
          });
          return expect(tokens[3]).toEqual({
            value: '– Initialization',
            scopes: ['source.c', 'meta.section', 'meta.preprocessor.pragma.c', 'entity.name.tag.pragma-mark.c']
          });
        });
        describe("define", function() {
          it("tokenizes '#define [identifier name]'", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#define _FILE_NAME_H_').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'define',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            });
            return expect(tokens[3]).toEqual({
              value: '_FILE_NAME_H_',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            });
          });
          it("tokenizes '#define [identifier name] [value]'", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#define WIDTH 80').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'define',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            });
            expect(tokens[3]).toEqual({
              value: 'WIDTH',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            });
            expect(tokens[5]).toEqual({
              value: '80',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.numeric.c']
            });
            tokens = grammar.tokenizeLine('#define ABC XYZ(1)').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'define',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            });
            expect(tokens[3]).toEqual({
              value: 'ABC',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            });
            expect(tokens[4]).toEqual({
              value: ' ',
              scopes: ['source.c', 'meta.preprocessor.macro.c']
            });
            expect(tokens[5]).toEqual({
              value: 'XYZ',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'entity.name.function.c']
            });
            expect(tokens[6]).toEqual({
              value: '(',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'punctuation.section.arguments.begin.bracket.round.c']
            });
            expect(tokens[7]).toEqual({
              value: '1',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'constant.numeric.c']
            });
            expect(tokens[8]).toEqual({
              value: ')',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.function.c', 'punctuation.section.arguments.end.bracket.round.c']
            });
            tokens = grammar.tokenizeLine('#define PI_PLUS_ONE (3.14 + 1)').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'define',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            });
            expect(tokens[3]).toEqual({
              value: 'PI_PLUS_ONE',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            });
            expect(tokens[4]).toEqual({
              value: ' ',
              scopes: ['source.c', 'meta.preprocessor.macro.c']
            });
            expect(tokens[5]).toEqual({
              value: '(',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.section.parens.begin.bracket.round.c']
            });
            expect(tokens[6]).toEqual({
              value: '3.14',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.numeric.c']
            });
            expect(tokens[8]).toEqual({
              value: '+',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.operator.c']
            });
            expect(tokens[10]).toEqual({
              value: '1',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.numeric.c']
            });
            return expect(tokens[11]).toEqual({
              value: ')',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.section.parens.end.bracket.round.c']
            });
          });
          return describe("macros", function() {
            it("tokenizes them", function() {
              var tokens;
              tokens = grammar.tokenizeLine('#define INCREMENT(x) x++').tokens;
              expect(tokens[0]).toEqual({
                value: '#',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
              });
              expect(tokens[1]).toEqual({
                value: 'define',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
              });
              expect(tokens[3]).toEqual({
                value: 'INCREMENT',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
              });
              expect(tokens[4]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
              });
              expect(tokens[5]).toEqual({
                value: 'x',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
              });
              expect(tokens[6]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
              });
              expect(tokens[7]).toEqual({
                value: ' x',
                scopes: ['source.c', 'meta.preprocessor.macro.c']
              });
              expect(tokens[8]).toEqual({
                value: '++',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.operator.increment.c']
              });
              tokens = grammar.tokenizeLine('#define MULT(x, y) (x) * (y)').tokens;
              expect(tokens[0]).toEqual({
                value: '#',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
              });
              expect(tokens[1]).toEqual({
                value: 'define',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
              });
              expect(tokens[3]).toEqual({
                value: 'MULT',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
              });
              expect(tokens[4]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
              });
              expect(tokens[5]).toEqual({
                value: 'x',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
              });
              expect(tokens[6]).toEqual({
                value: ',',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c', 'punctuation.separator.parameters.c']
              });
              expect(tokens[7]).toEqual({
                value: ' y',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
              });
              expect(tokens[8]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
              });
              expect(tokens[9]).toEqual({
                value: ' ',
                scopes: ['source.c', 'meta.preprocessor.macro.c']
              });
              expect(tokens[10]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.section.parens.begin.bracket.round.c']
              });
              expect(tokens[11]).toEqual({
                value: 'x',
                scopes: ['source.c', 'meta.preprocessor.macro.c']
              });
              expect(tokens[12]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.section.parens.end.bracket.round.c']
              });
              expect(tokens[13]).toEqual({
                value: ' ',
                scopes: ['source.c', 'meta.preprocessor.macro.c']
              });
              expect(tokens[14]).toEqual({
                value: '*',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.operator.c']
              });
              expect(tokens[15]).toEqual({
                value: ' ',
                scopes: ['source.c', 'meta.preprocessor.macro.c']
              });
              expect(tokens[16]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.section.parens.begin.bracket.round.c']
              });
              expect(tokens[17]).toEqual({
                value: 'y',
                scopes: ['source.c', 'meta.preprocessor.macro.c']
              });
              expect(tokens[18]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.section.parens.end.bracket.round.c']
              });
              tokens = grammar.tokenizeLine('#define SWAP(a, b)  do { a ^= b; b ^= a; a ^= b; } while ( 0 )').tokens;
              expect(tokens[0]).toEqual({
                value: '#',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
              });
              expect(tokens[1]).toEqual({
                value: 'define',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
              });
              expect(tokens[3]).toEqual({
                value: 'SWAP',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
              });
              expect(tokens[4]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
              });
              expect(tokens[5]).toEqual({
                value: 'a',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
              });
              expect(tokens[6]).toEqual({
                value: ',',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c', 'punctuation.separator.parameters.c']
              });
              expect(tokens[7]).toEqual({
                value: ' b',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
              });
              expect(tokens[8]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
              });
              expect(tokens[10]).toEqual({
                value: 'do',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.c']
              });
              expect(tokens[12]).toEqual({
                value: '{',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.begin.bracket.curly.c']
              });
              expect(tokens[13]).toEqual({
                value: ' a ',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
              });
              expect(tokens[14]).toEqual({
                value: '^=',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'keyword.operator.assignment.compound.bitwise.c']
              });
              expect(tokens[15]).toEqual({
                value: ' b',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
              });
              expect(tokens[16]).toEqual({
                value: ';',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.terminator.statement.c']
              });
              expect(tokens[17]).toEqual({
                value: ' b ',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
              });
              expect(tokens[18]).toEqual({
                value: '^=',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'keyword.operator.assignment.compound.bitwise.c']
              });
              expect(tokens[19]).toEqual({
                value: ' a',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
              });
              expect(tokens[20]).toEqual({
                value: ';',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.terminator.statement.c']
              });
              expect(tokens[21]).toEqual({
                value: ' a ',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
              });
              expect(tokens[22]).toEqual({
                value: '^=',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'keyword.operator.assignment.compound.bitwise.c']
              });
              expect(tokens[23]).toEqual({
                value: ' b',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
              });
              expect(tokens[24]).toEqual({
                value: ';',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.terminator.statement.c']
              });
              expect(tokens[25]).toEqual({
                value: ' ',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c']
              });
              expect(tokens[26]).toEqual({
                value: '}',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.end.bracket.curly.c']
              });
              expect(tokens[28]).toEqual({
                value: 'while',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.c']
              });
              expect(tokens[29]).toEqual({
                value: ' ',
                scopes: ['source.c', 'meta.preprocessor.macro.c']
              });
              expect(tokens[30]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.section.parens.begin.bracket.round.c']
              });
              expect(tokens[32]).toEqual({
                value: '0',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.numeric.c']
              });
              return expect(tokens[34]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.section.parens.end.bracket.round.c']
              });
            });
            it("tokenizes multiline macros", function() {
              var lines;
              lines = grammar.tokenizeLines('#define max(a,b) (a>b)? \\\n                  a:b');
              expect(lines[0][17]).toEqual({
                value: '\\',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'constant.character.escape.line-continuation.c']
              });
              expect(lines[1][0]).toEqual({
                value: '                  a',
                scopes: ['source.c', 'meta.preprocessor.macro.c']
              });
              lines = grammar.tokenizeLines('#define SWAP(a, b)  { \\\n  a ^= b; \\\n  b ^= a; \\\n  a ^= b; \\\n}');
              expect(lines[0][0]).toEqual({
                value: '#',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
              });
              expect(lines[0][1]).toEqual({
                value: 'define',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
              });
              expect(lines[0][3]).toEqual({
                value: 'SWAP',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
              });
              expect(lines[0][4]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
              });
              expect(lines[0][5]).toEqual({
                value: 'a',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
              });
              expect(lines[0][6]).toEqual({
                value: ',',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c', 'punctuation.separator.parameters.c']
              });
              expect(lines[0][7]).toEqual({
                value: ' b',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
              });
              expect(lines[0][8]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
              });
              expect(lines[0][10]).toEqual({
                value: '{',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.begin.bracket.curly.c']
              });
              expect(lines[0][12]).toEqual({
                value: '\\',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'constant.character.escape.line-continuation.c']
              });
              expect(lines[1][1]).toEqual({
                value: '^=',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'keyword.operator.assignment.compound.bitwise.c']
              });
              expect(lines[1][5]).toEqual({
                value: '\\',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'constant.character.escape.line-continuation.c']
              });
              expect(lines[2][1]).toEqual({
                value: '^=',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'keyword.operator.assignment.compound.bitwise.c']
              });
              expect(lines[2][5]).toEqual({
                value: '\\',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'constant.character.escape.line-continuation.c']
              });
              expect(lines[3][1]).toEqual({
                value: '^=',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'keyword.operator.assignment.compound.bitwise.c']
              });
              expect(lines[3][5]).toEqual({
                value: '\\',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'constant.character.escape.line-continuation.c']
              });
              return expect(lines[4][0]).toEqual({
                value: '}',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.end.bracket.curly.c']
              });
            });
            return it("tokenizes complex definitions", function() {
              var lines;
              lines = grammar.tokenizeLines('#define MakeHook(name) struct HOOK name = {{false, 0L}, \\\n((HOOKF)(*HookEnt)), ID("hook")}');
              expect(lines[0][0]).toEqual({
                value: '#',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
              });
              expect(lines[0][1]).toEqual({
                value: 'define',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
              });
              expect(lines[0][3]).toEqual({
                value: 'MakeHook',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
              });
              expect(lines[0][4]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.begin.c']
              });
              expect(lines[0][5]).toEqual({
                value: 'name',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'variable.parameter.preprocessor.c']
              });
              expect(lines[0][6]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'punctuation.definition.parameters.end.c']
              });
              expect(lines[0][8]).toEqual({
                value: 'struct',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'storage.type.c']
              });
              expect(lines[0][10]).toEqual({
                value: '=',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.operator.assignment.c']
              });
              expect(lines[0][12]).toEqual({
                value: '{',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.begin.bracket.curly.c']
              });
              expect(lines[0][13]).toEqual({
                value: '{',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.begin.bracket.curly.c']
              });
              expect(lines[0][14]).toEqual({
                value: 'false',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'constant.language.c']
              });
              expect(lines[0][15]).toEqual({
                value: ',',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.separator.delimiter.c']
              });
              expect(lines[0][17]).toEqual({
                value: '0L',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'constant.numeric.c']
              });
              expect(lines[0][18]).toEqual({
                value: '}',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.end.bracket.curly.c']
              });
              expect(lines[0][19]).toEqual({
                value: ',',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.separator.delimiter.c']
              });
              expect(lines[0][21]).toEqual({
                value: '\\',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'constant.character.escape.line-continuation.c']
              });
              expect(lines[1][0]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.parens.begin.bracket.round.c']
              });
              expect(lines[1][1]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.parens.begin.bracket.round.c']
              });
              expect(lines[1][3]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.parens.end.bracket.round.c']
              });
              expect(lines[1][4]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.parens.begin.bracket.round.c']
              });
              expect(lines[1][5]).toEqual({
                value: '*',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'keyword.operator.c']
              });
              expect(lines[1][7]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.parens.end.bracket.round.c']
              });
              expect(lines[1][8]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.parens.end.bracket.round.c']
              });
              expect(lines[1][9]).toEqual({
                value: ',',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.separator.delimiter.c']
              });
              expect(lines[1][11]).toEqual({
                value: 'ID',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'meta.function.c', 'entity.name.function.c']
              });
              expect(lines[1][12]).toEqual({
                value: '(',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'meta.function.c', 'punctuation.section.arguments.begin.bracket.round.c']
              });
              expect(lines[1][13]).toEqual({
                value: '"',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'meta.function.c', 'string.quoted.double.c', "punctuation.definition.string.begin.c"]
              });
              expect(lines[1][14]).toEqual({
                value: 'hook',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'meta.function.c', 'string.quoted.double.c']
              });
              expect(lines[1][15]).toEqual({
                value: '"',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'meta.function.c', 'string.quoted.double.c', "punctuation.definition.string.end.c"]
              });
              expect(lines[1][16]).toEqual({
                value: ')',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'meta.function.c', 'punctuation.section.arguments.end.bracket.round.c']
              });
              return expect(lines[1][17]).toEqual({
                value: '}',
                scopes: ['source.c', 'meta.preprocessor.macro.c', 'meta.block.c', 'punctuation.section.block.end.bracket.curly.c']
              });
            });
          });
        });
        describe("includes", function() {
          it("tokenizes '#include'", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#include <stdio.h>').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'include',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
            });
            expect(tokens[3]).toEqual({
              value: '<',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.begin.c']
            });
            expect(tokens[4]).toEqual({
              value: 'stdio.h',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c']
            });
            expect(tokens[5]).toEqual({
              value: '>',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.end.c']
            });
            tokens = grammar.tokenizeLine('#include<stdio.h>').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'include',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
            });
            expect(tokens[2]).toEqual({
              value: '<',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.begin.c']
            });
            expect(tokens[3]).toEqual({
              value: 'stdio.h',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c']
            });
            expect(tokens[4]).toEqual({
              value: '>',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.end.c']
            });
            tokens = grammar.tokenizeLine('#include_<stdio.h>').tokens;
            expect(tokens[0]).toEqual({
              value: '#include_',
              scopes: ['source.c']
            });
            tokens = grammar.tokenizeLine('#include "file"').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'include',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
            });
            expect(tokens[3]).toEqual({
              value: '"',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.begin.c']
            });
            expect(tokens[4]).toEqual({
              value: 'file',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c']
            });
            return expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.end.c']
            });
          });
          it("tokenizes '#import'", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#import "file"').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.import.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'import',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.import.c']
            });
            expect(tokens[3]).toEqual({
              value: '"',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.begin.c']
            });
            expect(tokens[4]).toEqual({
              value: 'file',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c']
            });
            return expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.end.c']
            });
          });
          return it("tokenizes '#include_next'", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#include_next "next.h"').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include_next.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'include_next',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include_next.c']
            });
            expect(tokens[3]).toEqual({
              value: '"',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.begin.c']
            });
            expect(tokens[4]).toEqual({
              value: 'next.h',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c']
            });
            return expect(tokens[5]).toEqual({
              value: '"',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.end.c']
            });
          });
        });
        describe("diagnostics", function() {
          it("tokenizes '#error'", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#error "C++ compiler required."').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'keyword.control.directive.diagnostic.error.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'error',
              scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'keyword.control.directive.diagnostic.error.c']
            });
            return expect(tokens[4]).toEqual({
              value: 'C++ compiler required.',
              scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'string.quoted.double.c']
            });
          });
          return it("tokenizes '#warning'", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#warning "This is a warning."').tokens;
            expect(tokens[0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'keyword.control.directive.diagnostic.warning.c', 'punctuation.definition.directive.c']
            });
            expect(tokens[1]).toEqual({
              value: 'warning',
              scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'keyword.control.directive.diagnostic.warning.c']
            });
            return expect(tokens[4]).toEqual({
              value: 'This is a warning.',
              scopes: ['source.c', 'meta.preprocessor.diagnostic.c', 'string.quoted.double.c']
            });
          });
        });
        return describe("conditionals", function() {
          it("tokenizes if-elif-else preprocessor blocks", function() {
            var lines;
            lines = grammar.tokenizeLines('#if defined(CREDIT)\n    credit();\n#elif defined(DEBIT)\n    debit();\n#else\n    printerror();\n#endif');
            expect(lines[0][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[0][1]).toEqual({
              value: 'if',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[0][3]).toEqual({
              value: 'defined',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[0][5]).toEqual({
              value: 'CREDIT',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[1][1]).toEqual({
              value: 'credit',
              scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
            });
            expect(lines[1][2]).toEqual({
              value: '(',
              scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.begin.bracket.round.c']
            });
            expect(lines[1][3]).toEqual({
              value: ')',
              scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.end.bracket.round.c']
            });
            expect(lines[2][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[2][1]).toEqual({
              value: 'elif',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[2][3]).toEqual({
              value: 'defined',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[2][5]).toEqual({
              value: 'DEBIT',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[3][1]).toEqual({
              value: 'debit',
              scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
            });
            expect(lines[3][2]).toEqual({
              value: '(',
              scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.begin.bracket.round.c']
            });
            expect(lines[3][3]).toEqual({
              value: ')',
              scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.end.bracket.round.c']
            });
            expect(lines[4][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[4][1]).toEqual({
              value: 'else',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[5][1]).toEqual({
              value: 'printerror',
              scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
            });
            expect(lines[5][2]).toEqual({
              value: '(',
              scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.begin.bracket.round.c']
            });
            expect(lines[5][3]).toEqual({
              value: ')',
              scopes: ['source.c', 'meta.function.c', 'punctuation.section.parameters.end.bracket.round.c']
            });
            expect(lines[6][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            return expect(lines[6][1]).toEqual({
              value: 'endif',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
          });
          it("tokenizes if-true-else blocks", function() {
            var lines;
            lines = grammar.tokenizeLines('#if 1\nint something() {\n  #if 1\n    return 1;\n  #else\n    return 0;\n  #endif\n}\n#else\nint something() {\n  return 0;\n}\n#endif');
            expect(lines[0][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[0][1]).toEqual({
              value: 'if',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[0][3]).toEqual({
              value: '1',
              scopes: ['source.c', 'meta.preprocessor.c', 'constant.numeric.c']
            });
            expect(lines[1][0]).toEqual({
              value: 'int',
              scopes: ['source.c', 'storage.type.c']
            });
            expect(lines[1][2]).toEqual({
              value: 'something',
              scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
            });
            expect(lines[2][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[2][2]).toEqual({
              value: 'if',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[2][4]).toEqual({
              value: '1',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'constant.numeric.c']
            });
            expect(lines[3][1]).toEqual({
              value: 'return',
              scopes: ['source.c', 'meta.block.c', 'keyword.control.c']
            });
            expect(lines[3][3]).toEqual({
              value: '1',
              scopes: ['source.c', 'meta.block.c', 'constant.numeric.c']
            });
            expect(lines[4][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[4][2]).toEqual({
              value: 'else',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[5][0]).toEqual({
              value: '    return 0;',
              scopes: ['source.c', 'meta.block.c', 'comment.block.preprocessor.else-branch.in-block.c']
            });
            expect(lines[6][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[6][2]).toEqual({
              value: 'endif',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[8][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[8][1]).toEqual({
              value: 'else',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[9][0]).toEqual({
              value: 'int something() {',
              scopes: ['source.c', 'comment.block.preprocessor.else-branch.c']
            });
            expect(lines[12][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            return expect(lines[12][1]).toEqual({
              value: 'endif',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
          });
          it("tokenizes if-false-else blocks", function() {
            var lines;
            lines = grammar.tokenizeLines('int something() {\n  #if 0\n    return 1;\n  #else\n    return 0;\n  #endif\n}');
            expect(lines[0][0]).toEqual({
              value: 'int',
              scopes: ['source.c', 'storage.type.c']
            });
            expect(lines[0][2]).toEqual({
              value: 'something',
              scopes: ['source.c', 'meta.function.c', 'entity.name.function.c']
            });
            expect(lines[1][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[1][2]).toEqual({
              value: 'if',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[1][4]).toEqual({
              value: '0',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'constant.numeric.c']
            });
            expect(lines[2][0]).toEqual({
              value: '    return 1;',
              scopes: ['source.c', 'meta.block.c', 'comment.block.preprocessor.if-branch.in-block.c']
            });
            expect(lines[3][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[3][2]).toEqual({
              value: 'else',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[4][1]).toEqual({
              value: 'return',
              scopes: ['source.c', 'meta.block.c', 'keyword.control.c']
            });
            expect(lines[4][3]).toEqual({
              value: '0',
              scopes: ['source.c', 'meta.block.c', 'constant.numeric.c']
            });
            expect(lines[5][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[5][2]).toEqual({
              value: 'endif',
              scopes: ['source.c', 'meta.block.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            lines = grammar.tokenizeLines('#if 0\n  something();\n#endif');
            expect(lines[0][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[0][1]).toEqual({
              value: 'if',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[0][3]).toEqual({
              value: '0',
              scopes: ['source.c', 'meta.preprocessor.c', 'constant.numeric.c']
            });
            expect(lines[1][0]).toEqual({
              value: '  something();',
              scopes: ['source.c', 'comment.block.preprocessor.if-branch.c']
            });
            expect(lines[2][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            return expect(lines[2][1]).toEqual({
              value: 'endif',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
          });
          it("tokenizes ifdef-elif blocks", function() {
            var lines;
            lines = grammar.tokenizeLines('#ifdef __unix__ /* is defined by compilers targeting Unix systems */\n  # include <unistd.h>\n#elif defined _WIN32 /* is defined by compilers targeting Windows systems */\n  # include <windows.h>\n#endif');
            expect(lines[0][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[0][1]).toEqual({
              value: 'ifdef',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[0][3]).toEqual({
              value: '__unix__',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[0][5]).toEqual({
              value: '/*',
              scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.begin.c']
            });
            expect(lines[0][6]).toEqual({
              value: ' is defined by compilers targeting Unix systems ',
              scopes: ['source.c', 'comment.block.c']
            });
            expect(lines[0][7]).toEqual({
              value: '*/',
              scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.end.c']
            });
            expect(lines[1][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
            });
            expect(lines[1][2]).toEqual({
              value: ' include',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
            });
            expect(lines[1][4]).toEqual({
              value: '<',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.begin.c']
            });
            expect(lines[1][5]).toEqual({
              value: 'unistd.h',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c']
            });
            expect(lines[1][6]).toEqual({
              value: '>',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.end.c']
            });
            expect(lines[2][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[2][1]).toEqual({
              value: 'elif',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[2][3]).toEqual({
              value: 'defined',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[2][5]).toEqual({
              value: '_WIN32',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[2][7]).toEqual({
              value: '/*',
              scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.begin.c']
            });
            expect(lines[2][8]).toEqual({
              value: ' is defined by compilers targeting Windows systems ',
              scopes: ['source.c', 'comment.block.c']
            });
            expect(lines[2][9]).toEqual({
              value: '*/',
              scopes: ['source.c', 'comment.block.c', 'punctuation.definition.comment.end.c']
            });
            expect(lines[3][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
            });
            expect(lines[3][2]).toEqual({
              value: ' include',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
            });
            expect(lines[3][4]).toEqual({
              value: '<',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.begin.c']
            });
            expect(lines[3][5]).toEqual({
              value: 'windows.h',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c']
            });
            expect(lines[3][6]).toEqual({
              value: '>',
              scopes: ['source.c', 'meta.preprocessor.include.c', 'string.quoted.other.lt-gt.include.c', 'punctuation.definition.string.end.c']
            });
            expect(lines[4][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            return expect(lines[4][1]).toEqual({
              value: 'endif',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
          });
          it("tokenizes ifndef blocks", function() {
            var lines;
            lines = grammar.tokenizeLines('#ifndef _INCL_GUARD\n  #define _INCL_GUARD\n#endif');
            expect(lines[0][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            expect(lines[0][1]).toEqual({
              value: 'ifndef',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[0][3]).toEqual({
              value: '_INCL_GUARD',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[1][1]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c', 'punctuation.definition.directive.c']
            });
            expect(lines[1][2]).toEqual({
              value: 'define',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'keyword.control.directive.define.c']
            });
            expect(lines[1][4]).toEqual({
              value: '_INCL_GUARD',
              scopes: ['source.c', 'meta.preprocessor.macro.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[2][0]).toEqual({
              value: '#',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
            });
            return expect(lines[2][1]).toEqual({
              value: 'endif',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
          });
          it("highlights stray elif, else and endif usages as invalid", function() {
            var lines;
            lines = grammar.tokenizeLines('#if defined SOMEMACRO\n#else\n#elif  //elif not permitted here\n#endif\n#else  //else without if\n#endif //endif without if');
            expect(lines[2][0]).toEqual({
              value: '#elif',
              scopes: ['source.c', 'invalid.illegal.stray-elif.c']
            });
            expect(lines[4][0]).toEqual({
              value: '#else',
              scopes: ['source.c', 'invalid.illegal.stray-else.c']
            });
            return expect(lines[5][0]).toEqual({
              value: '#endif',
              scopes: ['source.c', 'invalid.illegal.stray-endif.c']
            });
          });
          it("highlights errorneous defined usage as invalid", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#if defined == VALUE').tokens;
            return expect(tokens[3]).toEqual({
              value: 'defined',
              scopes: ['source.c', 'meta.preprocessor.c', 'invalid.illegal.macro-name.c']
            });
          });
          it("tokenizes multi line conditional queries", function() {
            var lines;
            lines = grammar.tokenizeLines('#if !defined (MACRO_A) \\\n || !defined MACRO_C\n  #define MACRO_A TRUE\n#elif MACRO_C == (5 + 4 -             /* multi line comment */  \\\n                 SOMEMACRO(TRUE) * 8) // single line comment\n#endif');
            expect(lines[0][2]).toEqual({
              value: ' ',
              scopes: ['source.c', 'meta.preprocessor.c']
            });
            expect(lines[0][3]).toEqual({
              value: '!',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.logical.c']
            });
            expect(lines[0][7]).toEqual({
              value: 'MACRO_A',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[0][10]).toEqual({
              value: '\\',
              scopes: ['source.c', 'meta.preprocessor.c', 'constant.character.escape.line-continuation.c']
            });
            expect(lines[1][1]).toEqual({
              value: '||',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.logical.c']
            });
            expect(lines[1][3]).toEqual({
              value: '!',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.logical.c']
            });
            expect(lines[1][4]).toEqual({
              value: 'defined',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            expect(lines[1][6]).toEqual({
              value: 'MACRO_C',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[3][2]).toEqual({
              value: ' ',
              scopes: ['source.c', 'meta.preprocessor.c']
            });
            expect(lines[3][3]).toEqual({
              value: 'MACRO_C',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[3][5]).toEqual({
              value: '==',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.comparison.c']
            });
            expect(lines[3][7]).toEqual({
              value: '(',
              scopes: ['source.c', 'meta.preprocessor.c', 'punctuation.section.parens.begin.bracket.round.c']
            });
            expect(lines[3][8]).toEqual({
              value: '5',
              scopes: ['source.c', 'meta.preprocessor.c', 'constant.numeric.c']
            });
            expect(lines[3][10]).toEqual({
              value: '+',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.c']
            });
            expect(lines[3][14]).toEqual({
              value: '-',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.c']
            });
            expect(lines[3][16]).toEqual({
              value: '/*',
              scopes: ['source.c', 'meta.preprocessor.c', 'comment.block.c', 'punctuation.definition.comment.begin.c']
            });
            expect(lines[3][17]).toEqual({
              value: ' multi line comment ',
              scopes: ['source.c', 'meta.preprocessor.c', 'comment.block.c']
            });
            expect(lines[3][18]).toEqual({
              value: '*/',
              scopes: ['source.c', 'meta.preprocessor.c', 'comment.block.c', 'punctuation.definition.comment.end.c']
            });
            expect(lines[3][20]).toEqual({
              value: '\\',
              scopes: ['source.c', 'meta.preprocessor.c', 'constant.character.escape.line-continuation.c']
            });
            expect(lines[4][1]).toEqual({
              value: 'SOMEMACRO',
              scopes: ['source.c', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
            });
            expect(lines[4][3]).toEqual({
              value: 'TRUE',
              scopes: ['source.c', 'meta.preprocessor.c', 'constant.language.c']
            });
            expect(lines[4][6]).toEqual({
              value: '*',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.c']
            });
            expect(lines[4][9]).toEqual({
              value: ')',
              scopes: ['source.c', 'meta.preprocessor.c', 'punctuation.section.parens.end.bracket.round.c']
            });
            expect(lines[4][11]).toEqual({
              value: '//',
              scopes: ['source.c', 'comment.line.double-slash.cpp', 'punctuation.definition.comment.cpp']
            });
            return expect(lines[4][12]).toEqual({
              value: ' single line comment',
              scopes: ['source.c', 'comment.line.double-slash.cpp']
            });
          });
          return it("tokenizes ternary operator usage in preprocessor conditionals", function() {
            var tokens;
            tokens = grammar.tokenizeLine('#if defined (__GNU_LIBRARY__) ? defined (__USE_GNU) : !defined (__STRICT_ANSI__)').tokens;
            expect(tokens[9]).toEqual({
              value: '?',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.ternary.c']
            });
            expect(tokens[11]).toEqual({
              value: 'defined',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
            });
            return expect(tokens[17]).toEqual({
              value: ':',
              scopes: ['source.c', 'meta.preprocessor.c', 'keyword.operator.ternary.c']
            });
          });
        });
      });
      describe("indentation", function() {
        var editor, expectPreservedIndentation;
        editor = null;
        beforeEach(function() {
          editor = buildTextEditor();
          return editor.setGrammar(grammar);
        });
        expectPreservedIndentation = function(text) {
          var actualLine, actualLines, expectedLines, i, _i, _len, _results;
          editor.setText(text);
          editor.autoIndentBufferRows(0, editor.getLineCount() - 1);
          expectedLines = text.split('\n');
          actualLines = editor.getText().split('\n');
          _results = [];
          for (i = _i = 0, _len = actualLines.length; _i < _len; i = ++_i) {
            actualLine = actualLines[i];
            _results.push(expect([actualLine, editor.indentLevelForLine(actualLine)]).toEqual([expectedLines[i], editor.indentLevelForLine(expectedLines[i])]));
          }
          return _results;
        };
        it("indents allman-style curly braces", function() {
          return expectPreservedIndentation('if (a)\n{\n  for (;;)\n  {\n    do\n    {\n      while (b)\n      {\n        c();\n      }\n    }\n    while (d)\n  }\n}');
        });
        it("indents non-allman-style curly braces", function() {
          return expectPreservedIndentation('if (a) {\n  for (;;) {\n    do {\n      while (b) {\n        c();\n      }\n    } while (d)\n  }\n}');
        });
        it("indents function arguments", function() {
          return expectPreservedIndentation('a(\n  b,\n  c(\n    d\n  )\n);');
        });
        it("indents array and struct literals", function() {
          return expectPreservedIndentation('some_t a[3] = {\n  { .b = c },\n  { .b = c, .d = {1, 2} },\n};');
        });
        return it("tokenizes binary literal", function() {
          var tokens;
          tokens = grammar.tokenizeLine('0b101010').tokens;
          return expect(tokens[0]).toEqual({
            value: '0b101010',
            scopes: ['source.c', 'constant.numeric.c']
          });
        });
      });
      describe("access", function() {
        it("tokenizes the dot access operator", function() {
          var lines;
          lines = grammar.tokenizeLines('{\n  a.\n}');
          expect(lines[1][0]).toEqual({
            value: '  a',
            scopes: ['source.c', 'meta.block.c']
          });
          expect(lines[1][1]).toEqual({
            value: '.',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.dot-access.c']
          });
          lines = grammar.tokenizeLines('{\n  a.b;\n}');
          expect(lines[1][0]).toEqual({
            value: '  a',
            scopes: ['source.c', 'meta.block.c']
          });
          expect(lines[1][1]).toEqual({
            value: '.',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.dot-access.c']
          });
          expect(lines[1][2]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'variable.other.member.c']
          });
          lines = grammar.tokenizeLines('{\n  a.b()\n}');
          expect(lines[1][0]).toEqual({
            value: '  a',
            scopes: ['source.c', 'meta.block.c']
          });
          expect(lines[1][1]).toEqual({
            value: '.',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.dot-access.c']
          });
          expect(lines[1][2]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'meta.function-call.c', 'entity.name.function.c']
          });
          lines = grammar.tokenizeLines('{\n  a. b;\n}');
          expect(lines[1][1]).toEqual({
            value: '.',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.dot-access.c']
          });
          expect(lines[1][3]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'variable.other.member.c']
          });
          lines = grammar.tokenizeLines('{\n  a .b;\n}');
          expect(lines[1][1]).toEqual({
            value: '.',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.dot-access.c']
          });
          expect(lines[1][2]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'variable.other.member.c']
          });
          lines = grammar.tokenizeLines('{\n  a . b;\n}');
          expect(lines[1][1]).toEqual({
            value: '.',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.dot-access.c']
          });
          return expect(lines[1][3]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'variable.other.member.c']
          });
        });
        return it("tokenizes the pointer access operator", function() {
          var lines;
          lines = grammar.tokenizeLines('{\n  a->b;\n}');
          expect(lines[1][1]).toEqual({
            value: '->',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.pointer-access.c']
          });
          expect(lines[1][2]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'variable.other.member.c']
          });
          lines = grammar.tokenizeLines('{\n  a->b()\n}');
          expect(lines[1][0]).toEqual({
            value: '  a',
            scopes: ['source.c', 'meta.block.c']
          });
          expect(lines[1][1]).toEqual({
            value: '->',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.pointer-access.c']
          });
          lines = grammar.tokenizeLines('{\n  a-> b;\n}');
          expect(lines[1][1]).toEqual({
            value: '->',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.pointer-access.c']
          });
          expect(lines[1][3]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'variable.other.member.c']
          });
          lines = grammar.tokenizeLines('{\n  a ->b;\n}');
          expect(lines[1][1]).toEqual({
            value: '->',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.pointer-access.c']
          });
          expect(lines[1][2]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'variable.other.member.c']
          });
          lines = grammar.tokenizeLines('{\n  a -> b;\n}');
          expect(lines[1][1]).toEqual({
            value: '->',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.pointer-access.c']
          });
          expect(lines[1][3]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.block.c', 'variable.other.member.c']
          });
          lines = grammar.tokenizeLines('{\n  a->\n}');
          expect(lines[1][0]).toEqual({
            value: '  a',
            scopes: ['source.c', 'meta.block.c']
          });
          return expect(lines[1][1]).toEqual({
            value: '->',
            scopes: ['source.c', 'meta.block.c', 'punctuation.separator.pointer-access.c']
          });
        });
      });
      return describe("operators", function() {
        it("tokenizes the sizeof operator", function() {
          var tokens;
          tokens = grammar.tokenizeLine('sizeof unary_expression').tokens;
          expect(tokens[0]).toEqual({
            value: 'sizeof',
            scopes: ['source.c', 'keyword.operator.sizeof.c']
          });
          expect(tokens[1]).toEqual({
            value: ' unary_expression',
            scopes: ['source.c']
          });
          tokens = grammar.tokenizeLine('sizeof (int)').tokens;
          expect(tokens[0]).toEqual({
            value: 'sizeof',
            scopes: ['source.c', 'keyword.operator.sizeof.c']
          });
          expect(tokens[1]).toEqual({
            value: ' ',
            scopes: ['source.c']
          });
          expect(tokens[2]).toEqual({
            value: '(',
            scopes: ['source.c', 'punctuation.section.parens.begin.bracket.round.c']
          });
          expect(tokens[3]).toEqual({
            value: 'int',
            scopes: ['source.c', 'storage.type.c']
          });
          expect(tokens[4]).toEqual({
            value: ')',
            scopes: ['source.c', 'punctuation.section.parens.end.bracket.round.c']
          });
          tokens = grammar.tokenizeLine('$sizeof').tokens;
          expect(tokens[1]).not.toEqual({
            value: 'sizeof',
            scopes: ['source.c', 'keyword.operator.sizeof.c']
          });
          tokens = grammar.tokenizeLine('sizeof$').tokens;
          expect(tokens[0]).not.toEqual({
            value: 'sizeof',
            scopes: ['source.c', 'keyword.operator.sizeof.c']
          });
          tokens = grammar.tokenizeLine('sizeof_').tokens;
          return expect(tokens[0]).not.toEqual({
            value: 'sizeof',
            scopes: ['source.c', 'keyword.operator.sizeof.c']
          });
        });
        it("tokenizes the increment operator", function() {
          var tokens;
          tokens = grammar.tokenizeLine('i++').tokens;
          expect(tokens[0]).toEqual({
            value: 'i',
            scopes: ['source.c']
          });
          expect(tokens[1]).toEqual({
            value: '++',
            scopes: ['source.c', 'keyword.operator.increment.c']
          });
          tokens = grammar.tokenizeLine('++i').tokens;
          expect(tokens[0]).toEqual({
            value: '++',
            scopes: ['source.c', 'keyword.operator.increment.c']
          });
          return expect(tokens[1]).toEqual({
            value: 'i',
            scopes: ['source.c']
          });
        });
        it("tokenizes the decrement operator", function() {
          var tokens;
          tokens = grammar.tokenizeLine('i--').tokens;
          expect(tokens[0]).toEqual({
            value: 'i',
            scopes: ['source.c']
          });
          expect(tokens[1]).toEqual({
            value: '--',
            scopes: ['source.c', 'keyword.operator.decrement.c']
          });
          tokens = grammar.tokenizeLine('--i').tokens;
          expect(tokens[0]).toEqual({
            value: '--',
            scopes: ['source.c', 'keyword.operator.decrement.c']
          });
          return expect(tokens[1]).toEqual({
            value: 'i',
            scopes: ['source.c']
          });
        });
        it("tokenizes logical operators", function() {
          var operator, operators, tokens, _i, _len, _results;
          tokens = grammar.tokenizeLine('!a').tokens;
          expect(tokens[0]).toEqual({
            value: '!',
            scopes: ['source.c', 'keyword.operator.logical.c']
          });
          expect(tokens[1]).toEqual({
            value: 'a',
            scopes: ['source.c']
          });
          operators = ['&&', '||'];
          _results = [];
          for (_i = 0, _len = operators.length; _i < _len; _i++) {
            operator = operators[_i];
            tokens = grammar.tokenizeLine('a ' + operator + ' b').tokens;
            expect(tokens[0]).toEqual({
              value: 'a ',
              scopes: ['source.c']
            });
            expect(tokens[1]).toEqual({
              value: operator,
              scopes: ['source.c', 'keyword.operator.logical.c']
            });
            _results.push(expect(tokens[2]).toEqual({
              value: ' b',
              scopes: ['source.c']
            }));
          }
          return _results;
        });
        it("tokenizes comparison operators", function() {
          var operator, operators, tokens, _i, _len, _results;
          operators = ['<=', '>=', '!=', '==', '<', '>'];
          _results = [];
          for (_i = 0, _len = operators.length; _i < _len; _i++) {
            operator = operators[_i];
            tokens = grammar.tokenizeLine('a ' + operator + ' b').tokens;
            expect(tokens[0]).toEqual({
              value: 'a ',
              scopes: ['source.c']
            });
            expect(tokens[1]).toEqual({
              value: operator,
              scopes: ['source.c', 'keyword.operator.comparison.c']
            });
            _results.push(expect(tokens[2]).toEqual({
              value: ' b',
              scopes: ['source.c']
            }));
          }
          return _results;
        });
        it("tokenizes arithmetic operators", function() {
          var operator, operators, tokens, _i, _len, _results;
          operators = ['+', '-', '*', '/', '%'];
          _results = [];
          for (_i = 0, _len = operators.length; _i < _len; _i++) {
            operator = operators[_i];
            tokens = grammar.tokenizeLine('a ' + operator + ' b').tokens;
            expect(tokens[0]).toEqual({
              value: 'a ',
              scopes: ['source.c']
            });
            expect(tokens[1]).toEqual({
              value: operator,
              scopes: ['source.c', 'keyword.operator.c']
            });
            _results.push(expect(tokens[2]).toEqual({
              value: ' b',
              scopes: ['source.c']
            }));
          }
          return _results;
        });
        it("tokenizes ternary operators", function() {
          var tokens;
          tokens = grammar.tokenizeLine('a ? b : c').tokens;
          expect(tokens[0]).toEqual({
            value: 'a ',
            scopes: ['source.c']
          });
          expect(tokens[1]).toEqual({
            value: '?',
            scopes: ['source.c', 'keyword.operator.ternary.c']
          });
          expect(tokens[2]).toEqual({
            value: ' b ',
            scopes: ['source.c']
          });
          expect(tokens[3]).toEqual({
            value: ':',
            scopes: ['source.c', 'keyword.operator.ternary.c']
          });
          return expect(tokens[4]).toEqual({
            value: ' c',
            scopes: ['source.c']
          });
        });
        it("tokenizes ternary operators with member access", function() {
          var tokens;
          tokens = grammar.tokenizeLine('a ? b.c : d').tokens;
          expect(tokens[0]).toEqual({
            value: 'a ',
            scopes: ['source.c']
          });
          expect(tokens[1]).toEqual({
            value: '?',
            scopes: ['source.c', 'keyword.operator.ternary.c']
          });
          expect(tokens[2]).toEqual({
            value: ' b',
            scopes: ['source.c']
          });
          expect(tokens[3]).toEqual({
            value: '.',
            scopes: ['source.c', 'punctuation.separator.dot-access.c']
          });
          expect(tokens[4]).toEqual({
            value: 'c',
            scopes: ['source.c', 'variable.other.member.c']
          });
          expect(tokens[5]).toEqual({
            value: ' ',
            scopes: ['source.c']
          });
          expect(tokens[6]).toEqual({
            value: ':',
            scopes: ['source.c', 'keyword.operator.ternary.c']
          });
          return expect(tokens[7]).toEqual({
            value: ' d',
            scopes: ['source.c']
          });
        });
        it("tokenizes ternary operators with pointer dereferencing", function() {
          var tokens;
          tokens = grammar.tokenizeLine('a ? b->c : d').tokens;
          expect(tokens[0]).toEqual({
            value: 'a ',
            scopes: ['source.c']
          });
          expect(tokens[1]).toEqual({
            value: '?',
            scopes: ['source.c', 'keyword.operator.ternary.c']
          });
          expect(tokens[2]).toEqual({
            value: ' b',
            scopes: ['source.c']
          });
          expect(tokens[3]).toEqual({
            value: '->',
            scopes: ['source.c', 'punctuation.separator.pointer-access.c']
          });
          expect(tokens[4]).toEqual({
            value: 'c',
            scopes: ['source.c', 'variable.other.member.c']
          });
          expect(tokens[5]).toEqual({
            value: ' ',
            scopes: ['source.c']
          });
          expect(tokens[6]).toEqual({
            value: ':',
            scopes: ['source.c', 'keyword.operator.ternary.c']
          });
          return expect(tokens[7]).toEqual({
            value: ' d',
            scopes: ['source.c']
          });
        });
        it("tokenizes ternary operators with function invocation", function() {
          var tokens;
          tokens = grammar.tokenizeLine('a ? f(b) : c').tokens;
          expect(tokens[0]).toEqual({
            value: 'a ',
            scopes: ['source.c']
          });
          expect(tokens[1]).toEqual({
            value: '?',
            scopes: ['source.c', 'keyword.operator.ternary.c']
          });
          expect(tokens[2]).toEqual({
            value: ' ',
            scopes: ['source.c']
          });
          expect(tokens[3]).toEqual({
            value: 'f',
            scopes: ['source.c', 'meta.function-call.c', 'entity.name.function.c']
          });
          expect(tokens[4]).toEqual({
            value: '(',
            scopes: ['source.c', 'meta.function-call.c', 'punctuation.section.arguments.begin.bracket.round.c']
          });
          expect(tokens[5]).toEqual({
            value: 'b',
            scopes: ['source.c', 'meta.function-call.c']
          });
          expect(tokens[6]).toEqual({
            value: ')',
            scopes: ['source.c', 'meta.function-call.c', 'punctuation.section.arguments.end.bracket.round.c']
          });
          expect(tokens[7]).toEqual({
            value: ' ',
            scopes: ['source.c']
          });
          expect(tokens[8]).toEqual({
            value: ':',
            scopes: ['source.c', 'keyword.operator.ternary.c']
          });
          return expect(tokens[9]).toEqual({
            value: ' c',
            scopes: ['source.c']
          });
        });
        describe("bitwise", function() {
          it("tokenizes bitwise 'not'", function() {
            var tokens;
            tokens = grammar.tokenizeLine('~a').tokens;
            expect(tokens[0]).toEqual({
              value: '~',
              scopes: ['source.c', 'keyword.operator.c']
            });
            return expect(tokens[1]).toEqual({
              value: 'a',
              scopes: ['source.c']
            });
          });
          it("tokenizes shift operators", function() {
            var tokens;
            tokens = grammar.tokenizeLine('>>').tokens;
            expect(tokens[0]).toEqual({
              value: '>>',
              scopes: ['source.c', 'keyword.operator.bitwise.shift.c']
            });
            tokens = grammar.tokenizeLine('<<').tokens;
            return expect(tokens[0]).toEqual({
              value: '<<',
              scopes: ['source.c', 'keyword.operator.bitwise.shift.c']
            });
          });
          return it("tokenizes them", function() {
            var operator, operators, tokens, _i, _len, _results;
            operators = ['|', '^', '&'];
            _results = [];
            for (_i = 0, _len = operators.length; _i < _len; _i++) {
              operator = operators[_i];
              tokens = grammar.tokenizeLine('a ' + operator + ' b').tokens;
              expect(tokens[0]).toEqual({
                value: 'a ',
                scopes: ['source.c']
              });
              expect(tokens[1]).toEqual({
                value: operator,
                scopes: ['source.c', 'keyword.operator.c']
              });
              _results.push(expect(tokens[2]).toEqual({
                value: ' b',
                scopes: ['source.c']
              }));
            }
            return _results;
          });
        });
        return describe("assignment", function() {
          it("tokenizes the assignment operator", function() {
            var tokens;
            tokens = grammar.tokenizeLine('a = b').tokens;
            expect(tokens[0]).toEqual({
              value: 'a ',
              scopes: ['source.c']
            });
            expect(tokens[1]).toEqual({
              value: '=',
              scopes: ['source.c', 'keyword.operator.assignment.c']
            });
            return expect(tokens[2]).toEqual({
              value: ' b',
              scopes: ['source.c']
            });
          });
          it("tokenizes compound assignment operators", function() {
            var operator, operators, tokens, _i, _len, _results;
            operators = ['+=', '-=', '*=', '/=', '%='];
            _results = [];
            for (_i = 0, _len = operators.length; _i < _len; _i++) {
              operator = operators[_i];
              tokens = grammar.tokenizeLine('a ' + operator + ' b').tokens;
              expect(tokens[0]).toEqual({
                value: 'a ',
                scopes: ['source.c']
              });
              expect(tokens[1]).toEqual({
                value: operator,
                scopes: ['source.c', 'keyword.operator.assignment.compound.c']
              });
              _results.push(expect(tokens[2]).toEqual({
                value: ' b',
                scopes: ['source.c']
              }));
            }
            return _results;
          });
          return it("tokenizes bitwise compound operators", function() {
            var operator, operators, tokens, _i, _len, _results;
            operators = ['<<=', '>>=', '&=', '^=', '|='];
            _results = [];
            for (_i = 0, _len = operators.length; _i < _len; _i++) {
              operator = operators[_i];
              tokens = grammar.tokenizeLine('a ' + operator + ' b').tokens;
              expect(tokens[0]).toEqual({
                value: 'a ',
                scopes: ['source.c']
              });
              expect(tokens[1]).toEqual({
                value: operator,
                scopes: ['source.c', 'keyword.operator.assignment.compound.bitwise.c']
              });
              _results.push(expect(tokens[2]).toEqual({
                value: ' b',
                scopes: ['source.c']
              }));
            }
            return _results;
          });
        });
      });
    });
    return describe("C++", function() {
      beforeEach(function() {
        return grammar = atom.grammars.grammarForScopeName('source.cpp');
      });
      it("parses the grammar", function() {
        expect(grammar).toBeTruthy();
        return expect(grammar.scopeName).toBe('source.cpp');
      });
      it("tokenizes this with `.this` class", function() {
        var tokens;
        tokens = grammar.tokenizeLine('this.x').tokens;
        return expect(tokens[0]).toEqual({
          value: 'this',
          scopes: ['source.cpp', 'variable.language.this.cpp']
        });
      });
      it("tokenizes classes", function() {
        var lines;
        lines = grammar.tokenizeLines('class Thing {\n  int x;\n}');
        expect(lines[0][0]).toEqual({
          value: 'class',
          scopes: ['source.cpp', 'meta.class-struct-block.cpp', 'storage.type.cpp']
        });
        return expect(lines[0][2]).toEqual({
          value: 'Thing',
          scopes: ['source.cpp', 'meta.class-struct-block.cpp', 'entity.name.type.cpp']
        });
      });
      it("tokenizes 'extern C'", function() {
        var lines;
        lines = grammar.tokenizeLines('extern "C" {\n#include "legacy_C_header.h"\n}');
        expect(lines[0][0]).toEqual({
          value: 'extern',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'storage.modifier.cpp']
        });
        expect(lines[0][2]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(lines[0][3]).toEqual({
          value: 'C',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'string.quoted.double.cpp']
        });
        expect(lines[0][4]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.end.cpp']
        });
        expect(lines[0][6]).toEqual({
          value: '{',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'punctuation.section.block.begin.bracket.curly.c']
        });
        expect(lines[1][0]).toEqual({
          value: '#',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c', 'punctuation.definition.directive.c']
        });
        expect(lines[1][1]).toEqual({
          value: 'include',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'meta.preprocessor.include.c', 'keyword.control.directive.include.c']
        });
        expect(lines[1][3]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.begin.c']
        });
        expect(lines[1][4]).toEqual({
          value: 'legacy_C_header.h',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'meta.preprocessor.include.c', 'string.quoted.double.include.c']
        });
        expect(lines[1][5]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'meta.preprocessor.include.c', 'string.quoted.double.include.c', 'punctuation.definition.string.end.c']
        });
        expect(lines[2][0]).toEqual({
          value: '}',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'punctuation.section.block.end.bracket.curly.c']
        });
        lines = grammar.tokenizeLines('#ifdef __cplusplus\nextern "C" {\n#endif\n  // legacy C code here\n#ifdef __cplusplus\n}\n#endif');
        expect(lines[0][0]).toEqual({
          value: '#',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
        });
        expect(lines[0][1]).toEqual({
          value: 'ifdef',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
        });
        expect(lines[0][3]).toEqual({
          value: '__cplusplus',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'entity.name.function.preprocessor.c']
        });
        expect(lines[1][0]).toEqual({
          value: 'extern',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'storage.modifier.cpp']
        });
        expect(lines[1][2]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(lines[1][3]).toEqual({
          value: 'C',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'string.quoted.double.cpp']
        });
        expect(lines[1][4]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.end.cpp']
        });
        expect(lines[1][6]).toEqual({
          value: '{',
          scopes: ['source.cpp', 'meta.extern-block.cpp', 'punctuation.section.block.begin.bracket.curly.c']
        });
        expect(lines[2][0]).toEqual({
          value: '#',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
        });
        expect(lines[2][1]).toEqual({
          value: 'endif',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
        });
        expect(lines[3][1]).toEqual({
          value: '//',
          scopes: ['source.cpp', 'comment.line.double-slash.cpp', 'punctuation.definition.comment.cpp']
        });
        expect(lines[3][2]).toEqual({
          value: ' legacy C code here',
          scopes: ['source.cpp', 'comment.line.double-slash.cpp']
        });
        expect(lines[4][0]).toEqual({
          value: '#',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
        });
        expect(lines[4][1]).toEqual({
          value: 'ifdef',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
        });
        expect(lines[5][0]).toEqual({
          value: '}',
          scopes: ['source.cpp']
        });
        expect(lines[6][0]).toEqual({
          value: '#',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c', 'punctuation.definition.directive.c']
        });
        return expect(lines[6][1]).toEqual({
          value: 'endif',
          scopes: ['source.cpp', 'meta.preprocessor.c', 'keyword.control.directive.conditional.c']
        });
      });
      it("tokenizes UTF string escapes", function() {
        var lines;
        lines = grammar.tokenizeLines('string str = U"\\U01234567\\u0123\\"\\0123\\x123";');
        expect(lines[0][0]).toEqual({
          value: 'string str ',
          scopes: ['source.cpp']
        });
        expect(lines[0][1]).toEqual({
          value: '=',
          scopes: ['source.cpp', 'keyword.operator.assignment.c']
        });
        expect(lines[0][3]).toEqual({
          value: 'U',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.begin.cpp', 'meta.encoding.cpp']
        });
        expect(lines[0][4]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(lines[0][5]).toEqual({
          value: '\\U01234567',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'constant.character.escape.cpp']
        });
        expect(lines[0][6]).toEqual({
          value: '\\u0123',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'constant.character.escape.cpp']
        });
        expect(lines[0][7]).toEqual({
          value: '\\"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'constant.character.escape.cpp']
        });
        expect(lines[0][8]).toEqual({
          value: '\\012',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'constant.character.escape.cpp']
        });
        expect(lines[0][9]).toEqual({
          value: '3',
          scopes: ['source.cpp', 'string.quoted.double.cpp']
        });
        expect(lines[0][10]).toEqual({
          value: '\\x123',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'constant.character.escape.cpp']
        });
        expect(lines[0][11]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.end.cpp']
        });
        return expect(lines[0][12]).toEqual({
          value: ';',
          scopes: ['source.cpp', 'punctuation.terminator.statement.c']
        });
      });
      it("tokenizes % format specifiers", function() {
        var tokens;
        tokens = grammar.tokenizeLine('"%d"').tokens;
        expect(tokens[0]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(tokens[1]).toEqual({
          value: '%d',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'constant.other.placeholder.c']
        });
        expect(tokens[2]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.end.cpp']
        });
        tokens = grammar.tokenizeLine('"%"').tokens;
        expect(tokens[0]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(tokens[1]).toEqual({
          value: '%',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'invalid.illegal.placeholder.c']
        });
        expect(tokens[2]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.end.cpp']
        });
        tokens = grammar.tokenizeLine('"%" PRId32').tokens;
        expect(tokens[0]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(tokens[1]).toEqual({
          value: '%',
          scopes: ['source.cpp', 'string.quoted.double.cpp']
        });
        return expect(tokens[2]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.cpp', 'punctuation.definition.string.end.cpp']
        });
      });
      it("tokenizes raw string literals", function() {
        var lines;
        lines = grammar.tokenizeLines('string str = R"test(\n  this is \"a\" test \'string\'\n)test";');
        expect(lines[0][0]).toEqual({
          value: 'string str ',
          scopes: ['source.cpp']
        });
        expect(lines[0][3]).toEqual({
          value: 'R"test(',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(lines[1][0]).toEqual({
          value: '  this is "a" test \'string\'',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp']
        });
        expect(lines[2][0]).toEqual({
          value: ')test"',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp', 'punctuation.definition.string.end.cpp']
        });
        return expect(lines[2][1]).toEqual({
          value: ';',
          scopes: ['source.cpp', 'punctuation.terminator.statement.c']
        });
      });
      it("errors on long raw string delimiters", function() {
        var lines;
        lines = grammar.tokenizeLines('string str = R"01234567890123456()01234567890123456";');
        expect(lines[0][0]).toEqual({
          value: 'string str ',
          scopes: ['source.cpp']
        });
        expect(lines[0][3]).toEqual({
          value: 'R"',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(lines[0][4]).toEqual({
          value: '01234567890123456',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp', 'punctuation.definition.string.begin.cpp', 'invalid.illegal.delimiter-too-long.cpp']
        });
        expect(lines[0][5]).toEqual({
          value: '(',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp', 'punctuation.definition.string.begin.cpp']
        });
        expect(lines[0][6]).toEqual({
          value: ')',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp', 'punctuation.definition.string.end.cpp']
        });
        expect(lines[0][7]).toEqual({
          value: '01234567890123456',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp', 'punctuation.definition.string.end.cpp', 'invalid.illegal.delimiter-too-long.cpp']
        });
        expect(lines[0][8]).toEqual({
          value: '"',
          scopes: ['source.cpp', 'string.quoted.double.raw.cpp', 'punctuation.definition.string.end.cpp']
        });
        return expect(lines[0][9]).toEqual({
          value: ';',
          scopes: ['source.cpp', 'punctuation.terminator.statement.c']
        });
      });
      it("tokenizes destructors", function() {
        var tokens;
        tokens = grammar.tokenizeLine('~Foo() {}').tokens;
        expect(tokens[0]).toEqual({
          value: '~Foo',
          scopes: ['source.cpp', 'meta.function.destructor.cpp', 'entity.name.function.cpp']
        });
        expect(tokens[1]).toEqual({
          value: '(',
          scopes: ['source.cpp', 'meta.function.destructor.cpp', 'punctuation.definition.parameters.begin.c']
        });
        expect(tokens[2]).toEqual({
          value: ')',
          scopes: ['source.cpp', 'meta.function.destructor.cpp', 'punctuation.definition.parameters.end.c']
        });
        expect(tokens[4]).toEqual({
          value: '{',
          scopes: ['source.cpp', 'meta.block.c', 'punctuation.section.block.begin.bracket.curly.c']
        });
        expect(tokens[5]).toEqual({
          value: '}',
          scopes: ['source.cpp', 'meta.block.c', 'punctuation.section.block.end.bracket.curly.c']
        });
        tokens = grammar.tokenizeLine('Foo::~Bar() {}').tokens;
        expect(tokens[0]).toEqual({
          value: 'Foo::~Bar',
          scopes: ['source.cpp', 'meta.function.destructor.cpp', 'entity.name.function.cpp']
        });
        expect(tokens[1]).toEqual({
          value: '(',
          scopes: ['source.cpp', 'meta.function.destructor.cpp', 'punctuation.definition.parameters.begin.c']
        });
        expect(tokens[2]).toEqual({
          value: ')',
          scopes: ['source.cpp', 'meta.function.destructor.cpp', 'punctuation.definition.parameters.end.c']
        });
        expect(tokens[4]).toEqual({
          value: '{',
          scopes: ['source.cpp', 'meta.block.c', 'punctuation.section.block.begin.bracket.curly.c']
        });
        return expect(tokens[5]).toEqual({
          value: '}',
          scopes: ['source.cpp', 'meta.block.c', 'punctuation.section.block.end.bracket.curly.c']
        });
      });
      describe("digit separators", function() {
        it("recognizes numbers with digit separators", function() {
          var tokens;
          tokens = grammar.tokenizeLine("1'000").tokens;
          expect(tokens[0]).toEqual({
            value: "1'000",
            scopes: ['source.cpp', 'constant.numeric.c']
          });
          tokens = grammar.tokenizeLine("123'456.500'000e-1'5").tokens;
          expect(tokens[0]).toEqual({
            value: "123'456.500'000e-1'5",
            scopes: ['source.cpp', 'constant.numeric.c']
          });
          tokens = grammar.tokenizeLine("0x1234'5678").tokens;
          expect(tokens[0]).toEqual({
            value: "0x1234'5678",
            scopes: ['source.cpp', 'constant.numeric.c']
          });
          tokens = grammar.tokenizeLine("0'123'456").tokens;
          expect(tokens[0]).toEqual({
            value: "0'123'456",
            scopes: ['source.cpp', 'constant.numeric.c']
          });
          tokens = grammar.tokenizeLine("0b1100'0011'1111'0000").tokens;
          return expect(tokens[0]).toEqual({
            value: "0b1100'0011'1111'0000",
            scopes: ['source.cpp', 'constant.numeric.c']
          });
        });
        return it("does not tokenize single quotes at the beginning or end of numbers as digit separators", function() {
          var tokens;
          tokens = grammar.tokenizeLine("'1000").tokens;
          expect(tokens[0]).toEqual({
            value: "'",
            scopes: ['source.cpp', 'string.quoted.single.c', 'punctuation.definition.string.begin.c']
          });
          expect(tokens[1]).toEqual({
            value: "1000",
            scopes: ['source.cpp', 'string.quoted.single.c']
          });
          tokens = grammar.tokenizeLine("1000'").tokens;
          expect(tokens[0]).toEqual({
            value: "1000",
            scopes: ['source.cpp', 'constant.numeric.c']
          });
          return expect(tokens[1]).toEqual({
            value: "'",
            scopes: ['source.cpp', 'string.quoted.single.c', 'punctuation.definition.string.begin.c']
          });
        });
      });
      describe("comments", function() {
        return it("tokenizes them", function() {
          var lines, tokens;
          tokens = grammar.tokenizeLine('// comment').tokens;
          expect(tokens[0]).toEqual({
            value: '//',
            scopes: ['source.cpp', 'comment.line.double-slash.cpp', 'punctuation.definition.comment.cpp']
          });
          expect(tokens[1]).toEqual({
            value: ' comment',
            scopes: ['source.cpp', 'comment.line.double-slash.cpp']
          });
          lines = grammar.tokenizeLines('// separated\\\ncomment');
          expect(lines[0][0]).toEqual({
            value: '//',
            scopes: ['source.cpp', 'comment.line.double-slash.cpp', 'punctuation.definition.comment.cpp']
          });
          expect(lines[0][1]).toEqual({
            value: ' separated',
            scopes: ['source.cpp', 'comment.line.double-slash.cpp']
          });
          expect(lines[0][2]).toEqual({
            value: '\\',
            scopes: ['source.cpp', 'comment.line.double-slash.cpp', 'constant.character.escape.line-continuation.c']
          });
          expect(lines[1][0]).toEqual({
            value: 'comment',
            scopes: ['source.cpp', 'comment.line.double-slash.cpp']
          });
          lines = grammar.tokenizeLines('// The space character \x20 is used to prevent stripping trailing whitespace\n// not separated\\\x20\ncomment');
          expect(lines[1][0]).toEqual({
            value: '//',
            scopes: ['source.cpp', 'comment.line.double-slash.cpp', 'punctuation.definition.comment.cpp']
          });
          expect(lines[1][1]).toEqual({
            value: ' not separated\\ ',
            scopes: ['source.cpp', 'comment.line.double-slash.cpp']
          });
          return expect(lines[2][0]).toEqual({
            value: 'comment',
            scopes: ['source.cpp']
          });
        });
      });
      return describe("operators", function() {
        return it("tokenizes ternary operators with namespace resolution", function() {
          var tokens;
          tokens = grammar.tokenizeLine('a ? ns::b : ns::c').tokens;
          expect(tokens[0]).toEqual({
            value: 'a ',
            scopes: ['source.cpp']
          });
          expect(tokens[1]).toEqual({
            value: '?',
            scopes: ['source.cpp', 'keyword.operator.ternary.c']
          });
          expect(tokens[2]).toEqual({
            value: ' ns',
            scopes: ['source.cpp']
          });
          expect(tokens[3]).toEqual({
            value: '::',
            scopes: ['source.cpp', 'punctuation.separator.namespace.access.cpp']
          });
          expect(tokens[4]).toEqual({
            value: 'b ',
            scopes: ['source.cpp']
          });
          expect(tokens[5]).toEqual({
            value: ':',
            scopes: ['source.cpp', 'keyword.operator.ternary.c']
          });
          expect(tokens[6]).toEqual({
            value: ' ns',
            scopes: ['source.cpp']
          });
          expect(tokens[7]).toEqual({
            value: '::',
            scopes: ['source.cpp', 'punctuation.separator.namespace.access.cpp']
          });
          return expect(tokens[8]).toEqual({
            value: 'c',
            scopes: ['source.cpp']
          });
        });
      });
    });
  });

}).call(this);
