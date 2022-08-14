# Tree Sitter in Pulsar

Tree-sitter is a tokenizer that uses native modules. The idea is that a language generates an AST of the source code and then Pulsar will tokenize these on the editor with some rules on CSON files (that kind of resemble CSS selectors)

## Debugging a Grammar

Inside Pulsar's source code is possible to require Tree-Sitter and try to parse some grammar. To do this, run this code on Devtools:

```js
const Parser = require('tree-sitter');
const Java = require('tree-sitter-java');

const parser = new Parser();
parser.setLanguage(Java);

tree = parser.parse(`
class A {
  void func() {
    obj.func2("arg");
  }
}
`);
console.log(tree.rootNode.toString());
```

This will create a parser, set its language to Java, and try to parse the source code that we sent. This specific fragment of code will print:

```
(program
  (class_declaration
    name: (identifier)
    body: (class_body
      (method_declaration
        type: (void_type)
        name: (identifier)
        parameters: (formal_parameters)
        body: (block
          (expression_statement
            (method_invocation
              object: (identifier)
              name: (identifier)
              arguments: (argument_list
                (string_literal)))))))))
```

I did the pretty-print manually. Basically, it says that the "root node" is a `program` that contains a `class_declaration`. Following that, comes the class's name, then its body, etc etc.

## Modern tree-sitter

If you look at the AST above, you'll see that there are things inside parenthesis and things like `name: ` and `body: `. This second one is what Tree-Sitter now calls "field name", and Pulsar is not yet using this anywhere. This is problematic for multiple reasons, but the main one is that tokenization gets wrong: for example, in the code above, we want to tokenize `obj.func2("arg")` by marking `func2` as a function that's being called, but the AST for that fragment is:

```
(method_invocation
  object: (identifier)
  name: (identifier)
  arguments: (argument_list (string_literal)))
```

What disambiguates the method name from other things is the field name: `obj` have field name `object`, and `func2` have field name `name`. As Pulsar is not parsing this, the closest match we can get is:

```cson
  'method_invocation > identifier': 'entity.name.function'
```

But unfortunately, this does not solve the issue - both `obj` and `func2` are tokenized as functions in this case.

### Fixing this

`src/tree-sitter-language-mode.js` is where the syntax tree is walked to generate tokens. It basically have methods like `seek`, `_moveDown`, etc that `.push` some token into `containingNodeTypes` and other local fields. Later, these are tokenized via `_currentScopeId` that basically tries to match the rule we're in inside `this.languageLayer.grammar.scopeMap` data structure.

This data structure is defined in `src/syntax-scope-map.js`, and contains `anonymousScopeTable` (that is, AFAIK, a list of words that are tokenized always the same - think like "keywords" on the language) and a `namedScopeTable` (which, surprisingly, does not treat the "field name" even though it has `name` on it). This structure is basically a "leaf first" structure. So, tokenizing `obj.func("a string")`, we would get:

1. `method_invocation`, that gets `push`ed into `containingNodeTypes` then we "move down"
1. `identifier` (for `obj`), that also gets `push`ed into `identifier`
1. We check the tokenID then "move right"
1. `identifier` (for `func`), replaces the sibling's `identifier` that was pushed before, and we check tokenID, and "move right" again
1. Repeate the process from the beginning, but for `argument_list` instead of `method_invocation` (replace the sibling's `identifier` with `argument_list`, then move down to push `string_literal`)
1. Finally "move up", `pop`ing the `string_literal`, then `argument_list`, and finally `method_invocation`, and continue walking the rest of the AST

To get the Token ID, we walk though the data structure, checking things as we go. So for example, in this case, after `push`ing things for `obj`, we have inside `containingNodeTypes`: `['method_invocation', 'identifier']`. We have this same structure for `func`.

If we look at the `scopeMap` structure, inside `namedScopeTable`, we'll see something like:

```js
identifier: {
  parents: {
    method_invocation: {
      result: ["entity.name.function", ...]
    }
  }
}
```

And this is how the tokenizer is done. Is also how the bug appears: both `func` and `obj` have the same `containingNodeTypes`.


### Possible solution

To make `src/syntax-scope-map.js` aware of "named fields" (we can do that by checking the `cursor.currentFieldName` or by `push`ing the `this.treeCursor.currentFieldName`), then match things correctly.

We will also need to decide on a syntax on the CSON file to this format, and also parse this format inside the `namedScopeTable`.

Finally, we'll need to change the `get` method of the `SyntaxScopeMap` to match things correctly and get tokenization for things filtered by the field name.
