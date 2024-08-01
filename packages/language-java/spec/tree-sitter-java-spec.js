
const {TextEditor} = require('atom');

describe('Tree-sitter based Java grammar', function() {
  let grammar = null;
  let editor = null;
  let buffer = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', true);
    atom.config.set('core.useLegacyTreeSitter', true);

    waitsForPromise(() => atom.packages.activatePackage('language-java'));

    runs(function() {
      editor = new TextEditor();
      grammar = atom.grammars.grammarForScopeName('source.java');
      editor.setGrammar(grammar);
      buffer = editor.getBuffer();
    });
  });

  // Compatibility functions with TextMate grammar tests

  // Returns list of tokens as [{value: ..., scopes: [...]}, ...]
  const getTokens = function(buffer, row) {
    const line = buffer.lineForRow(row);
    const tokens = [];

    const iterator = buffer.getLanguageMode().buildHighlightIterator();
    let start = {row, column: 0};
    const scopes = iterator.seek(start, row);

    while (true) {
      const end = iterator.getPosition();

      if (end.row > row) {
        end.row = row;
        end.column = line.length;
      }

      if (end.column > start.column) {
        tokens.push({
          value: line.substring(start.column, end.column),
          scopes: Array.from(scopes).map((s) => buffer.getLanguageMode().grammar.scopeNameForScopeId(s))
        });
      }

      if (end.column < line.length) {
        for (let num of Array.from(iterator.getCloseScopeIds())) {
          const item = scopes.pop();
        }
        scopes.push(...iterator.getOpenScopeIds());
        start = end;
        iterator.moveToSuccessor();
      } else {
        break;
      }
    }

    return tokens;
  };

  const tokenizeLine = function(text) {
    buffer.setText(text);
    return getTokens(buffer, 0);
  };

  const tokenizeLines = function(text) {
    buffer.setText(text);
    const lines = buffer.getLines();
    const tokens = [];
    let row = 0;
    for (let _ of Array.from(lines)) {
      tokens.push(getTokens(buffer, row));
      row += 1;
    }
    return tokens;
  };

  const printTokens = function(tokens) {
    console.log();
    return (() => {
      const result = [];
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        for (let j = 0; j < token.length; j++) {
          const t = token[j];
          const scopes = (Array.from(t.scopes).map((scope) => `'${scope}'`)).join(", ");
          console.log(`expect(tokens[${i}][${j}]).toEqual value: '${t.value}', scopes: [${scopes}]`);
        }
        result.push(console.log());
      }
      return result;
    })();
  };

  // Unit tests

  it('parses the grammar', function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe('source.java');
  });

  it('tokenizes punctuation', function() {
    let tokens = tokenizeLine('int a, b, c;');

    expect(tokens[2]).toEqual({value: ',', scopes: ['source.java', 'punctuation.separator.delimiter']});
    expect(tokens[4]).toEqual({value: ',', scopes: ['source.java', 'punctuation.separator.delimiter']});
    expect(tokens[6]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.statement']});

    tokens = tokenizeLine('a.b.c();');

    expect(tokens[1]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period']});
    expect(tokens[3]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period']});
    expect(tokens[7]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.statement']});

    tokens = tokenizeLine('a . b');

    expect(tokens[2]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period']});

    tokens = tokenizeLine('new com.package.Clazz();');

    expect(tokens[3]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period']});
    expect(tokens[5]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period']});
    expect(tokens[9]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.statement']});

    tokens = tokenizeLine('class A implements B, C {}');

    expect(tokens[7]).toEqual({value: ',', scopes: ['source.java', 'punctuation.separator.delimiter']});
});

  it('tokenizes comparison', function() {
    const tokens = tokenizeLines(`\
a > b;
a < b;
a == b;
a >= b;
a <= b;
a != b;\
`
    );

    expect(tokens[0][1]).toEqual({value: '>', scopes: ['source.java', 'keyword.operator.comparison']});
    expect(tokens[1][1]).toEqual({value: '<', scopes: ['source.java', 'keyword.operator.comparison']});
    expect(tokens[2][1]).toEqual({value: '==', scopes: ['source.java', 'keyword.operator.comparison']});
    expect(tokens[3][1]).toEqual({value: '>=', scopes: ['source.java', 'keyword.operator.comparison']});
    expect(tokens[4][1]).toEqual({value: '<=', scopes: ['source.java', 'keyword.operator.comparison']});
    expect(tokens[5][1]).toEqual({value: '!=', scopes: ['source.java', 'keyword.operator.comparison']});
});

  it('tokenizes logical', function() {
    const tokens = tokenizeLines(`\
a && b;
a || b;
!a;\
`
    );

    expect(tokens[0][1]).toEqual({value: '&&', scopes: ['source.java', 'keyword.operator.logical']});
    expect(tokens[1][1]).toEqual({value: '||', scopes: ['source.java', 'keyword.operator.logical']});
    expect(tokens[2][0]).toEqual({value: '!', scopes: ['source.java', 'keyword.operator.logical']});
});

  it('tokenizes arithmetic', function() {
    const tokens = tokenizeLines(`\
a + b;
a - b;
a * b;
a / b;
a % b;
a += b;
a -= b;
a *= b;
a /= b;
a %= b;
a++;
--a;\
`
    );

    expect(tokens[0][1]).toEqual({value: '+', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[1][1]).toEqual({value: '-', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[2][1]).toEqual({value: '*', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[3][1]).toEqual({value: '/', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[4][1]).toEqual({value: '%', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[5][1]).toEqual({value: '+=', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[6][1]).toEqual({value: '-=', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[7][1]).toEqual({value: '*=', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[8][1]).toEqual({value: '/=', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[9][1]).toEqual({value: '%=', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[10][1]).toEqual({value: '++', scopes: ['source.java', 'keyword.operator.arithmetic']});
    expect(tokens[11][0]).toEqual({value: '--', scopes: ['source.java', 'keyword.operator.arithmetic']});
});

  it('tokenizes bitwise', function() {
    const tokens = tokenizeLines(`\
a & b;
a | b;
a ^ b;
a >> b;
a << b;
a >>> b;
a &= b;
a |= b;
a ^= b;
a >>= b;
a <<= b;
a >>>= b;
~a;\
`
    );

    expect(tokens[0][1]).toEqual({value: '&', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[1][1]).toEqual({value: '|', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[2][1]).toEqual({value: '^', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[3][1]).toEqual({value: '>>', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[4][1]).toEqual({value: '<<', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[5][1]).toEqual({value: '>>>', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[6][1]).toEqual({value: '&=', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[7][1]).toEqual({value: '|=', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[8][1]).toEqual({value: '^=', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[9][1]).toEqual({value: '>>=', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[10][1]).toEqual({value: '<<=', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[11][1]).toEqual({value: '>>>=', scopes: ['source.java', 'keyword.operator.bitwise']});
    expect(tokens[12][0]).toEqual({value: '~', scopes: ['source.java', 'keyword.operator.bitwise']});
});

  it('tokenizes brackets', function() {
    const tokens = tokenizeLine('{ (a + b) + c[d] }');

    expect(tokens[0]).toEqual({value: '{', scopes: ['source.java', 'punctuation.bracket.curly']});
    expect(tokens[2]).toEqual({value: '(', scopes: ['source.java', 'punctuation.bracket.round']});
    expect(tokens[6]).toEqual({value: ')', scopes: ['source.java', 'punctuation.bracket.round']});
    expect(tokens[10]).toEqual({value: '[', scopes: ['source.java', 'punctuation.bracket.square']});
    expect(tokens[12]).toEqual({value: ']', scopes: ['source.java', 'punctuation.bracket.square']});
    expect(tokens[14]).toEqual({value: '}', scopes: ['source.java', 'punctuation.bracket.curly']});
});

  it('tokenizes literals', function() {
    const tokens = tokenizeLines(`\
a = null;
a = true;
a = false;
a = 123;
a = 0x1a;
a = 0b11010;
a = 123L;
a = 123l;
a = 123.4;
a = 123.4d;
a = 1.234e2;
a = 123.4f;
a = 'a';
a = '\u0108'
a = "abc";\
`
    );

    expect(tokens[0][3]).toEqual({value: 'null', scopes: ['source.java', 'constant.language.null']});
    expect(tokens[1][3]).toEqual({value: 'true', scopes: ['source.java', 'constant.boolean']});
    expect(tokens[2][3]).toEqual({value: 'false', scopes: ['source.java', 'constant.boolean']});
    expect(tokens[3][3]).toEqual({value: '123', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[4][3]).toEqual({value: '0x1a', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[5][3]).toEqual({value: '0b11010', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[6][3]).toEqual({value: '123L', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[7][3]).toEqual({value: '123l', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[8][3]).toEqual({value: '123.4', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[9][3]).toEqual({value: '123.4d', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[10][3]).toEqual({value: '1.234e2', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[11][3]).toEqual({value: '123.4f', scopes: ['source.java', 'constant.numeric']});
    expect(tokens[12][3]).toEqual({value: '\'a\'', scopes: ['source.java', 'string.quoted.single']});
    expect(tokens[13][3]).toEqual({value: '\'\u0108\'', scopes: ['source.java', 'string.quoted.single']});
    expect(tokens[14][3]).toEqual({value: '\"abc\"', scopes: ['source.java', 'string.quoted.double']});
});

  it('tokenizes constants', function() {
    const tokens = tokenizeLines(`\
String CONSTANT_STR = "value";
int CONST0 = 0;
int CONST_1 = 1;
String A1_B2_C3 = "abc";
String A$_B$_C$ = "abc";
a = CONSTANT + obj.func();
b = conf.get(CONSTANT_ANOTHER);
c = Integer.MAX_VALUE;
d = A1_B2_C3;
e = A1_B2_C$;
f = Test.A1_B2_C3;\
`
    );

    expect(tokens[0][2]).toEqual({value: 'CONSTANT_STR', scopes: ['source.java', 'constant.other']});
    expect(tokens[1][2]).toEqual({value: 'CONST0', scopes: ['source.java', 'constant.other']});
    expect(tokens[2][2]).toEqual({value: 'CONST_1', scopes: ['source.java', 'constant.other']});
    expect(tokens[3][2]).toEqual({value: 'A1_B2_C3', scopes: ['source.java', 'constant.other']});
    expect(tokens[4][2]).toEqual({value: 'A$_B$_C$', scopes: ['source.java', 'constant.other']});
    expect(tokens[5][3]).toEqual({value: 'CONSTANT', scopes: ['source.java', 'constant.other']});
    expect(tokens[6][7]).toEqual({value: 'CONSTANT_ANOTHER', scopes: ['source.java', 'constant.other']});
    expect(tokens[7][5]).toEqual({value: 'MAX_VALUE', scopes: ['source.java', 'constant.other']});
    expect(tokens[8][3]).toEqual({value: 'A1_B2_C3', scopes: ['source.java', 'constant.other']});
    expect(tokens[9][3]).toEqual({value: 'A1_B2_C$', scopes: ['source.java', 'constant.other']});
    expect(tokens[10][5]).toEqual({value: 'A1_B2_C3', scopes: ['source.java', 'constant.other']});
});

  it('tokenizes constants in switch statement', function() {
    const tokens = tokenizeLines(`\
switch (value) {
  case CONST: break;
  case CONST_STR: break;
  case CONST0: break;
  case CONST_1: break;
  case C0_STR1_DEF2: break;
  case C$_STR$_DEF$: break;
  default: break;
}\
`
    );

    expect(tokens[1][3]).toEqual({value: 'CONST', scopes: ['source.java', 'constant.other']});
    expect(tokens[2][3]).toEqual({value: 'CONST_STR', scopes: ['source.java', 'constant.other']});
    expect(tokens[3][3]).toEqual({value: 'CONST0', scopes: ['source.java', 'constant.other']});
    expect(tokens[4][3]).toEqual({value: 'CONST_1', scopes: ['source.java', 'constant.other']});
    expect(tokens[5][3]).toEqual({value: 'C0_STR1_DEF2', scopes: ['source.java', 'constant.other']});
    expect(tokens[6][3]).toEqual({value: 'C$_STR$_DEF$', scopes: ['source.java', 'constant.other']});
});

  it('tokenizes packages', function() {
    const tokens = tokenizeLine('package com.test;');

    expect(tokens[0]).toEqual({value: 'package', scopes: ['source.java', 'meta.package', 'keyword.other.package']});
    expect(tokens[1]).toEqual({value: ' com', scopes: ['source.java', 'meta.package']});
    expect(tokens[2]).toEqual({value: '.', scopes: ['source.java', 'meta.package', 'punctuation.separator.period']});
    expect(tokens[3]).toEqual({value: 'test', scopes: ['source.java', 'meta.package']});
    expect(tokens[4]).toEqual({value: ';', scopes: ['source.java', 'meta.package', 'punctuation.terminator.statement']});
});

  it('tokenizes imports', function() {
    const tokens = tokenizeLine('import com.package;');

    expect(tokens[0]).toEqual({value: 'import', scopes: ['source.java', 'meta.import', 'keyword.other.import']});
});

  it('tokenizes static imports', function() {
    const tokens = tokenizeLine('import static com.package;');

    expect(tokens[0]).toEqual({value: 'import', scopes: ['source.java', 'meta.import', 'keyword.other.import']});
    expect(tokens[2]).toEqual({value: 'static', scopes: ['source.java', 'meta.import', 'keyword.other.static']});
});

  it('tokenizes imports with asterisk', function() {
    const tokens = tokenizeLine('import static com.package.*;');

    expect(tokens[0]).toEqual({value: 'import', scopes: ['source.java', 'meta.import', 'keyword.other.import']});
    expect(tokens[2]).toEqual({value: 'static', scopes: ['source.java', 'meta.import', 'keyword.other.static']});
    expect(tokens[7]).toEqual({value: '*', scopes: ['source.java', 'meta.import', 'variable.language.wildcard']});
});

  it('tokenizes static initializers', function() {
    const tokens = tokenizeLines(`\
class A {
  private static int a = 0;

  static {
    a = 1;
  }
}\
`
    );

    expect(tokens[1][3]).toEqual({value: 'static', scopes: ['source.java', 'meta.class.body', 'storage.modifier']});
    expect(tokens[3][1]).toEqual({value: 'static', scopes: ['source.java', 'meta.class.body', 'storage.modifier']});
});

  it('tokenizes synchronized blocks', function() {
    const tokens = tokenizeLines(`\
class A {
  synchronized {
    func();
  }
}\
`
    );

    expect(tokens[1][1]).toEqual({value: 'synchronized', scopes: ['source.java', 'meta.class.body', 'storage.modifier']});
});

  it('tokenizes instanceof', function() {
    const tokens = tokenizeLines(`\
(a instanceof Tpe);
(a instanceof tpe);
(a instanceof tpTpe);
(a instanceof tp.Tpe);
if (a instanceof B) { }
if (aaBb instanceof B) { }\
`
    );

    expect(tokens[0][2]).toEqual({value: 'instanceof', scopes: ['source.java', 'keyword.operator.instanceof']});
    expect(tokens[0][4]).toEqual({value: 'Tpe', scopes: ['source.java', 'storage.type']});
    expect(tokens[1][2]).toEqual({value: 'instanceof', scopes: ['source.java', 'keyword.operator.instanceof']});
    expect(tokens[1][4]).toEqual({value: 'tpe', scopes: ['source.java', 'storage.type']});
    expect(tokens[2][2]).toEqual({value: 'instanceof', scopes: ['source.java', 'keyword.operator.instanceof']});
    expect(tokens[2][4]).toEqual({value: 'tpTpe', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][2]).toEqual({value: 'instanceof', scopes: ['source.java', 'keyword.operator.instanceof']});
    expect(tokens[3][4]).toEqual({value: 'tp', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][6]).toEqual({value: 'Tpe', scopes: ['source.java', 'storage.type']});
    expect(tokens[4][4]).toEqual({value: 'instanceof', scopes: ['source.java', 'keyword.operator.instanceof']});
    expect(tokens[5][4]).toEqual({value: 'instanceof', scopes: ['source.java', 'keyword.operator.instanceof']});
});

  it('tokenizes ternary', function() {
    const tokens = tokenizeLine('(a > b) ? a : b;');

    expect(tokens[6]).toEqual({value: '?', scopes: ['source.java', 'keyword.control.ternary']});
    expect(tokens[8]).toEqual({value: ':', scopes: ['source.java', 'keyword.control.ternary']});
});

  it('tokenizes try-catch block with multiple exceptions', function() {
    const tokens = tokenizeLines(`\
private void method() {
  try {
    // do something
  } catch (Exception1 | Exception2 err) {
    throw new Exception3();
  }
}\
`
    );

    expect(tokens[1][1]).toEqual({value: 'try', scopes: ['source.java', 'keyword.control']});
    expect(tokens[3][3]).toEqual({value: 'catch', scopes: ['source.java', 'keyword.control']});
    expect(tokens[3][5]).toEqual({value: '(', scopes: ['source.java', 'punctuation.bracket.round']});
    expect(tokens[3][6]).toEqual({value: 'Exception1', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][8]).toEqual({value: '|', scopes: ['source.java', 'punctuation.catch.separator']});
    expect(tokens[3][10]).toEqual({value: 'Exception2', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][12]).toEqual({value: ')', scopes: ['source.java', 'punctuation.bracket.round']});
    expect(tokens[4][1]).toEqual({value: 'throw', scopes: ['source.java', 'keyword.control']});
    expect(tokens[4][3]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control']});
    expect(tokens[4][5]).toEqual({value: 'Exception3', scopes: ['source.java', 'storage.type']});
});

  it('tokenizes lambda expressions', function() {
    const tokens = tokenizeLine('(String s1) -> s1.length() - outer.length();');

    expect(tokens[5]).toEqual({value: '->', scopes: ['source.java', 'storage.type.function.arrow']});
});

  it('tokenizes spread parameters', function() {
    let tokens = tokenizeLine('public void method(String... args);');

    expect(tokens[6]).toEqual({value: '...', scopes: ['source.java', 'punctuation.definition.parameters.varargs']});

    tokens = tokenizeLine('void func(int /* ... */ arg, int ... args);');

    expect(tokens[5]).toEqual({value: '/* ... */', scopes: ['source.java', 'comment.block']});
    expect(tokens[11]).toEqual({value: '...', scopes: ['source.java', 'punctuation.definition.parameters.varargs']});
});

  xit('tokenizes identifiers with `$`', function() {
    const tokens = tokenizeLines(`\
class A$B {
  void func$() {
    $object.$property;
    $hello();
  }
}\
`
    );

    expect(tokens[0][2]).toEqual({value: 'A$B', scopes: ['source.java', 'entity.name.type.class']});
    expect(tokens[0][3]).toEqual({value: ' ', scopes: ['source.java']});
    expect(tokens[0][4]).toEqual({value: '{', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.curly']});
    expect(tokens[1][3]).toEqual({value: 'func$', scopes: ['source.java', 'meta.class.body', 'meta.method', 'entity.name.function']});
    expect(tokens[2][1]).toEqual({value: '$object', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body']});
    expect(tokens[2][3]).toEqual({value: '$property', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body']});
    expect(tokens[3][1]).toEqual({value: '$hello', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
});

  it('tokenizes this and super', function() {
    const tokens = tokenizeLine('this.x + super.x;');

    expect(tokens[0]).toEqual({value: 'this', scopes: ['source.java', 'variable.language']});
    expect(tokens[5]).toEqual({value: 'super', scopes: ['source.java', 'variable.language']});
});

  it('tokenizes this and super in method invocations', function() {
    const tokens = tokenizeLines(`\
class A {
  void func() {
    super.debug("debug");
    this.debug("debug");
    property.super.func("arg");
  }
}\
`
    );

    expect(tokens[2][1]).toEqual({value: 'super', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'variable.language']});
    expect(tokens[3][1]).toEqual({value: 'this', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'variable.language']});
    expect(tokens[4][3]).toEqual({value: 'super', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'variable.language']});
});

  it('tokenizes comments', function() {
    const tokens = tokenizeLines(`\
// comment

/*
 comment
 */\
`
    );

    expect(tokens[0][0]).toEqual({value: '// comment', scopes: ['source.java', 'comment.block']});
    expect(tokens[2][0]).toEqual({value: '/*', scopes: ['source.java', 'comment.block']});
    expect(tokens[3][0]).toEqual({value: ' comment', scopes: ['source.java', 'comment.block']});
    expect(tokens[4][0]).toEqual({value: ' */', scopes: ['source.java', 'comment.block']});
});

  it('tokenizes type definitions', function() {
    const tokens = tokenizeLines(`\
class A {
  void method() { }
  boolean method() { }
  int method() { }
  long method() { }
  float method() { }
  double method() { }
  int[] method() { }
  T method() { }
  java.util.List<T> method() { }
}\
`
    );

    expect(tokens[1][1]).toEqual({value: 'void', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[2][1]).toEqual({value: 'boolean', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[3][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[4][1]).toEqual({value: 'long', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[5][1]).toEqual({value: 'float', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[6][1]).toEqual({value: 'double', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[7][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[8][1]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][1]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][3]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][5]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][7]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
});

  it('tokenizes type casting', function() {
    const tokens = tokenizeLines(`\
class A {
  A<T> method() {
    return (A<T>) a;
  }
}\
`
    );

    expect(tokens[2][1]).toEqual({value: 'return', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control']});
    expect(tokens[2][3]).toEqual({value: '(', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.round']});
    expect(tokens[2][4]).toEqual({value: 'A', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[2][5]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.angle']});
    expect(tokens[2][6]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[2][7]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.angle']});
    expect(tokens[2][8]).toEqual({value: ')', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.round']});
});

  it('tokenizes class generic type definitions', function() {
    const tokens = tokenizeLines(`\
class Test<K, V> {}
class Test<A extends java.util.List<T>> {}
class Bound<T extends A & B> {}
class Bound<T extends java.lang.A & java.lang.B> {}
class Bound <T extends A<? extends D> & B> {}
class Test<T, S> extends Common<? super T> {}
class Test<T extends A & B, String, Integer> {}
class Test<T extends Conv<S>, S extends Conv<T>> {}\
`
    );

    expect(tokens[0][3]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[0][4]).toEqual({value: 'K', scopes: ['source.java', 'storage.type']});
    expect(tokens[0][5]).toEqual({value: ',', scopes: ['source.java', 'punctuation.separator.delimiter']});
    expect(tokens[0][7]).toEqual({value: 'V', scopes: ['source.java', 'storage.type']});
    expect(tokens[0][8]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});

    expect(tokens[1][3]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[1][4]).toEqual({value: 'A', scopes: ['source.java', 'storage.type']});
    expect(tokens[1][6]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[1][8]).toEqual({value: 'java', scopes: ['source.java', 'storage.type']});
    expect(tokens[1][10]).toEqual({value: 'util', scopes: ['source.java', 'storage.type']});
    expect(tokens[1][12]).toEqual({value: 'List', scopes: ['source.java', 'storage.type']});
    expect(tokens[1][13]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[1][14]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[1][15]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[1][16]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});

    expect(tokens[2][3]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[2][4]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[2][6]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[2][8]).toEqual({value: 'A', scopes: ['source.java', 'storage.type']});
    expect(tokens[2][10]).toEqual({value: '&', scopes: ['source.java', 'punctuation.separator.types']});
    expect(tokens[2][12]).toEqual({value: 'B', scopes: ['source.java', 'storage.type']});
    expect(tokens[2][13]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});

    expect(tokens[3][3]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[3][4]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][6]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[3][8]).toEqual({value: 'java', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][10]).toEqual({value: 'lang', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][12]).toEqual({value: 'A', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][14]).toEqual({value: '&', scopes: ['source.java', 'punctuation.separator.types']});
    expect(tokens[3][16]).toEqual({value: 'java', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][18]).toEqual({value: 'lang', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][20]).toEqual({value: 'B', scopes: ['source.java', 'storage.type']});
    expect(tokens[3][21]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});

    expect(tokens[4][4]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[4][5]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[4][7]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[4][9]).toEqual({value: 'A', scopes: ['source.java', 'storage.type']});
    expect(tokens[4][10]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[4][11]).toEqual({value: '?', scopes: ['source.java', 'storage.type.generic.wildcard']});
    expect(tokens[4][13]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[4][15]).toEqual({value: 'D', scopes: ['source.java', 'storage.type']});
    expect(tokens[4][16]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[4][18]).toEqual({value: '&', scopes: ['source.java', 'punctuation.separator.types']});
    expect(tokens[4][20]).toEqual({value: 'B', scopes: ['source.java', 'storage.type']});
    expect(tokens[4][21]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});

    expect(tokens[5][3]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[5][4]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[5][5]).toEqual({value: ',', scopes: ['source.java', 'punctuation.separator.delimiter']});
    expect(tokens[5][7]).toEqual({value: 'S', scopes: ['source.java', 'storage.type']});
    expect(tokens[5][8]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[5][10]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[5][12]).toEqual({value: 'Common', scopes: ['source.java', 'storage.type']});
    expect(tokens[5][13]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[5][14]).toEqual({value: '?', scopes: ['source.java', 'storage.type.generic.wildcard']});
    expect(tokens[5][16]).toEqual({value: 'super', scopes: ['source.java', 'storage.modifier.super']});
    expect(tokens[5][18]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[5][19]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});

    expect(tokens[6][3]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[6][4]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[6][6]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[6][8]).toEqual({value: 'A', scopes: ['source.java', 'storage.type']});
    expect(tokens[6][10]).toEqual({value: '&', scopes: ['source.java', 'punctuation.separator.types']});
    expect(tokens[6][12]).toEqual({value: 'B', scopes: ['source.java', 'storage.type']});
    expect(tokens[6][13]).toEqual({value: ',', scopes: ['source.java', 'punctuation.separator.delimiter']});
    expect(tokens[6][15]).toEqual({value: 'String', scopes: ['source.java', 'storage.type']});
    expect(tokens[6][16]).toEqual({value: ',', scopes: ['source.java', 'punctuation.separator.delimiter']});
    expect(tokens[6][18]).toEqual({value: 'Integer', scopes: ['source.java', 'storage.type']});
    expect(tokens[6][19]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});

    expect(tokens[7][3]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[7][4]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[7][6]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[7][8]).toEqual({value: 'Conv', scopes: ['source.java', 'storage.type']});
    expect(tokens[7][9]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[7][10]).toEqual({value: 'S', scopes: ['source.java', 'storage.type']});
    expect(tokens[7][11]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[7][12]).toEqual({value: ',', scopes: ['source.java', 'punctuation.separator.delimiter']});
    expect(tokens[7][14]).toEqual({value: 'S', scopes: ['source.java', 'storage.type']});
    expect(tokens[7][16]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[7][18]).toEqual({value: 'Conv', scopes: ['source.java', 'storage.type']});
    expect(tokens[7][19]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[7][20]).toEqual({value: 'T', scopes: ['source.java', 'storage.type']});
    expect(tokens[7][21]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});
    expect(tokens[7][22]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle']});
});

  it('tokenizes generic type definitions', function() {
    const tokens = tokenizeLines(`\
abstract class Generics {
  HashMap<Integer, String> map = new HashMap<>();
  CodeMap<String, ? extends ArrayList> codemap;
  C(Map<?, ? extends List<?>> m) {}
  Map<Integer, String> method() {}
  Set<Map.Entry<K, V>> set1;
  Set<java.util.List<K>> set2;

  List<A, B, C> func();
  java.util.List<Integer> func();
  List<> func();
  java.util.List<java.util.Map<Integer, java.lang.String>> func();
  java.util.List<? extends Integer> func();
  <T extends Integer> java.util.List<T> func();
  <T extends Annotation> T getAnnotation(Class<T> annotationType);
}\
`
    );

    expect(tokens[1][1]).toEqual({value: 'HashMap', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[1][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[1][3]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[1][4]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.delimiter']});
    expect(tokens[1][6]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[1][7]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[1][13]).toEqual({value: 'HashMap', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[1][14]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[1][15]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});

    expect(tokens[2][1]).toEqual({value: 'CodeMap', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[2][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[2][3]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[2][4]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.delimiter']});
    expect(tokens[2][6]).toEqual({value: '?', scopes: ['source.java', 'meta.class.body', 'storage.type.generic.wildcard']});
    expect(tokens[2][8]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.body', 'storage.modifier.extends']});
    expect(tokens[2][10]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[2][11]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});

    expect(tokens[3][3]).toEqual({value: 'Map', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.type']});
    expect(tokens[3][4]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'punctuation.bracket.angle']});
    expect(tokens[3][5]).toEqual({value: '?', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.type.generic.wildcard']});
    expect(tokens[3][6]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'punctuation.separator.delimiter']});
    expect(tokens[3][8]).toEqual({value: '?', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.type.generic.wildcard']});
    expect(tokens[3][10]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.modifier.extends']});
    expect(tokens[3][12]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.type']});
    expect(tokens[3][13]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'punctuation.bracket.angle']});
    expect(tokens[3][14]).toEqual({value: '?', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.type.generic.wildcard']});
    expect(tokens[3][15]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'punctuation.bracket.angle']});
    expect(tokens[3][16]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'punctuation.bracket.angle']});

    expect(tokens[4][1]).toEqual({value: 'Map', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[4][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[4][3]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[4][4]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.delimiter']});
    expect(tokens[4][6]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[4][7]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});

    expect(tokens[5][1]).toEqual({value: 'Set', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[5][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[5][3]).toEqual({value: 'Map', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[5][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.period']});
    expect(tokens[5][5]).toEqual({value: 'Entry', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[5][6]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[5][7]).toEqual({value: 'K', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[5][8]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.delimiter']});
    expect(tokens[5][10]).toEqual({value: 'V', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[5][11]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[5][12]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});

    expect(tokens[6][1]).toEqual({value: 'Set', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[6][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[6][3]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[6][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.period']});
    expect(tokens[6][5]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[6][6]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.period']});
    expect(tokens[6][7]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[6][8]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[6][9]).toEqual({value: 'K', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[6][10]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[6][11]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});

    expect(tokens[8][1]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[8][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[8][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[8][4]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.delimiter']});
    expect(tokens[8][6]).toEqual({value: 'B', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[8][7]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.delimiter']});
    expect(tokens[8][9]).toEqual({value: 'C', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[8][10]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});

    expect(tokens[9][1]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[9][3]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[9][5]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][6]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[9][7]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][8]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});

    expect(tokens[10][1]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[10][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[10][3]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});

    expect(tokens[11][1]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[11][3]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[11][5]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][6]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[11][7]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][8]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[11][9]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][10]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[11][11]).toEqual({value: 'Map', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][12]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[11][13]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][14]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.delimiter']});
    expect(tokens[11][16]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][17]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[11][18]).toEqual({value: 'lang', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][19]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[11][20]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[11][21]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[11][22]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});

    expect(tokens[12][1]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[12][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[12][3]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[12][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[12][5]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[12][6]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[12][7]).toEqual({value: '?', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type.generic.wildcard']});
    expect(tokens[12][9]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier.extends']});
    expect(tokens[12][11]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[12][12]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});

    expect(tokens[13][1]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[13][2]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[13][4]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier.extends']});
    expect(tokens[13][6]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[13][7]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[13][9]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[13][10]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[13][11]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[13][12]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.period']});
    expect(tokens[13][13]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[13][14]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[13][15]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[13][16]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});

    expect(tokens[14][1]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[14][2]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[14][4]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier.extends']});
    expect(tokens[14][6]).toEqual({value: 'Annotation', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[14][7]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[14][9]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[14][14]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
    expect(tokens[14][15]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[14][16]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.angle']});
});

  it('tokenizes generics without mixing with bitwise or comparison operators', function() {
    const tokens = tokenizeLines(`\
class A {
  void func1() {
    t = M << 12;
  }

  void func2() {
    if (A < a) {
      a = A;
    }
    ArrayList<A> list;
    list = new ArrayList<A>();

    if (A < a) { }

    if (A < a && b < a) {
      b = a;
    }
  }
}\
`
    );

    expect(tokens[2][4]).toEqual({value: '<<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.operator.bitwise']});
    expect(tokens[6][1]).toEqual({value: 'if', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control']});
    expect(tokens[6][5]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.operator.comparison']});
    expect(tokens[9][1]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[9][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.angle']});
    expect(tokens[9][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[9][4]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.angle']});
    expect(tokens[10][4]).toEqual({value: 'new', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control']});
    expect(tokens[10][6]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[10][7]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.angle']});
    expect(tokens[10][8]).toEqual({value: 'A', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[10][9]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.angle']});
    expect(tokens[12][1]).toEqual({value: 'if', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control']});
    expect(tokens[12][5]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.operator.comparison']});
    expect(tokens[14][1]).toEqual({value: 'if', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control']});
    expect(tokens[14][5]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.operator.comparison']});
    expect(tokens[14][7]).toEqual({value: '&&', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.operator.logical']});
    expect(tokens[14][9]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.operator.comparison']});
});

  it('tokenizes types and class names with underscore', function() {
    const tokens = tokenizeLines(`\
class _Class {
  static _String var1;
  static _abc._abc._Class var2;
  static _abc._abc._Generic<_String> var3;
}\
`
    );

    expect(tokens[0][2]).toEqual({value: '_Class', scopes: ['source.java', 'entity.name.type.class']});
    expect(tokens[1][3]).toEqual({value: '_String', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[2][3]).toEqual({value: '_abc', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[2][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.period']});
    expect(tokens[2][5]).toEqual({value: '_abc', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[2][6]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.period']});
    expect(tokens[2][7]).toEqual({value: '_Class', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[3][3]).toEqual({value: '_abc', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[3][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.period']});
    expect(tokens[3][5]).toEqual({value: '_abc', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[3][6]).toEqual({value: '.', scopes: ['source.java', 'meta.class.body', 'punctuation.separator.period']});
    expect(tokens[3][7]).toEqual({value: '_Generic', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[3][8]).toEqual({value: '<', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
    expect(tokens[3][9]).toEqual({value: '_String', scopes: ['source.java', 'meta.class.body', 'storage.type']});
    expect(tokens[3][10]).toEqual({value: '>', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.angle']});
});

  it('tokenizes classes', function() {
    let tokens = tokenizeLine('public abstract static class A { }');

    expect(tokens[0]).toEqual({value: 'public', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[2]).toEqual({value: 'abstract', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[4]).toEqual({value: 'static', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[6]).toEqual({value: 'class', scopes: ['source.java', 'keyword.other.class']});
    expect(tokens[8]).toEqual({value: 'A', scopes: ['source.java', 'entity.name.type.class']});
    expect(tokens[10]).toEqual({value: '{', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.curly']});
    expect(tokens[12]).toEqual({value: '}', scopes: ['source.java', 'meta.class.body', 'punctuation.bracket.curly']});

    tokens = tokenizeLine('class A extends B implements C, D { }');

    expect(tokens[0]).toEqual({value: 'class', scopes: ['source.java', 'keyword.other.class']});
    expect(tokens[2]).toEqual({value: 'A', scopes: ['source.java', 'entity.name.type.class']});
    expect(tokens[4]).toEqual({value: 'extends', scopes: ['source.java', 'storage.modifier.extends']});
    expect(tokens[6]).toEqual({value: 'B', scopes: ['source.java', 'storage.type']});
    expect(tokens[8]).toEqual({value: 'implements', scopes: ['source.java', 'storage.modifier.implements']});
    expect(tokens[10]).toEqual({value: 'C', scopes: ['source.java', 'storage.type']});
    expect(tokens[13]).toEqual({value: 'D', scopes: ['source.java', 'storage.type']});
});

  it('tokenizes interfaces', function() {
    const tokens = tokenizeLine('public interface A { }');

    expect(tokens[0]).toEqual({value: 'public', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[2]).toEqual({value: 'interface', scopes: ['source.java', 'keyword.other.interface']});
    expect(tokens[4]).toEqual({value: 'A', scopes: ['source.java', 'entity.name.type.interface']});
    expect(tokens[6]).toEqual({value: '{', scopes: ['source.java', 'meta.interface.body', 'punctuation.bracket.curly']});
    expect(tokens[8]).toEqual({value: '}', scopes: ['source.java', 'meta.interface.body', 'punctuation.bracket.curly']});
});

  it('tokenizes annotated interfaces', function() {
    const tokens = tokenizeLines(`\
public @interface A {
  String method() default "abc";
}\
`
    );

    expect(tokens[0][0]).toEqual({value: 'public', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[0][2]).toEqual({value: '@interface', scopes: ['source.java', 'keyword.other.interface.annotated']});
    expect(tokens[0][4]).toEqual({value: 'A', scopes: ['source.java', 'entity.name.type.interface.annotated']});
    expect(tokens[0][6]).toEqual({value: '{', scopes: ['source.java', 'meta.interface.annotated.body', 'punctuation.bracket.curly']});
    expect(tokens[1][1]).toEqual({value: 'String', scopes: ['source.java', 'meta.interface.annotated.body', 'storage.type']});
    expect(tokens[1][3]).toEqual({value: 'method', scopes: ['source.java', 'meta.interface.annotated.body', 'entity.name.function']});
    expect(tokens[1][7]).toEqual({value: 'default', scopes: ['source.java', 'meta.interface.annotated.body', 'keyword.control']});
    expect(tokens[1][9]).toEqual({value: '\"abc\"', scopes: ['source.java', 'meta.interface.annotated.body', 'string.quoted.double']});
    expect(tokens[2][0]).toEqual({value: '}', scopes: ['source.java', 'meta.interface.annotated.body', 'punctuation.bracket.curly']});
});

  it('tokenizes enums', function() {
    const tokens = tokenizeLines(`\
public enum A implements B {
  CONSTANT1,
  CONSTANT2,
  Constant3,
  constant4
}\
`
    );

    expect(tokens[0][0]).toEqual({value: 'public', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[0][2]).toEqual({value: 'enum', scopes: ['source.java', 'keyword.other.enum']});
    expect(tokens[0][4]).toEqual({value: 'A', scopes: ['source.java', 'entity.name.type.enum']});
    expect(tokens[0][6]).toEqual({value: 'implements', scopes: ['source.java', 'storage.modifier.implements']});
    expect(tokens[0][8]).toEqual({value: 'B', scopes: ['source.java', 'storage.type']});
    expect(tokens[0][10]).toEqual({value: '{', scopes: ['source.java', 'meta.enum.body', 'punctuation.bracket.curly']});
    expect(tokens[1][1]).toEqual({value: 'CONSTANT1', scopes: ['source.java', 'meta.enum.body', 'constant.other.enum']});
    expect(tokens[2][1]).toEqual({value: 'CONSTANT2', scopes: ['source.java', 'meta.enum.body', 'constant.other.enum']});
    expect(tokens[3][1]).toEqual({value: 'Constant3', scopes: ['source.java', 'meta.enum.body', 'constant.other.enum']});
    expect(tokens[4][1]).toEqual({value: 'constant4', scopes: ['source.java', 'meta.enum.body', 'constant.other.enum']});
    expect(tokens[5][0]).toEqual({value: '}', scopes: ['source.java', 'meta.enum.body', 'punctuation.bracket.curly']});
});

  it('tokenizes enums with modifiers', function() {
    const tokens = tokenizeLines(`\
public enum Test { }
private enum Test { }
protected enum Test { }\
`
    );

    expect(tokens[0][0]).toEqual({value: 'public', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[0][2]).toEqual({value: 'enum', scopes: ['source.java', 'keyword.other.enum']});
    expect(tokens[0][4]).toEqual({value: 'Test', scopes: ['source.java', 'entity.name.type.enum']});
    expect(tokens[1][0]).toEqual({value: 'private', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[1][2]).toEqual({value: 'enum', scopes: ['source.java', 'keyword.other.enum']});
    expect(tokens[1][4]).toEqual({value: 'Test', scopes: ['source.java', 'entity.name.type.enum']});
    expect(tokens[2][0]).toEqual({value: 'protected', scopes: ['source.java', 'storage.modifier']});
    expect(tokens[2][2]).toEqual({value: 'enum', scopes: ['source.java', 'keyword.other.enum']});
    expect(tokens[2][4]).toEqual({value: 'Test', scopes: ['source.java', 'entity.name.type.enum']});
});

  it('tokenizes annotations', function() {
    const tokens = tokenizeLines(`\
@Annotation1
@Annotation2()
@Annotation3("value")
@Annotation4(key = "value")
@Test.Annotation5
@Test.Annotation6()
class A { }\
`
    );

    expect(tokens[0][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.definition.annotation']});
    expect(tokens[0][1]).toEqual({value: 'Annotation1', scopes: ['source.java', 'meta.declaration.annotation', 'storage.type.annotation']});

    expect(tokens[1][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.definition.annotation']});
    expect(tokens[1][1]).toEqual({value: 'Annotation2', scopes: ['source.java', 'meta.declaration.annotation', 'storage.type.annotation']});
    expect(tokens[1][2]).toEqual({value: '(', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.bracket.round']});
    expect(tokens[1][3]).toEqual({value: ')', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.bracket.round']});

    expect(tokens[2][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.definition.annotation']});
    expect(tokens[2][1]).toEqual({value: 'Annotation3', scopes: ['source.java', 'meta.declaration.annotation', 'storage.type.annotation']});
    expect(tokens[2][2]).toEqual({value: '(', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.bracket.round']});
    expect(tokens[2][3]).toEqual({value: '\"value\"', scopes: ['source.java', 'meta.declaration.annotation', 'string.quoted.double']});
    expect(tokens[2][4]).toEqual({value: ')', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.bracket.round']});

    expect(tokens[3][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.definition.annotation']});
    expect(tokens[3][1]).toEqual({value: 'Annotation4', scopes: ['source.java', 'meta.declaration.annotation', 'storage.type.annotation']});
    expect(tokens[3][2]).toEqual({value: '(', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.bracket.round']});
    expect(tokens[3][3]).toEqual({value: 'key', scopes: ['source.java', 'meta.declaration.annotation', 'variable.other.annotation.element']});
    expect(tokens[3][5]).toEqual({value: '=', scopes: ['source.java', 'meta.declaration.annotation', 'keyword.operator.assignment']});
    expect(tokens[3][7]).toEqual({value: '\"value\"', scopes: ['source.java', 'meta.declaration.annotation', 'string.quoted.double']});
    expect(tokens[3][8]).toEqual({value: ')', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.bracket.round']});

    expect(tokens[4][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.definition.annotation']});
    expect(tokens[4][1]).toEqual({value: 'Test', scopes: ['source.java', 'meta.declaration.annotation', 'storage.type.annotation']});
    expect(tokens[4][2]).toEqual({value: '.', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.separator.period']});
    expect(tokens[4][3]).toEqual({value: 'Annotation5', scopes: ['source.java', 'meta.declaration.annotation', 'storage.type.annotation']});

    expect(tokens[5][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.definition.annotation']});
    expect(tokens[5][1]).toEqual({value: 'Test', scopes: ['source.java', 'meta.declaration.annotation', 'storage.type.annotation']});
    expect(tokens[5][2]).toEqual({value: '.', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.separator.period']});
    expect(tokens[5][3]).toEqual({value: 'Annotation6', scopes: ['source.java', 'meta.declaration.annotation', 'storage.type.annotation']});
    expect(tokens[5][4]).toEqual({value: '(', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.bracket.round']});
    expect(tokens[5][5]).toEqual({value: ')', scopes: ['source.java', 'meta.declaration.annotation', 'punctuation.bracket.round']});
});

  it('tokenizes constructor declarations', function() {
    const tokens = tokenizeLines(`\
class A {
  public A() throws Exception {
    super();
    this.a = 1;
  }
}\
`
    );

    expect(tokens[1][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.modifier']});
    expect(tokens[1][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'entity.name.function']});
    expect(tokens[1][4]).toEqual({value: '(', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'punctuation.bracket.round']});
    expect(tokens[1][5]).toEqual({value: ')', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'punctuation.bracket.round']});
    expect(tokens[1][7]).toEqual({value: 'throws', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.modifier.throws']});
    expect(tokens[1][9]).toEqual({value: 'Exception', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'storage.type']});
    expect(tokens[1][11]).toEqual({value: '{', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'meta.constructor.body', 'punctuation.bracket.curly']});
    expect(tokens[2][1]).toEqual({value: 'super', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'meta.constructor.body', 'variable.language']});
    expect(tokens[2][2]).toEqual({value: '(', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'meta.constructor.body', 'punctuation.bracket.round']});
    expect(tokens[2][3]).toEqual({value: ')', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'meta.constructor.body', 'punctuation.bracket.round']});
    expect(tokens[2][4]).toEqual({value: ';', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'meta.constructor.body', 'punctuation.terminator.statement']});
    expect(tokens[3][1]).toEqual({value: 'this', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'meta.constructor.body', 'variable.language']});
    expect(tokens[4][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.body', 'meta.constructor', 'meta.constructor.body', 'punctuation.bracket.curly']});
});

  it('tokenizes method declarations', function() {
    const tokens = tokenizeLines(`\
class A {
  public int[] func(int size) throws Exception {
    return null;
  }

  public int FUNC() {
    return 1;
  }

  public int func2(final int finalScore, final int scorefinal) {
    return finalScore;
  }
}\
`
    );

    expect(tokens[1][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier']});
    expect(tokens[1][3]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[1][4]).toEqual({value: '[', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.square']});
    expect(tokens[1][5]).toEqual({value: ']', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.square']});
    expect(tokens[1][7]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'entity.name.function']});
    expect(tokens[1][8]).toEqual({value: '(', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.round']});
    expect(tokens[1][9]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[1][11]).toEqual({value: ')', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.round']});
    expect(tokens[1][13]).toEqual({value: 'throws', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier.throws']});
    expect(tokens[1][15]).toEqual({value: 'Exception', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[1][17]).toEqual({value: '{', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.curly']});
    expect(tokens[2][1]).toEqual({value: 'return', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control']});
    expect(tokens[2][3]).toEqual({value: 'null', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'constant.language.null']});
    expect(tokens[2][4]).toEqual({value: ';', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.terminator.statement']});
    expect(tokens[3][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.curly']});

    expect(tokens[5][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier']});
    expect(tokens[5][3]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[5][5]).toEqual({value: 'FUNC', scopes: ['source.java', 'meta.class.body', 'meta.method', 'entity.name.function']});
    expect(tokens[5][6]).toEqual({value: '(', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.round']});
    expect(tokens[5][7]).toEqual({value: ')', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.round']});
    expect(tokens[5][9]).toEqual({value: '{', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.curly']});
    expect(tokens[7][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.curly']});

    expect(tokens[9][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier']});
    expect(tokens[9][3]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][5]).toEqual({value: 'func2', scopes: ['source.java', 'meta.class.body', 'meta.method', 'entity.name.function']});
    expect(tokens[9][6]).toEqual({value: '(', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.round']});
    expect(tokens[9][7]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier']});
    expect(tokens[9][9]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][11]).toEqual({value: ',', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.separator.delimiter']});
    expect(tokens[9][13]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.modifier']});
    expect(tokens[9][15]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.body', 'meta.method', 'storage.type']});
    expect(tokens[9][17]).toEqual({value: ')', scopes: ['source.java', 'meta.class.body', 'meta.method', 'punctuation.bracket.round']});
    expect(tokens[9][19]).toEqual({value: '{', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.curly']});
    expect(tokens[11][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'punctuation.bracket.curly']});
});

  it('tokenizes method invocations', function() {
    const tokens = tokenizeLines(`\
class A {
  void func() {
    func("arg");
    obj.func("arg");
    obj.prop1.prop2.func();
    obj.prop1.func().prop2.func();
    super.func("arg");
    super.prop1.func("arg");
    this.func("arg");
    this.prop1.func("arg");
    this.prop1.prop2.func("arg");
    this.prop1.func().func("arg");
    property.super.func("arg");
  }
}\
`
    );

    expect(tokens[2][1]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[3][3]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[4][7]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[5][5]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[5][11]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[6][3]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[7][5]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[8][3]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[9][5]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[10][7]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[11][5]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[11][9]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[12][5]).toEqual({value: 'func', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
});

  it('tokenizes method references', function() {
    const tokens = tokenizeLines(`\
class A {
  void func() {
    Arrays.sort(rosterAsArray, Person::compareByAge);
    call(Person::new);
    call(java.util.ArrayList<String>::new);
    call(com.test.Util::create);
    call(super::new);
    call(testObject::method);
  }
}\
`
    );

    expect(tokens[2][8]).toEqual({value: 'Person', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[2][9]).toEqual({value: '::', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control.method']});
    expect(tokens[2][10]).toEqual({value: 'compareByAge', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[3][3]).toEqual({value: 'Person', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[3][4]).toEqual({value: '::', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control.method']});
    expect(tokens[3][5]).toEqual({value: 'new', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    expect(tokens[4][3]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[4][5]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[4][7]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[4][9]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[4][11]).toEqual({value: '::', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control.method']});
    expect(tokens[4][12]).toEqual({value: 'new', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    // We cannot parse "com.test.Util" correctly in this example
    // TODO: fix parsing of "com.test.Util::create"
    expect(tokens[5][7]).toEqual({value: 'Util', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[5][8]).toEqual({value: '::', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control.method']});
    expect(tokens[5][9]).toEqual({value: 'create', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});

    expect(tokens[6][3]).toEqual({value: 'super', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'variable.language']});
    expect(tokens[6][4]).toEqual({value: '::', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control.method']});
    expect(tokens[6][5]).toEqual({value: 'new', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
    // testObject is not scoped as "storage.type"
    expect(tokens[7][3]).toEqual({value: 'testObject', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body']});
    expect(tokens[7][4]).toEqual({value: '::', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'keyword.control.method']});
    expect(tokens[7][5]).toEqual({value: 'method', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
});

  it('tokenizes field access', function() {
    const tokens = tokenizeLines(`\
class A {
  void func() {
    var1 = Test.class;
    var2 = com.test.Test.class;
    var5 = Test.staticProperty;
    System.out.println("test");
    Arrays.sort(array);
  }
}\
`
    );

    expect(tokens[2][4]).toEqual({value: 'Test', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    // TODO: it would be good to fix the scope for "com.test" component of the class name
    expect(tokens[3][3]).toEqual({value: ' com', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body']});
    expect(tokens[3][5]).toEqual({value: 'test', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body']});
    expect(tokens[3][7]).toEqual({value: 'Test', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[4][4]).toEqual({value: 'Test', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    expect(tokens[5][1]).toEqual({value: 'System', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'storage.type']});
    // TODO: [6][1] Expects last value of scopes to be 'storage.type' but instead is 'entity.name.function'
    expect(tokens[6][1]).toEqual({value: 'Arrays', scopes: ['source.java', 'meta.class.body', 'meta.method', 'meta.method.body', 'entity.name.function']});
});
});
