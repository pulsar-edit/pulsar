
describe("Clojure grammar", function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);

    waitsForPromise(() => atom.packages.activatePackage("language-clojure"));

    runs(() => grammar = atom.grammars.grammarForScopeName("source.clojure"));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeDefined();
    expect(grammar.scopeName).toBe("source.clojure");
  });

  it("tokenizes semicolon comments", function() {
    const {tokens} = grammar.tokenizeLine("; clojure");
    expect(tokens[0]).toEqual({value: ";", scopes: ["source.clojure", "comment.line.semicolon.clojure", "punctuation.definition.comment.clojure"]});
    expect(tokens[1]).toEqual({value: " clojure", scopes: ["source.clojure", "comment.line.semicolon.clojure"]});
});

  it("does not tokenize escaped semicolons as comments", function() {
    const {tokens} = grammar.tokenizeLine("\\; clojure");
    expect(tokens[0]).toEqual({value: "\\; ", scopes: ["source.clojure"]});
    expect(tokens[1]).toEqual({value: "clojure", scopes: ["source.clojure", "meta.symbol.clojure"]});
});

  it("tokenizes shebang comments", function() {
    const {tokens} = grammar.tokenizeLine("#!/usr/bin/env clojure");
    expect(tokens[0]).toEqual({value: "#!", scopes: ["source.clojure", "comment.line.shebang.clojure", "punctuation.definition.comment.shebang.clojure"]});
    expect(tokens[1]).toEqual({value: "/usr/bin/env clojure", scopes: ["source.clojure", "comment.line.shebang.clojure"]});
});

  it("tokenizes strings", function() {
    const {tokens} = grammar.tokenizeLine('"foo bar"');
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.clojure", "string.quoted.double.clojure", "punctuation.definition.string.begin.clojure"]});
    expect(tokens[1]).toEqual({value: 'foo bar', scopes: ["source.clojure", "string.quoted.double.clojure"]});
    expect(tokens[2]).toEqual({value: '"', scopes: ["source.clojure", "string.quoted.double.clojure", "punctuation.definition.string.end.clojure"]});
});

  it("tokenizes character escape sequences", function() {
    const {tokens} = grammar.tokenizeLine('"\\n"');
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.clojure", "string.quoted.double.clojure", "punctuation.definition.string.begin.clojure"]});
    expect(tokens[1]).toEqual({value: '\\n', scopes: ["source.clojure", "string.quoted.double.clojure", "constant.character.escape.clojure"]});
    expect(tokens[2]).toEqual({value: '"', scopes: ["source.clojure", "string.quoted.double.clojure", "punctuation.definition.string.end.clojure"]});
});

  it("tokenizes regexes", function() {
    const {tokens} = grammar.tokenizeLine('#"foo"');
    expect(tokens[0]).toEqual({value: '#"', scopes: ["source.clojure", "string.regexp.clojure", "punctuation.definition.regexp.begin.clojure"]});
    expect(tokens[1]).toEqual({value: 'foo', scopes: ["source.clojure", "string.regexp.clojure"]});
    expect(tokens[2]).toEqual({value: '"', scopes: ["source.clojure", "string.regexp.clojure", "punctuation.definition.regexp.end.clojure"]});
});

  it("tokenizes backslash escape character in regexes", function() {
    const {tokens} = grammar.tokenizeLine('#"\\\\" "/"');
    expect(tokens[0]).toEqual({value: '#"', scopes: ["source.clojure", "string.regexp.clojure", "punctuation.definition.regexp.begin.clojure"]});
    expect(tokens[1]).toEqual({value: "\\\\", scopes: ['source.clojure', 'string.regexp.clojure', 'constant.character.escape.clojure']});
    expect(tokens[2]).toEqual({value: '"', scopes: ['source.clojure', 'string.regexp.clojure', "punctuation.definition.regexp.end.clojure"]});
    expect(tokens[4]).toEqual({value: '"', scopes: ['source.clojure', 'string.quoted.double.clojure', 'punctuation.definition.string.begin.clojure']});
    expect(tokens[5]).toEqual({value: "/", scopes: ['source.clojure', 'string.quoted.double.clojure']});
    expect(tokens[6]).toEqual({value: '"', scopes: ['source.clojure', 'string.quoted.double.clojure', 'punctuation.definition.string.end.clojure']});
});

  it("tokenizes escaped double quote in regexes", function() {
    const {tokens} = grammar.tokenizeLine('#"\\""');
    expect(tokens[0]).toEqual({value: '#"', scopes: ["source.clojure", "string.regexp.clojure", "punctuation.definition.regexp.begin.clojure"]});
    expect(tokens[1]).toEqual({value: '\\"', scopes: ['source.clojure', 'string.regexp.clojure', 'constant.character.escape.clojure']});
    expect(tokens[2]).toEqual({value: '"', scopes: ['source.clojure', 'string.regexp.clojure', "punctuation.definition.regexp.end.clojure"]});
});

  it("tokenizes numerics", function() {
    const numbers = {
      "constant.numeric.ratio.clojure": ["1/2", "123/456", "+0/2", "-23/1"],
      "constant.numeric.arbitrary-radix.clojure": ["2R1011", "16rDEADBEEF", "16rDEADBEEFN", "36rZebra"],
      "constant.numeric.hexadecimal.clojure": ["0xDEADBEEF", "0XDEADBEEF", "0xDEADBEEFN", "0x0"],
      "constant.numeric.octal.clojure": ["0123", "0123N", "00"],
      "constant.numeric.double.clojure": ["123.45", "123.45e6", "123.45E6", "123.456M", "42.", "42.M", "42E+9M", "42E-0", "0M", "+0M", "42.E-23M"],
      "constant.numeric.long.clojure": ["123", "12321", "123N", "+123N", "-123", "0"],
      "constant.numeric.symbol.clojure": ["##Inf", "##-Inf", "##NaN"]
    };

    return (() => {
      const result = [];
      for (var scope in numbers) {
        var nums = numbers[scope];
        result.push((() => {
          const result1 = [];
          for (let num of Array.from(nums)) {
            const {tokens} = grammar.tokenizeLine(num);
            result1.push(expect(tokens[0]).toEqual({value: num, scopes: ["source.clojure", scope]}));
          }
          return result1;
        })());
      }
      return result;
    })();
});

  it("tokenizes booleans", function() {
    const booleans =
      {"constant.language.boolean.clojure": ["true", "false"]};

    return (() => {
      const result = [];
      for (var scope in booleans) {
        var bools = booleans[scope];
        result.push((() => {
          const result1 = [];
          for (let bool of Array.from(bools)) {
            const {tokens} = grammar.tokenizeLine(bool);
            result1.push(expect(tokens[0]).toEqual({value: bool, scopes: ["source.clojure", scope]}));
          }
          return result1;
        })());
      }
      return result;
    })();
});

  it("tokenizes nil", function() {
    const {tokens} = grammar.tokenizeLine("nil");
    expect(tokens[0]).toEqual({value: "nil", scopes: ["source.clojure", "constant.language.nil.clojure"]});
});

  it("tokenizes keywords", function() {
    let tokens;
    const tests = {
      "meta.expression.clojure": ["(:foo)"],
      "meta.map.clojure": ["{:foo}"],
      "meta.vector.clojure": ["[:foo]"],
      "meta.quoted-expression.clojure": ["'(:foo)", "`(:foo)"]
    };

    for (let metaScope in tests) {
      const lines = tests[metaScope];
      for (let line of Array.from(lines)) {
        ({tokens} = grammar.tokenizeLine(line));
        expect(tokens[1]).toEqual({value: ":foo", scopes: ["source.clojure", metaScope, "constant.keyword.clojure"]});
      }
    }

    ({tokens} = grammar.tokenizeLine("(def foo :bar)"));
    expect(tokens[5]).toEqual({value: ":bar", scopes: ["source.clojure", "meta.expression.clojure", "meta.definition.global.clojure", "constant.keyword.clojure"]});

    // keywords can start with an uppercase non-ASCII letter
    ({tokens} = grammar.tokenizeLine("(def foo :Öπ)"));
    expect(tokens[5]).toEqual({value: ":Öπ", scopes: ["source.clojure", "meta.expression.clojure", "meta.definition.global.clojure", "constant.keyword.clojure"]});
});

  it("tokenizes keyfns (keyword control)", function() {
    const keyfns = ["declare", "declare-", "ns", "in-ns", "import", "use", "require", "load", "compile", "def", "defn", "defn-", "defmacro", "defåπç"];

    return (() => {
      const result = [];
      for (let keyfn of Array.from(keyfns)) {
        const {tokens} = grammar.tokenizeLine(`(${keyfn})`);
        result.push(expect(tokens[1]).toEqual({value: keyfn, scopes: ["source.clojure", "meta.expression.clojure", "keyword.control.clojure"]}));
      }
      return result;
    })();
});

  it("tokenizes keyfns (storage control)", function() {
    const keyfns = ["if", "when", "for", "cond", "do", "let", "binding", "loop", "recur", "fn", "throw", "try", "catch", "finally", "case"];

    return (() => {
      const result = [];
      for (let keyfn of Array.from(keyfns)) {
        const {tokens} = grammar.tokenizeLine(`(${keyfn})`);
        result.push(expect(tokens[1]).toEqual({value: keyfn, scopes: ["source.clojure", "meta.expression.clojure", "storage.control.clojure"]}));
      }
      return result;
    })();
});

  it("tokenizes global definitions", function() {
    const macros = ["ns", "declare", "def", "defn", "defn-", "defroutes", "compojure/defroutes", "rum.core/defc123-", "some.nested-ns/def-nested->symbol!?*", "def+!.?abc8:<>", "ns/def+!.?abc8:<>", "ns/defåÄÖπç"];

    return (() => {
      const result = [];
      for (let macro of Array.from(macros)) {
        const {tokens} = grammar.tokenizeLine(`(${macro} foo 'bar)`);
        expect(tokens[1]).toEqual({value: macro, scopes: ["source.clojure", "meta.expression.clojure", "meta.definition.global.clojure", "keyword.control.clojure"]});
        result.push(expect(tokens[3]).toEqual({value: "foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.definition.global.clojure", "entity.global.clojure"]}));
      }
      return result;
    })();
});

  it("tokenizes dynamic variables", function() {
    const mutables = ["*ns*", "*foo-bar*", "*åÄÖπç*"];

    return (() => {
      const result = [];
      for (let mutable of Array.from(mutables)) {
        const {tokens} = grammar.tokenizeLine(mutable);
        result.push(expect(tokens[0]).toEqual({value: mutable, scopes: ["source.clojure", "meta.symbol.dynamic.clojure"]}));
      }
      return result;
    })();
});

  it("tokenizes metadata", function() {
    let {tokens} = grammar.tokenizeLine("^Foo");
    expect(tokens[0]).toEqual({value: "^", scopes: ["source.clojure", "meta.metadata.simple.clojure"]});
    expect(tokens[1]).toEqual({value: "Foo", scopes: ["source.clojure", "meta.metadata.simple.clojure", "meta.symbol.clojure"]});

    // non-ASCII letters
    ({tokens} = grammar.tokenizeLine("^Öπ"));
    expect(tokens[0]).toEqual({value: "^", scopes: ["source.clojure", "meta.metadata.simple.clojure"]});
    expect(tokens[1]).toEqual({value: "Öπ", scopes: ["source.clojure", "meta.metadata.simple.clojure", "meta.symbol.clojure"]});

    ({tokens} = grammar.tokenizeLine("^{:foo true}"));
    expect(tokens[0]).toEqual({value: "^{", scopes: ["source.clojure", "meta.metadata.map.clojure", "punctuation.section.metadata.map.begin.clojure"]});
    expect(tokens[1]).toEqual({value: ":foo", scopes: ["source.clojure", "meta.metadata.map.clojure", "constant.keyword.clojure"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.clojure", "meta.metadata.map.clojure"]});
    expect(tokens[3]).toEqual({value: "true", scopes: ["source.clojure", "meta.metadata.map.clojure", "constant.language.boolean.clojure"]});
    expect(tokens[4]).toEqual({value: "}", scopes: ["source.clojure", "meta.metadata.map.clojure", "punctuation.section.metadata.map.end.trailing.clojure"]});
});

  it("tokenizes functions", function() {
    let tokens;
    const expressions = ["(foo)", "(foo 1 10)"];

    for (let expr of Array.from(expressions)) {
      ({tokens} = grammar.tokenizeLine(expr));
      expect(tokens[1]).toEqual({value: "foo", scopes: ["source.clojure", "meta.expression.clojure", "entity.name.function.clojure"]});
    }

    //non-ASCII letters
    ({tokens} = grammar.tokenizeLine("(Öπ 2 20)"));
    expect(tokens[1]).toEqual({value: "Öπ", scopes: ["source.clojure", "meta.expression.clojure", "entity.name.function.clojure"]});
});

  it("tokenizes vars", function() {
    let {tokens} = grammar.tokenizeLine("(func #'foo)");
    expect(tokens[2]).toEqual({value: " #", scopes: ["source.clojure", "meta.expression.clojure"]});
    expect(tokens[3]).toEqual({value: "'foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.var.clojure"]});

    // non-ASCII letters
    ({tokens} = grammar.tokenizeLine("(func #'Öπ)"));
    expect(tokens[2]).toEqual({value: " #", scopes: ["source.clojure", "meta.expression.clojure"]});
    expect(tokens[3]).toEqual({value: "'Öπ", scopes: ["source.clojure", "meta.expression.clojure", "meta.var.clojure"]});
});

  it("tokenizes symbols", function() {
    let {tokens} = grammar.tokenizeLine("x");
    expect(tokens[0]).toEqual({value: "x", scopes: ["source.clojure", "meta.symbol.clojure"]});

    // non-ASCII letters
    ({tokens} = grammar.tokenizeLine("Öπ"));
    expect(tokens[0]).toEqual({value: "Öπ", scopes: ["source.clojure", "meta.symbol.clojure"]});

    // Should not be tokenized as a symbol
    ({tokens} = grammar.tokenizeLine("1foobar"));
    expect(tokens[0]).toEqual({value: "1", scopes: ["source.clojure", "constant.numeric.long.clojure"]});
});

  it("tokenizes namespaces", function() {
    let {tokens} = grammar.tokenizeLine("foo/bar");
    expect(tokens[0]).toEqual({value: "foo", scopes: ["source.clojure", "meta.symbol.namespace.clojure"]});
    expect(tokens[1]).toEqual({value: "/", scopes: ["source.clojure"]});
    expect(tokens[2]).toEqual({value: "bar", scopes: ["source.clojure", "meta.symbol.clojure"]});

    // non-ASCII letters
    ({tokens} = grammar.tokenizeLine("Öπ/Åä"));
    expect(tokens[0]).toEqual({value: "Öπ", scopes: ["source.clojure", "meta.symbol.namespace.clojure"]});
    expect(tokens[1]).toEqual({value: "/", scopes: ["source.clojure"]});
    expect(tokens[2]).toEqual({value: "Åä", scopes: ["source.clojure", "meta.symbol.clojure"]});
});

  const testMetaSection = function(metaScope, puncScope, startsWith, endsWith) {
    // Entire expression on one line.
    let adjustedLength1, adjustedLength2, after, token;
    let {tokens} = grammar.tokenizeLine(`${startsWith}foo, bar${endsWith}`);

    let start = tokens[0], adjustedLength = Math.max(tokens.length, 2), mid = tokens.slice(1, adjustedLength - 1), end = tokens[adjustedLength - 1];

    expect(start).toEqual({value: startsWith, scopes: ["source.clojure", `meta.${metaScope}.clojure`, `punctuation.section.${puncScope}.begin.clojure`]});
    expect(end).toEqual({value: endsWith, scopes: ["source.clojure", `meta.${metaScope}.clojure`, `punctuation.section.${puncScope}.end.trailing.clojure`]});

    for (token of Array.from(mid)) {
      expect(token.scopes.slice(0, 2)).toEqual(["source.clojure", `meta.${metaScope}.clojure`]);
    }

    // Expression broken over multiple lines.
    tokens = grammar.tokenizeLines(`${startsWith}foo\n bar${endsWith}`);

    start = tokens[0][0],
      adjustedLength1 = Math.max(tokens[0].length, 2),
      mid = tokens[0].slice(1, adjustedLength1 - 1),
      after = tokens[0][adjustedLength1 - 1];

    expect(start).toEqual({value: startsWith, scopes: ["source.clojure", `meta.${metaScope}.clojure`, `punctuation.section.${puncScope}.begin.clojure`]});

    for (token of Array.from(mid)) {
      expect(token.scopes.slice(0, 2)).toEqual(["source.clojure", `meta.${metaScope}.clojure`]);
    }

    adjustedLength2 = Math.max(tokens[1].length, 1),
      mid = tokens[1].slice(0, adjustedLength2 - 1),
      end = tokens[1][adjustedLength2 - 1];

    expect(end).toEqual({value: endsWith, scopes: ["source.clojure", `meta.${metaScope}.clojure`, `punctuation.section.${puncScope}.end.trailing.clojure`]});

    return (() => {
      const result = [];
      for (token of Array.from(mid)) {
        result.push(expect(token.scopes.slice(0, 2)).toEqual(["source.clojure", `meta.${metaScope}.clojure`]));
      }
      return result;
    })();
  };

  it("tokenizes expressions", () => testMetaSection("expression", "expression", "(", ")"));

  it("tokenizes quoted expressions", function() {
    testMetaSection("quoted-expression", "expression", "'(", ")");
    testMetaSection("quoted-expression", "expression", "`(", ")");
  });

  it("tokenizes vectors", () => testMetaSection("vector", "vector", "[", "]"));

  it("tokenizes maps", () => testMetaSection("map", "map", "{", "}"));

  it("tokenizes sets", () => testMetaSection("set", "set", "\#{", "}"));

  it("tokenizes functions in nested sexp", function() {
    const {tokens} = grammar.tokenizeLine("((foo bar) baz)");
    expect(tokens[0]).toEqual({value: "(", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.begin.clojure"]});
    expect(tokens[1]).toEqual({value: "(", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure", "punctuation.section.expression.begin.clojure"]});
    expect(tokens[2]).toEqual({value: "foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure", "entity.name.function.clojure"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure"]});
    expect(tokens[4]).toEqual({value: "bar", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure", "meta.symbol.clojure"]});
    expect(tokens[5]).toEqual({value: ")", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure", "punctuation.section.expression.end.clojure"]});
    expect(tokens[6]).toEqual({value: " ", scopes: ["source.clojure", "meta.expression.clojure"]});
    expect(tokens[7]).toEqual({value: "baz", scopes: ["source.clojure", "meta.expression.clojure", "meta.symbol.clojure"]});
    expect(tokens[8]).toEqual({value: ")", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.end.trailing.clojure"]});
});

  it("tokenizes maps used as functions", function() {
    const {tokens} = grammar.tokenizeLine("({:foo bar} :foo)");
    expect(tokens[0]).toEqual({value: "(", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.begin.clojure"]});
    expect(tokens[1]).toEqual({value: "{", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure", "punctuation.section.map.begin.clojure"]});
    expect(tokens[2]).toEqual({value: ":foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure", "constant.keyword.clojure"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure"]});
    expect(tokens[4]).toEqual({value: "bar", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure", "meta.symbol.clojure"]});
    expect(tokens[5]).toEqual({value: "}", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure", "punctuation.section.map.end.clojure"]});
    expect(tokens[6]).toEqual({value: " ", scopes: ["source.clojure", "meta.expression.clojure"]});
    expect(tokens[7]).toEqual({value: ":foo", scopes: ["source.clojure", "meta.expression.clojure", "constant.keyword.clojure"]});
    expect(tokens[8]).toEqual({value: ")", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.end.trailing.clojure"]});
});

  it("tokenizes sets used in functions", function() {
    const {tokens} = grammar.tokenizeLine("(\#{:foo :bar})");
    expect(tokens[0]).toEqual({value: "(", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.begin.clojure"]});
    expect(tokens[1]).toEqual({value: "\#{", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure", "punctuation.section.set.begin.clojure"]});
    expect(tokens[2]).toEqual({value: ":foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure", "constant.keyword.clojure"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure"]});
    expect(tokens[4]).toEqual({value: ":bar", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure", "constant.keyword.clojure"]});
    expect(tokens[5]).toEqual({value: "}", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure", "punctuation.section.set.end.trailing.clojure"]});
    expect(tokens[6]).toEqual({value: ")", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.end.trailing.clojure"]});
});

  describe("firstLineMatch", function() {
    it("recognises interpreter directives", function() {
      let line;
      const valid = `\
#!/usr/sbin/boot foo
#!/usr/bin/boot foo=bar/
#!/usr/sbin/boot
#!/usr/sbin/boot foo bar baz
#!/usr/bin/boot perl
#!/usr/bin/boot bin/perl
#!/usr/bin/boot
#!/bin/boot
#!/usr/bin/boot --script=usr/bin
#! /usr/bin/env A=003 B=149 C=150 D=xzd E=base64 F=tar G=gz H=head I=tail boot
#!\t/usr/bin/env --foo=bar boot --quu=quux
#! /usr/bin/boot
#!/usr/bin/env boot\
`;
      for (line of Array.from(valid.split(/\n/))) {
        expect(grammar.firstLineRegex.findNextMatchSync(line)).not.toBeNull();
      }

      const invalid = `\
\x20#!/usr/sbin/boot
\t#!/usr/sbin/boot
#!/usr/bin/env-boot/node-env/
#!/usr/bin/das-boot
#! /usr/binboot
#!\t/usr/bin/env --boot=bar\
`;
      return (() => {
        const result = [];
        for (line of Array.from(invalid.split(/\n/))) {
          result.push(expect(grammar.firstLineRegex.findNextMatchSync(line)).toBeNull());
        }
        return result;
      })();
    });

    it("recognises Emacs modelines", function() {
      let line;
      const valid = `\
#-*- Clojure -*-
#-*- mode: ClojureScript -*-
/* -*-clojureScript-*- */
// -*- Clojure -*-
/* -*- mode:Clojure -*- */
// -*- font:bar;mode:Clojure -*-
// -*- font:bar;mode:Clojure;foo:bar; -*-
// -*-font:mode;mode:Clojure-*-
// -*- foo:bar mode: clojureSCRIPT bar:baz -*-
" -*-foo:bar;mode:clojure;bar:foo-*- ";
" -*-font-mode:foo;mode:clojure;foo-bar:quux-*-"
"-*-font:x;foo:bar; mode : clojure; bar:foo;foooooo:baaaaar;fo:ba;-*-";
"-*- font:x;foo : bar ; mode : ClojureScript ; bar : foo ; foooooo:baaaaar;fo:ba-*-";\
`;
      for (line of Array.from(valid.split(/\n/))) {
        expect(grammar.firstLineRegex.findNextMatchSync(line)).not.toBeNull();
      }

      const invalid = `\
/* --*clojure-*- */
/* -*-- clojure -*-
/* -*- -- Clojure -*-
/* -*- Clojure -;- -*-
// -*- iClojure -*-
// -*- Clojure; -*-
// -*- clojure-door -*-
/* -*- model:clojure -*-
/* -*- indent-mode:clojure -*-
// -*- font:mode;Clojure -*-
// -*- mode: -*- Clojure
// -*- mode: das-clojure -*-
// -*-font:mode;mode:clojure--*-\
`;
      return (() => {
        const result = [];
        for (line of Array.from(invalid.split(/\n/))) {
          result.push(expect(grammar.firstLineRegex.findNextMatchSync(line)).toBeNull());
        }
        return result;
      })();
    });

    it("recognises Vim modelines", function() {
      let line;
      const valid = `\
vim: se filetype=clojure:
# vim: se ft=clojure:
# vim: set ft=Clojure:
# vim: set filetype=Clojure:
# vim: ft=Clojure
# vim: syntax=Clojure
# vim: se syntax=Clojure:
# ex: syntax=Clojure
# vim:ft=clojure
# vim600: ft=clojure
# vim>600: set ft=clojure:
# vi:noai:sw=3 ts=6 ft=clojure
# vi::::::::::noai:::::::::::: ft=clojure
# vim:ts=4:sts=4:sw=4:noexpandtab:ft=clojure
# vi:: noai : : : : sw   =3 ts   =6 ft  =clojure
# vim: ts=4: pi sts=4: ft=clojure: noexpandtab: sw=4:
# vim: ts=4 sts=4: ft=clojure noexpandtab:
# vim:noexpandtab sts=4 ft=clojure ts=4
# vim:noexpandtab:ft=clojure
# vim:ts=4:sts=4 ft=clojure:noexpandtab:\x20
# vim:noexpandtab titlestring=hi\|there\\\\ ft=clojure ts=4\
`;
      for (line of Array.from(valid.split(/\n/))) {
        expect(grammar.firstLineRegex.findNextMatchSync(line)).not.toBeNull();
      }

      const invalid = `\
ex: se filetype=clojure:
_vi: se filetype=clojure:
 vi: se filetype=clojure
# vim set ft=klojure
# vim: soft=clojure
# vim: clean-syntax=clojure:
# vim set ft=clojure:
# vim: setft=clojure:
# vim: se ft=clojure backupdir=tmp
# vim: set ft=clojure set cmdheight=1
# vim:noexpandtab sts:4 ft:clojure ts:4
# vim:noexpandtab titlestring=hi\\|there\\ ft=clojure ts=4
# vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=clojure ts=4\
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
});
