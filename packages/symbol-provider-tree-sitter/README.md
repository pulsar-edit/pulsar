# symbol-provider-tree-sitter package

Provides symbols to `symbols-view` via Tree-sitter queries.

Tree-sitter grammars [with tags queries](https://tree-sitter.github.io/tree-sitter/code-navigation-systems) can very easily give us a list of all the symbols in a file without the drawbacks of a `ctags`-based approach. For instance, they operate on the contents of the buffer, not the contents of the file on disk, so they work just fine in brand-new files and in files that have been modified since the last save.

This provider does not currently support project-wide symbol search, but possibly could do so in the future.

## Tags queries

This provider expects for a grammar to have specified a tags query in its grammar definition file. All the built-in Tree-sitter grammars will have such a file. If you’re using a third-party Tree-sitter grammar that hasn’t defined one, file an issue on Pulsar and we’ll see what we can do.

If you’re writing your own grammar, or contributing a `tags.scm` to a grammar without one, keep reading.

### Query syntax

The query syntax starts as a subset of what is described [on this page](https://tree-sitter.github.io/tree-sitter/code-navigation-systems). Here’s what this package can understand:

* A query that consists of a `@definition.THING` capture with a `@name` capture inside will properly be understood as a symbol with a tag corresponding to `THING` and a name corresponding to the `@name` capture’s text.
* A query that consists of a `@reference.THING` capture with a `@name` capture inside will be ignored by default. If the proper setting is enabled, each of these references will become a symbol with a tag corresponding to `THING` and a name corresponding to the `@name` capture’s text.
* All other `@name` captures that are not within either a `@definition` or a `@reference` will be considered as a symbol in isolation. (These symbols can still specify a tag via a `#set!` predicate.)

To match the current behavior of the `symbols-view` package, you can usually take a `queries/tags.scm` file from a Tree-sitter repository — many parsers define them — and paste it straight into your grammar’s `tags.scm` file.

#### Advanced features

The text of the captured node is what will be displayed as the symbol’s name, but a few predicates are available to alter that field and others. Symbol predicates use `#set!` and the `symbol` namespace.

##### Node position descriptors

Several predicates take a **node position descriptor** as an argument. It’s a string that resembles an object lookup chain in JavaScript:

```scm
(#set! symbol.prependTextForNode parent.parent.firstNamedChild)
```

Starting at the captured node, it describes a path to take within the tree in order to get to another meaningful node.

In all these examples, if the descriptor is invalid and does not return a node, the predicate will be ignored.

##### Changing the symbol’s name

There are several ways to add text to the beginning or end of the symbol’s name:

###### symbol.prepend

```scm
(class_declaration
  name: (identifier) @name
  (#set! symbol.prepend "Class: "))
```

The `symbol.prepend` predicate adds a constant string to the beginning of a symbol name. For a class `Foo` in JavaScript, this predicate would result in a symbol called `Class: Foo`.

###### symbol.append

```scm
(class_declaration
  name: (identifier) @name
  (#set! symbol.append " (class)"))
```

The `symbol.append` predicate adds a constant string to the end of a symbol name. For a class `Foo`, this predicate would result in a symbol called `Foo (class)`.


###### symbol.strip

```scm
(class_declaration
  name: (identifier) @name
  (#set! symbol.strip "^\\s+|\\s+$"))
```

The `symbol.strip` predicate will replace everything matched by the regular expression with an empty string. The pattern given is compiled into a JavaScript `RegExp` with an implied `g` (global) flag.

In this example, _if_ the `identifier` node included whitespace on either side of the symbol, the symbol’s name would be stripped of that whitespace before being shown in the UI.

###### symbol.prependTextForNode

```scm
(class_body (method_definition
  name: (property_identifier) @name
  (#set! symbol.prependTextForNode "parent.parent.previousNamedSibling")
  (#set! symbol.joiner "#")
))
```

The `symbol.prependTextForNode` predicate will look up the text of the node referred to by the provided _node position descriptor_, then prepend that text to the symbol name. If `symbol.joiner` is provided, it will be inserted in between the two.

In this example, a `bar` method on a class named `Foo` would have a symbol name of `Foo#bar`.

###### symbol.prependSymbolForNode

```scm
(class_body (method_definition
  name: (property_identifier) @name
  (#set! symbol.prependSymbolForNode "parent.parent.previousNamedSibling")
  (#set! symbol.joiner "#")
))
```

The `symbol.prependSymbolForNode` predicate will look up the symbol name of the node referred to by the provided _node position descriptor_, then prepend that name to the symbol name. If `symbol.joiner` is provided, it will be inserted in between the two.

Unlike `symbol.prependTextForNode`, the node referred to with the descriptor must have its own symbol name, and it must have been processed already — that is, it must be a symbol whose name was determined earlier than that of the current node.

This allows us to incorporate any transformations that were applied to the other node’s symbol name. We can use this to build “recursive” symbol names — for instance, JSON keys whose symbols consist of their entire key path from the root.

##### Adding the `context` field

The `context` field of a symbol is a short piece of text meant to give context. For instance, a symbol that represents a class method could have a `context` field that contains the name of the owning class. The `context` field is not filtered on.

###### symbol.contextNode

```scm
(class_body (method_definition
  name: (property_identifier) @name
  (#set! symbol.contextNode "parent.parent.previousNamedSibling")
))
```

The `symbol.contextNode` predicate will set the value of a symbol’s `context` property to the text of a node based on the provided _node position descriptor_.

###### symbol.context

```scm
(class_body (method_definition
  name: (property_identifier) @name
  (#set! symbol.context "class")
))
```

The `symbol.context` predicate will set the value of a symbol’s `context` property to a fixed string.

The point of `context` is to provide information to help you tell symbols apart, so you probably don’t want to set it to a fixed value. But this predicate is available just in case.

##### Adding a tag

The `tag` field is a string (ideally a short string) that indicates a symbol’s kind or type. A `tag` for a class method’s symbol might say `method`, whereas the symbol for the class itself might have a `tag` of `class`. These tags will be indicated in the UI with a badge or an icon.

The preferred method of adding a tag is to leverage the `@definition.` captures that are typically present in a tags file. For instance, in this excerpt from the JavaScript grammar’s `tags.scm` file…

```scm
(assignment_expression
  left: [
    (identifier) @name
    (member_expression
      property: (property_identifier) @name)
  ]
  right: [(arrow_function) (function)]
) @definition.function
```

…the resulting symbol will infer a `tag` value of `function`.

In cases where this is impractical, you can provide the tag explicitly with a predicate.

###### symbol.icon

```scm
(class_body (method_definition
  name: (property_identifier) @name
  (#set! symbol.icon "package")
))
```

The icon to be shown alongside the symbol in a list. Will only be shown if the user has enabled the “Show Icons in Symbols View” option in the `symbols-view` settings. You can see the full list of available icons by invoking the **Styleguide: Show** command and browsing the “Icons” section. The value can include the preceding `icon-` or can omit it; e.g., `icon-package` and `package` are both valid values.

If this value is omitted, this provider will still attempt to match certain common tag values to icons. If `tag` is not present on the symbol, or is an uncommon value, there will be a blank space instead of an icon.

###### symbol.tag

```scm
(class_body (method_definition
  name: (property_identifier) @name
  (#set! symbol.tag "class")
))
```

The `symbol.tag` predicate will set the value of a symbol’s `tag` property to a fixed string.

The `tag` property is used to supply a word that represents the symbol in some way. For conventional symbols, this will often be something like `class` or `function`.
