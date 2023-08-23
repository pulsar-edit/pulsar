
describe('Java grammar', function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);

    waitsForPromise(() => atom.packages.activatePackage('language-java'));

    runs(() => grammar = atom.grammars.grammarForScopeName('source.java'));
  });

  it('parses the grammar', function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe('source.java');
  });

  it('tokenizes this with `.this` class', function() {
    const {tokens} = grammar.tokenizeLine('this.x');

    expect(tokens[0]).toEqual({value: 'this', scopes: ['source.java', 'variable.language.this.java']});
});

  it('tokenizes braces', function() {
    let {tokens} = grammar.tokenizeLine('(3 + 5) + a[b]');

    expect(tokens[0]).toEqual({value: '(', scopes: ['source.java', 'punctuation.bracket.round.java']});
    expect(tokens[6]).toEqual({value: ')', scopes: ['source.java', 'punctuation.bracket.round.java']});
    expect(tokens[10]).toEqual({value: '[', scopes: ['source.java', 'punctuation.bracket.square.java']});
    expect(tokens[12]).toEqual({value: ']', scopes: ['source.java', 'punctuation.bracket.square.java']});

    ({tokens} = grammar.tokenizeLine('a(b)'));

    expect(tokens[1]).toEqual({value: '(', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[3]).toEqual({value: ')', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});

    const lines = grammar.tokenizeLines(`\
class A<String>
{
  public int[][] something(String[][] hello)
  {
  }
}\
`
    );

    expect(lines[0][3]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'punctuation.bracket.angle.java']});
    expect(lines[0][5]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'punctuation.bracket.angle.java']});
    expect(lines[1][0]).toEqual({value: '{', scopes: ['source.java', 'meta.class.java', 'punctuation.section.class.begin.bracket.curly.java']});
    expect(lines[2][4]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.bracket.square.java']});
    expect(lines[2][5]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.bracket.square.java']});
    expect(lines[2][6]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.bracket.square.java']});
    expect(lines[2][7]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.bracket.square.java']});
    expect(lines[2][8]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java']});
    expect(lines[2][10]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[2][12]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.bracket.square.java']});
    expect(lines[2][13]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.bracket.square.java']});
    expect(lines[2][14]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.bracket.square.java']});
    expect(lines[2][15]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.bracket.square.java']});
    expect(lines[2][18]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(lines[3][1]).toEqual({value: '{', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'punctuation.section.method.begin.bracket.curly.java']});
    expect(lines[4][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'punctuation.section.method.end.bracket.curly.java']});
    expect(lines[5][0]).toEqual({value: '}', scopes: ['source.java', 'meta.class.java', 'punctuation.section.class.end.bracket.curly.java']});
});

  it('tokenizes punctuation', function() {
    let {tokens} = grammar.tokenizeLine('int a, b, c;');

    expect(tokens[3]).toEqual({value: ',', scopes: ['source.java', 'meta.definition.variable.java', 'punctuation.separator.delimiter.java']});
    expect(tokens[6]).toEqual({value: ',', scopes: ['source.java', 'meta.definition.variable.java', 'punctuation.separator.delimiter.java']});
    expect(tokens[9]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('a.b(1, 2, c);'));

    expect(tokens[1]).toEqual({value: '.', scopes: ['source.java', 'meta.method-call.java', 'punctuation.separator.period.java']});
    expect(tokens[5]).toEqual({value: ',', scopes: ['source.java', 'meta.method-call.java', 'punctuation.separator.delimiter.java']});
    expect(tokens[8]).toEqual({value: ',', scopes: ['source.java', 'meta.method-call.java', 'punctuation.separator.delimiter.java']});
    expect(tokens[11]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('a . b'));

    expect(tokens[2]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period.java']});

    ({tokens} = grammar.tokenizeLine('class A implements B, C'));

    expect(tokens[7]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.definition.class.implemented.interfaces.java', 'punctuation.separator.delimiter.java']});
});

  it('tokenizes the `package` keyword', function() {
    let {tokens} = grammar.tokenizeLine('package java.util.example;');

    expect(tokens[0]).toEqual({value: 'package', scopes: ['source.java', 'meta.package.java', 'keyword.other.package.java']});
    expect(tokens[1]).toEqual({value: ' ', scopes: ['source.java', 'meta.package.java']});
    expect(tokens[2]).toEqual({value: 'java', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java']});
    expect(tokens[3]).toEqual({value: '.', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java', 'punctuation.separator.java']});
    expect(tokens[4]).toEqual({value: 'util', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java']});
    expect(tokens[7]).toEqual({value: ';', scopes: ['source.java', 'meta.package.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('package java.Hi;'));

    expect(tokens[4]).toEqual({value: 'H', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java', 'invalid.deprecated.package_name_not_lowercase.java']});

    ({tokens} = grammar.tokenizeLine('package java.3a;'));

    expect(tokens[4]).toEqual({value: '3', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('package java.-hi;'));

    expect(tokens[4]).toEqual({value: '-', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('package java._;'));

    expect(tokens[4]).toEqual({value: '_', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('package java.__;'));

    expect(tokens[4]).toEqual({value: '__', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java']});

    ({tokens} = grammar.tokenizeLine('package java.int;'));

    expect(tokens[4]).toEqual({value: 'int', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('package java.interesting;'));

    expect(tokens[4]).toEqual({value: 'interesting', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java']});

    ({tokens} = grammar.tokenizeLine('package java..hi;'));

    expect(tokens[4]).toEqual({value: '.', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('package java.;'));

    expect(tokens[3]).toEqual({value: '.', scopes: ['source.java', 'meta.package.java', 'storage.modifier.package.java', 'invalid.illegal.character_not_allowed_here.java']});
});

  it('tokenizes the `import` keyword', function() {
    let {tokens} = grammar.tokenizeLine('import java.util.Example;');

    expect(tokens[0]).toEqual({value: 'import', scopes: ['source.java', 'meta.import.java', 'keyword.other.import.java']});
    expect(tokens[1]).toEqual({value: ' ', scopes: ['source.java', 'meta.import.java']});
    expect(tokens[2]).toEqual({value: 'java', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java']});
    expect(tokens[3]).toEqual({value: '.', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'punctuation.separator.java']});
    expect(tokens[4]).toEqual({value: 'util', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java']});
    expect(tokens[7]).toEqual({value: ';', scopes: ['source.java', 'meta.import.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('import java.util.*;'));

    expect(tokens[6]).toEqual({value: '*', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'variable.language.wildcard.java']});

    ({tokens} = grammar.tokenizeLine('import static java.lang.Math.PI;'));

    expect(tokens[2]).toEqual({value: 'static', scopes: ['source.java', 'meta.import.java', 'storage.modifier.java']});

    ({tokens} = grammar.tokenizeLine('import java.3a;'));

    expect(tokens[4]).toEqual({value: '3', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('import java.-hi;'));

    expect(tokens[4]).toEqual({value: '-', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('import java._;'));

    expect(tokens[4]).toEqual({value: '_', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('import java.__;'));

    expect(tokens[4]).toEqual({value: '__', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java']});

    ({tokens} = grammar.tokenizeLine('import java.**;'));

    expect(tokens[5]).toEqual({value: '*', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('import java.a*;'));

    expect(tokens[5]).toEqual({value: '*', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('import java.int;'));

    expect(tokens[4]).toEqual({value: 'int', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('import java.interesting;'));

    expect(tokens[4]).toEqual({value: 'interesting', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java']});

    ({tokens} = grammar.tokenizeLine('import java..hi;'));

    expect(tokens[4]).toEqual({value: '.', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'invalid.illegal.character_not_allowed_here.java']});

    ({tokens} = grammar.tokenizeLine('import java.;'));

    expect(tokens[3]).toEqual({value: '.', scopes: ['source.java', 'meta.import.java', 'storage.modifier.import.java', 'invalid.illegal.character_not_allowed_here.java']});
});

  it('tokenizes reserved keywords', function() {
    let {tokens} = grammar.tokenizeLine('const value');

    expect(tokens[0]).toEqual({value: 'const', scopes: ['source.java', 'keyword.reserved.java']});

    ({tokens} = grammar.tokenizeLine('int a = 1; goto;'));

    expect(tokens[9]).toEqual({value: 'goto', scopes: ['source.java', 'keyword.reserved.java']});
});

  it('tokenizes module keywords', function() {
    const lines = grammar.tokenizeLines(`\
module Provider {
  requires ServiceInterface;
  provides javax0.serviceinterface.ServiceInterface with javax0.serviceprovider.Provider;
}\
`
    );

    expect(lines[0][0]).toEqual({value: 'module', scopes: ['source.java', 'meta.module.java', 'storage.modifier.java']});
    expect(lines[0][2]).toEqual({value: 'Provider', scopes: ['source.java', 'meta.module.java', 'entity.name.type.module.java']});
    expect(lines[0][4]).toEqual({value: '{', scopes: ['source.java', 'meta.module.java', 'punctuation.section.module.begin.bracket.curly.java']});
    expect(lines[1][1]).toEqual({value: 'requires', scopes: ['source.java', 'meta.module.java', 'meta.module.body.java', 'keyword.module.java']});
    expect(lines[2][1]).toEqual({value: 'provides', scopes: ['source.java', 'meta.module.java', 'meta.module.body.java', 'keyword.module.java']});
    expect(lines[2][3]).toEqual({value: 'with', scopes: ['source.java', 'meta.module.java', 'meta.module.body.java', 'keyword.module.java']});
    expect(lines[3][0]).toEqual({value: '}', scopes: ['source.java', 'meta.module.java', 'punctuation.section.module.end.bracket.curly.java']});
});

  it('tokenizes comments inside module', function() {
    const lines = grammar.tokenizeLines(`\
module com.foo.bar {
  // comments
  /* comments */
  /** javadoc */
  requires java.base;
}\
`
    );

    expect(lines[0][0]).toEqual({value: 'module', scopes: ['source.java', 'meta.module.java', 'storage.modifier.java']});
    expect(lines[0][4]).toEqual({value: '{', scopes: ['source.java', 'meta.module.java', 'punctuation.section.module.begin.bracket.curly.java']});
    expect(lines[1][2]).toEqual({value: ' comments', scopes: ['source.java', 'meta.module.java', 'meta.module.body.java', 'comment.line.double-slash.java']});
    expect(lines[2][2]).toEqual({value: ' comments ', scopes: ['source.java', 'meta.module.java', 'meta.module.body.java', 'comment.block.java']});
    expect(lines[3][2]).toEqual({value: ' javadoc ', scopes: ['source.java', 'meta.module.java', 'meta.module.body.java', 'comment.block.javadoc.java']});
    expect(lines[4][1]).toEqual({value: 'requires', scopes: ['source.java', 'meta.module.java', 'meta.module.body.java', 'keyword.module.java']});
    expect(lines[5][0]).toEqual({value: '}', scopes: ['source.java', 'meta.module.java', 'punctuation.section.module.end.bracket.curly.java']});
});

  it('tokenizes classes', function() {
    const lines = grammar.tokenizeLines(`\
class Thing {
  int x;
}

class classA {
  int a;
}

class Aclass {
  int b;
}

public static void main(String[] args) {
  Testclass test1 = null;
  TestClass test2 = null;
}

class A$B {
  int a;
}\
`
    );

    expect(lines[0][0]).toEqual({value: 'class', scopes: ['source.java', 'meta.class.java', 'meta.class.identifier.java', 'storage.modifier.java']});
    expect(lines[0][2]).toEqual({value: 'Thing', scopes: ['source.java', 'meta.class.java', 'meta.class.identifier.java', 'entity.name.type.class.java']});
    expect(lines[4][0]).toEqual({value: 'class', scopes: ['source.java', 'meta.class.java', 'meta.class.identifier.java', 'storage.modifier.java']});
    expect(lines[4][2]).toEqual({value: 'classA', scopes: ['source.java', 'meta.class.java', 'meta.class.identifier.java', 'entity.name.type.class.java']});
    expect(lines[8][0]).toEqual({value: 'class', scopes: ['source.java', 'meta.class.java', 'meta.class.identifier.java', 'storage.modifier.java']});
    expect(lines[8][2]).toEqual({value: 'Aclass', scopes: ['source.java', 'meta.class.java', 'meta.class.identifier.java', 'entity.name.type.class.java']});
    expect(lines[13][1]).toEqual({value: 'Testclass', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[14][1]).toEqual({value: 'TestClass', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[17][0]).toEqual({value: 'class', scopes: ['source.java', 'meta.class.java', 'meta.class.identifier.java', 'storage.modifier.java']});
    expect(lines[17][2]).toEqual({value: 'A$B', scopes: ['source.java', 'meta.class.java', 'meta.class.identifier.java', 'entity.name.type.class.java']});
});

  it('tokenizes enums', function() {
    const lines = grammar.tokenizeLines(`\
enum Letters {
  /* Comment about A */
  A,

  // Comment about B
  B,

  /** Javadoc comment about C */
  C
}\
`
    );

    const comment = ['source.java', 'meta.enum.java', 'comment.block.java'];
    const commentLine = ['source.java', 'meta.enum.java', 'comment.line.double-slash.java'];
    const commentJavadoc = ['source.java', 'meta.enum.java', 'comment.block.javadoc.java'];
    const commentDefinition = comment.concat('punctuation.definition.comment.java');
    const commentLineDefinition = commentLine.concat('punctuation.definition.comment.java');
    const commentJavadocDefinition = commentJavadoc.concat('punctuation.definition.comment.java');

    expect(lines[0][0]).toEqual({value: 'enum', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[0][2]).toEqual({value: 'Letters', scopes: ['source.java', 'meta.enum.java', 'entity.name.type.enum.java']});
    expect(lines[0][4]).toEqual({value: '{', scopes: ['source.java', 'meta.enum.java', 'punctuation.section.enum.begin.bracket.curly.java']});
    expect(lines[1][1]).toEqual({value: '/*', scopes: commentDefinition});
    expect(lines[1][2]).toEqual({value: ' Comment about A ', scopes: comment});
    expect(lines[1][3]).toEqual({value: '*/', scopes: commentDefinition});
    expect(lines[2][1]).toEqual({value: 'A', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[4][1]).toEqual({value: '//', scopes: commentLineDefinition});
    expect(lines[4][2]).toEqual({value: ' Comment about B', scopes: commentLine});
    expect(lines[5][1]).toEqual({value: 'B', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[7][1]).toEqual({value: '/**', scopes: commentJavadocDefinition});
    expect(lines[7][2]).toEqual({value: ' Javadoc comment about C ', scopes: commentJavadoc});
    expect(lines[8][1]).toEqual({value: 'C', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[9][0]).toEqual({value: '}', scopes: ['source.java', 'meta.enum.java', 'punctuation.section.enum.end.bracket.curly.java']});
});

  it('tokenizes enums with class body', function() {
    const lines = grammar.tokenizeLines(`\
enum Colours {
  RED ("red"),
  GREEN (1000L),
  BLUE (123);

  private String v;

  Colours(String v) {
    this.v = v;
  }

  Colours(long v) {
    this.v = "" + v;
  }

  Colours(int v) {
    this.v = "" + v;
  }

  public String func() {
    return "RGB";
  }
}\
`
    );

    expect(lines[0][0]).toEqual({value: 'enum', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[0][2]).toEqual({value: 'Colours', scopes: ['source.java', 'meta.enum.java', 'entity.name.type.enum.java']});
    expect(lines[0][4]).toEqual({value: '{', scopes: ['source.java', 'meta.enum.java', 'punctuation.section.enum.begin.bracket.curly.java']});

    expect(lines[1][1]).toEqual({value: 'RED', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[1][3]).toEqual({value: '(', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});
    expect(lines[1][5]).toEqual({value: 'red', scopes: ['source.java', 'meta.enum.java', 'string.quoted.double.java']});
    expect(lines[1][7]).toEqual({value: ')', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});

    expect(lines[2][1]).toEqual({value: 'GREEN', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[2][3]).toEqual({value: '(', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});
    expect(lines[2][4]).toEqual({value: '1000L', scopes: ['source.java', 'meta.enum.java', 'constant.numeric.decimal.java']});
    expect(lines[2][5]).toEqual({value: ')', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});

    expect(lines[3][1]).toEqual({value: 'BLUE', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[3][3]).toEqual({value: '(', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});
    expect(lines[3][4]).toEqual({value: '123', scopes: ['source.java', 'meta.enum.java', 'constant.numeric.decimal.java']});
    expect(lines[3][5]).toEqual({value: ')', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});

    expect(lines[19][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'storage.modifier.java']});
    expect(lines[19][3]).toEqual({value: 'String', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.java']});
    expect(lines[19][5]).toEqual({value: 'func', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[22][0]).toEqual({value: '}', scopes: ['source.java', 'meta.enum.java', 'punctuation.section.enum.end.bracket.curly.java']});
});

  it('tokenizes enums with modifiers', function() {
    const lines = grammar.tokenizeLines(`\
public enum Test {
}

private enum Test {
}

protected enum Test {
}

unknown enum Test {
}\
`
    );

    expect(lines[0][0]).toEqual({value: 'public', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[0][2]).toEqual({value: 'enum', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[3][0]).toEqual({value: 'private', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[3][2]).toEqual({value: 'enum', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[6][0]).toEqual({value: 'protected', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[6][2]).toEqual({value: 'enum', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[9][0]).toEqual({value: 'unknown ', scopes: ['source.java', 'meta.enum.java']});
    expect(lines[9][1]).toEqual({value: 'enum', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
});

  it('tokenizes enums within a class', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  public enum Colours {
    RED,
    GREEN,
    BLUE
  }
}\
`
    );

    expect(lines[1][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[1][3]).toEqual({value: 'enum', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java', 'storage.modifier.java']});
    expect(lines[1][5]).toEqual({value: 'Colours', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java', 'entity.name.type.enum.java']});
    expect(lines[1][7]).toEqual({value: '{', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java', 'punctuation.section.enum.begin.bracket.curly.java']});
    expect(lines[2][1]).toEqual({value: 'RED', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[3][1]).toEqual({value: 'GREEN', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[4][1]).toEqual({value: 'BLUE', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[5][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java', 'punctuation.section.enum.end.bracket.curly.java']});
});

  it('tokenizes enums with method overrides', function() {
    const lines = grammar.tokenizeLines(`\
enum TYPES {
  TYPE_A {
    @Override
    int func() {
      return 1;
    }
  },
  TYPE_B {
    @Override
    int func() {
      return 2;
    }
  },
  TYPE_DEFAULT;

  int func() {
    return 0;
  }
}\
`
    );

    expect(lines[1][1]).toEqual({value: 'TYPE_A', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[1][3]).toEqual({value: '{', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.curly.java']});
    expect(lines[2][2]).toEqual({value: 'Override', scopes: ['source.java', 'meta.enum.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});
    expect(lines[3][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.primitive.java']});
    expect(lines[3][3]).toEqual({value: 'func', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[6][1]).toEqual({value: '}', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.curly.java']});

    expect(lines[7][1]).toEqual({value: 'TYPE_B', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[7][3]).toEqual({value: '{', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.curly.java']});
    expect(lines[8][2]).toEqual({value: 'Override', scopes: ['source.java', 'meta.enum.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});
    expect(lines[9][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.primitive.java']});
    expect(lines[9][3]).toEqual({value: 'func', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[12][1]).toEqual({value: '}', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.curly.java']});

    expect(lines[13][1]).toEqual({value: 'TYPE_DEFAULT', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});

    expect(lines[15][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.primitive.java']});
    expect(lines[15][3]).toEqual({value: 'func', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
});

  it('tokenizes enums with method overrides and constructor', function() {
    const lines = grammar.tokenizeLines(`\
enum TYPES {
  TYPE_A("1", 1) {
    @Override
    int func() {
      return 1;
    }
  },
  TYPE_B("2", 2)
  {
    @Override
    int func() {
      return 2;
    }
  },
  TYPE_DEFAULT("3", 3);

  String label;
  int value;

  TYPES(String label, int value) {
    this.label = label;
    this.value = value;
  }

  int func() {
    return 0;
  }
}\
`
    );

    expect(lines[1][1]).toEqual({value: 'TYPE_A', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[1][2]).toEqual({value: '(', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});
    expect(lines[1][3]).toEqual({value: '"', scopes: ['source.java', 'meta.enum.java', 'string.quoted.double.java', 'punctuation.definition.string.begin.java']});
    expect(lines[1][4]).toEqual({value: '1', scopes: ['source.java', 'meta.enum.java', 'string.quoted.double.java']});
    expect(lines[1][5]).toEqual({value: '"', scopes: ['source.java', 'meta.enum.java', 'string.quoted.double.java', 'punctuation.definition.string.end.java']});
    expect(lines[1][6]).toEqual({value: ',', scopes: ['source.java', 'meta.enum.java', 'punctuation.separator.delimiter.java']});
    expect(lines[1][8]).toEqual({value: '1', scopes: ['source.java', 'meta.enum.java', 'constant.numeric.decimal.java']});
    expect(lines[1][9]).toEqual({value: ')', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});
    expect(lines[1][11]).toEqual({value: '{', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.curly.java']});
    expect(lines[2][2]).toEqual({value: 'Override', scopes: ['source.java', 'meta.enum.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});
    expect(lines[3][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.primitive.java']});
    expect(lines[3][3]).toEqual({value: 'func', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[6][1]).toEqual({value: '}', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.curly.java']});

    expect(lines[7][1]).toEqual({value: 'TYPE_B', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});
    expect(lines[7][2]).toEqual({value: '(', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});
    expect(lines[7][3]).toEqual({value: '"', scopes: ['source.java', 'meta.enum.java', 'string.quoted.double.java', 'punctuation.definition.string.begin.java']});
    expect(lines[7][4]).toEqual({value: '2', scopes: ['source.java', 'meta.enum.java', 'string.quoted.double.java']});
    expect(lines[7][5]).toEqual({value: '"', scopes: ['source.java', 'meta.enum.java', 'string.quoted.double.java', 'punctuation.definition.string.end.java']});
    expect(lines[7][6]).toEqual({value: ',', scopes: ['source.java', 'meta.enum.java', 'punctuation.separator.delimiter.java']});
    expect(lines[7][8]).toEqual({value: '2', scopes: ['source.java', 'meta.enum.java', 'constant.numeric.decimal.java']});
    expect(lines[7][9]).toEqual({value: ')', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.round.java']});
    expect(lines[8][1]).toEqual({value: '{', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.curly.java']}); // Begin bracket placed at new line
    expect(lines[9][2]).toEqual({value: 'Override', scopes: ['source.java', 'meta.enum.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});
    expect(lines[10][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.primitive.java']});
    expect(lines[10][3]).toEqual({value: 'func', scopes: ['source.java', 'meta.enum.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[13][1]).toEqual({value: '}', scopes: ['source.java', 'meta.enum.java', 'punctuation.bracket.curly.java']});

    expect(lines[14][1]).toEqual({value: 'TYPE_DEFAULT', scopes: ['source.java', 'meta.enum.java', 'constant.other.enum.java']});

    expect(lines[27][0]).toEqual({value: '}', scopes: ['source.java', 'meta.enum.java', 'punctuation.section.enum.end.bracket.curly.java']});
}); // Test that enum scope correctly ends

  it('tokenizes enums with extends and implements', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  enum Test1 extends Bclass, Cclass implements Din, Ein {
  }

  enum Test2 implements Din, Ein extends Bclass, Cclass {
  }

  enum Test3 extends SomeClass {
  }

  enum Test4 implements SomeInterface {
  }

  enum Test5 extends java.lang.SomeClass {
  }

  enum Test6 implements java.lang.SomeInterface {
  }
}\
`
    );

    const scopeStack = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.enum.java'];

    // Test1
    expect(lines[1][5]).toEqual({value: 'extends', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'storage.modifier.extends.java'])});
    expect(lines[1][7]).toEqual({value: 'Bclass', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'entity.other.inherited-class.java'])});
    expect(lines[1][10]).toEqual({value: 'Cclass', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'entity.other.inherited-class.java'])});
    expect(lines[1][12]).toEqual({value: 'implements', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'storage.modifier.implements.java'])});
    expect(lines[1][14]).toEqual({value: 'Din', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'entity.other.inherited-class.java'])});
    expect(lines[1][17]).toEqual({value: 'Ein', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'entity.other.inherited-class.java'])});

    // Test2
    expect(lines[4][5]).toEqual({value: 'implements', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'storage.modifier.implements.java'])});
    expect(lines[4][7]).toEqual({value: 'Din', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'entity.other.inherited-class.java'])});
    expect(lines[4][10]).toEqual({value: 'Ein', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'entity.other.inherited-class.java'])});
    expect(lines[4][12]).toEqual({value: 'extends', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'storage.modifier.extends.java'])});
    expect(lines[4][14]).toEqual({value: 'Bclass', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'entity.other.inherited-class.java'])});
    expect(lines[4][17]).toEqual({value: 'Cclass', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'entity.other.inherited-class.java'])});

    // Test3
    expect(lines[7][5]).toEqual({value: 'extends', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'storage.modifier.extends.java'])});
    expect(lines[7][7]).toEqual({value: 'SomeClass', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'entity.other.inherited-class.java'])});

    // Test4
    expect(lines[10][5]).toEqual({value: 'implements', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'storage.modifier.implements.java'])});
    expect(lines[10][7]).toEqual({value: 'SomeInterface', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'entity.other.inherited-class.java'])});

    // Test5
    // TODO ' java.lang.' is highlighted as a single block for some reason, same for the class
    expect(lines[13][5]).toEqual({value: 'extends', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'storage.modifier.extends.java'])});
    expect(lines[13][7]).toEqual({value: 'SomeClass', scopes: scopeStack.concat(['meta.definition.class.inherited.classes.java', 'entity.other.inherited-class.java'])});

    // Test6
    // TODO ' java.lang.' is highlighted as a single block for some reason, same for the class
    expect(lines[16][5]).toEqual({value: 'implements', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'storage.modifier.implements.java'])});
    expect(lines[16][7]).toEqual({value: 'SomeInterface', scopes: scopeStack.concat(['meta.definition.class.implemented.interfaces.java', 'entity.other.inherited-class.java'])});
});

  it('does not catastrophically backtrack when tokenizing large enums (regression)', function() {
    // https://github.com/atom/language-java/issues/103
    // This test 'fails' if it runs for an absurdly long time without completing.
    // It should pass almost immediately just like all the other tests.

    const enumContents = 'AAAAAAAAAAA, BBBBBBBBBB, CCCCCCCCCC, DDDDDDDDDD, EEEEEEEEEE, FFFFFFFFFF, '.repeat(50);

    const lines = grammar.tokenizeLines(`\
public enum test {
  ${enumContents}
}\
`
    );

    expect(lines[0][2]).toEqual({value: 'enum', scopes: ['source.java', 'meta.enum.java', 'storage.modifier.java']});
});

  it('tokenizes methods', function() {
    const lines = grammar.tokenizeLines(`\
abstract class A
{
  A(int a, int b)
  {
    super();
    this.prop = a + b;
  }

  public /* test */ List<Integer> /* test */ getList() /* test */ throws Exception
  {
    return null;
  }

  public void nothing();

  public java.lang.String[][] getString()
  {
    return null;
  }

  public Map<Integer, Integer> getMap()
  {
    return null;
  }

  public <T extends Box> T call(String name, Class<T> type)
  {
    return null;
  }

  private int prop = 0;
}\
`
    );

    const scopeStack = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java'];

    expect(lines[2][1]).toEqual({value: 'A', scopes: scopeStack.concat(['meta.method.identifier.java', 'entity.name.function.java'])});
    expect(lines[2][2]).toEqual({value: '(', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java'])});
    expect(lines[2][3]).toEqual({value: 'int', scopes: scopeStack.concat(['meta.method.identifier.java', 'storage.type.primitive.java'])});
    expect(lines[2][5]).toEqual({value: 'a', scopes: scopeStack.concat(['meta.method.identifier.java', 'variable.parameter.java'])});
    expect(lines[2][6]).toEqual({value: ',', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.separator.delimiter.java'])});
    expect(lines[2][11]).toEqual({value: ')', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[3][1]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.method.begin.bracket.curly.java'])});
    expect(lines[4][1]).toEqual({value: 'super', scopes: scopeStack.concat(['meta.method.body.java', 'variable.language.java'])});
    expect(lines[5][1]).toEqual({value: 'this', scopes: scopeStack.concat(['meta.method.body.java', 'variable.language.this.java'])});
    expect(lines[5][3]).toEqual({value: 'prop', scopes: scopeStack.concat(['meta.method.body.java', 'variable.other.object.property.java'])});
    expect(lines[6][1]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.method.end.bracket.curly.java'])});

    expect(lines[8][1]).toEqual({value: 'public', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[8][4]).toEqual({value: ' test ', scopes: scopeStack.concat(['comment.block.java'])});
    expect(lines[8][7]).toEqual({value: 'List', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.java'])});
    expect(lines[8][8]).toEqual({value: '<', scopes: scopeStack.concat(['meta.method.return-type.java', 'punctuation.bracket.angle.java'])});
    expect(lines[8][9]).toEqual({value: 'Integer', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.generic.java'])});
    expect(lines[8][10]).toEqual({value: '>', scopes: scopeStack.concat(['meta.method.return-type.java', 'punctuation.bracket.angle.java'])});
    expect(lines[8][13]).toEqual({value: ' test ', scopes: scopeStack.concat(['meta.method.return-type.java', 'comment.block.java'])});
    expect(lines[8][16]).toEqual({value: 'getList', scopes: scopeStack.concat(['meta.method.identifier.java', 'entity.name.function.java'])});
    expect(lines[8][21]).toEqual({value: ' test ', scopes: scopeStack.concat(['comment.block.java'])});
    expect(lines[8][24]).toEqual({value: 'throws', scopes: scopeStack.concat(['meta.throwables.java', 'storage.modifier.java'])});
    expect(lines[8][26]).toEqual({value: 'Exception', scopes: scopeStack.concat(['meta.throwables.java', 'storage.type.java'])});

    expect(lines[13][1]).toEqual({value: 'public', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[13][3]).toEqual({value: 'void', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.primitive.java'])});
    expect(lines[13][5]).toEqual({value: 'nothing', scopes: scopeStack.concat(['meta.method.identifier.java', 'entity.name.function.java'])});
    expect(lines[13][6]).toEqual({value: '(', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java'])});
    expect(lines[13][7]).toEqual({value: ')', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java'])});

    expect(lines[15][1]).toEqual({value: 'public', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[15][3]).toEqual({value: 'java', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.java'])});
    expect(lines[15][5]).toEqual({value: 'lang', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.java'])});
    expect(lines[15][7]).toEqual({value: 'String', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.object.array.java'])});
    expect(lines[15][8]).toEqual({value: '[', scopes: scopeStack.concat(['meta.method.return-type.java', 'punctuation.bracket.square.java'])});
    expect(lines[15][9]).toEqual({value: ']', scopes: scopeStack.concat(['meta.method.return-type.java', 'punctuation.bracket.square.java'])});
    expect(lines[15][10]).toEqual({value: '[', scopes: scopeStack.concat(['meta.method.return-type.java', 'punctuation.bracket.square.java'])});
    expect(lines[15][11]).toEqual({value: ']', scopes: scopeStack.concat(['meta.method.return-type.java', 'punctuation.bracket.square.java'])});
    expect(lines[15][13]).toEqual({value: 'getString', scopes: scopeStack.concat(['meta.method.identifier.java', 'entity.name.function.java'])});

    expect(lines[20][1]).toEqual({value: 'public', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[20][3]).toEqual({value: 'Map', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.java'])});
    expect(lines[20][4]).toEqual({value: '<', scopes: scopeStack.concat(['meta.method.return-type.java', 'punctuation.bracket.angle.java'])});
    expect(lines[20][5]).toEqual({value: 'Integer', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.generic.java'])});
    expect(lines[20][8]).toEqual({value: 'Integer', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.generic.java'])});
    expect(lines[20][9]).toEqual({value: '>', scopes: scopeStack.concat(['meta.method.return-type.java', 'punctuation.bracket.angle.java'])});
    expect(lines[20][11]).toEqual({value: 'getMap', scopes: scopeStack.concat(['meta.method.identifier.java', 'entity.name.function.java'])});

    expect(lines[25][1]).toEqual({value: 'public', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[25][3]).toEqual({value: '<', scopes: scopeStack.concat(['punctuation.bracket.angle.java'])});
    expect(lines[25][4]).toEqual({value: 'T', scopes: scopeStack.concat(['storage.type.generic.java'])});
    expect(lines[25][6]).toEqual({value: 'extends', scopes: scopeStack.concat(['storage.modifier.extends.java'])});
    expect(lines[25][8]).toEqual({value: 'Box', scopes: scopeStack.concat(['storage.type.generic.java'])});
    expect(lines[25][9]).toEqual({value: '>', scopes: scopeStack.concat(['punctuation.bracket.angle.java'])});
    expect(lines[25][11]).toEqual({value: 'T', scopes: scopeStack.concat(['meta.method.return-type.java', 'storage.type.java'])});
    expect(lines[25][13]).toEqual({value: 'call', scopes: scopeStack.concat(['meta.method.identifier.java', 'entity.name.function.java'])});
    expect(lines[25][14]).toEqual({value: '(', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java'])});
    expect(lines[25][15]).toEqual({value: 'String', scopes: scopeStack.concat(['meta.method.identifier.java', 'storage.type.java'])});
    expect(lines[25][17]).toEqual({value: 'name', scopes: scopeStack.concat(['meta.method.identifier.java', 'variable.parameter.java'])});
    expect(lines[25][20]).toEqual({value: 'Class', scopes: scopeStack.concat(['meta.method.identifier.java', 'storage.type.java'])});
    expect(lines[25][21]).toEqual({value: '<', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.bracket.angle.java'])});
    expect(lines[25][22]).toEqual({value: 'T', scopes: scopeStack.concat(['meta.method.identifier.java', 'storage.type.generic.java'])});
    expect(lines[25][23]).toEqual({value: '>', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.bracket.angle.java'])});
    expect(lines[25][25]).toEqual({value: 'type', scopes: scopeStack.concat(['meta.method.identifier.java', 'variable.parameter.java'])});
    expect(lines[25][26]).toEqual({value: ')', scopes: scopeStack.concat(['meta.method.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java'])});
});


  it('tokenizes variable-length argument list (varargs)', function() {
    const lines = grammar.tokenizeLines(`\
class A
{
  void func1(String... args)
  {
  }

  void func2(int /* ... */ arg, int ... args)
  {
  }
}\
`
    );
    expect(lines[2][5]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.java']});
    expect(lines[2][6]).toEqual({value: '...', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.varargs.java']});
    expect(lines[6][5]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.primitive.java']});
    expect(lines[6][8]).toEqual({value: ' ... ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java']});
    expect(lines[6][14]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.primitive.java']});
    expect(lines[6][16]).toEqual({value: '...', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.varargs.java']});
});

  it('tokenizes `final` in class method', function() {
    const lines = grammar.tokenizeLines(`\
class A
{
  public int doSomething(final int finalScore, final int scorefinal)
  {
    return finalScore;
  }
}\
`
    );

    expect(lines[2][7]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.modifier.java']});
    expect(lines[2][11]).toEqual({value: 'finalScore', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'variable.parameter.java']});
    expect(lines[2][14]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.modifier.java']});
    expect(lines[2][18]).toEqual({value: 'scorefinal', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'variable.parameter.java']});
    expect(lines[4][2]).toEqual({value: ' finalScore', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java']});
});

  describe('numbers', function() {
    describe('integers', function() {
      it('tokenizes hexadecimal integers', function() {
        let {tokens} = grammar.tokenizeLine('0x0');
        expect(tokens[0]).toEqual({value: '0x0', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0X0'));
        expect(tokens[0]).toEqual({value: '0X0', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0x1234567ABCDEF'));
        expect(tokens[0]).toEqual({value: '0x1234567ABCDEF', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0x1234567aBcDEf'));
        expect(tokens[0]).toEqual({value: '0x1234567aBcDEf', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0x3746A4l'));
        expect(tokens[0]).toEqual({value: '0x3746A4l', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xC3L'));
        expect(tokens[0]).toEqual({value: '0xC3L', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0x0_1B'));
        expect(tokens[0]).toEqual({value: '0x0_1B', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xCF______3_2_A_73_B'));
        expect(tokens[0]).toEqual({value: '0xCF______3_2_A_73_B', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xCF______3_2_A_73_BL'));
        expect(tokens[0]).toEqual({value: '0xCF______3_2_A_73_BL', scopes: ['source.java', 'constant.numeric.hex.java']});

        // Invalid
        ({tokens} = grammar.tokenizeLine('0x_0'));
        expect(tokens[0]).toEqual({value: '0x_0', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x_'));
        expect(tokens[0]).toEqual({value: '0x_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0_'));
        expect(tokens[0]).toEqual({value: '0x0_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x123ABCQ'));
        expect(tokens[0]).toEqual({value: '0x123ABCQ', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x123ABC$'));
        expect(tokens[0]).toEqual({value: '0x123ABC$', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x123ABC_L'));
        expect(tokens[0]).toEqual({value: '0x123ABC_L', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x123ABCLl'));
        expect(tokens[0]).toEqual({value: '0x123ABCLl', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('a0x123ABC'));
        expect(tokens[0]).toEqual({value: 'a0x123ABC', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('$0x123ABC'));
        expect(tokens[0]).toEqual({value: '$0x123ABC', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1x0'));
        expect(tokens[0]).toEqual({value: '1x0', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('.0x1'));
        expect(tokens[0]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period.java']});
    });

      it('tokenizes binary literals', function() {
        let {tokens} = grammar.tokenizeLine('0b0');
        expect(tokens[0]).toEqual({value: '0b0', scopes: ['source.java', 'constant.numeric.binary.java']});

        ({tokens} = grammar.tokenizeLine('0B0'));
        expect(tokens[0]).toEqual({value: '0B0', scopes: ['source.java', 'constant.numeric.binary.java']});

        ({tokens} = grammar.tokenizeLine('0b10101010010101'));
        expect(tokens[0]).toEqual({value: '0b10101010010101', scopes: ['source.java', 'constant.numeric.binary.java']});

        ({tokens} = grammar.tokenizeLine('0b10_101__010______01_0_101'));
        expect(tokens[0]).toEqual({value: '0b10_101__010______01_0_101', scopes: ['source.java', 'constant.numeric.binary.java']});

        ({tokens} = grammar.tokenizeLine('0b1111l'));
        expect(tokens[0]).toEqual({value: '0b1111l', scopes: ['source.java', 'constant.numeric.binary.java']});

        ({tokens} = grammar.tokenizeLine('0b1111L'));
        expect(tokens[0]).toEqual({value: '0b1111L', scopes: ['source.java', 'constant.numeric.binary.java']});

        ({tokens} = grammar.tokenizeLine('0b11__01l'));
        expect(tokens[0]).toEqual({value: '0b11__01l', scopes: ['source.java', 'constant.numeric.binary.java']});

        // Invalid
        ({tokens} = grammar.tokenizeLine('0b_0'));
        expect(tokens[0]).toEqual({value: '0b_0', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0b_'));
        expect(tokens[0]).toEqual({value: '0b_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0b0_'));
        expect(tokens[0]).toEqual({value: '0b0_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0b1001010102'));
        expect(tokens[0]).toEqual({value: '0b1001010102', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0b100101010Q'));
        expect(tokens[0]).toEqual({value: '0b100101010Q', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0b100101010$'));
        expect(tokens[0]).toEqual({value: '0b100101010$', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('a0b100101010'));
        expect(tokens[0]).toEqual({value: 'a0b100101010', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('$0b100101010'));
        expect(tokens[0]).toEqual({value: '$0b100101010', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0b100101010Ll'));
        expect(tokens[0]).toEqual({value: '0b100101010Ll', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0b100101010_L'));
        expect(tokens[0]).toEqual({value: '0b100101010_L', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1b0'));
        expect(tokens[0]).toEqual({value: '1b0', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('.0b100101010'));
        expect(tokens[0]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period.java']});
    });

      it('tokenizes octal literals', function() {
        let {tokens} = grammar.tokenizeLine('00');
        expect(tokens[0]).toEqual({value: '00', scopes: ['source.java', 'constant.numeric.octal.java']});

        ({tokens} = grammar.tokenizeLine('01234567'));
        expect(tokens[0]).toEqual({value: '01234567', scopes: ['source.java', 'constant.numeric.octal.java']});

        ({tokens} = grammar.tokenizeLine('07263_3251___3625_1_4'));
        expect(tokens[0]).toEqual({value: '07263_3251___3625_1_4', scopes: ['source.java', 'constant.numeric.octal.java']});

        ({tokens} = grammar.tokenizeLine('07263l'));
        expect(tokens[0]).toEqual({value: '07263l', scopes: ['source.java', 'constant.numeric.octal.java']});

        ({tokens} = grammar.tokenizeLine('07263L'));
        expect(tokens[0]).toEqual({value: '07263L', scopes: ['source.java', 'constant.numeric.octal.java']});

        ({tokens} = grammar.tokenizeLine('011__24l'));
        expect(tokens[0]).toEqual({value: '011__24l', scopes: ['source.java', 'constant.numeric.octal.java']});

        // Invalid
        ({tokens} = grammar.tokenizeLine('0'));
        expect(tokens[0]).toEqual({value: '0', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('0_'));
        expect(tokens[0]).toEqual({value: '0_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0_0'));
        expect(tokens[0]).toEqual({value: '0_0', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('01_'));
        expect(tokens[0]).toEqual({value: '01_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('02637242638'));
        expect(tokens[0]).toEqual({value: '02637242638', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0263724263Q'));
        expect(tokens[0]).toEqual({value: '0263724263Q', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0263724263$'));
        expect(tokens[0]).toEqual({value: '0263724263$', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('a0263724263'));
        expect(tokens[0]).toEqual({value: 'a0263724263', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('$0263724263'));
        expect(tokens[0]).toEqual({value: '$0263724263', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0263724263Ll'));
        expect(tokens[0]).toEqual({value: '0263724263Ll', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0263724263_L'));
        expect(tokens[0]).toEqual({value: '0263724263_L', scopes: ['source.java']});
    });

      it('tokenizes numeric integers', function() {
        let {tokens} = grammar.tokenizeLine('0');
        expect(tokens[0]).toEqual({value: '0', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('123456789'));
        expect(tokens[0]).toEqual({value: '123456789', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('362__2643_0_7'));
        expect(tokens[0]).toEqual({value: '362__2643_0_7', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('29473923603492738L'));
        expect(tokens[0]).toEqual({value: '29473923603492738L', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('29473923603492738l'));
        expect(tokens[0]).toEqual({value: '29473923603492738l', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('2947_39___23__60_3_4______92738l'));
        expect(tokens[0]).toEqual({value: '2947_39___23__60_3_4______92738l', scopes: ['source.java', 'constant.numeric.decimal.java']});

        // Invalid
        ({tokens} = grammar.tokenizeLine('01'));
        expect(tokens[0]).toEqual({value: '01', scopes: ['source.java', 'constant.numeric.octal.java']});

        ({tokens} = grammar.tokenizeLine('1_'));
        expect(tokens[0]).toEqual({value: '1_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('2639724263Q'));
        expect(tokens[0]).toEqual({value: '2639724263Q', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('2639724263$'));
        expect(tokens[0]).toEqual({value: '2639724263$', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('a2639724263'));
        expect(tokens[0]).toEqual({value: 'a2639724263', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('$2639724263'));
        expect(tokens[0]).toEqual({value: '$2639724263', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('2639724263Ll'));
        expect(tokens[0]).toEqual({value: '2639724263Ll', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('2639724263_L'));
        expect(tokens[0]).toEqual({value: '2639724263_L', scopes: ['source.java']});
    });
  });

    describe('floats', function() {
      it('tokenizes hexadecimal floats', function() {
        let {tokens} = grammar.tokenizeLine('0x0P0');
        expect(tokens[0]).toEqual({value: '0x0P0', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0x0p0'));
        expect(tokens[0]).toEqual({value: '0x0p0', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xDp3746'));
        expect(tokens[0]).toEqual({value: '0xDp3746', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD__3p3_7_46'));
        expect(tokens[0]).toEqual({value: '0xD__3p3_7_46', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.p3_7_46'));
        expect(tokens[0]).toEqual({value: '0xD3.p3_7_46', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17Fp3_7_46'));
        expect(tokens[0]).toEqual({value: '0xD3.17Fp3_7_46', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp3_7_46'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp3_7_46', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp+3_7_46'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp+3_7_46', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp-3_7_46'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp-3_7_46', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp3_7_46F'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp3_7_46F', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp3_7_46f'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp3_7_46f', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp3_7_46D'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp3_7_46D', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp3_7_46d'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp3_7_46d', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp-3_7_46f'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp-3_7_46f', scopes: ['source.java', 'constant.numeric.hex.java']});

        ({tokens} = grammar.tokenizeLine('0xD3.17_Fp-0f'));
        expect(tokens[0]).toEqual({value: '0xD3.17_Fp-0f', scopes: ['source.java', 'constant.numeric.hex.java']});

        // Invalid
        ({tokens} = grammar.tokenizeLine('0x0p'));
        expect(tokens[0]).toEqual({value: '0x0p', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0pA'));
        expect(tokens[0]).toEqual({value: '0x0pA', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0p+'));
        expect(tokens[0]).toEqual({value: '0x0p', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0p'));
        expect(tokens[0]).toEqual({value: '0x0p', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0pF'));
        expect(tokens[0]).toEqual({value: '0x0pF', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0p_'));
        expect(tokens[0]).toEqual({value: '0x0p_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0_p1'));
        expect(tokens[0]).toEqual({value: '0x0_p1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0p1_'));
        expect(tokens[0]).toEqual({value: '0x0p1_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0p+-2'));
        expect(tokens[0]).toEqual({value: '0x0p', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0p+2Ff'));
        expect(tokens[0]).toEqual({value: '0x0p', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0._p2'));
        expect(tokens[0]).toEqual({value: '0x0', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0_.p2'));
        expect(tokens[0]).toEqual({value: '0x0_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0..p2'));
        expect(tokens[0]).toEqual({value: '0x0', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0x0Pp2'));
        expect(tokens[0]).toEqual({value: '0x0Pp2', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('0xp2'));
        expect(tokens[0]).toEqual({value: '0xp2', scopes: ['source.java']});
    });

      it('tokenizes numeric floats', function() {
        let {tokens} = grammar.tokenizeLine('1.');
        expect(tokens[0]).toEqual({value: '1.', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.0'));
        expect(tokens[0]).toEqual({value: '1.0', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1273.47363'));
        expect(tokens[0]).toEqual({value: '1273.47363', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1_2.4_7__89_5'));
        expect(tokens[0]).toEqual({value: '1_2.4_7__89_5', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.F'));
        expect(tokens[0]).toEqual({value: '1.F', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.f'));
        expect(tokens[0]).toEqual({value: '1.f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.D'));
        expect(tokens[0]).toEqual({value: '1.D', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.d'));
        expect(tokens[0]).toEqual({value: '1.d', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.0f'));
        expect(tokens[0]).toEqual({value: '1.0f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.0_7f'));
        expect(tokens[0]).toEqual({value: '1.0_7f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.E5'));
        expect(tokens[0]).toEqual({value: '1.E5', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.e5'));
        expect(tokens[0]).toEqual({value: '1.e5', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.e5_7'));
        expect(tokens[0]).toEqual({value: '1.e5_7', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.6e58_26'));
        expect(tokens[0]).toEqual({value: '1.6e58_26', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.6e8f'));
        expect(tokens[0]).toEqual({value: '1.6e8f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.78e+7'));
        expect(tokens[0]).toEqual({value: '1.78e+7', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.78e-7'));
        expect(tokens[0]).toEqual({value: '1.78e-7', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('1.78e+7f'));
        expect(tokens[0]).toEqual({value: '1.78e+7f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('.7'));
        expect(tokens[0]).toEqual({value: '.7', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('.726'));
        expect(tokens[0]).toEqual({value: '.726', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('.72__6e97_5632f'));
        expect(tokens[0]).toEqual({value: '.72__6e97_5632f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('7_26e+52_3'));
        expect(tokens[0]).toEqual({value: '7_26e+52_3', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('7_26e+52_3f'));
        expect(tokens[0]).toEqual({value: '7_26e+52_3f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('3f'));
        expect(tokens[0]).toEqual({value: '3f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        ({tokens} = grammar.tokenizeLine('7_26f'));
        expect(tokens[0]).toEqual({value: '7_26f', scopes: ['source.java', 'constant.numeric.decimal.java']});

        // Invalid
        ({tokens} = grammar.tokenizeLine('1e'));
        expect(tokens[0]).toEqual({value: '1e', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1.e'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('.e'));
        expect(tokens[0]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period.java']});

        ({tokens} = grammar.tokenizeLine('1_.'));
        expect(tokens[0]).toEqual({value: '1_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1._'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('_.'));
        expect(tokens[0]).toEqual({value: '_', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1._1'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('_1.1'));
        expect(tokens[0]).toEqual({value: '_1', scopes: ['source.java', 'variable.other.object.java']});

        ({tokens} = grammar.tokenizeLine('1.1_'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1e++7'));
        expect(tokens[0]).toEqual({value: '1e', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1.ee5'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1.Ff'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1.e'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1..1'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('a1'));
        expect(tokens[0]).toEqual({value: 'a1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1a'));
        expect(tokens[0]).toEqual({value: '1a', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1.q'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1.3fa'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1.1_f'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1.1_e3'));
        expect(tokens[0]).toEqual({value: '1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('$1'));
        expect(tokens[0]).toEqual({value: '$1', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('1$'));
        expect(tokens[0]).toEqual({value: '1$', scopes: ['source.java']});

        ({tokens} = grammar.tokenizeLine('$.1'));
        expect(tokens[0]).toEqual({value: '$', scopes: ['source.java', 'variable.other.object.java']});

        ({tokens} = grammar.tokenizeLine('.1$'));
        expect(tokens[0]).toEqual({value: '.', scopes: ['source.java', 'punctuation.separator.period.java']});
    });
  });
});

  it('tokenizes `final` in class fields', function() {
    const lines = grammar.tokenizeLines(`\
class A
{
  private final int finala = 0;
  final private int bfinal = 1;
}\
`
    );

    expect(lines[2][3]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.modifier.java']});
    expect(lines[2][7]).toEqual({value: 'finala', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[3][1]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.modifier.java']});
    expect(lines[3][7]).toEqual({value: 'bfinal', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
});

  it('tokenizes method-local variables', function() {
    const lines = grammar.tokenizeLines(`\
class A
{
  public void fn()
  {
    String someString;
    String assigned = "Rand al'Thor";
    int primitive = 5;
  }
}\
`
    );

    expect(lines[4][1]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[4][3]).toEqual({value: 'someString', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});

    expect(lines[5][1]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[5][3]).toEqual({value: 'assigned', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[5][5]).toEqual({value: '=', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'keyword.operator.assignment.java']});
    expect(lines[5][8]).toEqual({value: "Rand al'Thor", scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'string.quoted.double.java']});

    expect(lines[6][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[6][3]).toEqual({value: 'primitive', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[6][5]).toEqual({value: '=', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'keyword.operator.assignment.java']});
    expect(lines[6][7]).toEqual({value: '5', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'constant.numeric.decimal.java']});
});

  it('tokenizes variables defined with incorrect primitive types', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  aint a = 1; int b = 2;
  aboolean c = true; boolean d = false;
}\
`
    );

    expect(lines[1][0]).toEqual({value: '  aint a ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java']});
    expect(lines[1][6]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[1][8]).toEqual({value: 'b', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[2][0]).toEqual({value: '  aboolean c ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java']});
    expect(lines[2][6]).toEqual({value: 'boolean', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[2][8]).toEqual({value: 'd', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
});

  it('tokenizes capitalized variables', function() {
    const lines = grammar.tokenizeLines(`\
void func()
{
  int g = 1;
  g += 2;
  int G = 1;
  G += 2;

  if (G > g) {
    // do something
  }
}\
`
    );

    expect(lines[2][3]).toEqual({value: 'g', scopes: ['source.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[3][0]).toEqual({value: '  g ', scopes: ['source.java']});
    expect(lines[4][3]).toEqual({value: 'G', scopes: ['source.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[5][0]).toEqual({value: '  G ', scopes: ['source.java']}); // should not be highlighted as storage type!

    expect(lines[7][4]).toEqual({value: 'G ', scopes: ['source.java']}); // should not be highlighted as storage type!
    expect(lines[7][5]).toEqual({value: '>', scopes: ['source.java', 'keyword.operator.comparison.java']});
    expect(lines[7][6]).toEqual({value: ' g', scopes: ['source.java']});
});

  it('tokenizes variables in for-each loop', function() {
    const lines = grammar.tokenizeLines(`\
void func()
{
  for (int i : elements) {
    // do something
  }

  for (HashMap<String, String> map : elementsFunc()) {
    // do something
  }
}\
`
    );

    expect(lines[2][3]).toEqual({value: '(', scopes: ['source.java', 'punctuation.bracket.round.java']});
    expect(lines[2][4]).toEqual({value: 'int', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[2][6]).toEqual({value: 'i', scopes: ['source.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[2][10]).toEqual({value: ')', scopes: ['source.java', 'punctuation.bracket.round.java']});

    expect(lines[6][3]).toEqual({value: '(', scopes: ['source.java', 'punctuation.bracket.round.java']});
    expect(lines[6][4]).toEqual({value: 'HashMap', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[6][12]).toEqual({value: 'map', scopes: ['source.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[6][19]).toEqual({value: ')', scopes: ['source.java', 'punctuation.bracket.round.java']});
});

  it('tokenizes Java 10 local variables', function() {
    const lines = grammar.tokenizeLines(`\
void func() {
  var a = new A();
  B var = new B();
  var = new C();
  { var d = new D(); }
  for (var e : elements()) {
    // do something
  }
}\
`
    );

    expect(lines[1][1]).toEqual({value: 'var', scopes: ['source.java', 'meta.definition.variable.local.java', 'storage.type.local.java']});
    expect(lines[1][3]).toEqual({value: 'a', scopes: ['source.java', 'meta.definition.variable.local.java', 'variable.other.definition.java']});

    // should be highlighted as variable name, not storage type
    expect(lines[2][1]).toEqual({value: 'B', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][3]).toEqual({value: 'var', scopes: ['source.java', 'meta.definition.variable.java', 'variable.other.definition.java']});

    // should be a variable name
    expect(lines[3][0]).toEqual({value: '  var ', scopes: ['source.java']});

    expect(lines[4][3]).toEqual({value: 'var', scopes: ['source.java', 'meta.definition.variable.local.java', 'storage.type.local.java']});
    expect(lines[4][5]).toEqual({value: 'd', scopes: ['source.java', 'meta.definition.variable.local.java', 'variable.other.definition.java']});

    expect(lines[5][4]).toEqual({value: 'var', scopes: ['source.java', 'meta.definition.variable.local.java', 'storage.type.local.java']});
    expect(lines[5][6]).toEqual({value: 'e', scopes: ['source.java', 'meta.definition.variable.local.java', 'variable.other.definition.java']});
});

  it('tokenizes function and method calls', function() {
    const lines = grammar.tokenizeLines(`\
class A
{
  A()
  {
    hello();
    hello(a, 1, "hello");
    $hello();
    this.hello();
    this . hello(a, b);
  }
}\
`
    );

    expect(lines[4][1]).toEqual({value: 'hello', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(lines[4][2]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[4][3]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(lines[4][4]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.terminator.java']});

    expect(lines[5][1]).toEqual({value: 'hello', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(lines[5][3]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java']});
    expect(lines[5][4]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'punctuation.separator.delimiter.java']});
    expect(lines[5][6]).toEqual({value: '1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'constant.numeric.decimal.java']});
    expect(lines[5][9]).toEqual({value: '"', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'string.quoted.double.java', 'punctuation.definition.string.begin.java']});
    expect(lines[5][11]).toEqual({value: '"', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'string.quoted.double.java', 'punctuation.definition.string.end.java']});
    expect(lines[5][13]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.terminator.java']});

    expect(lines[6][1]).toEqual({value: '$hello', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'entity.name.function.java']});

    expect(lines[7][1]).toEqual({value: 'this', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.language.this.java']});
    expect(lines[7][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'punctuation.separator.period.java']});
    expect(lines[7][3]).toEqual({value: 'hello', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'entity.name.function.java']});
    expect(lines[7][4]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[7][5]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(lines[7][6]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.terminator.java']});

    expect(lines[8][3]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'punctuation.separator.period.java']});
    expect(lines[8][4]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java']});
    expect(lines[8][5]).toEqual({value: 'hello', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'entity.name.function.java']});
    expect(lines[8][7]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java']});
    expect(lines[8][8]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'punctuation.separator.delimiter.java']});
    expect(lines[8][11]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.terminator.java']});
});

  it('tokenizes objects and properties', function() {
    const lines = grammar.tokenizeLines(`\
class A
{
  A()
  {
    object.property;
    object.Property;
    Object.property;
    object . property;
    $object.$property;
    object.property1.property2;
    object.method().property;
    object.property.method();
    object.123illegal;
  }
}\
`
    );

    expect(lines[4][1]).toEqual({value: 'object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java']});
    expect(lines[4][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.separator.period.java']});
    expect(lines[4][3]).toEqual({value: 'property', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.property.java']});
    expect(lines[4][4]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.terminator.java']});

    expect(lines[5][1]).toEqual({value: 'object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java']});
    expect(lines[5][3]).toEqual({value: 'Property', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.property.java']});

    expect(lines[6][1]).toEqual({value: 'Object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java']});

    expect(lines[7][1]).toEqual({value: 'object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java']});
    expect(lines[7][5]).toEqual({value: 'property', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.property.java']});

    expect(lines[8][1]).toEqual({value: '$object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java']});
    expect(lines[8][3]).toEqual({value: '$property', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.property.java']});

    expect(lines[9][3]).toEqual({value: 'property1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.property.java']});
    expect(lines[9][5]).toEqual({value: 'property2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.property.java']});

    expect(lines[10][1]).toEqual({value: 'object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java']});
    expect(lines[10][3]).toEqual({value: 'method', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'entity.name.function.java']});
    expect(lines[10][7]).toEqual({value: 'property', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.property.java']});

    expect(lines[11][3]).toEqual({value: 'property', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.property.java']});
    expect(lines[11][5]).toEqual({value: 'method', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'entity.name.function.java']});

    expect(lines[12][1]).toEqual({value: 'object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java']});
    expect(lines[12][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.separator.period.java']});
    expect(lines[12][3]).toEqual({value: '123illegal', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'invalid.illegal.identifier.java']});
    expect(lines[12][4]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.terminator.java']});
});

  it('tokenizes generics', function() {
    const lines = grammar.tokenizeLines(`\
class A<T extends A & B, String, Integer>
{
  HashMap<Integer, String> map = new HashMap<>();
  CodeMap<String, ? extends ArrayList> codemap;
  C(Map<?, ? extends List<?>> m) {}
  Map<Integer, String> method() {}
  private Object otherMethod() { return null; }
  Set<Map.Entry<K, V>> set1;
  Set<java.util.List<K>> set2;
}\
`
    );

    expect(lines[0][3]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'punctuation.bracket.angle.java']});
    expect(lines[0][4]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.java', 'storage.type.generic.java']});
    expect(lines[0][5]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java']});
    expect(lines[0][6]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.java', 'storage.modifier.extends.java']});
    expect(lines[0][7]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java']});
    expect(lines[0][8]).toEqual({value: 'A', scopes: ['source.java', 'meta.class.java', 'storage.type.generic.java']});
    expect(lines[0][9]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java']});
    expect(lines[0][10]).toEqual({value: '&', scopes: ['source.java', 'meta.class.java', 'punctuation.separator.types.java']});
    expect(lines[0][11]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java']});
    expect(lines[0][12]).toEqual({value: 'B', scopes: ['source.java', 'meta.class.java', 'storage.type.generic.java']});
    expect(lines[0][13]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'punctuation.separator.delimiter.java']});
    expect(lines[0][14]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java']});
    expect(lines[0][15]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'storage.type.generic.java']});
    expect(lines[0][16]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'punctuation.separator.delimiter.java']});
    expect(lines[0][17]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java']});
    expect(lines[0][18]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.java', 'storage.type.generic.java']});
    expect(lines[0][19]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][1]).toEqual({value: 'HashMap', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][3]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[2][4]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.delimiter.java']});
    expect(lines[2][6]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[2][7]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][9]).toEqual({value: 'map', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[2][15]).toEqual({value: 'HashMap', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.type.java']});
    expect(lines[2][16]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][17]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.bracket.angle.java']});
    expect(lines[3][1]).toEqual({value: 'CodeMap', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[3][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[3][3]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[3][4]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.delimiter.java']});
    expect(lines[3][6]).toEqual({value: '?', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.wildcard.java']});
    expect(lines[3][8]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.modifier.extends.java']});
    expect(lines[3][10]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[3][11]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[3][13]).toEqual({value: 'codemap', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[4][1]).toEqual({value: 'C', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[4][3]).toEqual({value: 'Map', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.java']});
    expect(lines[4][4]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.bracket.angle.java']});
    expect(lines[4][5]).toEqual({value: '?', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.generic.wildcard.java']});
    expect(lines[4][6]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.separator.delimiter.java']});
    expect(lines[4][8]).toEqual({value: '?', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.generic.wildcard.java']});
    expect(lines[4][10]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.modifier.extends.java']});
    expect(lines[4][12]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.java']});
    expect(lines[4][13]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.bracket.angle.java']});
    expect(lines[4][14]).toEqual({value: '?', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.generic.wildcard.java']});
    expect(lines[4][15]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.bracket.angle.java']});
    expect(lines[4][16]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.bracket.angle.java']});
    expect(lines[4][18]).toEqual({value: 'm', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'variable.parameter.java']});
    expect(lines[5][1]).toEqual({value: 'Map', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.java']});
    expect(lines[5][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.bracket.angle.java']});
    expect(lines[5][3]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.generic.java']});
    expect(lines[5][7]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.bracket.angle.java']});
    expect(lines[5][9]).toEqual({value: 'method', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[6][1]).toEqual({value: 'private', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'storage.modifier.java']});
    expect(lines[6][3]).toEqual({value: 'Object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.java']});
    expect(lines[6][5]).toEqual({value: 'otherMethod', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[7][1]).toEqual({value: 'Set', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[7][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[7][3]).toEqual({value: 'Map', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[7][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[7][5]).toEqual({value: 'Entry', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[7][6]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[7][7]).toEqual({value: 'K', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[7][8]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.delimiter.java']});
    expect(lines[7][10]).toEqual({value: 'V', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[7][11]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[7][12]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[7][14]).toEqual({value: 'set1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[8][1]).toEqual({value: 'Set', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[8][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[8][3]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[8][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[8][5]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[8][6]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[8][7]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[8][8]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[8][9]).toEqual({value: 'K', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[8][10]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[8][11]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[8][13]).toEqual({value: 'set2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
});

  it('tokenizes generics in if-else code block', function() {
    const lines = grammar.tokenizeLines(`\
void func() {
  int a = 1, A = 2, b = 0;
  if (A < a) {
    b = a;
  }
  String S = "str>str";
}\
`
    );

    expect(lines[2][4]).toEqual({value: 'A', scopes: ['source.java', 'storage.type.java']});
    expect(lines[2][6]).toEqual({value: '<', scopes: ['source.java', 'keyword.operator.comparison.java']});
    expect(lines[5][1]).toEqual({value: 'String', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[5][3]).toEqual({value: 'S', scopes: ['source.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[5][5]).toEqual({value: '=', scopes: ['source.java', 'keyword.operator.assignment.java']});
    // check that string does not extend to/include ';'
    expect(lines[5][10]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});
});

  it('tokenizes generics with multiple conditions in if-else code block', function() {
    const lines = grammar.tokenizeLines(`\
void func() {
  int a = 1, A = 2, b = 0;
  if (A < a && b < a) {
    b = a;
  }
}\
`
    );

    expect(lines[2][4]).toEqual({value: 'A', scopes: ['source.java', 'storage.type.java']});
    expect(lines[2][6]).toEqual({value: '<', scopes: ['source.java', 'keyword.operator.comparison.java']});
    expect(lines[2][8]).toEqual({value: '&&', scopes: ['source.java', 'keyword.operator.logical.java']});
    // 'b' should be just a variable, not part of generic
    expect(lines[2][9]).toEqual({value: ' b ', scopes: ['source.java']});
    expect(lines[2][10]).toEqual({value: '<', scopes: ['source.java', 'keyword.operator.comparison.java']});
});

  it('tokenizes generics before if-else code block, not including it', function() {
    const lines = grammar.tokenizeLines(`\
void func() {
  int a = 1, A = 2;
  ArrayList<A extends B<C>> list;
  list = new ArrayList<>();
  if (A < a) { }
}\
`
    );

    expect(lines[2][1]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][2]).toEqual({value: '<', scopes: ['source.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    // "B" is storage.type.java because of the following generic <C>
    expect(lines[2][7]).toEqual({value: 'B', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][9]).toEqual({value: 'C', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[2][11]).toEqual({value: '>', scopes: ['source.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    // right part of the assignment
    expect(lines[3][5]).toEqual({value: 'ArrayList', scopes: ['source.java', 'storage.type.java']});
    expect(lines[3][6]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle.java']});
    expect(lines[3][7]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle.java']});
    // 'if' code block
    expect(lines[4][4]).toEqual({value: 'A', scopes: ['source.java', 'storage.type.java']});
    expect(lines[4][6]).toEqual({value: '<', scopes: ['source.java', 'keyword.operator.comparison.java']});
});

  it('tokenizes generics after if-else code block, not including it', function() {
    const lines = grammar.tokenizeLines(`\
void func() {
  if (A < a) {
    a = A;
  }
  ArrayList<A extends B, C> list;
  list = new ArrayList<A extends B, C>();
}\
`
    );

    expect(lines[4][1]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[4][2]).toEqual({value: '<', scopes: ['source.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[4][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[4][7]).toEqual({value: 'B', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[4][10]).toEqual({value: 'C', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[4][11]).toEqual({value: '>', scopes: ['source.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    // right part of the assignment
    expect(lines[5][5]).toEqual({value: 'ArrayList', scopes: ['source.java', 'storage.type.java']});
    expect(lines[5][6]).toEqual({value: '<', scopes: ['source.java', 'punctuation.bracket.angle.java']});
    expect(lines[5][7]).toEqual({value: 'A', scopes: ['source.java', 'storage.type.generic.java']});
    expect(lines[5][11]).toEqual({value: 'B', scopes: ['source.java', 'storage.type.generic.java']});
    expect(lines[5][14]).toEqual({value: 'C', scopes: ['source.java', 'storage.type.generic.java']});
    expect(lines[5][15]).toEqual({value: '>', scopes: ['source.java', 'punctuation.bracket.angle.java']});
});

  it('tokenizes bit shift correctly, not as generics', function() {
    const lines = grammar.tokenizeLines(`\
void func() {
  int t = 0;
  t = M << 12;
}\
`
    );

    expect(lines[2][5]).toEqual({value: '<<', scopes: ['source.java', 'keyword.operator.bitwise.java']});
    expect(lines[2][7]).toEqual({value: '12', scopes: ['source.java', 'constant.numeric.decimal.java']});
});

  it('tokenizes generics as a function return type', function() {
    // use function wrapped with class otherwise highlighting is broken
    const lines = grammar.tokenizeLines(`\
class Test
{
  ArrayList<A extends B, C> func() {
    return null;
  }
}\
`
    );

    expect(lines[2][1]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.java']});
    expect(lines[2][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.generic.java']});
    expect(lines[2][5]).toEqual({value: 'extends', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.modifier.extends.java']});
    expect(lines[2][7]).toEqual({value: 'B', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.generic.java']});
    expect(lines[2][8]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.separator.delimiter.java']});
    expect(lines[2][10]).toEqual({value: 'C', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'storage.type.generic.java']});
    expect(lines[2][11]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.return-type.java', 'punctuation.bracket.angle.java']});
});

  it('tokenizes generics and primitive arrays declarations', function() {
    const lines = grammar.tokenizeLines(`\
class A<T> {
  private B<T>[] arr;
  private int[][] two = null;
}\
`
    );

    expect(lines[1][1]).toEqual({value: 'private', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.modifier.java']});
    expect(lines[1][3]).toEqual({value: 'B', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[1][4]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[1][5]).toEqual({value: 'T', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[1][6]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[1][7]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[1][8]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[1][10]).toEqual({value: 'arr', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[1][11]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});

    expect(lines[2][1]).toEqual({value: 'private', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.modifier.java']});
    expect(lines[2][3]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.array.java']});
    expect(lines[2][4]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[2][5]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[2][6]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[2][7]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[2][9]).toEqual({value: 'two', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[2][11]).toEqual({value: '=', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'keyword.operator.assignment.java']});
    expect(lines[2][13]).toEqual({value: 'null', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'constant.language.java']});
    expect(lines[2][14]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});
});

  it('tokenizes lambda expressions', function() {
    const {tokens} = grammar.tokenizeLine('(String s1) -> s1.length() - outer.length();');

    expect(tokens[1]).toEqual({value: 'String', scopes: ['source.java', 'storage.type.java']});
    expect(tokens[5]).toEqual({value: '->', scopes: ['source.java', 'storage.type.function.arrow.java']});
    expect(tokens[8]).toEqual({value: '.', scopes: ['source.java', 'meta.method-call.java', 'punctuation.separator.period.java']});
    expect(tokens[10]).toEqual({value: '(', scopes: ['source.java', 'meta.method-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[11]).toEqual({value: ')', scopes: ['source.java', 'meta.method-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[13]).toEqual({value: '-', scopes: ['source.java', 'keyword.operator.arithmetic.java']});
});

  it('tokenizes `new` statements', function() {
    let {tokens} = grammar.tokenizeLine('int[] list = new int[10];');

    expect(tokens[8]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[9]).toEqual({value: ' ', scopes: ['source.java']});
    expect(tokens[10]).toEqual({value: 'int', scopes: ['source.java', 'storage.type.primitive.array.java']});
    expect(tokens[11]).toEqual({value: '[', scopes: ['source.java', 'punctuation.bracket.square.java']});
    expect(tokens[12]).toEqual({value: '10', scopes: ['source.java', 'constant.numeric.decimal.java']});
    expect(tokens[13]).toEqual({value: ']', scopes: ['source.java', 'punctuation.bracket.square.java']});
    expect(tokens[14]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('boolean[] list = new boolean[variable];'));

    expect(tokens[12]).toEqual({value: 'variable', scopes: ['source.java']});

    ({tokens} = grammar.tokenizeLine('String[] list = new String[10];'));

    expect(tokens[8]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[10]).toEqual({value: 'String', scopes: ['source.java', 'storage.type.object.array.java']});
    expect(tokens[11]).toEqual({value: '[', scopes: ['source.java', 'punctuation.bracket.square.java']});
    expect(tokens[12]).toEqual({value: '10', scopes: ['source.java', 'constant.numeric.decimal.java']});
    expect(tokens[13]).toEqual({value: ']', scopes: ['source.java', 'punctuation.bracket.square.java']});
    expect(tokens[14]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('String[] list = new String[]{"hi", "abc", "etc"};'));

    expect(tokens[8]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[10]).toEqual({value: 'String', scopes: ['source.java', 'storage.type.object.array.java']});
    expect(tokens[13]).toEqual({value: '{', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.section.array-initializer.begin.bracket.curly.java']});
    expect(tokens[14]).toEqual({value: '"', scopes: ['source.java', 'meta.array-initializer.java', 'string.quoted.double.java', 'punctuation.definition.string.begin.java']});
    expect(tokens[15]).toEqual({value: 'hi', scopes: ['source.java', 'meta.array-initializer.java', 'string.quoted.double.java']});
    expect(tokens[16]).toEqual({value: '"', scopes: ['source.java', 'meta.array-initializer.java', 'string.quoted.double.java', 'punctuation.definition.string.end.java']});
    expect(tokens[17]).toEqual({value: ',', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.separator.delimiter.java']});
    expect(tokens[18]).toEqual({value: ' ', scopes: ['source.java', 'meta.array-initializer.java']});
    expect(tokens[27]).toEqual({value: '}', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.section.array-initializer.end.bracket.curly.java']});
    expect(tokens[28]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('A[] arr = new A[]{new A(), new A()};'));

    expect(tokens[8]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[10]).toEqual({value: 'A', scopes: ['source.java', 'storage.type.object.array.java']});
    expect(tokens[13]).toEqual({value: '{', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.section.array-initializer.begin.bracket.curly.java']});
    expect(tokens[14]).toEqual({value: 'new', scopes: ['source.java', 'meta.array-initializer.java', 'keyword.control.new.java']});
    expect(tokens[16]).toEqual({value: 'A', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[17]).toEqual({value: '(', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[18]).toEqual({value: ')', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[21]).toEqual({value: 'new', scopes: ['source.java', 'meta.array-initializer.java', 'keyword.control.new.java']});
    expect(tokens[23]).toEqual({value: 'A', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[24]).toEqual({value: '(', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[25]).toEqual({value: ')', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[26]).toEqual({value: '}', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.section.array-initializer.end.bracket.curly.java']});
    expect(tokens[27]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('A[] arr = new A[2] { new A(), new A() };'));

    expect(tokens[8]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[10]).toEqual({value: 'A', scopes: ['source.java', 'storage.type.object.array.java']});
    expect(tokens[15]).toEqual({value: '{', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.section.array-initializer.begin.bracket.curly.java']});
    expect(tokens[17]).toEqual({value: 'new', scopes: ['source.java', 'meta.array-initializer.java', 'keyword.control.new.java']});
    expect(tokens[19]).toEqual({value: 'A', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[20]).toEqual({value: '(', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[21]).toEqual({value: ')', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[24]).toEqual({value: 'new', scopes: ['source.java', 'meta.array-initializer.java', 'keyword.control.new.java']});
    expect(tokens[26]).toEqual({value: 'A', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[27]).toEqual({value: '(', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[28]).toEqual({value: ')', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[30]).toEqual({value: '}', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.section.array-initializer.end.bracket.curly.java']});
    expect(tokens[31]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    let lines = grammar.tokenizeLines(`\
A[] arr = new A[2] // new A()
{ // new A()
  new A(),
  new A()
};\
`
    );

    expect(lines[0][8]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(lines[0][10]).toEqual({value: 'A', scopes: ['source.java', 'storage.type.object.array.java']});
    expect(lines[0][15]).toEqual({value: '//', scopes: ['source.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[1][0]).toEqual({value: '{', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.section.array-initializer.begin.bracket.curly.java']});
    expect(lines[1][2]).toEqual({value: '//', scopes: ['source.java', 'meta.array-initializer.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[2][1]).toEqual({value: 'new', scopes: ['source.java', 'meta.array-initializer.java', 'keyword.control.new.java']});
    expect(lines[2][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(lines[2][4]).toEqual({value: '(', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[2][5]).toEqual({value: ')', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(lines[3][1]).toEqual({value: 'new', scopes: ['source.java', 'meta.array-initializer.java', 'keyword.control.new.java']});
    expect(lines[3][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(lines[3][4]).toEqual({value: '(', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[3][5]).toEqual({value: ')', scopes: ['source.java', 'meta.array-initializer.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(lines[4][0]).toEqual({value: '}', scopes: ['source.java', 'meta.array-initializer.java', 'punctuation.section.array-initializer.end.bracket.curly.java']});
    expect(lines[4][1]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('A[] arr = {new A(), new A()};'));

    expect(tokens[8]).toEqual({value: '{', scopes: ['source.java', 'punctuation.section.block.begin.bracket.curly.java']});
    expect(tokens[9]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[11]).toEqual({value: 'A', scopes: ['source.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[12]).toEqual({value: '(', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[13]).toEqual({value: ')', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[16]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[18]).toEqual({value: 'A', scopes: ['source.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[19]).toEqual({value: '(', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[20]).toEqual({value: ')', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[21]).toEqual({value: '}', scopes: ['source.java', 'punctuation.section.block.end.bracket.curly.java']});
    expect(tokens[22]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('String a = (valid ? new Date().toString() + " : " : "");'));

    expect(tokens[15]).toEqual({value: '.', scopes: ['source.java', 'meta.method-call.java', 'punctuation.separator.period.java']});
    expect(tokens[16]).toEqual({value: 'toString', scopes: ['source.java', 'meta.method-call.java', 'entity.name.function.java']});
    expect(tokens[17]).toEqual({value: '(', scopes: ['source.java', 'meta.method-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[18]).toEqual({value: ')', scopes: ['source.java', 'meta.method-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[20]).toEqual({value: '+', scopes: ['source.java', 'keyword.operator.arithmetic.java']});
    expect(tokens[23]).toEqual({value: ' : ', scopes: ['source.java', 'string.quoted.double.java']});
    expect(tokens[26]).toEqual({value: ':', scopes: ['source.java', 'keyword.control.ternary.java']});
    expect(tokens[28]).toEqual({value: '"', scopes: ['source.java', 'string.quoted.double.java', 'punctuation.definition.string.begin.java']});
    expect(tokens[29]).toEqual({value: '"', scopes: ['source.java', 'string.quoted.double.java', 'punctuation.definition.string.end.java']});

    ({tokens} = grammar.tokenizeLine('String[] list = new String[variable];'));

    expect(tokens[12]).toEqual({value: 'variable', scopes: ['source.java']});

    ({tokens} = grammar.tokenizeLine('Point point = new Point(1, 4);'));

    expect(tokens[6]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[8]).toEqual({value: 'Point', scopes: ['source.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[9]).toEqual({value: '(', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[14]).toEqual({value: ')', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[15]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('Point point = true ? new Point(1, 4) : new Point(0, 0);'));

    expect(tokens[8]).toEqual({value: '?', scopes: ['source.java', 'keyword.control.ternary.java']});
    expect(tokens[10]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[12]).toEqual({value: 'Point', scopes: ['source.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[13]).toEqual({value: '(', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[18]).toEqual({value: ')', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[20]).toEqual({value: ':', scopes: ['source.java', 'keyword.control.ternary.java']});
    expect(tokens[22]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[31]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('Point point = new Random() ? new Point(1, 4) : new Point(0, 0);'));

    expect(tokens[12]).toEqual({value: '?', scopes: ['source.java', 'keyword.control.ternary.java']});
    expect(tokens[14]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[16]).toEqual({value: 'Point', scopes: ['source.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[17]).toEqual({value: '(', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(tokens[22]).toEqual({value: ')', scopes: ['source.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[24]).toEqual({value: ':', scopes: ['source.java', 'keyword.control.ternary.java']});
    expect(tokens[26]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[35]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('map.put(key, new Value(value), "extra");'));

    expect(tokens[12]).toEqual({value: ')', scopes: ['source.java', 'meta.method-call.java', 'meta.function-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});
    expect(tokens[13]).toEqual({value: ',', scopes: ['source.java', 'meta.method-call.java', 'punctuation.separator.delimiter.java']});
    expect(tokens[15]).toEqual({value: '"', scopes: ['source.java', 'meta.method-call.java', 'string.quoted.double.java', 'punctuation.definition.string.begin.java']});
    expect(tokens[18]).toEqual({value: ')', scopes: ['source.java', 'meta.method-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});

    ({tokens} = grammar.tokenizeLine('new /* JPanel() */ Point();'));

    expect(tokens[0]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(tokens[2]).toEqual({value: '/*', scopes: ['source.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(tokens[4]).toEqual({value: '*/', scopes: ['source.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(tokens[6]).toEqual({value: 'Point', scopes: ['source.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(tokens[9]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    ({tokens} = grammar.tokenizeLine('new Point() /* JPanel() */ { };'));

    expect(tokens[10]).toEqual({value: '{', scopes: ['source.java', 'meta.inner-class.java', 'punctuation.section.inner-class.begin.bracket.curly.java']});
    expect(tokens[11]).toEqual({value: ' ', scopes: ['source.java', 'meta.inner-class.java']});
    expect(tokens[12]).toEqual({value: '}', scopes: ['source.java', 'meta.inner-class.java', 'punctuation.section.inner-class.end.bracket.curly.java']});

    lines = grammar.tokenizeLines(`\
new Point() // JPanel()
{ }\
`
    );

    expect(lines[1][0]).toEqual({value: '{', scopes: ['source.java', 'meta.inner-class.java', 'punctuation.section.inner-class.begin.bracket.curly.java']});
    expect(lines[1][1]).toEqual({value: ' ', scopes: ['source.java', 'meta.inner-class.java']});
    expect(lines[1][2]).toEqual({value: '}', scopes: ['source.java', 'meta.inner-class.java', 'punctuation.section.inner-class.end.bracket.curly.java']});

    lines = grammar.tokenizeLines(`\
map.put(key,
  new Value(value)
);\
`
    );

    expect(lines[2][0]).toEqual({value: ')', scopes: ['source.java', 'meta.method-call.java', 'punctuation.definition.parameters.end.bracket.round.java']});

    lines = grammar.tokenizeLines(`\
Point point = new Point()
{
  public void something(x)
  {
    int y = x;
  }
};\
`
    );

    expect(lines[0][6]).toEqual({value: 'new', scopes: ['source.java', 'keyword.control.new.java']});
    expect(lines[0][8]).toEqual({value: 'Point', scopes: ['source.java', 'meta.function-call.java', 'entity.name.function.java']});
    expect(lines[1][0]).toEqual({value: '{', scopes: ['source.java', 'meta.inner-class.java', 'punctuation.section.inner-class.begin.bracket.curly.java']});
    expect(lines[2][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.inner-class.java', 'meta.method.java', 'storage.modifier.java']});
    expect(lines[4][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.inner-class.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[6][0]).toEqual({value: '}', scopes: ['source.java', 'meta.inner-class.java', 'punctuation.section.inner-class.end.bracket.curly.java']});
    expect(lines[6][1]).toEqual({value: ';', scopes: ['source.java', 'punctuation.terminator.java']});

    // See issue https://github.com/atom/language-java/issues/192
    lines = grammar.tokenizeLines(`\
class A {
  void func() {
    long a = new Date().getTime() + start.getTime();
    long b = new Date().getTime() - start.getTime();
    long c = new Date().getTime() * start.getTime();
    long d = new Date().getTime() / start.getTime();
    long e = new Date().getTime() & start.getTime();
    long f = new Date().getTime() | start.getTime();
    long g = new Date().getTime() ^ start.getTime();
    boolean g = new Date().getTime() == start.getTime();
    boolean h = new Date().getTime() != start.getTime();
  }
}\
`
    );

    const expected = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java'];

    expect(lines[2][19]).toEqual({value: 'start', scopes: expected});
    expect(lines[3][19]).toEqual({value: 'start', scopes: expected});
    expect(lines[4][19]).toEqual({value: 'start', scopes: expected});
    expect(lines[5][19]).toEqual({value: 'start', scopes: expected});
    expect(lines[6][19]).toEqual({value: 'start', scopes: expected});
    expect(lines[7][19]).toEqual({value: 'start', scopes: expected});
    expect(lines[8][19]).toEqual({value: 'start', scopes: expected});
    expect(lines[9][19]).toEqual({value: 'start', scopes: expected});
    expect(lines[10][19]).toEqual({value: 'start', scopes: expected});
  });

  it('checks that accessor + new operator do not introduce extra scopes', function() {
    // See issue https://github.com/atom/language-java/issues/180
    const lines = grammar.tokenizeLines(`\
public class A {
  void f() {
    int a = 1;
    g(education[new Random()]);
    g(education[new Random()]);
    g(education[new Random()]);
    g(education[new Random()]);
    g(education[new Random()]);
    g(education[new Random()]);
    g(education[new Random()]);
    g(education[new Random()]);
    int a = 1;
  }

  void g(Object o) {
    int a = 1;
  }
}\
`
    );

    const expected = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.function-call.java', 'entity.name.function.java'];

    expect(lines[3][1]).toEqual({value: 'g', scopes: expected});
    expect(lines[4][1]).toEqual({value: 'g', scopes: expected});
    expect(lines[5][1]).toEqual({value: 'g', scopes: expected});
    expect(lines[6][1]).toEqual({value: 'g', scopes: expected});
    expect(lines[7][1]).toEqual({value: 'g', scopes: expected});
    expect(lines[8][1]).toEqual({value: 'g', scopes: expected});
    expect(lines[9][1]).toEqual({value: 'g', scopes: expected});
    expect(lines[10][1]).toEqual({value: 'g', scopes: expected});
    expect(lines[15][3]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
});

  it('tokenizes the `instanceof` operator', function() {
    const {tokens} = grammar.tokenizeLine('instanceof');

    expect(tokens[0]).toEqual({value: 'instanceof', scopes: ['source.java', 'keyword.operator.instanceof.java']});
});

  it('tokenizes the `instanceof` operator in assertions and if statements', function() {
    const lines = grammar.tokenizeLines(`\
class Test {
  void func() {
    A a = new A();
    if (a instanceof A) {
      // do something
    }
    assert a instanceof A;
  }
}\
`
    );

    const scopeStack = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java'];
    expect(lines[3][5]).toEqual({value: 'instanceof', scopes: scopeStack.concat(['keyword.operator.instanceof.java'])});
    expect(lines[6][4]).toEqual({value: 'instanceof', scopes: scopeStack.concat(['meta.declaration.assertion.java', 'keyword.operator.instanceof.java'])});
});

  it('tokenizes the `instanceof` operator in return statements and variable definitions', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  boolean func1() {
    return aa instanceof Test;
  }

  boolean func2() {
    return aaBbb instanceof Test;
  }

  void func3() {
    boolean test = aaBbb instanceof Test;
  }
}\
`
    );

    const expected = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'keyword.operator.instanceof.java'];

    expect(lines[2][3]).toEqual({value: 'instanceof', scopes: expected});
    expect(lines[6][3]).toEqual({value: 'instanceof', scopes: expected});
    expect(lines[10][7]).toEqual({value: 'instanceof', scopes: expected});
  });

  it('tokenizes class fields', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  private int variable;
  public Object[] variable;
  private int variable = 3;
  private int variable1, variable2, variable3;
  private int variable1, variable2 = variable;
  private int variable;// = 3;
  public String CAPITALVARIABLE;
  private int[][] somevar = new int[10][12];
  private int 1invalid;
  private Integer $tar_war$;
  double a,b,c;double d;
  String[] primitiveArray;
  private Foo<int[]> hi;
  Foo<int[]> hi;
  String [] var1;
  List <String> var2;
}\
`
    );

    expect(lines[2][1]).toEqual({value: 'private', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.modifier.java']});
    expect(lines[2][2]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java']});
    expect(lines[2][3]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[2][4]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java']});
    expect(lines[2][5]).toEqual({value: 'variable', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[2][6]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});

    expect(lines[3][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.modifier.java']});
    expect(lines[3][3]).toEqual({value: 'Object', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.object.array.java']});
    expect(lines[3][4]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[3][5]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});

    expect(lines[4][5]).toEqual({value: 'variable', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[4][6]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java']});
    expect(lines[4][7]).toEqual({value: '=', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'keyword.operator.assignment.java']});
    expect(lines[4][8]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java']});
    expect(lines[4][9]).toEqual({value: '3', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'constant.numeric.decimal.java']});
    expect(lines[4][10]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});

    expect(lines[5][5]).toEqual({value: 'variable1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[5][6]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.delimiter.java']});
    expect(lines[5][7]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java']});
    expect(lines[5][8]).toEqual({value: 'variable2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[5][11]).toEqual({value: 'variable3', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[5][12]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});

    expect(lines[6][5]).toEqual({value: 'variable1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[6][8]).toEqual({value: 'variable2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[6][10]).toEqual({value: '=', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'keyword.operator.assignment.java']});
    expect(lines[6][11]).toEqual({value: ' variable', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java']});
    expect(lines[6][12]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});

    expect(lines[7][5]).toEqual({value: 'variable', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[7][6]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});
    expect(lines[7][7]).toEqual({value: '//', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});

    expect(lines[8][5]).toEqual({value: 'CAPITALVARIABLE', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[8][6]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});

    expect(lines[9][3]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.array.java']});
    expect(lines[9][4]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[9][5]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[9][6]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[9][7]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[9][9]).toEqual({value: 'somevar', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[9][11]).toEqual({value: '=', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'keyword.operator.assignment.java']});
    expect(lines[9][15]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.type.primitive.array.java']});
    expect(lines[9][16]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.bracket.square.java']});
    expect(lines[9][17]).toEqual({value: '10', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'constant.numeric.decimal.java']});
    expect(lines[9][18]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.bracket.square.java']});
    expect(lines[9][19]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.bracket.square.java']});
    expect(lines[9][20]).toEqual({value: '12', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'constant.numeric.decimal.java']});
    expect(lines[9][21]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.bracket.square.java']});

    expect(lines[10][3]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.type.primitive.java']});
    expect(lines[10][4]).toEqual({value: ' 1invalid', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java']});

    expect(lines[11][3]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[11][5]).toEqual({value: '$tar_war$', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});

    expect(lines[12][1]).toEqual({value: 'double', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[12][3]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[12][4]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.delimiter.java']});
    expect(lines[12][5]).toEqual({value: 'b', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[12][6]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.delimiter.java']});
    expect(lines[12][7]).toEqual({value: 'c', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[12][8]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});
    expect(lines[12][9]).toEqual({value: 'double', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[12][11]).toEqual({value: 'd', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[12][12]).toEqual({value: ';', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.terminator.java']});

    expect(lines[13][1]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.object.array.java']});
    expect(lines[13][2]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[13][3]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[13][5]).toEqual({value: 'primitiveArray', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});

    expect(lines[14][1]).toEqual({value: 'private', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.modifier.java']});
    expect(lines[14][3]).toEqual({value: 'Foo', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[14][4]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[14][5]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.array.java']});
    expect(lines[14][6]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[14][7]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[14][8]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});

    expect(lines[15][1]).toEqual({value: 'Foo', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[15][2]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[15][3]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.array.java']});
    expect(lines[15][4]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[15][5]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[15][6]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});

    expect(lines[16][1]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.object.array.java']});
    expect(lines[16][3]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[16][4]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[16][6]).toEqual({value: 'var1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});

    expect(lines[17][1]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[17][3]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[17][4]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[17][5]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[17][7]).toEqual({value: 'var2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
});

  it('tokenizes class fields with complex definitions', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  private String a = func();
  private String b = a + "a()" + a() + "" + "a();" + "" + a() + abc + b() + "b();";
  private String c = "a / a();";
  private int d[] = a + "a();" + func();

  int abcd() {
    return 1;
  }
}\
`
    );

    const scopeStack = ['source.java', 'meta.class.java', 'meta.class.body.java'];

    expect(lines[1][1]).toEqual({value: 'private', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[1][3]).toEqual({value: 'String', scopes: scopeStack.concat(['meta.definition.variable.java', 'storage.type.java'])});
    expect(lines[1][5]).toEqual({value: 'a', scopes: scopeStack.concat(['meta.definition.variable.java', 'variable.other.definition.java'])});
    expect(lines[1][7]).toEqual({value: '=', scopes: scopeStack.concat(['keyword.operator.assignment.java'])});
    expect(lines[1][9]).toEqual({value: 'func', scopes: scopeStack.concat(['meta.function-call.java', 'entity.name.function.java'])});

    expect(lines[2][1]).toEqual({value: 'private', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[2][3]).toEqual({value: 'String', scopes: scopeStack.concat(['meta.definition.variable.java', 'storage.type.java'])});
    expect(lines[2][5]).toEqual({value: 'b', scopes: scopeStack.concat(['meta.definition.variable.java', 'variable.other.definition.java'])});
    expect(lines[2][7]).toEqual({value: '=', scopes: scopeStack.concat(['keyword.operator.assignment.java'])});
    expect(lines[2][8]).toEqual({value: ' a ', scopes: scopeStack});
    expect(lines[2][12]).toEqual({value: 'a()', scopes: scopeStack.concat(['string.quoted.double.java'])});
    expect(lines[2][17]).toEqual({value: 'a', scopes: scopeStack.concat(['meta.function-call.java', 'entity.name.function.java'])});
    expect(lines[2][29]).toEqual({value: 'a();', scopes: scopeStack.concat(['string.quoted.double.java'])});
    expect(lines[2][39]).toEqual({value: 'a', scopes: scopeStack.concat(['meta.function-call.java', 'entity.name.function.java'])});
    expect(lines[2][44]).toEqual({value: ' abc ', scopes: scopeStack});
    expect(lines[2][47]).toEqual({value: 'b', scopes: scopeStack.concat(['meta.function-call.java', 'entity.name.function.java'])});
    expect(lines[2][54]).toEqual({value: 'b();', scopes: scopeStack.concat(['string.quoted.double.java'])});

    expect(lines[3][1]).toEqual({value: 'private', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[3][3]).toEqual({value: 'String', scopes: scopeStack.concat(['meta.definition.variable.java', 'storage.type.java'])});
    expect(lines[3][5]).toEqual({value: 'c', scopes: scopeStack.concat(['meta.definition.variable.java', 'variable.other.definition.java'])});
    expect(lines[3][7]).toEqual({value: '=', scopes: scopeStack.concat(['keyword.operator.assignment.java'])});
    expect(lines[3][10]).toEqual({value: 'a / a();', scopes: scopeStack.concat(['string.quoted.double.java'])});

    expect(lines[4][1]).toEqual({value: 'private', scopes: scopeStack.concat(['storage.modifier.java'])});
    expect(lines[4][3]).toEqual({value: 'int', scopes: scopeStack.concat(['meta.definition.variable.java', 'storage.type.primitive.java'])});
    expect(lines[4][5]).toEqual({value: 'd', scopes: scopeStack.concat(['meta.definition.variable.java', 'variable.other.definition.java'])});
    expect(lines[4][6]).toEqual({value: '[', scopes: scopeStack.concat(['meta.definition.variable.java', 'punctuation.bracket.square.java'])});
    expect(lines[4][7]).toEqual({value: ']', scopes: scopeStack.concat(['meta.definition.variable.java', 'punctuation.bracket.square.java'])});
    expect(lines[4][9]).toEqual({value: '=', scopes: scopeStack.concat(['keyword.operator.assignment.java'])});
    expect(lines[4][10]).toEqual({value: ' a ', scopes: scopeStack});
    expect(lines[4][14]).toEqual({value: 'a();', scopes: scopeStack.concat(['string.quoted.double.java'])});
    expect(lines[4][19]).toEqual({value: 'func', scopes: scopeStack.concat(['meta.function-call.java', 'entity.name.function.java'])});

    expect(lines[6][1]).toEqual({value: 'int', scopes: scopeStack.concat(['meta.method.java', 'meta.method.return-type.java', 'storage.type.primitive.java'])});
    expect(lines[6][3]).toEqual({value: 'abcd', scopes: scopeStack.concat(['meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java'])});
});

  it('tokenizes qualified storage types', function() {
    const lines = grammar.tokenizeLines(`\
class Test {
  private Test.Double something;
  java.util.Set<java.util.List<K>> varA = null;
  java.lang.String a = null;
  java.util.List<Integer> b = new java.util.ArrayList<Integer>();
  java.lang.String[] arr;
}\
`
    );

    expect(lines[1][3]).toEqual({value: 'Test', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[1][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[1][5]).toEqual({value: 'Double', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[1][7]).toEqual({value: 'something', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});

    expect(lines[2][1]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[2][3]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[2][5]).toEqual({value: 'Set', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][6]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][7]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[2][8]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[2][9]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[2][10]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[2][11]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[2][12]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][13]).toEqual({value: 'K', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[2][14]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[2][15]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});

    expect(lines[3][1]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[3][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[3][3]).toEqual({value: 'lang', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[3][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[3][5]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});

    expect(lines[4][1]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[4][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[4][3]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[4][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[4][5]).toEqual({value: 'List', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[4][6]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[4][7]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
    expect(lines[4][8]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java']});
    expect(lines[4][16]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.type.java']});
    expect(lines[4][17]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.separator.period.java']});
    expect(lines[4][18]).toEqual({value: 'util', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.type.java']});
    expect(lines[4][19]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.separator.period.java']});
    expect(lines[4][20]).toEqual({value: 'ArrayList', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.type.java']});
    expect(lines[4][21]).toEqual({value: '<', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.bracket.angle.java']});
    expect(lines[4][22]).toEqual({value: 'Integer', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.type.generic.java']});
    expect(lines[4][23]).toEqual({value: '>', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.bracket.angle.java']});

    expect(lines[5][1]).toEqual({value: 'java', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[5][2]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[5][3]).toEqual({value: 'lang', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[5][4]).toEqual({value: '.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.separator.period.java']});
    expect(lines[5][5]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.object.array.java']});
    expect(lines[5][6]).toEqual({value: '[', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
    expect(lines[5][7]).toEqual({value: ']', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'punctuation.bracket.square.java']});
});

  it('tokenizes storage types with underscore', function() {
    const lines = grammar.tokenizeLines(`\
class _Class {
  static _String var1;
  static _abc._abc._Class var2;
  static _abc._abc._Generic<_String> var3;
}\
`
    );

    expect(lines[1][3]).toEqual({value: '_String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});

    expect(lines[2][3]).toEqual({value: '_abc', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][5]).toEqual({value: '_abc', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[2][7]).toEqual({value: '_Class', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});

    expect(lines[3][3]).toEqual({value: '_abc', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[3][5]).toEqual({value: '_abc', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[3][7]).toEqual({value: '_Generic', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.java']});
    expect(lines[3][9]).toEqual({value: '_String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.generic.java']});
});

  it('tokenizes try-catch-finally blocks', function() {
    const lines = grammar.tokenizeLines(`\
class Test {
  public void fn() {
    try {
      errorProneMethod();
    } catch (RuntimeException re) {
      handleRuntimeException(re);
    } catch (Exception e) {
      String variable = "assigning for some reason";
    } finally {
      // Relax, it's over
      new Thingie().call();
    }
  }
}\
`
    );

    const scopeStack = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java'];

    scopeStack.push('meta.try.java');
    expect(lines[2][1]).toEqual({value: 'try', scopes: scopeStack.concat(['keyword.control.try.java'])});
    expect(lines[2][3]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.try.begin.bracket.curly.java'])});

    scopeStack.push('meta.try.body.java');
    expect(lines[3][1]).toEqual({value: 'errorProneMethod', scopes: scopeStack.concat(['meta.function-call.java', 'entity.name.function.java'])});

    scopeStack.pop();
    expect(lines[4][1]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.try.end.bracket.curly.java'])});
    scopeStack.pop();
    scopeStack.push('meta.catch.java');
    expect(lines[4][3]).toEqual({value: 'catch', scopes: scopeStack.concat(['keyword.control.catch.java'])});
    expect(lines[4][5]).toEqual({value: '(', scopes: scopeStack.concat(['punctuation.definition.parameters.begin.bracket.round.java'])});
    scopeStack.push('meta.catch.parameters.java');
    expect(lines[4][6]).toEqual({value: 'RuntimeException', scopes: scopeStack.concat(['storage.type.java'])});
    expect(lines[4][8]).toEqual({value: 're', scopes: scopeStack.concat(['variable.parameter.java'])});
    scopeStack.pop();
    expect(lines[4][9]).toEqual({value: ')', scopes: scopeStack.concat(['punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[4][11]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.catch.begin.bracket.curly.java'])});

    scopeStack.push('meta.catch.body.java');
    expect(lines[5][1]).toEqual({value: 'handleRuntimeException', scopes: scopeStack.concat(['meta.function-call.java', 'entity.name.function.java'])});

    scopeStack.pop();
    expect(lines[6][1]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.catch.end.bracket.curly.java'])});
    expect(lines[6][3]).toEqual({value: 'catch', scopes: scopeStack.concat(['keyword.control.catch.java'])});
    expect(lines[6][5]).toEqual({value: '(', scopes: scopeStack.concat(['punctuation.definition.parameters.begin.bracket.round.java'])});
    scopeStack.push('meta.catch.parameters.java');
    expect(lines[6][6]).toEqual({value: 'Exception', scopes: scopeStack.concat(['storage.type.java'])});
    expect(lines[6][8]).toEqual({value: 'e', scopes: scopeStack.concat(['variable.parameter.java'])});
    scopeStack.pop();
    expect(lines[6][9]).toEqual({value: ')', scopes: scopeStack.concat(['punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[6][11]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.catch.begin.bracket.curly.java'])});

    scopeStack.push('meta.catch.body.java');
    expect(lines[7][1]).toEqual({value: 'String', scopes: scopeStack.concat(['meta.definition.variable.java', 'storage.type.java'])});
    expect(lines[7][3]).toEqual({value: 'variable', scopes: scopeStack.concat(['meta.definition.variable.java', 'variable.other.definition.java'])});

    scopeStack.pop();
    expect(lines[8][1]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.catch.end.bracket.curly.java'])});
    scopeStack.pop();
    scopeStack.push('meta.finally.java');
    expect(lines[8][3]).toEqual({value: 'finally', scopes: scopeStack.concat(['keyword.control.finally.java'])});
    expect(lines[8][5]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.finally.begin.bracket.curly.java'])});

    scopeStack.push('meta.finally.body.java');
    expect(lines[9][1]).toEqual({value: '//', scopes: scopeStack.concat(['comment.line.double-slash.java', 'punctuation.definition.comment.java'])});

    expect(lines[10][1]).toEqual({value: 'new', scopes: scopeStack.concat(['keyword.control.new.java'])});

    scopeStack.pop();
    expect(lines[11][1]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.finally.end.bracket.curly.java'])});
});

  it('tokenizes nested try-catch-finally blocks', function() {
    const lines = grammar.tokenizeLines(`\
class Test {
  public void fn() {
    try {
      try {
        String nested;
      } catch (Exception e) {
        handleNestedException();
      }
    } catch (RuntimeException re) {}
  }
}\
`
    );

    const scopeStack = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java'];

    scopeStack.push('meta.try.java');
    expect(lines[2][1]).toEqual({value: 'try', scopes: scopeStack.concat(['keyword.control.try.java'])});
    expect(lines[2][2]).toEqual({value: ' ', scopes: scopeStack});
    expect(lines[2][3]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.try.begin.bracket.curly.java'])});

    scopeStack.push('meta.try.body.java', 'meta.try.java');
    expect(lines[3][1]).toEqual({value: 'try', scopes: scopeStack.concat(['keyword.control.try.java'])});
    expect(lines[3][2]).toEqual({value: ' ', scopes: scopeStack});
    expect(lines[3][3]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.try.begin.bracket.curly.java'])});

    scopeStack.push('meta.try.body.java');
    expect(lines[4][1]).toEqual({value: 'String', scopes: scopeStack.concat(['meta.definition.variable.java', 'storage.type.java'])});
    expect(lines[4][3]).toEqual({value: 'nested', scopes: scopeStack.concat(['meta.definition.variable.java', 'variable.other.definition.java'])});

    scopeStack.pop();
    expect(lines[5][1]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.try.end.bracket.curly.java'])});
    scopeStack.pop();
    expect(lines[5][2]).toEqual({value: ' ', scopes: scopeStack});
    scopeStack.push('meta.catch.java');
    expect(lines[5][3]).toEqual({value: 'catch', scopes: scopeStack.concat(['keyword.control.catch.java'])});
    expect(lines[5][4]).toEqual({value: ' ', scopes: scopeStack});
    expect(lines[5][5]).toEqual({value: '(', scopes: scopeStack.concat(['punctuation.definition.parameters.begin.bracket.round.java'])});
    scopeStack.push('meta.catch.parameters.java');
    expect(lines[5][6]).toEqual({value: 'Exception', scopes: scopeStack.concat(['storage.type.java'])});
    expect(lines[5][7]).toEqual({value: ' ', scopes: scopeStack});
    expect(lines[5][8]).toEqual({value: 'e', scopes: scopeStack.concat(['variable.parameter.java'])});
    scopeStack.pop();
    expect(lines[5][9]).toEqual({value: ')', scopes: scopeStack.concat(['punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[5][10]).toEqual({value: ' ', scopes: scopeStack});
    expect(lines[5][11]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.catch.begin.bracket.curly.java'])});

    scopeStack.push('meta.catch.body.java');
    expect(lines[6][1]).toEqual({value: 'handleNestedException', scopes: scopeStack.concat(['meta.function-call.java', 'entity.name.function.java'])});

    scopeStack.pop();
    expect(lines[7][1]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.catch.end.bracket.curly.java'])});

    scopeStack.pop();
    scopeStack.pop();
    expect(lines[8][1]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.try.end.bracket.curly.java'])});
    scopeStack.pop();
    expect(lines[8][2]).toEqual({value: ' ', scopes: scopeStack});
    scopeStack.push('meta.catch.java');
    expect(lines[8][3]).toEqual({value: 'catch', scopes: scopeStack.concat(['keyword.control.catch.java'])});
    expect(lines[8][4]).toEqual({value: ' ', scopes: scopeStack});
    expect(lines[8][5]).toEqual({value: '(', scopes: scopeStack.concat(['punctuation.definition.parameters.begin.bracket.round.java'])});
    scopeStack.push('meta.catch.parameters.java');
    expect(lines[8][6]).toEqual({value: 'RuntimeException', scopes: scopeStack.concat(['storage.type.java'])});
    expect(lines[8][7]).toEqual({value: ' ', scopes: scopeStack});
    expect(lines[8][8]).toEqual({value: 're', scopes: scopeStack.concat(['variable.parameter.java'])});
    scopeStack.pop();
    expect(lines[8][9]).toEqual({value: ')', scopes: scopeStack.concat(['punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[8][10]).toEqual({value: ' ', scopes: scopeStack});
    expect(lines[8][11]).toEqual({value: '{', scopes: scopeStack.concat(['punctuation.section.catch.begin.bracket.curly.java'])});
    expect(lines[8][12]).toEqual({value: '}', scopes: scopeStack.concat(['punctuation.section.catch.end.bracket.curly.java'])});
});

  it('tokenizes try-catch blocks with resources', function() {
    const lines = grammar.tokenizeLines(`\
class Test {
  private void fn() {
    try (
      BufferedReader in = new BufferedReader();
      BufferedReader br = new BufferedReader(new FileReader(path))
    ) {
      // stuff
    }
  }
}\
`
    );

    const scopes = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.try.java'];
    expect(lines[2][1]).toEqual({value: 'try', scopes: scopes.concat(['keyword.control.try.java'])});
    expect(lines[2][2]).toEqual({value: ' ', scopes});
    expect(lines[2][3]).toEqual({value: '(', scopes: scopes.concat(['meta.try.resources.java', 'punctuation.section.try.resources.begin.bracket.round.java'])});
    expect(lines[3][1]).toEqual({value: 'BufferedReader', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'storage.type.java'])});
    expect(lines[4][1]).toEqual({value: 'BufferedReader', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'storage.type.java'])});
    expect(lines[5][1]).toEqual({value: ')', scopes: scopes.concat(['meta.try.resources.java', 'punctuation.section.try.resources.end.bracket.round.java'])});
    expect(lines[5][2]).toEqual({value: ' ', scopes});
    expect(lines[5][3]).toEqual({value: '{', scopes: scopes.concat(['punctuation.section.try.begin.bracket.curly.java'])});
});

  it('tokenizes generics with dots in try-catch with resources', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  void func() {
    try (List<java.lang.String> a = get()) {
      // do something
    }
  }
}\
`
    );

    const scopes = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.try.java'];
    expect(lines[2][1]).toEqual({value: 'try', scopes: scopes.concat(['keyword.control.try.java'])});
    expect(lines[2][3]).toEqual({value: '(', scopes: scopes.concat(['meta.try.resources.java', 'punctuation.section.try.resources.begin.bracket.round.java'])});
    expect(lines[2][4]).toEqual({value: 'List', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'storage.type.java'])});
    expect(lines[2][5]).toEqual({value: '<', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java'])});
    expect(lines[2][6]).toEqual({value: 'java', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'storage.type.generic.java'])});
    expect(lines[2][7]).toEqual({value: '.', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'punctuation.separator.period.java'])});
    expect(lines[2][8]).toEqual({value: 'lang', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'storage.type.generic.java'])});
    expect(lines[2][9]).toEqual({value: '.', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'punctuation.separator.period.java'])});
    expect(lines[2][10]).toEqual({value: 'String', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'storage.type.generic.java'])});
    expect(lines[2][11]).toEqual({value: '>', scopes: scopes.concat(['meta.try.resources.java', 'meta.definition.variable.java', 'punctuation.bracket.angle.java'])});
    expect(lines[2][20]).toEqual({value: ')', scopes: scopes.concat(['meta.try.resources.java', 'punctuation.section.try.resources.end.bracket.round.java'])});
    expect(lines[2][22]).toEqual({value: '{', scopes: scopes.concat(['punctuation.section.try.begin.bracket.curly.java'])});
});

  it('tokenizes storage modifier in catch block', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  private void method() {
    try {
      // do something
    } catch (final Exception1 ex) {
      throw new Exception2();
    }
  }
}\
`
    );

    expect(lines[5][3]).toEqual({value: 'catch', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'keyword.control.catch.java']});
    expect(lines[5][5]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[5][6]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.modifier.java']});
    expect(lines[5][8]).toEqual({value: 'Exception1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[5][10]).toEqual({value: 'ex', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'variable.parameter.java']});
    expect(lines[5][11]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.end.bracket.round.java']});
});

  it('tokenizes list of exceptions in catch block', function() {
    let lines = grammar.tokenizeLines(`\
class Test
{
  private void method() {
    try {
      // do something
    } catch (Exception1 | Exception2 err) {
      throw new Exception3();
    }
  }
}\
`
    );

    expect(lines[5][3]).toEqual({value: 'catch', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'keyword.control.catch.java']});
    expect(lines[5][5]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[5][6]).toEqual({value: 'Exception1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[5][8]).toEqual({value: '|', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'punctuation.catch.separator.java']});
    expect(lines[5][10]).toEqual({value: 'Exception2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[5][12]).toEqual({value: 'err', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'variable.parameter.java']});
    expect(lines[5][13]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.end.bracket.round.java']});

    lines = grammar.tokenizeLines(`\
class Test
{
  private void method() {
    try {
      // do something
    } catch // this is a catch
    (Exception1 |
        Exception2
      | Exception3 err) {
      throw new Exception3();
    }
  }
}\
`
    );

    expect(lines[5][3]).toEqual({value: 'catch', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'keyword.control.catch.java']});
    expect(lines[5][5]).toEqual({value: '//', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[6][1]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[6][2]).toEqual({value: 'Exception1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[6][4]).toEqual({value: '|', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'punctuation.catch.separator.java']});
    expect(lines[7][1]).toEqual({value: 'Exception2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[8][1]).toEqual({value: '|', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'punctuation.catch.separator.java']});
    expect(lines[8][3]).toEqual({value: 'Exception3', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[8][5]).toEqual({value: 'err', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'variable.parameter.java']});
    expect(lines[8][6]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.end.bracket.round.java']});
});

  it('tokenizes catch parameter in new line or with a comment in between', function() {
    let lines = grammar.tokenizeLines(`\
class Test
{
  private void method() {
    try {
      // do something
    } catch // this is a catch
    (Exception1 /* exception 1 */ |
      final Exception2 // exception 2
      err // this is a error
    /* end */) {
      throw new Exception3();
    }
  }
}\
`
    );

    expect(lines[5][3]).toEqual({value: 'catch', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'keyword.control.catch.java']});
    expect(lines[5][5]).toEqual({value: '//', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[6][1]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[6][2]).toEqual({value: 'Exception1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[6][4]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[6][8]).toEqual({value: '|', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'punctuation.catch.separator.java']});
    expect(lines[7][1]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.modifier.java']});
    expect(lines[7][3]).toEqual({value: 'Exception2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[7][5]).toEqual({value: '//', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[8][1]).toEqual({value: 'err', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'variable.parameter.java']});
    expect(lines[8][3]).toEqual({value: '//', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[9][1]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[9][4]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.end.bracket.round.java']});

    lines = grammar.tokenizeLines(`\
class Test
{
  private void method() {
    try {
      // do something
    } catch (/* comment */ Exception1 /* comment */ | final Exception2 /* comment */ err /* comment */) {
      throw new Exception3();
    }
  }
}\
`
    );

    expect(lines[5][3]).toEqual({value: 'catch', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'keyword.control.catch.java']});
    expect(lines[5][5]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[5][6]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[5][10]).toEqual({value: 'Exception1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[5][12]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[5][16]).toEqual({value: '|', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'punctuation.catch.separator.java']});
    expect(lines[5][18]).toEqual({value: 'final', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.modifier.java']});
    expect(lines[5][20]).toEqual({value: 'Exception2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'storage.type.java']});
    expect(lines[5][22]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[5][26]).toEqual({value: 'err', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'variable.parameter.java']});
    expect(lines[5][28]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[5][31]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.catch.java', 'punctuation.definition.parameters.end.bracket.round.java']});
});

  it('tokenizes list of exceptions in method throws clause', function() {
    const lines = grammar.tokenizeLines(`\
class Test {
  public void test1() throws Exception1, Exception2 {
    // throws exceptions
  }

  public void test2() throws Exception1 {
    // throws exceptions
  }
}\
`
    );

    expect(lines[1][9]).toEqual({value: 'throws', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.throwables.java', 'storage.modifier.java']});
    expect(lines[1][11]).toEqual({value: 'Exception1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.throwables.java', 'storage.type.java']});
    expect(lines[1][12]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.throwables.java', 'punctuation.separator.delimiter.java']});
    expect(lines[1][14]).toEqual({value: 'Exception2', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.throwables.java', 'storage.type.java']});
    expect(lines[1][16]).toEqual({value: '{', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'punctuation.section.method.begin.bracket.curly.java']});

    expect(lines[5][9]).toEqual({value: 'throws', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.throwables.java', 'storage.modifier.java']});
    expect(lines[5][11]).toEqual({value: 'Exception1', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.throwables.java', 'storage.type.java']});
    expect(lines[5][13]).toEqual({value: '{', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'punctuation.section.method.begin.bracket.curly.java']});
});

  it('tokenizes comment inside method body', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  private void method() {
    /** invalid javadoc comment */
    /* inline comment */
    // single-line comment
  }
}\
`
    );

    expect(lines[3][1]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[3][2]).toEqual({value: '* invalid javadoc comment ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'comment.block.java']});
    expect(lines[3][3]).toEqual({value: '*/', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'comment.block.java', 'punctuation.definition.comment.java']});

    expect(lines[4][1]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[4][2]).toEqual({value: ' inline comment ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'comment.block.java']});
    expect(lines[4][3]).toEqual({value: '*/', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'comment.block.java', 'punctuation.definition.comment.java']});

    expect(lines[5][1]).toEqual({value: '//', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[5][2]).toEqual({value: ' single-line comment', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'comment.line.double-slash.java']});
});

  it('tokenizes comment inside try-catch-finally block', function() {
    const lines = grammar.tokenizeLines(`\
try {
  // comment A
} catch (IOException /* RuntimeException */ err) {
  // comment B
} finally {
  // comment C
}\
`
    );

    expect(lines[1][1]).toEqual({value: '//', scopes: ['source.java', 'meta.try.java', 'meta.try.body.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[1][2]).toEqual({value: ' comment A', scopes: ['source.java', 'meta.try.java', 'meta.try.body.java', 'comment.line.double-slash.java']});
    expect(lines[2][7]).toEqual({value: '/*', scopes: ['source.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[2][8]).toEqual({value: ' RuntimeException ', scopes: ['source.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java']});
    expect(lines[2][9]).toEqual({value: '*/', scopes: ['source.java', 'meta.catch.java', 'meta.catch.parameters.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[3][1]).toEqual({value: '//', scopes: ['source.java', 'meta.catch.java', 'meta.catch.body.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[3][2]).toEqual({value: ' comment B', scopes: ['source.java', 'meta.catch.java', 'meta.catch.body.java', 'comment.line.double-slash.java']});
    expect(lines[5][1]).toEqual({value: '//', scopes: ['source.java', 'meta.finally.java', 'meta.finally.body.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java']});
    expect(lines[5][2]).toEqual({value: ' comment C', scopes: ['source.java', 'meta.finally.java', 'meta.finally.body.java', 'comment.line.double-slash.java']});
});

  it('tokenizes single-line javadoc comment', function() {
    const lines = grammar.tokenizeLines(`\
/** single-line javadoc comment */
class Test
{
  private int variable;
}\
`
    );

    expect(lines[0][0]).toEqual({value: '/**', scopes: ['source.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
    expect(lines[0][1]).toEqual({value: ' single-line javadoc comment ', scopes: ['source.java', 'comment.block.javadoc.java']});
    expect(lines[0][2]).toEqual({value: '*/', scopes: ['source.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
});

  it('tokenizes javadoc comment inside class body', function() {
    // this checks single line javadoc comment, but the same rules apply for multi-line one
    const lines = grammar.tokenizeLines(`\
enum Test {
  /** javadoc comment */
}

class Test {
  /** javadoc comment */
}\
`
    );

    expect(lines[1][1]).toEqual({value: '/**', scopes: ['source.java', 'meta.enum.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
    expect(lines[1][2]).toEqual({value: ' javadoc comment ', scopes: ['source.java', 'meta.enum.java', 'comment.block.javadoc.java']});
    expect(lines[1][3]).toEqual({value: '*/', scopes: ['source.java', 'meta.enum.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});

    expect(lines[5][1]).toEqual({value: '/**', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
    expect(lines[5][2]).toEqual({value: ' javadoc comment ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[5][3]).toEqual({value: '*/', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
});

  it('tokenizes empty/single character comment', function() {
    // this test checks the correct tokenizing of empty/single character comments
    // comment like /**/ should be parsed as single line comment, but /***/ should be parsed as javadoc
    const lines = grammar.tokenizeLines(`\
/**/ int a = 1;
/**/ int b = 1;
/**/ int c = 1;
/**/ int d = 1;

/***/ int e = 1;
/**/ int f = 1;
/** */ int g = 1;
/* */ int h = 1;\
`
    );

    expect(lines[0][0]).toEqual({value: '/**/', scopes: ['source.java', 'comment.block.empty.java', 'punctuation.definition.comment.java']});
    expect(lines[0][2]).toEqual({value: 'int', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[1][0]).toEqual({value: '/**/', scopes: ['source.java', 'comment.block.empty.java', 'punctuation.definition.comment.java']});
    expect(lines[1][2]).toEqual({value: 'int', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[2][0]).toEqual({value: '/**/', scopes: ['source.java', 'comment.block.empty.java', 'punctuation.definition.comment.java']});
    expect(lines[2][2]).toEqual({value: 'int', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[3][0]).toEqual({value: '/**/', scopes: ['source.java', 'comment.block.empty.java', 'punctuation.definition.comment.java']});
    expect(lines[3][2]).toEqual({value: 'int', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});

    expect(lines[5][0]).toEqual({value: '/**', scopes: ['source.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
    expect(lines[5][1]).toEqual({value: '*/', scopes: ['source.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
    expect(lines[6][0]).toEqual({value: '/**/', scopes: ['source.java', 'comment.block.empty.java', 'punctuation.definition.comment.java']});
    expect(lines[6][2]).toEqual({value: 'int', scopes: ['source.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[7][0]).toEqual({value: '/**', scopes: ['source.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
    expect(lines[7][2]).toEqual({value: '*/', scopes: ['source.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
    expect(lines[8][0]).toEqual({value: '/*', scopes: ['source.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[8][2]).toEqual({value: '*/', scopes: ['source.java', 'comment.block.java', 'punctuation.definition.comment.java']});
});

  it('tokenizes inline comment inside method signature', function() {
    // this checks usage of inline /*...*/ comments mixing with parameters
    const lines = grammar.tokenizeLines(`\
class A
{
  public A(int a, /* String b,*/ boolean c) { }

  public void methodA(int a /*, String b */) { }

  private void methodB(/* int a, */String b) { }

  protected void methodC(/* comment */) { }
}\
`
    );

    expect(lines[2][1]).toEqual({value: 'public', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'storage.modifier.java']});
    expect(lines[2][3]).toEqual({value: 'A', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'entity.name.function.java']});
    expect(lines[2][4]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[2][5]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.primitive.java']});
    expect(lines[2][7]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'variable.parameter.java']});
    expect(lines[2][8]).toEqual({value: ',', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.separator.delimiter.java']});
    expect(lines[2][10]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[2][11]).toEqual({value: ' String b,', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java']});
    expect(lines[2][12]).toEqual({value: '*/', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[2][14]).toEqual({value: 'boolean', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.primitive.java']});
    expect(lines[2][16]).toEqual({value: 'c', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'variable.parameter.java']});
    expect(lines[2][17]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java']});

    expect(lines[4][6]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[4][7]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.primitive.java']});
    expect(lines[4][9]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'variable.parameter.java']});
    expect(lines[4][11]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[4][12]).toEqual({value: ', String b ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java']});
    expect(lines[4][13]).toEqual({value: '*/', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[4][14]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java']});

    expect(lines[6][6]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[6][7]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[6][8]).toEqual({value: ' int a, ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java']});
    expect(lines[6][9]).toEqual({value: '*/', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[6][10]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'storage.type.java']});
    expect(lines[6][12]).toEqual({value: 'b', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'variable.parameter.java']});
    expect(lines[6][13]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java']});

    expect(lines[8][6]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java']});
    expect(lines[8][7]).toEqual({value: '/*', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[8][8]).toEqual({value: ' comment ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java']});
    expect(lines[8][9]).toEqual({value: '*/', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'comment.block.java', 'punctuation.definition.comment.java']});
    expect(lines[8][10]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java']});
});

  it('tokenizes multi-line basic javadoc comment', function() {
    const lines = grammar.tokenizeLines(`\
/**
 * @author John Smith
 * @deprecated description
 * @see reference
 * @since version
 * @version version
 */
class Test { }\
`
    );

    expect(lines[0][0]).toEqual({value: '/**', scopes: ['source.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});

    expect(lines[1][1]).toEqual({value: '@author', scopes: ['source.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[1][2]).toEqual({value: ' John Smith', scopes: ['source.java', 'comment.block.javadoc.java']});

    expect(lines[2][1]).toEqual({value: '@deprecated', scopes: ['source.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[2][2]).toEqual({value: ' description', scopes: ['source.java', 'comment.block.javadoc.java']});

    expect(lines[3][1]).toEqual({value: '@see', scopes: ['source.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[3][2]).toEqual({value: ' reference', scopes: ['source.java', 'comment.block.javadoc.java']});

    expect(lines[4][1]).toEqual({value: '@since', scopes: ['source.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[4][2]).toEqual({value: ' version', scopes: ['source.java', 'comment.block.javadoc.java']});

    expect(lines[5][1]).toEqual({value: '@version', scopes: ['source.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[5][2]).toEqual({value: ' version', scopes: ['source.java', 'comment.block.javadoc.java']});

    expect(lines[6][0]).toEqual({value: ' ', scopes: ['source.java', 'comment.block.javadoc.java']});
    expect(lines[6][1]).toEqual({value: '*/', scopes: ['source.java', 'comment.block.javadoc.java', 'punctuation.definition.comment.java']});
});

  it('tokenizes `param` javadoc comment', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  /**
   * Increment number.
   * @param num value to increment.
   */
  public void inc(int num) {
    num += 1;
  }
}\
`
    );

    expect(lines[4][1]).toEqual({value: '@param', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[4][3]).toEqual({value: 'num', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'variable.parameter.java']});
    expect(lines[4][4]).toEqual({value: ' value to increment.', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
});

  it('tokenizes `exception`/`throws` javadoc comment', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  /**
   * @throws IllegalStateException reason
   * @exception IllegalStateException reason
   */
  public void fail() { throw new IllegalStateException(); }
}\
`
    );

    expect(lines[3][1]).toEqual({value: '@throws', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[3][3]).toEqual({value: 'IllegalStateException', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'entity.name.type.class.java']});
    expect(lines[3][4]).toEqual({value: ' reason', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});

    expect(lines[4][1]).toEqual({value: '@exception', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[4][3]).toEqual({value: 'IllegalStateException', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'entity.name.type.class.java']});
    expect(lines[4][4]).toEqual({value: ' reason', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
});

  it('tokenizes `link` javadoc comment', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  /**
   * Use {@link #method()}
   * Use {@link #method(int a)}
   * Use {@link Class#method(int a)}
   * Use {@link Class#method (int a, int b)}
   * @link #method()
   * Use {@link Class#method$(int a) label {@link Class#method()}}
   * Use {@link String#charAt(int)} {@link String#chars()}
   */
  public int test() { return -1; }
}\
`
    );

    expect(lines[3][2]).toEqual({value: '@link', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[3][3]).toEqual({value: ' #', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[3][4]).toEqual({value: 'method()', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'variable.parameter.java']});

    expect(lines[4][2]).toEqual({value: '@link', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[4][3]).toEqual({value: ' #', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[4][4]).toEqual({value: 'method(int a)', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'variable.parameter.java']});

    expect(lines[5][2]).toEqual({value: '@link', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[5][3]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[5][4]).toEqual({value: 'Class', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'entity.name.type.class.java']});
    expect(lines[5][5]).toEqual({value: '#', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[5][6]).toEqual({value: 'method(int a)', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'variable.parameter.java']});

    expect(lines[6][4]).toEqual({value: 'Class', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'entity.name.type.class.java']});
    expect(lines[6][5]).toEqual({value: '#', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[6][6]).toEqual({value: 'method (int a, int b)', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'variable.parameter.java']});

    expect(lines[7][0]).toEqual({value: '   * @link #method()', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});

    expect(lines[8][2]).toEqual({value: '@link', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[8][3]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[8][4]).toEqual({value: 'Class', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'entity.name.type.class.java']});
    expect(lines[8][5]).toEqual({value: '#', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[8][6]).toEqual({value: 'method$(int a)', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'variable.parameter.java']});
    expect(lines[8][7]).toEqual({value: ' label {@link Class#method()}', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});

    expect(lines[9][2]).toEqual({value: '@link', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[9][3]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[9][4]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'entity.name.type.class.java']});
    expect(lines[9][5]).toEqual({value: '#', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[9][6]).toEqual({value: 'charAt(int)', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'variable.parameter.java']});
    expect(lines[9][10]).toEqual({value: '@link', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'keyword.other.documentation.javadoc.java']});
    expect(lines[9][11]).toEqual({value: ' ', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[9][12]).toEqual({value: 'String', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'entity.name.type.class.java']});
    expect(lines[9][13]).toEqual({value: '#', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java']});
    expect(lines[9][14]).toEqual({value: 'chars()', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'comment.block.javadoc.java', 'variable.parameter.java']});
});


  it('tokenizes class-body block initializer', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  public static HashSet<Integer> set = new HashSet<Integer>();
  {
    int a = 1;
    set.add(a);
  }
}\
`
    );

    expect(lines[3][1]).toEqual({value: '{', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.section.block.begin.bracket.curly.java']});
    expect(lines[4][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[4][3]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[5][1]).toEqual({value: 'set', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'variable.other.object.java']});
    expect(lines[5][3]).toEqual({value: 'add', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method-call.java', 'entity.name.function.java']});
    expect(lines[6][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.section.block.end.bracket.curly.java']});
});

  it('tokenizes method-body block initializer', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  public int func() {
    List<Integer> list = new ArrayList<Integer>();
    {
      int a = 1;
      list.add(a);
    }
    return 1;
  }
}\
`
    );

    expect(lines[4][1]).toEqual({value: '{', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.section.block.begin.bracket.curly.java']});
    expect(lines[5][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[5][3]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[6][1]).toEqual({value: 'list', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'variable.other.object.java']});
    expect(lines[6][3]).toEqual({value: 'add', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'meta.method-call.java', 'entity.name.function.java']});
    expect(lines[7][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method.java', 'meta.method.body.java', 'punctuation.section.block.end.bracket.curly.java']});
});

  it('tokenizes static initializer', function() {
    const lines = grammar.tokenizeLines(`\
class Test
{
  public static HashSet<Integer> set = new HashSet<Integer>();
  static {
    int a = 1;
    set.add(a);
  }
}\
`
    );

    expect(lines[3][1]).toEqual({value: 'static', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'storage.modifier.java']});
    expect(lines[3][3]).toEqual({value: '{', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.section.block.begin.bracket.curly.java']});
    expect(lines[4][1]).toEqual({value: 'int', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'storage.type.primitive.java']});
    expect(lines[4][3]).toEqual({value: 'a', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.definition.variable.java', 'variable.other.definition.java']});
    expect(lines[5][1]).toEqual({value: 'set', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'variable.other.object.java']});
    expect(lines[5][3]).toEqual({value: 'add', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.method-call.java', 'entity.name.function.java']});
    expect(lines[6][1]).toEqual({value: '}', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'punctuation.section.block.end.bracket.curly.java']});
});

  it('tokenizes annotations', function() {
    const lines = grammar.tokenizeLines(`\
@Annotation
@Table(key = "value")
class Test {
  @Override
  @Column(true)
}
 @interface Test {}
@interface Test {}
public @interface Test {}\
`
    );

    expect(lines[0][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation.java']});
    expect(lines[0][1]).toEqual({value: 'Annotation', scopes: ['source.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});

    expect(lines[1][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation.java']});
    expect(lines[1][1]).toEqual({value: 'Table', scopes: ['source.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});
    expect(lines[1][2]).toEqual({value: '(', scopes: ['source.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation-arguments.begin.bracket.round.java']});
    expect(lines[1][3]).toEqual({value: 'key', scopes: ['source.java', 'meta.declaration.annotation.java', 'constant.other.key.java']});
    expect(lines[1][5]).toEqual({value: '=', scopes: ['source.java', 'meta.declaration.annotation.java', 'keyword.operator.assignment.java']});
    expect(lines[1][7]).toEqual({value: '"', scopes: ['source.java', 'meta.declaration.annotation.java', 'string.quoted.double.java', 'punctuation.definition.string.begin.java']});
    expect(lines[1][8]).toEqual({value: 'value', scopes: ['source.java', 'meta.declaration.annotation.java', 'string.quoted.double.java']});
    expect(lines[1][9]).toEqual({value: '"', scopes: ['source.java', 'meta.declaration.annotation.java',  'string.quoted.double.java', 'punctuation.definition.string.end.java']});
    expect(lines[1][10]).toEqual({value: ')', scopes: ['source.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation-arguments.end.bracket.round.java']});

    expect(lines[3][1]).toEqual({value: '@', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation.java']});
    expect(lines[3][2]).toEqual({value: 'Override', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});

    expect(lines[4][1]).toEqual({value: '@', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation.java']});
    expect(lines[4][2]).toEqual({value: 'Column', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});
    expect(lines[4][3]).toEqual({value: '(', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation-arguments.begin.bracket.round.java']});
    expect(lines[4][4]).toEqual({value: 'true', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.declaration.annotation.java', 'constant.language.java']});
    expect(lines[4][5]).toEqual({value: ')', scopes: ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation-arguments.end.bracket.round.java']});

    expect(lines[6][1]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation.java']});
    expect(lines[6][2]).toEqual({value: 'interface', scopes: ['source.java', 'meta.declaration.annotation.java', 'storage.modifier.java']});
    expect(lines[6][4]).toEqual({value: 'Test', scopes: ['source.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});

    expect(lines[7][0]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation.java']});
    expect(lines[7][1]).toEqual({value: 'interface', scopes: ['source.java', 'meta.declaration.annotation.java', 'storage.modifier.java']});
    expect(lines[7][3]).toEqual({value: 'Test', scopes: ['source.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});

    expect(lines[8][0]).toEqual({value: 'public', scopes: ['source.java', 'storage.modifier.java']});
    expect(lines[8][2]).toEqual({value: '@', scopes: ['source.java', 'meta.declaration.annotation.java', 'punctuation.definition.annotation.java']});
    expect(lines[8][3]).toEqual({value: 'interface', scopes: ['source.java', 'meta.declaration.annotation.java', 'storage.modifier.java']});
    expect(lines[8][5]).toEqual({value: 'Test', scopes: ['source.java', 'meta.declaration.annotation.java', 'storage.type.annotation.java']});
});

  it('tokenizes annotations with spaces', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  @ Override
  public void func1() {
  }

  @ Message("message")
  public void func2() {
  }
}\
`
    );

    const scopes = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.declaration.annotation.java'];
    expect(lines[1][1]).toEqual({value: '@', scopes: scopes.concat(['punctuation.definition.annotation.java'])});
    expect(lines[1][3]).toEqual({value: 'Override', scopes: scopes.concat(['storage.type.annotation.java'])});
    expect(lines[5][1]).toEqual({value: '@', scopes: scopes.concat(['punctuation.definition.annotation.java'])});
    expect(lines[5][3]).toEqual({value: 'Message', scopes: scopes.concat(['storage.type.annotation.java'])});
    expect(lines[5][6]).toEqual({value: 'message', scopes: scopes.concat(['string.quoted.double.java'])});
  });

  it('tokenizes annotations within classes', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  private @interface Test {
    // comment 1
    public boolean func() default true;
  }
}\
`
    );

    const scopes = ['source.java', 'meta.class.java', 'meta.class.body.java'];
    expect(lines[1][3]).toEqual({value: '@', scopes: scopes.concat(['meta.declaration.annotation.java', 'punctuation.definition.annotation.java'])});
    expect(lines[1][4]).toEqual({value: 'interface', scopes: scopes.concat(['meta.declaration.annotation.java', 'storage.modifier.java'])});
    expect(lines[2][1]).toEqual({value: '//', scopes: scopes.concat(['comment.line.double-slash.java', 'punctuation.definition.comment.java'])});
    expect(lines[3][5]).toEqual({value: 'func', scopes: scopes.concat(['meta.function-call.java', 'entity.name.function.java'])});
  });

  it('tokenizes Java 14 records', function() {
    const lines = grammar.tokenizeLines(`\
record Point() {}\
`
    );
    const recordScopes = ['source.java', 'meta.record.java'];
    expect(lines[0][0]).toEqual({value: 'record', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.modifier.java'])});
    expect(lines[0][2]).toEqual({value: 'Point', scopes: recordScopes.concat(['meta.record.identifier.java', 'entity.name.type.record.java'])});
    expect(lines[0][3]).toEqual({value: '(', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java'])});
    expect(lines[0][4]).toEqual({value: ')', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[0][6]).toEqual({value: '{', scopes: recordScopes.concat(['meta.record.body.java', 'punctuation.section.class.begin.bracket.curly.java'])});
    expect(lines[0][7]).toEqual({value: '}', scopes: recordScopes.concat(['punctuation.section.class.end.bracket.curly.java'])});
  });

  it('tokenizes Java 14 record implementing other interfaces', function() {
    const lines = grammar.tokenizeLines(`\
public record Point(int x) implements IA, IB {}\
`
    );
    const recordScopes = ['source.java', 'meta.record.java'];
    expect(lines[0][0]).toEqual({value: 'public', scopes: recordScopes.concat(['storage.modifier.java'])});
    expect(lines[0][2]).toEqual({value: 'record', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.modifier.java'])});
    expect(lines[0][4]).toEqual({value: 'Point', scopes: recordScopes.concat(['meta.record.identifier.java', 'entity.name.type.record.java'])});
    expect(lines[0][5]).toEqual({value: '(', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java'])});
    expect(lines[0][6]).toEqual({value: 'int', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.type.primitive.java'])});
    expect(lines[0][8]).toEqual({value: ')', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[0][10]).toEqual({value: 'implements', scopes: recordScopes.concat(['meta.definition.class.implemented.interfaces.java', 'storage.modifier.implements.java'])});
    expect(lines[0][12]).toEqual({value: 'IA', scopes: recordScopes.concat(['meta.definition.class.implemented.interfaces.java', 'entity.other.inherited-class.java'])});
    expect(lines[0][13]).toEqual({value: ',', scopes: recordScopes.concat(['meta.definition.class.implemented.interfaces.java', 'punctuation.separator.delimiter.java'])});
    expect(lines[0][15]).toEqual({value: 'IB', scopes: recordScopes.concat(['meta.definition.class.implemented.interfaces.java', 'entity.other.inherited-class.java'])});
    expect(lines[0][17]).toEqual({value: '{', scopes: recordScopes.concat(['meta.record.body.java', 'punctuation.section.class.begin.bracket.curly.java'])});
    expect(lines[0][18]).toEqual({value: '}', scopes: recordScopes.concat(['punctuation.section.class.end.bracket.curly.java'])});
  });

  it('tokenizes Java 14 record with generic types as parameters', function() {
    const lines = grammar.tokenizeLines(`\
public record Point<T>(T x) { }\
`
    );
    const recordScopes = ['source.java', 'meta.record.java'];
    expect(lines[0][0]).toEqual({value: 'public', scopes: recordScopes.concat(['storage.modifier.java'])});
    expect(lines[0][2]).toEqual({value: 'record', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.modifier.java'])});
    expect(lines[0][4]).toEqual({value: 'Point', scopes: recordScopes.concat(['meta.record.identifier.java', 'entity.name.type.record.java'])});
    expect(lines[0][5]).toEqual({value: '<', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.bracket.angle.java'])});
    expect(lines[0][6]).toEqual({value: 'T', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.type.generic.java'])});
    expect(lines[0][7]).toEqual({value: '>', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.bracket.angle.java'])});
    expect(lines[0][8]).toEqual({value: '(', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java'])});
    expect(lines[0][9]).toEqual({value: 'T', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.type.java'])});
    expect(lines[0][11]).toEqual({value: ')', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[0][13]).toEqual({value: '{', scopes: recordScopes.concat(['meta.record.body.java', 'punctuation.section.class.begin.bracket.curly.java'])});
    expect(lines[0][15]).toEqual({value: '}', scopes: recordScopes.concat(['punctuation.section.class.end.bracket.curly.java'])});
  });

  it('tokenizes Java 14 record construtor', function() {
    const lines = grammar.tokenizeLines(`\
public record Point(int x, int y) {
  public Point {
    // validation
  }
  private void foo() { }
}\
`
    );
    const recordScopes = ['source.java', 'meta.record.java'];
    expect(lines[0][0]).toEqual({value: 'public', scopes: recordScopes.concat(['storage.modifier.java'])});
    expect(lines[0][2]).toEqual({value: 'record', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.modifier.java'])});
    expect(lines[0][4]).toEqual({value: 'Point', scopes: recordScopes.concat(['meta.record.identifier.java', 'entity.name.type.record.java'])});
    expect(lines[0][5]).toEqual({value: '(', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java'])});
    expect(lines[0][6]).toEqual({value: 'int', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.type.primitive.java'])});
    expect(lines[0][8]).toEqual({value: ',', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.separator.delimiter.java'])});
    expect(lines[0][10]).toEqual({value: 'int', scopes: recordScopes.concat(['meta.record.identifier.java', 'storage.type.primitive.java'])});
    expect(lines[0][12]).toEqual({value: ')', scopes: recordScopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[0][14]).toEqual({value: '{', scopes: recordScopes.concat(['meta.record.body.java', 'punctuation.section.class.begin.bracket.curly.java'])});
    expect(lines[5][0]).toEqual({value: '}', scopes: recordScopes.concat(['punctuation.section.class.end.bracket.curly.java'])});

    const methodScopes = recordScopes.concat(['meta.record.body.java', 'meta.method.java']);
    expect(lines[1][1]).toEqual({value: 'public', scopes: methodScopes.concat(['storage.modifier.java'])});
    expect(lines[1][3]).toEqual({value: 'Point', scopes: methodScopes.concat(['meta.method.identifier.java', 'entity.name.function.java'])});
    expect(lines[1][5]).toEqual({value: '{', scopes: methodScopes.concat(['punctuation.section.method.begin.bracket.curly.java'])});
    expect(lines[2][1]).toEqual({value: '//', scopes: methodScopes.concat(['meta.method.body.java', 'comment.line.double-slash.java', 'punctuation.definition.comment.java'])});
    expect(lines[3][1]).toEqual({value: '}', scopes: methodScopes.concat(['punctuation.section.method.end.bracket.curly.java'])});
    expect(lines[4][1]).toEqual({value: 'private', scopes: methodScopes.concat(['storage.modifier.java'])});
    expect(lines[4][3]).toEqual({value: 'void', scopes: methodScopes.concat(['meta.method.return-type.java', 'storage.type.primitive.java'])});
    expect(lines[4][5]).toEqual({value: 'foo', scopes: methodScopes.concat(['meta.method.identifier.java', 'entity.name.function.java'])});
  });

  it('tokenizes Java 14 record as an inner class', function() {
    const lines = grammar.tokenizeLines(`\
class A {
  record Point() {}
}\
`
    );

    const scopes = ['source.java', 'meta.class.java', 'meta.class.body.java', 'meta.record.java'];
    expect(lines[1][1]).toEqual({value: 'record', scopes: scopes.concat(['meta.record.identifier.java', 'storage.modifier.java'])});
    expect(lines[1][3]).toEqual({value: 'Point', scopes: scopes.concat(['meta.record.identifier.java', 'entity.name.type.record.java'])});
    expect(lines[1][4]).toEqual({value: '(', scopes: scopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.begin.bracket.round.java'])});
    expect(lines[1][5]).toEqual({value: ')', scopes: scopes.concat(['meta.record.identifier.java', 'punctuation.definition.parameters.end.bracket.round.java'])});
    expect(lines[1][7]).toEqual({value: '{', scopes: scopes.concat(['meta.record.body.java', 'punctuation.section.class.begin.bracket.curly.java'])});
    expect(lines[1][8]).toEqual({value: '}', scopes: scopes.concat(['punctuation.section.class.end.bracket.curly.java'])});
  });

  it('tokenizes yield keyword', function() {
    const lines = grammar.tokenizeLines(`\
public static int calculate(int d) {
  return switch (d) {
    default -> {
      int l = d.toString().length();
      yield l*l;
    }
  };
}\
`
    );

    expect(lines[4][1]).toEqual({value: 'yield', scopes: ['source.java', 'keyword.control.java']});
});

  it('tokenizes sealed, non-sealed, and permits keywords', function() {
    const lines = grammar.tokenizeLines(`\
public sealed class X extends A implements B permits C { }
public sealed class X permits A extends B implements C { }
public sealed class X implements A permits B extends C { }
public sealed class Shape permits Circle, Rectangle, Square { }
public sealed interface ConstantDesc permits String, Integer { }
public non-sealed class Square extends Shape {}\
`
    );

    expect(lines[0][2]).toEqual({value: 'sealed', scopes: ['source.java', 'meta.class.java', 'storage.modifier.java']});
    expect(lines[0][16]).toEqual({value: 'permits', scopes: ['source.java', 'meta.class.java', 'meta.definition.class.permits.classes.java', 'storage.modifier.permits.java']});
    expect(lines[1][2]).toEqual({value: 'sealed', scopes: ['source.java', 'meta.class.java', 'storage.modifier.java']});
    expect(lines[1][8]).toEqual({value: 'permits', scopes: ['source.java', 'meta.class.java', 'meta.definition.class.permits.classes.java', 'storage.modifier.permits.java']});
    expect(lines[2][2]).toEqual({value: 'sealed', scopes: ['source.java', 'meta.class.java', 'storage.modifier.java']});
    expect(lines[2][12]).toEqual({value: 'permits', scopes: ['source.java', 'meta.class.java', 'meta.definition.class.permits.classes.java', 'storage.modifier.permits.java']});
    expect(lines[3][2]).toEqual({value: 'sealed', scopes: ['source.java', 'meta.class.java', 'storage.modifier.java']});
    expect(lines[3][8]).toEqual({value: 'permits', scopes: ['source.java', 'meta.class.java', 'meta.definition.class.permits.classes.java', 'storage.modifier.permits.java']});
    expect(lines[4][2]).toEqual({value: 'sealed', scopes: ['source.java', 'meta.class.java', 'storage.modifier.java']});
    expect(lines[4][8]).toEqual({value: 'permits', scopes: ['source.java', 'meta.class.java', 'meta.definition.class.permits.classes.java', 'storage.modifier.permits.java']});
    expect(lines[5][2]).toEqual({value: 'non-sealed', scopes: ['source.java', 'meta.class.java', 'storage.modifier.java']});
});
});
