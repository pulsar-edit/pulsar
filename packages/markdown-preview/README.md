# Markdown Preview package

Show the rendered HTML markdown to the right of the current editor using <kbd>ctrl-shift-m</kbd>.

It is currently enabled for `.markdown`, `.md`, `.mdown`, `.mkd`, `.mkdown`, `.ron`, and `.txt` files.

![markdown-preview](https://cloud.githubusercontent.com/assets/378023/10013086/24cad23e-6149-11e5-90e6-663009210218.png)

## Customize

By default Markdown Preview uses the colors of the active syntax theme. Enable **Use GitHub.com Style** in the __package settings__ to make it look closer to how markdown files get rendered on github.com.

![markdown-preview GitHub style](https://cloud.githubusercontent.com/assets/378023/10013087/24ccc7ec-6149-11e5-97ea-53a842a715ea.png)

When **Use GitHub.com Style** is selected, you can further customize the theme of the Markdown preview with the **GitHub.com Style Mode** setting. Since the GitHub website has a light theme and a dark theme, `markdown-preview` allows you to choose which theme to use when previewing your files. By default, it will use whatever mode is preferred by your system, but you can opt into “Light” or “Dark” to force it to use a particular theme.

No matter which theme you use, you can apply further customizations in your `styles.less` file. For example:

```css
.markdown-preview pre {
  background-color: #444;
}
```

## Language identifiers in fenced code blocks

A detailed Markdown specification helps to ensure that Markdown is displayed consistently across multiple parsers. Sadly, the same isn’t true of code block language identifiers — the strings you use to tell the renderer what sort of code is inside a code block.

The CommonMark specification [explicitly avoids standardizing these identifiers](https://spec.commonmark.org/0.31.2/#info-string):

> The first word of the info string is typically used to specify the language of the code sample, and rendered in the class attribute of the code tag. However, this spec does not mandate any particular treatment of the info string.

There are several valid ways to infer specific languages from language identifiers such as `js`, `less`, `coffee`,  and `c`. This package supports the following systems, configured via the **Syntax Highlighting Language Identifiers** setting:

  * [Linguist](https://github.com/github-linguist/linguist): Used by GitHub (previously the default and only language identification system).
  * [Chroma](https://github.com/alecthomas/chroma): Used by CodeBerg/Gitea/Hugo/Goldmark.
  * [Rouge](https://github.com/rouge-ruby/rouge): Used by GitLab/Jekyll.
  * [HighlightJS](https://highlightjs.org/): Used in a number of places, but most relevantly on the [Pulsar Package Registry](https://web.pulsar-edit.dev/) website.

If none of these systems meets your needs, you may specify custom language identifiers. This may not be as portable as the systems described above, but it will at least produce the desired outcome on your own system.

The setting **Custom Syntax Highlighting Language Identifiers** lets you define a list of custom language identifiers that match up to languages available within your Pulsar installation.

For example, if you wanted to map `j` to JavaScript and `p` to Python, you’d add the following text to the **Custom Syntax Highlighting Language Identifiers** field:

```
j: source.js, p: source.python
```

Now `markdown-preview` will understand what to do with fenced code blocks that begin with <code>\`\`\`j</code> or <code>\`\`\`p</code>. These custom identifiers will work alongside whatever system you’ve chosen with **Syntax Highlighting Language Identifiers**, but will supersede that system in the event of conflict.
