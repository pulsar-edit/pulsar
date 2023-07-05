# Markdown Preview package

Show the rendered HTML markdown to the right of the current editor using <kbd>ctrl-shift-m</kbd>.

It is currently enabled for `.markdown`, `.md`, `.mdown`, `.mkd`, `.mkdown`, `.ron`, and `.txt` files.

![markdown-preview](https://cloud.githubusercontent.com/assets/378023/10013086/24cad23e-6149-11e5-90e6-663009210218.png)

## Customize

By default Markdown Preview uses the colors of the active syntax theme. Enable `Use GitHub.com style` in the __package settings__ to make it look closer to how markdown files get rendered on github.com.

![markdown-preview GitHub style](https://cloud.githubusercontent.com/assets/378023/10013087/24ccc7ec-6149-11e5-97ea-53a842a715ea.png)

To customize even further, the styling can be overridden in your `styles.less` file. For example:

```css
.markdown-preview.markdown-preview {
  background-color: #444;
}
```

## Syntax Highlighting Language Identifier

While a verbose specification of Markdown, mostly, ensures the content of Markdown will look the same everywhere it's shipped, the same isn't true of code block language identifiers.

A "code block language identifier" is the string you use to tell the Markdown renderer what code is inside a code block of your Markdown document.

Nearly every Markdown rendering system supports different strings to specify your language than each other. `Markdown-Preview` has implemented several valid Language Identifier systems to help ensure that your Markdown will look the same no matter where you publish it!

In the settings, you can select from a list of different popular Language Identification systems that can then be used in your code blocks. This means that they will still be valid when shipping them to whatever platform of your choice.

Currently, `Markdown-Preview` supports the following:

  * Linguist: Used by GitHub (Previously the default and only language identification system)
  * Chroma: Used by CodeBerg/Gitea/Hugo/Goldmark
  * Rouge: Used by GitLab/Jekyll
  * HighlightJS: Used by Markdown-IT/Pulsar Package Website


Of course, not all Markdown content is destined to be shared, `Markdown-Preview` even lets you specify custom Language Identifiers to be used within your Markdown code blocks.

The setting `Custom Syntax Highlighting Language Identifiers` lets you define a list of custom language identifiers that match up to languages available within your Pulsar installation

For example, if you wanted to highlight your code like JavaScript by just using `j` as your Code Block language Identifier and `p` to use Python Syntax Highlighting, you could add the following to this setting:

```
j: source.js, p: source.python
```

And that's it, now anytime you use that language identifier it will be highlighted exactly the way you want. Of course your preference of language identification system will still be used, in addition to your custom list.
