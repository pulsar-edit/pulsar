# symbol-provider-ctags

Provides symbols to symbols-view via ctags.

## Features

- **File symbols**: scans the current file with ctags to list its symbols, without needing a tags file.
- **Project symbols**: reads a project tags file to list symbols across the whole project.
- **Go to declaration**: resolves the word under the cursor to its declaration using the project tags file.
- **Broad language support**: works with any language present in its ctags config file.

## Services

- **symbol.provider** (`1.0.0`): provided to supply symbols for a given file or project to symbols-view.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
