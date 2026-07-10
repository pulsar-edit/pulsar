# symbol-provider-tree-sitter

Provides symbols to symbols-view based on tree-sitter queries.

## Features

- **Buffer-based symbols**: reads symbols from the live buffer, so they work in new and unsaved files.
- **Tags queries**: derives symbols from a grammar's `tags.scm` query file.
- **Rich symbol shaping**: predicates can prepend, append, strip, and set the context and tag of each symbol.
- **Optional references**: can include references such as function calls in addition to definitions.

## Services

- **symbol.provider** (`1.0.0`): provided to supply symbols for a given file to symbols-view.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
