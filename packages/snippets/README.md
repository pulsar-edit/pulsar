# Snippets package

Expand snippets matching the current prefix with <kbd>tab</kbd> in Pulsar.

To add your own snippets, select the _Pulsar > Snippets..._ menu option if you're using macOS, or the _File > Snippets..._ menu option if you're using Windows, or the _Edit > Snippets..._ menu option if you are using Linux.

## Snippet Format

Snippets files are stored in a package's `snippets/` folder and also loaded from `~/.pulsar/snippets.cson`. They can be either `.json` or `.cson` file types.

```coffee
'.source.js':
  'console.log':
    'prefix': 'log'
    'command': 'insert-console-log'
    'body': 'console.log(${1:"crash"});$2'
```

The outermost keys are the selectors where these snippets should be active, prefixed with a period (`.`) (details below).

The next level of keys are the snippet names. Because this is object notation, each snippet must have a different name.

Under each snippet name is a `body` to insert when the snippet is triggered.

`$` followed by a number are the tabs stops which can be cycled between by pressing <kbd>Tab</kbd> once a snippet has been triggered.

The above example adds a `console.log` snippet to JavaScript files that would expand to:

```js
console.log("crash");
```

The string `"crash"` would be initially selected and pressing tab again would place the cursor after the `;`

A snippet specifies how it can be triggered. Thus it must provide **at least one** of the following keys:

### The ‘prefix’ key

If a `prefix` is defined, it specifies a string that can trigger the snippet. In the above example, typing `log` (as its own word) and then pressing <kbd>Tab</kbd> would replace `log` with the string `console.log("crash")` as described above.

Prefix completions can be suggested if partially typed thanks to the `autocomplete-snippets` package.

### The ‘command’ key

If a `command` is defined, it specifies a command name that can trigger the snippet. That command can be invoked from the command palette or mapped to a keyboard shortcut via your `keymap.cson`.

If a package called `some-package` had defined that snippet, it would be available in the keymap as `some-package:insert-console-log`, or in the command palette as **Some Package: Insert Console Log**.

If you defined the `console.log` snippet described above in your own `snippets.cson`, it could be referenced in a keymap file as `snippets:insert-console-log`, or in the command palette as **Snippets: Insert Console Log**.

Invoking the command would insert the snippet at the cursor, replacing any text that may be selected.

Snippet command names must be unique. They can’t conflict with each other, nor can they conflict with any other commands that have been defined. If there is such a conflict, you’ll see an error notification describing the problem.

### Optional parameters

These parameters are meant to provide extra information about your snippet to [autocomplete-plus](https://github.com/atom/autocomplete-plus/wiki/Provider-API).

* `leftLabel` will add text to the left part of the autocomplete results box.
* `leftLabelHTML` will overwrite what's in `leftLabel` and allow you to use a bit of CSS such as `color`.
* `rightLabelHTML`. By default, in the right part of the results box you will see the name of the snippet. When using `rightLabelHTML` the name of the snippet will no longer be displayed, and you will be able to use a bit of CSS.
* `description` will add text to a description box under the autocomplete results list.
* `descriptionMoreURL` URL to the documentation of the snippet.

![autocomplete-description](http://i.imgur.com/cvI2lOq.png)

Example:
```coffee
'.source.js':
  'console.log':
    'prefix': 'log'
    'body': 'console.log(${1:"crash"});$2'
    'description': 'Output data to the console'
    'rightLabelHTML': '<span style="color:#ff0">JS</span>'
```

### Determining the correct scope for a snippet

The outmost key of a snippet is the “scope” that you want the descendent snippets to be available in. The key should be prefixed with a period (`text.html.basic` → `.text.html.basic`). You can find out the correct scope by opening the Settings (<kbd>cmd-,</kbd> on macOS) and selecting the corresponding *Language [xxx]* package. For example, here’s the settings page for `language-html`:

![Screenshot of Language Html settings](https://cloud.githubusercontent.com/assets/1038121/5137632/126beb66-70f2-11e4-839b-bc7e84103f67.png)

If it's difficult to determine the package handling the file type in question (for example, for `.md`-documents), you can use another approach:

1. Put your cursor in a file in which you want the snippet to be available.
2. Open the [Command Palette](https://github.com/pulsar-edit/command-palette)
(<kbd>cmd-shift-p</kbd> or <kbd>ctrl-shift-p</kbd>).
3. Run the `Editor: Log Cursor Scope` command.

This will trigger a notification which will contain a list of scopes. The first scope that's listed is the scope for that language. Here are some examples: `source.coffee`, `text.plain`, `text.html.basic`.

## Snippet syntax

This package supports a subset of the features of TextMate snippets, [documented here](http://manual.macromates.com/en/snippets), as well as most features described in the [LSP specification][lsp] and [supported by VSCode][vscode].

The following features from TextMate snippets are not yet supported:

* Interpolated shell code can’t reliably be supported cross-platform, and is probably a bad idea anyway. No other editors that support snippets have adopted this feature, and Pulsar won’t either.

The following features from VSCode snippets are not yet supported:

* “Choice” syntax like `${1|one,two,three|}` requires that the autocomplete engine pop up a menu to offer the user a choice between the available placeholder options. This may be supported in the future, but right now Pulsar effectively converts this to `${1:one}`, treating the first choice as a conventional placeholder.

### Variables

Pulsar snippets support all of the variables mentioned in the [LSP specification][lsp], plus many of the variables [supported by VSCode][vscode].

Variables can be referenced with `$`, either without braces (`$CLIPBOARD`) or with braces (`${CLIPBOARD}`). Variables can also have fallback values (`${CLIPBOARD:http://example.com}`), simple flag-based transformations (`${CLIPBOARD:/upcase}`), or `sed`-style transformations (`${CLIPBOARD/ /_/g}`).

One of the most useful is `TM_SELECTED_TEXT`, which represents whatever text was selected when the snippet was invoked. (Naturally, this can only happen when a snippet is invoked via command or key shortcut, rather than by typing in a <kbd>Tab</kbd> trigger.)

Others that can be useful:

* `TM_FILENAME`: The name of the current file (`foo.rb`).
* `TM_FILENAME_BASE`: The name of the current file, but without its extension (`foo`).
* `TM_FILEPATH`: The entire path on disk to the current file.
* `TM_CURRENT_LINE`: The entire current line that the cursor is sitting on.
* `TM_CURRENT_WORD`: The entire word that the cursor is within or adjacent to, as interpreted by `cursor.getCurrentWordBufferRange`.
* `CLIPBOARD`: The current contents of the clipboard.
* `CURRENT_YEAR`, `CURRENT_MONTH`, et cetera: referneces to the current date and time in various formats.
* `LINE_COMMENT`, `BLOCK_COMMENT_START`, `BLOCK_COMMENT_END`: uses the correct comment delimiters for whatever language you’re in.

Any variable that has no value — for instance, `TM_FILENAME` on an untitled document, or `LINE_COMMENT` in a CSS file — will resolve to an empty string.

#### Variable transformation flags

Pulsar supports the three flags defined in the [LSP snippets specification][lsp] and two other flags that are [implemented in VSCode][vscode]:

* `/upcase` (`foo` → `FOO`)
* `/downcase` (`BAR` → `bar`)
* `/capitalize` (`lorem ipsum dolor` → `Lorem ipsum dolor`) *(first letter uppercased; rest of input left intact)*
* `/camelcase` (`foo bar` → `fooBar`, `lorem-ipsum.dolor` → `loremIpsumDolor`)
* `/pascalcase` (`foo bar` → `FooBar`, `lorem-ipsum.dolor` → `LoremIpsumDolor`)

It also supports two other common transformations:

* `/snakecase` (`foo bar` → `foo_bar`, `lorem-ipsum.dolor` → `lorem_ipsum_dolor`)
* `/kebabcase` (`foo bar` → `foo-bar`, `lorem-ipsum.dolor` → `lorem-ipsum-dolor`)

These transformation flags can also be applied on backreferences in `sed`-style replacements for transformed tab stops. Given the following example snippet body…

```
[$1] becomes [${1/(.*)/${1:/upcase}/}]
```

…invoking the snippet and typing `Lorem ipsum dolor` will produce:

```
[Lorem ipsum dolor] becomes [LOREM IPSUM DOLOR]
```


#### Variable caveats

* `WORKSPACE_NAME`, `WORKSPACE_FOLDER`, and `RELATIVE_PATH` all rely on the presence of a root project folder, but a Pulsar project can technically have multiple root folders. While this is rare, it is handled by `snippets` as follows: whichever project path is an ancestor of the currently active file is treated as the project root — or the first one found if multiple roots are ancestors.
* `WORKSPACE_NAME` in VSCode refers to “the name of the opened workspace or folder.” In the former case, this appears to mean bundled projects with a `.code-workspace` file extension — which have no Pulsar equivalent. Instead, `WORKSPACE_NAME` will always refer to the last path component of your project’s root directory as defined above.

#### Variables that are not yet supported

Of the variables supported by VSCode, Pulsar does not yet support:

* `UUID` (Will automatically be supported when Pulsar uses a version of Electron that has native `crypto.randomUUID`.)

## Multi-line Snippet Body

You can also use multi-line syntax using `"""` for larger templates:

```coffee
'.source.js':
  'if, else if, else':
    'prefix': 'ieie'
    'body': """
      if (${1:true}) {
        $2
      } else if (${3:false}) {
        $4
      } else {
        $5
      }
    """
```

## Escaping Characters

Including a literal closing brace inside the text provided by a snippet's tab stop will close that tab stop early. To prevent that, escape the brace with two backslashes, like so:

```coffee
'.source.js':
  'function':
    'prefix': 'funct'
    'body': """
      ${1:function () {
        statements;
      \\}
      this line is also included in the snippet tab;
      }
      """
```

Likewise, if your snippet includes literal references to `$` or `{`, you may have to escape those with two backslashes as well, depending on the context.

## Multiple snippets for the same scope

Snippets for the same scope must be placed within the same key. See [this section of the Pulsar Flight Manual](https://pulsar-edit.dev/docs/launch-manual/sections/using-pulsar/#configuring-with-cson) for more information.


[lsp]: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#variables
[vscode]: https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables
