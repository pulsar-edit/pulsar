(function() {
  describe('Go grammar', function() {
    var grammar;
    grammar = null;
    beforeEach(function() {
      atom.config.set('core.useTreeSitterParsers', false);
      waitsForPromise(function() {
        return atom.packages.activatePackage('language-go');
      });
      return runs(function() {
        return grammar = atom.grammars.grammarForScopeName('source.go');
      });
    });
    it('parses the grammar', function() {
      expect(grammar).toBeTruthy();
      return expect(grammar.scopeName).toBe('source.go');
    });
    it('tokenizes comments', function() {
      var tokens;
      tokens = grammar.tokenizeLine('// I am a comment').tokens;
      expect(tokens[0].value).toEqual('//');
      expect(tokens[0].scopes).toEqual(['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']);
      expect(tokens[1].value).toEqual(' I am a comment');
      expect(tokens[1].scopes).toEqual(['source.go', 'comment.line.double-slash.go']);
      tokens = grammar.tokenizeLines('/*\nI am a comment\n*/');
      expect(tokens[0][0].value).toEqual('/*');
      expect(tokens[0][0].scopes).toEqual(['source.go', 'comment.block.go', 'punctuation.definition.comment.go']);
      expect(tokens[1][0].value).toEqual('I am a comment');
      expect(tokens[1][0].scopes).toEqual(['source.go', 'comment.block.go']);
      expect(tokens[2][0].value).toEqual('*/');
      return expect(tokens[2][0].scopes).toEqual(['source.go', 'comment.block.go', 'punctuation.definition.comment.go']);
    });
    it('tokenizes comments in imports', function() {
      var lines;
      lines = grammar.tokenizeLines('import (\n  //"fmt"\n  "os" // comment\n  // comment!\n)');
      expect(lines[1][1]).toEqual({
        value: '//',
        scopes: ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
      });
      expect(lines[2][5]).toEqual({
        value: '//',
        scopes: ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
      });
      return expect(lines[3][1]).toEqual({
        value: '//',
        scopes: ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
      });
    });
    it('tokenizes strings', function() {
      var delim, delims, scope, tokens, _results;
      delims = {
        'string.quoted.double.go': '"',
        'string.quoted.raw.go': '`'
      };
      _results = [];
      for (scope in delims) {
        delim = delims[scope];
        tokens = grammar.tokenizeLine(delim + 'I am a string' + delim).tokens;
        expect(tokens[0].value).toEqual(delim);
        expect(tokens[0].scopes).toEqual(['source.go', scope, 'punctuation.definition.string.begin.go']);
        expect(tokens[1].value).toEqual('I am a string');
        expect(tokens[1].scopes).toEqual(['source.go', scope]);
        expect(tokens[2].value).toEqual(delim);
        _results.push(expect(tokens[2].scopes).toEqual(['source.go', scope, 'punctuation.definition.string.end.go']));
      }
      return _results;
    });
    it('tokenizes placeholders in strings', function() {
      var tokens, verb, verbs, _i, _len, _results;
      verbs = ['%# x', '%-5s', '%5s', '%05s', '%.5s', '%10.1q', '%10v', '%-10v', '%.0d', '%.d', '%+07.2f', '%0100d', '%0.100f', '%#064x', '%+.3F', '%-#20.8x', '%[1]d', '%[2]*[1]d', '%[3]*.[2]*[1]f', '%[3]*.[2]f', '%3.[2]d', '%.[2]d', '%-+[1]x', '%d', '%-d', '%+d', '%#d', '% d', '%0d', '%1.2d', '%-1.2d', '%+1.2d', '%-+1.2d', '%*d', '%.*d', '%*.*d', '%0*d', '%-*d'];
      _results = [];
      for (_i = 0, _len = verbs.length; _i < _len; _i++) {
        verb = verbs[_i];
        tokens = grammar.tokenizeLine('"' + verb + '"').tokens;
        expect(tokens[0].value).toEqual('"', expect(tokens[0].scopes).toEqual(['source.go', 'string.quoted.double.go', 'punctuation.definition.string.begin.go']));
        expect(tokens[1].value).toEqual(verb);
        expect(tokens[1].scopes).toEqual(['source.go', 'string.quoted.double.go', 'constant.other.placeholder.go']);
        _results.push(expect(tokens[2].value).toEqual('"', expect(tokens[2].scopes).toEqual(['source.go', 'string.quoted.double.go', 'punctuation.definition.string.end.go'])));
      }
      return _results;
    });
    it('tokenizes character escapes in strings', function() {
      var escape, escapes, tokens, _i, _len;
      escapes = ['\\a', '\\b', '\\f', '\\n', '\\r', '\\t', '\\v', '\\\\', '\\000', '\\007', '\\377', '\\x07', '\\xff', '\\u12e4', '\\U00101234'];
      for (_i = 0, _len = escapes.length; _i < _len; _i++) {
        escape = escapes[_i];
        tokens = grammar.tokenizeLine('"' + escape + '"').tokens;
        expect(tokens[1].value).toEqual(escape);
        expect(tokens[1].scopes).toEqual(['source.go', 'string.quoted.double.go', 'constant.character.escape.go']);
      }
      tokens = grammar.tokenizeLine('"\\""').tokens;
      expect(tokens[1].value).toEqual('\\"');
      return expect(tokens[1].scopes).toEqual(['source.go', 'string.quoted.double.go', 'constant.character.escape.go']);
    });
    it('tokenizes placeholders in raw strings', function() {
      var tokens, verb, verbs, _i, _len, _results;
      verbs = ['%# x', '%-5s', '%5s', '%05s', '%.5s', '%10.1q', '%10v', '%-10v', '%.0d', '%.d', '%+07.2f', '%0100d', '%0.100f', '%#064x', '%+.3F', '%-#20.8x', '%[1]d', '%[2]*[1]d', '%[3]*.[2]*[1]f', '%[3]*.[2]f', '%3.[2]d', '%.[2]d', '%-+[1]x', '%d', '%-d', '%+d', '%#d', '% d', '%0d', '%1.2d', '%-1.2d', '%+1.2d', '%-+1.2d', '%*d', '%.*d', '%*.*d', '%0*d', '%-*d'];
      _results = [];
      for (_i = 0, _len = verbs.length; _i < _len; _i++) {
        verb = verbs[_i];
        tokens = grammar.tokenizeLine('`' + verb + '`').tokens;
        expect(tokens[0].value).toEqual('`', expect(tokens[0].scopes).toEqual(['source.go', 'string.quoted.raw.go', 'punctuation.definition.string.begin.go']));
        expect(tokens[1].value).toEqual(verb);
        expect(tokens[1].scopes).toEqual(['source.go', 'string.quoted.raw.go', 'constant.other.placeholder.go']);
        _results.push(expect(tokens[2].value).toEqual('`', expect(tokens[2].scopes).toEqual(['source.go', 'string.quoted.raw.go', 'punctuation.definition.string.end.go'])));
      }
      return _results;
    });
    it('tokenizes runes', function() {
      var rune, runes, tokens, _i, _len, _results;
      runes = ['u', 'X', '$', ':', '(', '.', '2', '=', '!', '@', '\\a', '\\b', '\\f', '\\n', '\\r', '\\t', '\\v', '\\\\', "\\'", '\\"', '\\000', '\\007', '\\377', '\\x07', '\\xff', '\\u12e4', '\\U00101234'];
      _results = [];
      for (_i = 0, _len = runes.length; _i < _len; _i++) {
        rune = runes[_i];
        tokens = grammar.tokenizeLine("'" + rune + "'").tokens;
        expect(tokens[0]).toEqual({
          value: "'",
          scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.begin.go']
        });
        expect(tokens[1]).toEqual({
          value: rune,
          scopes: ['source.go', 'string.quoted.rune.go', 'constant.other.rune.go']
        });
        _results.push(expect(tokens[2]).toEqual({
          value: "'",
          scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.end.go']
        }));
      }
      return _results;
    });
    it('tokenizes invalid runes and single quoted strings', function() {
      var tokens;
      tokens = grammar.tokenizeLine("'\\c'").tokens;
      expect(tokens[0]).toEqual({
        value: "'",
        scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.begin.go']
      });
      expect(tokens[1]).toEqual({
        value: '\\c',
        scopes: ['source.go', 'string.quoted.rune.go', 'invalid.illegal.unknown-rune.go']
      });
      expect(tokens[2]).toEqual({
        value: "'",
        scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.end.go']
      });
      tokens = grammar.tokenizeLine("'ab'").tokens;
      expect(tokens[0]).toEqual({
        value: "'",
        scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.begin.go']
      });
      expect(tokens[1]).toEqual({
        value: 'ab',
        scopes: ['source.go', 'string.quoted.rune.go', 'invalid.illegal.unknown-rune.go']
      });
      expect(tokens[2]).toEqual({
        value: "'",
        scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.end.go']
      });
      tokens = grammar.tokenizeLine("'some single quote string'").tokens;
      expect(tokens[0]).toEqual({
        value: "'",
        scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.begin.go']
      });
      expect(tokens[1]).toEqual({
        value: 'some single quote string',
        scopes: ['source.go', 'string.quoted.rune.go', 'invalid.illegal.unknown-rune.go']
      });
      return expect(tokens[2]).toEqual({
        value: "'",
        scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.end.go']
      });
    });
    it('tokenizes invalid whitespace around chan annotations', function() {
      var expr, invalid, invalid_receive, invalid_send, tokens, _results;
      invalid_send = {
        'chan <- sendonly': ' '
      };
      invalid_receive = {
        '<- chan recvonly': ' '
      };
      for (expr in invalid_send) {
        invalid = invalid_send[expr];
        tokens = grammar.tokenizeLine(expr).tokens;
        expect(tokens[1].value).toEqual(invalid);
        expect(tokens[1].scopes).toEqual(['source.go', 'invalid.illegal.send-channel.go']);
      }
      _results = [];
      for (expr in invalid_receive) {
        invalid = invalid_receive[expr];
        tokens = grammar.tokenizeLine(expr).tokens;
        expect(tokens[1].value).toEqual(invalid);
        _results.push(expect(tokens[1].scopes).toEqual(['source.go', 'invalid.illegal.receive-channel.go']));
      }
      return _results;
    });
    it('tokenizes keywords', function() {
      var keyword, keywordLists, list, scope, tokens, _results;
      keywordLists = {
        'keyword.control.go': ['break', 'case', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'go', 'goto', 'if', 'range', 'return', 'select', 'switch'],
        'keyword.channel.go': ['chan'],
        'keyword.const.go': ['const'],
        'keyword.function.go': ['func'],
        'keyword.interface.go': ['interface'],
        'keyword.import.go': ['import'],
        'keyword.map.go': ['map'],
        'keyword.package.go': ['package'],
        'keyword.struct.go': ['struct'],
        'keyword.type.go': ['type'],
        'keyword.var.go': ['var']
      };
      _results = [];
      for (scope in keywordLists) {
        list = keywordLists[scope];
        _results.push((function() {
          var _i, _len, _results1;
          _results1 = [];
          for (_i = 0, _len = list.length; _i < _len; _i++) {
            keyword = list[_i];
            tokens = grammar.tokenizeLine(keyword).tokens;
            expect(tokens[0].value).toEqual(keyword);
            _results1.push(expect(tokens[0].scopes).toEqual(['source.go', scope]));
          }
          return _results1;
        })());
      }
      return _results;
    });
    it('tokenizes storage types', function() {
      var scope, storageTypes, tokens, type, types, _results;
      storageTypes = {
        'storage.type.boolean.go': ['bool'],
        'storage.type.byte.go': ['byte'],
        'storage.type.error.go': ['error'],
        'storage.type.numeric.go': ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64', 'complex64', 'complex128'],
        'storage.type.rune.go': ['rune'],
        'storage.type.string.go': ['string'],
        'storage.type.uintptr.go': ['uintptr']
      };
      _results = [];
      for (scope in storageTypes) {
        types = storageTypes[scope];
        _results.push((function() {
          var _i, _len, _results1;
          _results1 = [];
          for (_i = 0, _len = types.length; _i < _len; _i++) {
            type = types[_i];
            tokens = grammar.tokenizeLine(type).tokens;
            expect(tokens[0].value).toEqual(type);
            _results1.push(expect(tokens[0].scopes).toEqual(['source.go', scope]));
          }
          return _results1;
        })());
      }
      return _results;
    });
    it('tokenizes func regardless of the context', function() {
      var funcKeyword, funcType, line, next, relevantToken, t, tokens, _i, _j, _len, _len1, _results;
      funcKeyword = ['func f()', 'func (x) f()', 'func(x) f()', 'func'];
      for (_i = 0, _len = funcKeyword.length; _i < _len; _i++) {
        line = funcKeyword[_i];
        tokens = grammar.tokenizeLine(line).tokens;
        expect(tokens[0].value).toEqual('func');
        expect(tokens[0].scopes).toEqual(['source.go', 'keyword.function.go']);
      }
      funcType = [
        {
          'line': 'var f1 func(',
          'tokenPos': 4
        }, {
          'line': 'f2 :=func()',
          'tokenPos': 3
        }, {
          'line': '\tfunc(',
          'tokenPos': 1
        }, {
          'line': 'type HandlerFunc func(',
          'tokenPos': 4
        }
      ];
      _results = [];
      for (_j = 0, _len1 = funcType.length; _j < _len1; _j++) {
        t = funcType[_j];
        tokens = grammar.tokenizeLine(t.line).tokens;
        relevantToken = tokens[t.tokenPos];
        expect(relevantToken.value).toEqual('func');
        expect(relevantToken.scopes).toEqual(['source.go', 'keyword.function.go']);
        next = tokens[t.tokenPos + 1];
        expect(next.value).toEqual('(');
        _results.push(expect(next.scopes).toEqual(['source.go', 'punctuation.definition.begin.bracket.round.go']));
      }
      return _results;
    });
    it('only tokenizes func when it is an exact match', function() {
      var test, tests, tokens, _i, _len, _results;
      tests = ['myfunc', 'funcMap'];
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        test = tests[_i];
        tokens = grammar.tokenizeLine(test).tokens;
        expect(tokens[0].value).not.toEqual('func');
        _results.push(expect(tokens[0].scopes).not.toEqual(['source.go', 'keyword.function.go']));
      }
      return _results;
    });
    it('tokenizes func names in their declarations', function() {
      var next, relevantToken, t, tests, tokens, _i, _len, _results;
      tests = [
        {
          'line': 'func f()',
          'tokenPos': 2
        }, {
          'line': 'func (T) f()',
          'tokenPos': 6
        }, {
          'line': 'func (t T) f()',
          'tokenPos': 6
        }, {
          'line': 'func (t *T) f()',
          'tokenPos': 8
        }
      ];
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        t = tests[_i];
        tokens = grammar.tokenizeLine(t.line).tokens;
        expect(tokens[0].value).toEqual('func');
        expect(tokens[0].scopes).toEqual(['source.go', 'keyword.function.go']);
        relevantToken = tokens[t.tokenPos];
        expect(relevantToken).toBeDefined();
        expect(relevantToken.value).toEqual('f');
        expect(relevantToken.scopes).toEqual(['source.go', 'entity.name.function.go']);
        next = tokens[t.tokenPos + 1];
        expect(next.value).toEqual('(');
        _results.push(expect(next.scopes).toEqual(['source.go', 'punctuation.definition.begin.bracket.round.go']));
      }
      return _results;
    });
    it('tokenizes operators method declarations', function() {
      var relevantToken, t, tests, tokens, _i, _len, _results;
      tests = [
        {
          'line': 'func (t *T) f()',
          'tokenPos': 4
        }
      ];
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        t = tests[_i];
        tokens = grammar.tokenizeLine(t.line).tokens;
        expect(tokens[0].value).toEqual('func');
        expect(tokens[0].scopes).toEqual(['source.go', 'keyword.function.go']);
        relevantToken = tokens[t.tokenPos];
        expect(relevantToken.value).toEqual('*');
        _results.push(expect(relevantToken.scopes).toEqual(['source.go', 'keyword.operator.address.go']));
      }
      return _results;
    });
    it('tokenizes numerics', function() {
      var invalidOctals, num, numbers, nums, scope, tokens, _i, _j, _len, _len1, _results;
      numbers = {
        'constant.numeric.integer.go': ['42', '0600', '0xBadFace', '170141183460469231731687303715884105727', '1E6', '0i', '011i', '1E6i'],
        'constant.numeric.floating-point.go': ['0.', '72.40', '072.40', '2.71828', '1.e+0', '6.67428e-11', '.25', '.12345E+5', '0.i', '2.71828i', '1.e+0i', '6.67428e-11i', '.25i', '.12345E+5i']
      };
      for (scope in numbers) {
        nums = numbers[scope];
        for (_i = 0, _len = nums.length; _i < _len; _i++) {
          num = nums[_i];
          tokens = grammar.tokenizeLine(num).tokens;
          expect(tokens[0].value).toEqual(num);
          expect(tokens[0].scopes).toEqual(['source.go', scope]);
        }
      }
      invalidOctals = ['08', '039', '0995'];
      _results = [];
      for (_j = 0, _len1 = invalidOctals.length; _j < _len1; _j++) {
        num = invalidOctals[_j];
        tokens = grammar.tokenizeLine(num).tokens;
        expect(tokens[0].value).toEqual(num);
        _results.push(expect(tokens[0].scopes).toEqual(['source.go', 'invalid.illegal.numeric.go']));
      }
      return _results;
    });
    it('tokenizes language constants', function() {
      var constant, constants, tokens, _i, _len, _results;
      constants = ['true', 'false', 'nil', 'iota'];
      _results = [];
      for (_i = 0, _len = constants.length; _i < _len; _i++) {
        constant = constants[_i];
        tokens = grammar.tokenizeLine(constant).tokens;
        expect(tokens[0].value).toEqual(constant);
        _results.push(expect(tokens[0].scopes).toEqual(['source.go', 'constant.language.go']));
      }
      return _results;
    });
    it('tokenizes built-in functions', function() {
      var func, funcVal, funcVals, funcs, tokens, _i, _len, _results;
      funcs = ['append(x)', 'cap(x)', 'close(x)', 'complex(x)', 'copy(x)', 'delete(x)', 'imag(x)', 'len(x)', 'make(x)', 'new(x)', 'panic(x)', 'print(x)', 'println(x)', 'real(x)', 'recover(x)'];
      funcVals = ['append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag', 'len', 'make', 'new', 'panic', 'print', 'println', 'real', 'recover'];
      _results = [];
      for (_i = 0, _len = funcs.length; _i < _len; _i++) {
        func = funcs[_i];
        funcVal = funcVals[funcs.indexOf(func)];
        tokens = grammar.tokenizeLine(func).tokens;
        expect(tokens[0].value).toEqual(funcVal);
        _results.push(expect(tokens[0].scopes).toEqual(['source.go', 'support.function.builtin.go']));
      }
      return _results;
    });
    it('tokenizes operators', function() {
      var binaryOpers, op, ops, scope, tokens, unaryOpers, _i, _len, _results;
      binaryOpers = {
        'keyword.operator.arithmetic.go': ['+', '-', '*', '/', '%'],
        'keyword.operator.arithmetic.bitwise.go': ['&', '|', '^', '&^', '<<', '>>'],
        'keyword.operator.assignment.go': ['=', '+=', '-=', '|=', '^=', '*=', '/=', ':=', '%=', '<<=', '>>=', '&=', '&^='],
        'keyword.operator.channel.go': ['<-'],
        'keyword.operator.comparison.go': ['==', '!=', '<', '<=', '>', '>='],
        'keyword.operator.decrement.go': ['--'],
        'keyword.operator.ellipsis.go': ['...'],
        'keyword.operator.increment.go': ['++'],
        'keyword.operator.logical.go': ['&&', '||']
      };
      unaryOpers = {
        'keyword.operator.address.go': ['*var', '&var'],
        'keyword.operator.arithmetic.go': ['+var', '-var'],
        'keyword.operator.arithmetic.bitwise.go': ['^var'],
        'keyword.operator.logical.go': ['!var']
      };
      for (scope in binaryOpers) {
        ops = binaryOpers[scope];
        for (_i = 0, _len = ops.length; _i < _len; _i++) {
          op = ops[_i];
          tokens = grammar.tokenizeLine(op).tokens;
          expect(tokens[0].value).toEqual(op);
          expect(tokens[0].scopes).toEqual(['source.go', scope]);
        }
      }
      _results = [];
      for (scope in unaryOpers) {
        ops = unaryOpers[scope];
        _results.push((function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = ops.length; _j < _len1; _j++) {
            op = ops[_j];
            tokens = grammar.tokenizeLine(op).tokens;
            expect(tokens[0].value).toEqual(op[0]);
            _results1.push(expect(tokens[0].scopes).toEqual(['source.go', scope]));
          }
          return _results1;
        })());
      }
      return _results;
    });
    it('does not treat values/variables attached to comparion operators as extensions of the operator', function() {
      var tokens;
      tokens = grammar.tokenizeLine('2<3.0 && 12>bar').tokens;
      expect(tokens[0]).toEqual({
        value: '2',
        scopes: ['source.go', 'constant.numeric.integer.go']
      });
      expect(tokens[1]).toEqual({
        value: '<',
        scopes: ['source.go', 'keyword.operator.comparison.go']
      });
      expect(tokens[2]).toEqual({
        value: '3.0',
        scopes: ['source.go', 'constant.numeric.floating-point.go']
      });
      expect(tokens[6]).toEqual({
        value: '12',
        scopes: ['source.go', 'constant.numeric.integer.go']
      });
      expect(tokens[7]).toEqual({
        value: '>',
        scopes: ['source.go', 'keyword.operator.comparison.go']
      });
      return expect(tokens[8]).toEqual({
        value: 'bar',
        scopes: ['source.go']
      });
    });
    it('tokenizes punctuation brackets', function() {
      var tokens;
      tokens = grammar.tokenizeLine('{([])}').tokens;
      expect(tokens[0]).toEqual({
        value: '{',
        scopes: ['source.go', 'punctuation.definition.begin.bracket.curly.go']
      });
      expect(tokens[1]).toEqual({
        value: '(',
        scopes: ['source.go', 'punctuation.definition.begin.bracket.round.go']
      });
      expect(tokens[2]).toEqual({
        value: '[',
        scopes: ['source.go', 'punctuation.definition.bracket.square.go']
      });
      expect(tokens[3]).toEqual({
        value: ']',
        scopes: ['source.go', 'punctuation.definition.bracket.square.go']
      });
      expect(tokens[4]).toEqual({
        value: ')',
        scopes: ['source.go', 'punctuation.definition.end.bracket.round.go']
      });
      return expect(tokens[5]).toEqual({
        value: '}',
        scopes: ['source.go', 'punctuation.definition.end.bracket.curly.go']
      });
    });
    it('tokenizes punctuation delimiters', function() {
      var delim, delims, scope, tokens, _results;
      delims = {
        'punctuation.other.comma.go': ',',
        'punctuation.other.period.go': '.',
        'punctuation.other.colon.go': ':'
      };
      _results = [];
      for (scope in delims) {
        delim = delims[scope];
        tokens = grammar.tokenizeLine(delim).tokens;
        expect(tokens[0].value).toEqual(delim);
        _results.push(expect(tokens[0].scopes).toEqual(['source.go', scope]));
      }
      return _results;
    });
    it('tokenizes func names in calls to them', function() {
      var next, relevantToken, t, tests, tokens, want, _i, _len, _results;
      tests = [
        {
          'line': 'a.b()',
          'name': 'b',
          'tokenPos': 2,
          'isFunc': true
        }, {
          'line': 'pkg.Func1(',
          'name': 'Func1',
          'tokenPos': 2,
          'isFunc': true
        }, {
          'line': 'pkg.Func1().Func2(',
          'name': 'Func2',
          'tokenPos': 6,
          'isFunc': true
        }, {
          'line': 'pkg.var',
          'name': 'var',
          'tokenPos': 2,
          'isFunc': false
        }, {
          'line': 'doWork(ch)',
          'name': 'doWork',
          'tokenPos': 0,
          'isFunc': true
        }, {
          'line': 'f1()',
          'name': 'f1',
          'tokenPos': 0,
          'isFunc': true
        }
      ];
      want = ['source.go', 'support.function.go'];
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        t = tests[_i];
        tokens = grammar.tokenizeLine(t.line).tokens;
        relevantToken = tokens[t.tokenPos];
        if (t.isFunc) {
          expect(relevantToken).not.toBeNull();
          expect(relevantToken.value).toEqual(t.name);
          expect(relevantToken.scopes).toEqual(want);
          next = tokens[t.tokenPos + 1];
          expect(next.value).toEqual('(');
          _results.push(expect(next.scopes).toEqual(['source.go', 'punctuation.definition.begin.bracket.round.go']));
        } else {
          _results.push(expect(relevantToken.scopes).not.toEqual(want));
        }
      }
      return _results;
    });
    it('tokenizes package names', function() {
      var test, tests, tokens, _i, _len, _results;
      tests = ['package main', 'package mypackage'];
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        test = tests[_i];
        tokens = grammar.tokenizeLine(test).tokens;
        expect(tokens[0].scopes).toEqual(['source.go', 'keyword.package.go']);
        _results.push(expect(tokens[2].scopes).toEqual(['source.go', 'entity.name.package.go']));
      }
      return _results;
    });
    it('tokenizes invalid package names as such', function() {
      var tokens;
      tokens = grammar.tokenizeLine('package 0mypackage').tokens;
      expect(tokens[0]).toEqual({
        value: 'package',
        scopes: ['source.go', 'keyword.package.go']
      });
      return expect(tokens[2]).toEqual({
        value: '0mypackage',
        scopes: ['source.go', 'invalid.illegal.identifier.go']
      });
    });
    it('does not treat words that have a trailing package as a package name', function() {
      var tokens;
      tokens = grammar.tokenizeLine('func myFunc(Varpackage string)').tokens;
      expect(tokens[4]).toEqual({
        value: 'Varpackage ',
        scopes: ['source.go']
      });
      return expect(tokens[5]).toEqual({
        value: 'string',
        scopes: ['source.go', 'storage.type.string.go']
      });
    });
    it('tokenizes type names', function() {
      var test, tests, tokens, _i, _len, _results;
      tests = ['type mystring string', 'type mytype interface{'];
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        test = tests[_i];
        tokens = grammar.tokenizeLine(test).tokens;
        expect(tokens[0].scopes).toEqual(['source.go', 'keyword.type.go']);
        _results.push(expect(tokens[2].scopes).toEqual(['source.go', 'entity.name.type.go']));
      }
      return _results;
    });
    it('tokenizes invalid type names as such', function() {
      var tokens;
      tokens = grammar.tokenizeLine('type 0mystring string').tokens;
      expect(tokens[0]).toEqual({
        value: 'type',
        scopes: ['source.go', 'keyword.type.go']
      });
      return expect(tokens[2]).toEqual({
        value: '0mystring',
        scopes: ['source.go', 'invalid.illegal.identifier.go']
      });
    });
    it('does not treat words that have a trailing type as a type name', function() {
      var tokens;
      tokens = grammar.tokenizeLine('func myFunc(Vartype string)').tokens;
      expect(tokens[4]).toEqual({
        value: 'Vartype ',
        scopes: ['source.go']
      });
      return expect(tokens[5]).toEqual({
        value: 'string',
        scopes: ['source.go', 'storage.type.string.go']
      });
    });
    describe('in variable declarations', function() {
      var testNum, testNumType, testOp, testOpAddress, testOpAssignment, testOpBracket, testOpPunctuation, testOpTermination, testString, testStringType, testVar, testVarAssignment, testVarDeclaration;
      testVar = function(token) {
        expect(token.value).toBe('var');
        return expect(token.scopes).toEqual(['source.go', 'keyword.var.go']);
      };
      testVarAssignment = function(token, name) {
        expect(token.value).toBe(name);
        return expect(token.scopes).toEqual(['source.go', 'variable.other.assignment.go']);
      };
      testVarDeclaration = function(token, name) {
        expect(token.value).toBe(name);
        return expect(token.scopes).toEqual(['source.go', 'variable.other.declaration.go']);
      };
      testOp = function(token, op) {
        expect(token.value).toBe(op);
        return expect(token.scopes).toEqual(['source.go', 'keyword.operator.go']);
      };
      testOpAddress = function(token, op) {
        expect(token.value).toBe(op);
        return expect(token.scopes).toEqual(['source.go', 'keyword.operator.address.go']);
      };
      testOpAssignment = function(token, op) {
        expect(token.value).toBe(op);
        return expect(token.scopes).toEqual(['source.go', 'keyword.operator.assignment.go']);
      };
      testOpBracket = function(token, op, type) {
        expect(token.value).toBe(op);
        return expect(token.scopes).toEqual(['source.go', "punctuation.definition.variables." + type + ".bracket.round.go"]);
      };
      testOpPunctuation = function(token, op) {
        expect(token.value).toBe(op);
        return expect(token.scopes).toEqual(['source.go', 'punctuation.other.comma.go']);
      };
      testOpTermination = function(token, op) {
        expect(token.value).toBe(op);
        return expect(token.scopes).toEqual(['source.go', 'punctuation.terminator.go']);
      };
      testNumType = function(token, name) {
        expect(token.value).toBe(name);
        return expect(token.scopes).toEqual(['source.go', 'storage.type.numeric.go']);
      };
      testStringType = function(token, name) {
        expect(token.value).toBe(name);
        return expect(token.scopes).toEqual(['source.go', 'storage.type.string.go']);
      };
      testNum = function(token, value) {
        expect(token.value).toBe(value);
        return expect(token.scopes).toEqual(['source.go', 'constant.numeric.integer.go']);
      };
      testString = function(token, value) {
        expect(token.value).toBe(value);
        return expect(token.scopes).toEqual(['source.go', 'string.quoted.double.go']);
      };
      return describe('in var statements', function() {
        it('tokenizes a single variable assignment', function() {
          var tokens;
          tokens = grammar.tokenizeLine('i = 7').tokens;
          testVarAssignment(tokens[0], 'i');
          testOpAssignment(tokens[2], '=');
          return testNum(tokens[4], '7');
        });
        it('tokenizes a single qualified variable assignment', function() {
          var tokens;
          tokens = grammar.tokenizeLine('a.b.cde = 7').tokens;
          expect(tokens[0]).toEqual({
            value: 'a',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          expect(tokens[1]).toEqual({
            value: '.',
            scopes: ['source.go', 'variable.other.assignment.go', 'punctuation.other.period.go']
          });
          expect(tokens[2]).toEqual({
            value: 'b',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          expect(tokens[3]).toEqual({
            value: '.',
            scopes: ['source.go', 'variable.other.assignment.go', 'punctuation.other.period.go']
          });
          expect(tokens[4]).toEqual({
            value: 'cde',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          testOpAssignment(tokens[6], '=');
          return testNum(tokens[8], '7');
        });
        it('tokenizes multiple variable assignments', function() {
          var tokens;
          tokens = grammar.tokenizeLine('i, j = 7, 8').tokens;
          testVarAssignment(tokens[0], 'i');
          testOpPunctuation(tokens[1], ',');
          testVarAssignment(tokens[3], 'j');
          testOpAssignment(tokens[5], '=');
          testNum(tokens[7], '7');
          return testNum(tokens[10], '8');
        });
        it('tokenizes multiple qualified variable assignment', function() {
          var tokens;
          tokens = grammar.tokenizeLine('a.b, c.d.efg = 7, 8').tokens;
          expect(tokens[0]).toEqual({
            value: 'a',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          expect(tokens[1]).toEqual({
            value: '.',
            scopes: ['source.go', 'variable.other.assignment.go', 'punctuation.other.period.go']
          });
          expect(tokens[2]).toEqual({
            value: 'b',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          testOpPunctuation(tokens[3], ',');
          expect(tokens[5]).toEqual({
            value: 'c',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          expect(tokens[6]).toEqual({
            value: '.',
            scopes: ['source.go', 'variable.other.assignment.go', 'punctuation.other.period.go']
          });
          expect(tokens[7]).toEqual({
            value: 'd',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          expect(tokens[8]).toEqual({
            value: '.',
            scopes: ['source.go', 'variable.other.assignment.go', 'punctuation.other.period.go']
          });
          expect(tokens[9]).toEqual({
            value: 'efg',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          testOpAssignment(tokens[11], '=');
          testNum(tokens[13], '7');
          return testNum(tokens[16], '8');
        });
        it('tokenizes a single name and a type', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var i int').tokens;
          testVar(tokens[0]);
          testVarDeclaration(tokens[2], 'i');
          return testNumType(tokens[4], 'int');
        });
        it('tokenizes a name and a qualified type', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var a b.c').tokens;
          testVar(tokens[0]);
          expect(tokens[2]).toEqual({
            value: 'a',
            scopes: ['source.go', 'variable.other.declaration.go']
          });
          expect(tokens[3]).toEqual({
            value: ' b',
            scopes: ['source.go']
          });
          expect(tokens[4]).toEqual({
            value: '.',
            scopes: ['source.go', 'punctuation.other.period.go']
          });
          return expect(tokens[5]).toEqual({
            value: 'c',
            scopes: ['source.go']
          });
        });
        it('tokenizes a single name and an array type', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var s []string').tokens;
          testVar(tokens[0]);
          testVarDeclaration(tokens[2], 's');
          return testStringType(tokens[6], 'string');
        });
        it('tokenizes a single name and an array type with predetermined length', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var s [4]string').tokens;
          testVar(tokens[0]);
          testVarDeclaration(tokens[2], 's');
          expect(tokens[4]).toEqual({
            value: '[',
            scopes: ['source.go', 'punctuation.definition.bracket.square.go']
          });
          expect(tokens[5]).toEqual({
            value: '4',
            scopes: ['source.go', 'constant.numeric.integer.go']
          });
          expect(tokens[6]).toEqual({
            value: ']',
            scopes: ['source.go', 'punctuation.definition.bracket.square.go']
          });
          return testStringType(tokens[7], 'string');
        });
        it('tokenizes a single name and an array type with variadic length', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var s [...]string').tokens;
          testVar(tokens[0]);
          testVarDeclaration(tokens[2], 's');
          expect(tokens[4]).toEqual({
            value: '[',
            scopes: ['source.go', 'punctuation.definition.bracket.square.go']
          });
          expect(tokens[5]).toEqual({
            value: '...',
            scopes: ['source.go', 'keyword.operator.ellipsis.go']
          });
          expect(tokens[6]).toEqual({
            value: ']',
            scopes: ['source.go', 'punctuation.definition.bracket.square.go']
          });
          return testStringType(tokens[7], 'string');
        });
        it('tokenizes a single name and multi-dimensional types with an address', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var e [][]*string').tokens;
          testVar(tokens[0]);
          testVarDeclaration(tokens[2], 'e');
          expect(tokens[4]).toEqual({
            value: '[',
            scopes: ['source.go', 'punctuation.definition.bracket.square.go']
          });
          expect(tokens[5]).toEqual({
            value: ']',
            scopes: ['source.go', 'punctuation.definition.bracket.square.go']
          });
          expect(tokens[6]).toEqual({
            value: '[',
            scopes: ['source.go', 'punctuation.definition.bracket.square.go']
          });
          expect(tokens[7]).toEqual({
            value: ']',
            scopes: ['source.go', 'punctuation.definition.bracket.square.go']
          });
          testOpAddress(tokens[8], '*');
          return testStringType(tokens[9], 'string');
        });
        it('tokenizes a single name and a channel', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var x <-chan bool').tokens;
          testVar(tokens[0]);
          testVarDeclaration(tokens[2], 'x');
          expect(tokens[4]).toEqual({
            value: '<-',
            scopes: ['source.go', 'keyword.operator.channel.go']
          });
          expect(tokens[5]).toEqual({
            value: 'chan',
            scopes: ['source.go', 'keyword.channel.go']
          });
          return expect(tokens[7]).toEqual({
            value: 'bool',
            scopes: ['source.go', 'storage.type.boolean.go']
          });
        });
        it('tokenizes a single name and its initialization', function() {
          var tokens;
          tokens = grammar.tokenizeLine(' var k =  0').tokens;
          testVar(tokens[1]);
          testVarAssignment(tokens[3], 'k');
          testOpAssignment(tokens[5], '=');
          return testNum(tokens[7], '0');
        });
        it('tokenizes a single name, a type, and an initialization', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var z blub = 7').tokens;
          testVar(tokens[0]);
          testVarAssignment(tokens[2], 'z');
          expect(tokens[3]).toEqual({
            value: ' blub ',
            scopes: ['source.go']
          });
          testOpAssignment(tokens[4], '=');
          return testNum(tokens[6], '7');
        });
        it('tokenizes a single name, a qualified type, and an initialization', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var a b.c = 5').tokens;
          testVar(tokens[0]);
          expect(tokens[2]).toEqual({
            value: 'a',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          expect(tokens[3]).toEqual({
            value: ' b',
            scopes: ['source.go']
          });
          expect(tokens[4]).toEqual({
            value: '.',
            scopes: ['source.go', 'punctuation.other.period.go']
          });
          expect(tokens[5]).toEqual({
            value: 'c ',
            scopes: ['source.go']
          });
          testOpAssignment(tokens[6], '=');
          return testNum(tokens[8], '5');
        });
        it('does not tokenize more than necessary', function() {
          var lines;
          lines = grammar.tokenizeLines('var multiline string = `wow!\nthis should work!`');
          testVar(lines[0][0]);
          testVarAssignment(lines[0][2], 'multiline');
          testStringType(lines[0][4], 'string');
          testOpAssignment(lines[0][6], '=');
          expect(lines[0][8]).toEqual({
            value: '`',
            scopes: ['source.go', 'string.quoted.raw.go', 'punctuation.definition.string.begin.go']
          });
          return expect(lines[1][1]).toEqual({
            value: '`',
            scopes: ['source.go', 'string.quoted.raw.go', 'punctuation.definition.string.end.go']
          });
        });
        it('tokenizes multiple names and a type', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var U, V,  W  float64').tokens;
          testVar(tokens[0]);
          testVarDeclaration(tokens[2], 'U');
          testOpPunctuation(tokens[3], ',');
          testVarDeclaration(tokens[5], 'V');
          testOpPunctuation(tokens[6], ',');
          return testVarDeclaration(tokens[8], 'W');
        });
        it('tokenizes multiple names and a qualified type', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var a, b c.d').tokens;
          testVar(tokens[0]);
          expect(tokens[2]).toEqual({
            value: 'a',
            scopes: ['source.go', 'variable.other.declaration.go']
          });
          testOpPunctuation(tokens[3], ',');
          expect(tokens[5]).toEqual({
            value: 'b',
            scopes: ['source.go', 'variable.other.declaration.go']
          });
          expect(tokens[6]).toEqual({
            value: ' c',
            scopes: ['source.go']
          });
          expect(tokens[7]).toEqual({
            value: '.',
            scopes: ['source.go', 'punctuation.other.period.go']
          });
          return expect(tokens[8]).toEqual({
            value: 'd',
            scopes: ['source.go']
          });
        });
        it('tokenizes multiple names and initialization expressions', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var x, y, z = 1, 2, 3').tokens;
          testVar(tokens[0]);
          testVarAssignment(tokens[2], 'x');
          testOpPunctuation(tokens[3], ',');
          testVarAssignment(tokens[5], 'y');
          testOpPunctuation(tokens[6], ',');
          testVarAssignment(tokens[8], 'z');
          testOpAssignment(tokens[10], '=');
          testNum(tokens[12], '1');
          testOpPunctuation(tokens[13], ',');
          testNum(tokens[15], '2');
          testOpPunctuation(tokens[16], ',');
          return testNum(tokens[18], '3');
        });
        it('tokenizes multiple names, a type, and initialization expressions', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var x, y float32 = float, thirtytwo').tokens;
          testVar(tokens[0]);
          testVarAssignment(tokens[2], 'x');
          testOpPunctuation(tokens[3], ',');
          testVarAssignment(tokens[5], 'y');
          testNumType(tokens[7], 'float32');
          testOpAssignment(tokens[9], '=');
          return testOpPunctuation(tokens[11], ',');
        });
        it('tokenizes multiple names, a qualified type, and initialization expression', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var a, b c.d = 1, 2').tokens;
          testVar(tokens[0]);
          expect(tokens[2]).toEqual({
            value: 'a',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          testOpPunctuation(tokens[3], ',');
          expect(tokens[5]).toEqual({
            value: 'b',
            scopes: ['source.go', 'variable.other.assignment.go']
          });
          expect(tokens[6]).toEqual({
            value: ' c',
            scopes: ['source.go']
          });
          expect(tokens[7]).toEqual({
            value: '.',
            scopes: ['source.go', 'punctuation.other.period.go']
          });
          expect(tokens[8]).toEqual({
            value: 'd ',
            scopes: ['source.go']
          });
          testOpAssignment(tokens[9], '=');
          testNum(tokens[11], '1');
          testOpPunctuation(tokens[12], ',');
          return testNum(tokens[14], '2');
        });
        it('tokenizes multiple names and a function call', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var re, im = complexSqrt(-1)').tokens;
          testVar(tokens[0]);
          testVarAssignment(tokens[2], 're');
          testVarAssignment(tokens[5], 'im');
          return testOpAssignment(tokens[7], '=');
        });
        it('tokenizes with a placeholder', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var _, found = entries[name]').tokens;
          testVar(tokens[0]);
          testVarAssignment(tokens[2], '_');
          testVarAssignment(tokens[5], 'found');
          return testOpAssignment(tokens[7], '=');
        });
        it('does not treat words that have a trailing var as a variable declaration', function() {
          var tokens;
          tokens = grammar.tokenizeLine('func test(envvar string)').tokens;
          expect(tokens[4]).toEqual({
            value: 'envvar ',
            scopes: ['source.go']
          });
          return expect(tokens[5]).toEqual({
            value: 'string',
            scopes: ['source.go', 'storage.type.string.go']
          });
        });
        describe('in var statement blocks', function() {
          it('tokenizes single names with a type', function() {
            var lines;
            lines = grammar.tokenizeLines('var (\n  foo *bar\n)');
            testVar(lines[0][0]);
            testOpBracket(lines[0][2], '(', 'begin');
            testVarDeclaration(lines[1][1], 'foo');
            testOpAddress(lines[1][3], '*');
            return testOpBracket(lines[2][0], ')', 'end');
          });
          it('tokenizes single names with an initializer', function() {
            var lines;
            lines = grammar.tokenizeLines('var (\n  foo = 42\n)');
            testVar(lines[0][0], 'var');
            testOpBracket(lines[0][2], '(', 'begin');
            testVarAssignment(lines[1][1], 'foo');
            testOpAssignment(lines[1][3], '=');
            testNum(lines[1][5], '42');
            return testOpBracket(lines[2][0], ')', 'end');
          });
          it('tokenizes multiple names', function() {
            var lines;
            lines = grammar.tokenizeLines('var (\n  foo, bar = baz, quux\n)');
            testVar(lines[0][0]);
            testOpBracket(lines[0][2], '(', 'begin');
            testVarAssignment(lines[1][1], 'foo');
            testOpPunctuation(lines[1][2], ',');
            testVarAssignment(lines[1][4], 'bar');
            testOpAssignment(lines[1][6], '=');
            testOpPunctuation(lines[1][8], ',');
            return testOpBracket(lines[2][0], ')', 'end');
          });
          it('tokenizes non variable declarations', function() {
            var lines;
            lines = grammar.tokenizeLines('var (\n  // I am a comment\n  foo *bar\n  userRegister = &routers.Handler{\n		Handler: func(c echo.Context) error {\n			if err := userService.Register(&user); err != nil {\n				return err\n			}\n			return nil\n		},\n	}\n)');
            testVar(lines[0][0]);
            testOpBracket(lines[0][2], '(', 'begin');
            expect(lines[1][1]).toEqual({
              value: '//',
              scopes: ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
            });
            expect(lines[1][2]).toEqual({
              value: ' I am a comment',
              scopes: ['source.go', 'comment.line.double-slash.go']
            });
            testVarDeclaration(lines[2][1], 'foo');
            testOpAddress(lines[2][3], '*');
            testVarAssignment(lines[3][1], 'userRegister');
            expect(lines[4][3]).toEqual({
              value: 'func',
              scopes: ['source.go', 'keyword.function.go']
            });
            expect(lines[5][1]).toEqual({
              value: 'if',
              scopes: ['source.go', 'keyword.control.go']
            });
            expect(lines[8][3]).toEqual({
              value: 'nil',
              scopes: ['source.go', 'constant.language.go']
            });
            return testOpBracket(lines[11][0], ')', 'end');
          });
          return it('tokenizes all parts of variable initializations correctly', function() {
            var lines;
            lines = grammar.tokenizeLines('var (\n  m = map[string]int{\n    "key": 10,\n  }\n)');
            testVar(lines[0][0]);
            testOpBracket(lines[0][2], '(', 'begin');
            testVarAssignment(lines[1][1], 'm');
            testOpAssignment(lines[1][3], '=');
            testString(lines[2][2], 'key');
            testNum(lines[2][6], '10');
            return testOpBracket(lines[4][0], ')', 'end');
          });
        });
        it('tokenizes non-ASCII variable names', function() {
          var tokens;
          tokens = grammar.tokenizeLine('über = test').tokens;
          testVarAssignment(tokens[0], 'über');
          return testOpAssignment(tokens[2], '=');
        });
        it('tokenizes invalid variable names as such', function() {
          var tokens;
          tokens = grammar.tokenizeLine('var 0test = 0').tokens;
          testVar(tokens[0]);
          return expect(tokens[2]).toEqual({
            value: '0test',
            scopes: ['source.go', 'invalid.illegal.identifier.go']
          });
        });
        return describe('in shorthand variable declarations', function() {
          it('tokenizes single names', function() {
            var tokens;
            tokens = grammar.tokenizeLine('f := func() int { return 7 }').tokens;
            testVarAssignment(tokens[0], 'f');
            testOpAssignment(tokens[2], ':=');
            tokens = grammar.tokenizeLine('ch := make(chan int)').tokens;
            testVarAssignment(tokens[0], 'ch');
            return testOpAssignment(tokens[2], ':=');
          });
          return it('tokenizes multiple names', function() {
            var tokens;
            tokens = grammar.tokenizeLine('i, j := 0, 10').tokens;
            testVarAssignment(tokens[0], 'i');
            testOpPunctuation(tokens[1], ',');
            testVarAssignment(tokens[3], 'j');
            tokens = grammar.tokenizeLine('if _, y, z := coord(p); z > 0').tokens;
            testVarAssignment(tokens[2], '_');
            testVarAssignment(tokens[5], 'y');
            testVarAssignment(tokens[8], 'z');
            testOpAssignment(tokens[10], ':=');
            return testOpTermination(tokens[16], ';');
          });
        });
      });
    });
    return describe('in imports declarations', function() {
      var testBeginQuoted, testEndQuoted, testImport, testImportAlias, testImportPackage, testOpBracket;
      testImport = function(token) {
        expect(token.value).toBe('import');
        return expect(token.scopes).toEqual(['source.go', 'keyword.import.go']);
      };
      testImportAlias = function(token, name) {
        expect(token.value).toBe(name);
        return expect(token.scopes).toEqual(['source.go', 'entity.alias.import.go']);
      };
      testImportPackage = function(token, name) {
        expect(token.value).toBe(name);
        return expect(token.scopes).toEqual(['source.go', 'string.quoted.double.go', 'entity.name.import.go']);
      };
      testOpBracket = function(token, op, type) {
        expect(token.value).toBe(op);
        return expect(token.scopes).toEqual(['source.go', "punctuation.definition.imports." + type + ".bracket.round.go"]);
      };
      testBeginQuoted = function(token) {
        expect(token.value).toBe('"');
        return expect(token.scopes).toEqual(['source.go', 'string.quoted.double.go', 'punctuation.definition.string.begin.go']);
      };
      testEndQuoted = function(token) {
        expect(token.value).toBe('"');
        return expect(token.scopes).toEqual(['source.go', 'string.quoted.double.go', 'punctuation.definition.string.end.go']);
      };
      describe('when it is a single line declaration', function() {
        it('tokenizes declarations with a package name', function() {
          var tokens;
          tokens = grammar.tokenizeLine('import "fmt"').tokens;
          testImport(tokens[0]);
          testBeginQuoted(tokens[2]);
          testImportPackage(tokens[3], 'fmt');
          return testEndQuoted(tokens[4]);
        });
        it('tokenizes declarations with a package name and an alias', function() {
          var tokens;
          tokens = grammar.tokenizeLine('import . "fmt"').tokens;
          testImport(tokens[0]);
          testImportAlias(tokens[2], '.');
          testBeginQuoted(tokens[4]);
          testImportPackage(tokens[5], 'fmt');
          testEndQuoted(tokens[6]);
          tokens = grammar.tokenizeLine('import otherpackage "github.com/test/package"').tokens;
          testImport(tokens[0]);
          testImportAlias(tokens[2], 'otherpackage');
          testBeginQuoted(tokens[4]);
          testImportPackage(tokens[5], 'github.com/test/package');
          return testEndQuoted(tokens[6]);
        });
        return it('does not treat words that have a trailing import as a import declaration', function() {
          var tokens;
          tokens = grammar.tokenizeLine('func myFunc(Varimport string)').tokens;
          expect(tokens[4]).toEqual({
            value: 'Varimport ',
            scopes: ['source.go']
          });
          return expect(tokens[5]).toEqual({
            value: 'string',
            scopes: ['source.go', 'storage.type.string.go']
          });
        });
      });
      return describe('when it is a multi line declaration', function() {
        it('tokenizes single declarations with a package name', function() {
          var closing, decl, kwd, _ref;
          _ref = grammar.tokenizeLines('import (\n  "github.com/test/package"\n)'), kwd = _ref[0], decl = _ref[1], closing = _ref[2];
          testImport(kwd[0]);
          testOpBracket(kwd[2], '(', 'begin');
          testBeginQuoted(decl[1]);
          testImportPackage(decl[2], 'github.com/test/package');
          testEndQuoted(decl[3]);
          return testOpBracket(closing[0], ')', 'end');
        });
        it('tokenizes multiple declarations with a package name', function() {
          var closing, decl, decl2, kwd, _ref;
          _ref = grammar.tokenizeLines('import (\n  "github.com/test/package"\n  "fmt"\n)'), kwd = _ref[0], decl = _ref[1], decl2 = _ref[2], closing = _ref[3];
          testImport(kwd[0]);
          testOpBracket(kwd[2], '(', 'begin');
          testBeginQuoted(decl[1]);
          testImportPackage(decl[2], 'github.com/test/package');
          testEndQuoted(decl[3]);
          testBeginQuoted(decl2[1]);
          testImportPackage(decl2[2], 'fmt');
          testEndQuoted(decl2[3]);
          return testOpBracket(closing[0], ')', 'end');
        });
        it('tokenizes single imports with an alias for a multi-line declaration', function() {
          var closing, decl, kwd, _ref;
          _ref = grammar.tokenizeLines('import (\n  . "github.com/test/package"\n)'), kwd = _ref[0], decl = _ref[1], closing = _ref[2];
          testImport(kwd[0]);
          testOpBracket(kwd[2], '(', 'begin');
          testImportAlias(decl[1], '.');
          testBeginQuoted(decl[3]);
          testImportPackage(decl[4], 'github.com/test/package');
          testEndQuoted(decl[5]);
          return testOpBracket(closing[0], ')', 'end');
        });
        return it('tokenizes multiple imports with an alias for a multi-line declaration', function() {
          var closing, decl, decl2, kwd, _ref;
          _ref = grammar.tokenizeLines('import (\n  . "github.com/test/package"\n  "fmt"\n)'), kwd = _ref[0], decl = _ref[1], decl2 = _ref[2], closing = _ref[3];
          testImport(kwd[0]);
          testOpBracket(kwd[2], '(', 'begin');
          testImportAlias(decl[1], '.');
          testBeginQuoted(decl[3]);
          testImportPackage(decl[4], 'github.com/test/package');
          testEndQuoted(decl[5]);
          testBeginQuoted(decl2[1]);
          testImportPackage(decl2[2], 'fmt');
          testEndQuoted(decl2[3]);
          return testOpBracket(closing[0], ')', 'end');
        });
      });
    });
  });

}).call(this);
