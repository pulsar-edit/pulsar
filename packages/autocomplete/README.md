# autocomplete

Display possible completions in the Lumine editor while you type.

## Features

- **Inline suggestions**: shows a suggestion list as you type, with a configurable activation delay.
- **Built-in provider**: completes words from the current buffer or all open buffers out of the box.
- **Provider support**: consumes external autocomplete providers so any package can contribute suggestions.
- **Snippet expansion**: expands snippet-based suggestions when a snippets service is available.
- **Fuzzy or strict matching**: match suggestions loosely with smart scoring or require an exact prefix.
- **Filtering controls**: skip suggestions for blacklisted files, scopes, and editor classes.

## Commands

Commands available in `atom-text-editor`:

- `autocomplete:activate`: manually show the suggestion list for the current word,
- `autocomplete:navigate-to-description-more-link`: open the "more" link of the selected suggestion's description externally.

Commands available in `atom-text-editor.autocomplete-active`:

- `autocomplete:confirm`: insert the selected suggestion,
- `autocomplete:confirmIfNonDefault`: insert the suggestion only if it is not the default selection,
- `autocomplete:cancel`: dismiss the suggestion list.

## Services

- **autocomplete.watchEditor** (`1.0.0`): provided to let other packages register an editor to be watched for autocompletion along with the set of providers to use for it.
- **autocomplete.provider** (`1.0.0`, `1.1.0`, `2.0.0`, `3.0.0`, `4.0.0`, `5.0.0`, `5.1.0`): consumed to register external suggestion providers that contribute completions.
- **snippets** (`0.1.0`): consumed to expand snippet-based suggestions when confirmed.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
