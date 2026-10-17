# JSON language support in Pulsar

Adds syntax highlighting of JSON files in Pulsar.

Originally [converted](https://pulsar-edit.dev/docs/launch-manual/sections/core-hacking/#converting-from-textmate) from the [JSON TextMate bundle](https://github.com/textmate/json.tmbundle).

Contributions are greatly appreciated. Please fork this repository and open a pull request to add snippets, make grammar tweaks, etc.

## Comments in JSON

Comments are disallowed in the JSON specification, but many libraries for parsing JSON tolerate their presence.

This package contains two grammars: **JSON** and **JSON with Comments**. The **JSON with Comments** grammar is used by default with `.jsonc` files (the JSON-with-comments file extension popularized by Visual Studio Code) and supports comments. A user can also switch to this grammar manually via the grammar selector.

By default, the **JSON** grammar marks comments as illegal. But you can opt into tolerance of comments in `.json` files by enabling the **Allow Comments in .json files** option.
