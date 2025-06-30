# `autocomplete.provider` service documentation

Read this document if you’d like to write your own autocompletion provider.

If you want to turn a language server into an autocompletion provider, you can use `atom-languageclient` instead of providing this service directly. [Consult its README](https://github.com/savetheclocktower/atom-languageclient?tab=readme-ov-file#developing-packages) for more information.

## Service definition

The following TypeScript-style code block describes the `autocomplete.provider` service in its current form.

The current service version is **5.1.0**. The documentation is accurate for version 4 or greater of the API; aspects that are present only in versions later than 4 are annotated as such.

```ts
import { Point, Range, ScopeDescriptor, TextEditor } from 'atom';


/**
 * A {@link Range} or any object that can be accepted by {@link
 * Range.prototype.fromObject}.
 */
type RangeCompatible =
  | Range
  | [Point, Point],
  | [[number, number], [number, number]]
  | [{ row: number, column: number}, { row: number, column: number}]

/**
 * Describes a range of a buffer and the text to insert into it. This is one
 * possible insertion strategy among several for a suggestion.
 *
 * Like a `Range` from the Language Server Protocol specification, but with an
 * Atom-style {@link Range}.
 *
 * This type bears some similarity to an existing `TextEdit` type used by
 * Atom-IDE. The existing type uses the `oldRange` property instead of `range`,
 * but is otherwise identical. Both are acceptable.
 */
type TextEdit = {
  newText: string
} & ({ range: RangeCompatible } | { oldRange: RangeCompatible })

/**
 * Known types of suggestions; these have predefined styles when rendered.
 */
type SuggestionType =
  | 'variable'
  | 'constant'
  | 'property'
  | 'value'
  | 'method'
  | 'function'
  | 'class'
  | 'type'
  | 'keyword'
  | 'tag'
  | 'snippet'
  | 'import'
  | 'require'

/**
 * A single suggestion as returned by `getSuggestions` or
 * `getSuggestionDetailsOnSelect`.
 */
type Suggestion = {
  // A suggestion can be inserted one of several ways: as plain text, as a
  // snippet, or as a `TextEdit`. One of these three properties is therefore
  // required; the others are optional.
  //
  // Of these three, later properties win out over earlier ones. For example,
  // `textEdit` will be preferred over both `snippet` and `text` if it is
  // present.

  /**
   * The text to be inserted. Will be used if `snippet` is absent.
   */
  text?: string

  /**
   * A snippet to insert upon suggestion selection.
   */
  snippet?: string

  /**
   * Text edit to make when the item is chosen. Use this when you want to be
   * specific about which range of the buffer is replaced. When present, this
   * will be used as the insertion strategy instead of the default behavior.
   *
   * If a suggestion needs to make several edits upon insertion, the rest can
   * be specified via `additionalTextEdits`.
   *
   * Added in 5.1.0.
   */
  textEdit?: TextEdit

  /**
   * The text to show in the menu for this suggestion. Optional; falls back to
   * `snippet`, then `text`.
   */
  displayText?: string

  /**
   * A list of `Range`s to replace when inserting the text. Each `Range`present
   * in this list will result in one insertion of the suggestion's textor
   * snippet.
   *
   * Can insert the autocompletion's text/snippet into one specific range or
   * multiple. Use this when you know the exact range of the current buffer
   * that should be replaced with the given text.
   *
   * Added in 5.0.0. Has no effect if `textEdit` is specified.
   */
  ranges?: Range[]

  /**
   * Text before the cursor that should be replaced as part of the insertion of
   * this suggestion. Optional; if omitted, the prefix before the cursor will
   * be used. Has no effect if `textEdit` or `ranges` is specified.
   */
  replacementPrefix?: string

  /**
   * A "type" for this suggestion. Used to classify suggestions and distinguish
   * them visually. The types of {@link SuggestionType} are preferred (and have
   * predefined styles), but you can use an arbitrary string if none of those
   * types suffice.
   */
  type?: SuggestionType | string

  /**
   * Text edits to make when the item is chosen — in addition to the main item.
   *
   * These are typically optional edits, such as an automatic `import`
   * statement that's inserted when a suggestion warrants it.
   *
   * When present, these edits are made in all code paths, regardless of the
   * original insertion strategy.
   *
   * Added in 5.1.0.
   */
  additionalTextEdits?: TextEdit

  /**
   * A label to display before the suggestion. This can indicate useful
   * information like a method return type. Both text and HTML variants are
   * supported; `leftLabelHTML` takes precedence over `leftLabel` when both are
   * present.
   */
  leftLabel?: string
  leftLabelHTML?: string

  /**
   * A label to display after the suggestion. This can indicate useful
   * information like a type annotation. Both text and HTML variants are
   * supported; `rightLabelHTML` takes precedence over `rightLabel` when both
   * are present.
   */
  rightLabel?: string
  rightLabelHTML?: string

  /**
   * Class name to add to the suggestion's row in the HTML. Allows for further
   * styling customization, if needed.
   */
  className?: string

  /**
   * An override to allow you to specify your own icon. Should follow Octicon
   * conventions; e.g., `"<i class="icon-move-right"></i>"`. Optional.
   */
  iconHTML?: string

  /**
   * A docstring summary or short description of the suggestion. When
   * specified, it will be displayed at the bottom of the suggestions list.
   * Optional.
   */
  description?: string

  /**
   * A url to the documentation or more information about this suggestion. When
   * specified, a `More…` link will be displayed in the description area.
   */
  descriptionMoreURL?: string

  /**
   * A list of indices where the characters in the prefix appear in this
   * suggestion's text.
   * @type {Object}
   */
  characterMatchIndices?: number[]

  // (Either `text`, `snippet`, or `textEdit` must be provided.)
} & { text: string } | { snippet: string } | { textEdit: TextEdit};

/**
 * The provider object that you should make available to `autocomplete-plus`.
 * This should be the return value of whatever method you specified in your
 * `providedServices` metadata.
 */
type ServiceProvider = {
  /**
   * Selector for which this provider should be active. Multiple values can be
   * given separated by commas.
   */
  selector: string,
  /**
   * Selector for which this provider should be inactive, even if scope
   * otherwise matches `selector`. Multiple values can be given separated by
   * commas.
   */
  disableForSelector: string,

  /**
   * The priority of this provider relative to others. Higher numbers beat
   * lower numbers.
   */
  inclusionPriority: number,

  /**
   * When `true`, this provider excludes options from providers with a lower
   * priority from even appearing in the menu.
   */
  excludeLowerPriority: boolean,

  /**
   * The priority of this provider's suggestions relative to other suggestions
   * that may exist in the list. Influences the ordering of suggestions within
   * a menu.
   */
  suggestionPriority: number,

  /**
   * When `true`, `autocomplete-plus` expects to receive many suggestions and
   * will filter the list based on what's already been typed in the token. When
   * `false`, you assert that whatever you deliver to `autocomplete-plus` has
   * already been filtered.
   */
  filterSuggestions: boolean,

  /**
   * Retrieves suggestions for a given editor at a given point. Can consult
   * other metadata. Can go async.
   */
  getSuggestions(meta: {
    /** The current text editor. */
    editor: TextEditor,
    /** The position of the cursor. */
    bufferPosition: Point,
    /**
     * The scope descriptor at the given buffer position.
     * @see https://docs.pulsar-edit.dev/api/pulsar/latest/ScopeDescriptor/
     */
    scopeDescriptor: ScopeDescriptor,
    /**
     * The prefix that the user has typed before the cursor. Typically
     * represents all word-like characters between the cursor and the last
     * non-word character.
     */
    prefix: string,
    /**
     * Whether the user activated this menu manually or had it appear
     * automatically while typing.
     */
    activatedManually: boolean
  }): Suggestion[] | Promise<Suggestion[]>,

  /**
   * Fills in further details on this suggestion when it is highlighted in the
   * menu. Optional.
   *
   * A language server can use this method to send `completionItem/resolve` and
   * return an updated suggestion with the new data.
   */
  getSuggestionDetailsOnSelect?(suggestion: Suggestion): Promise<Suggestion>,

  /**
   * Invoked after a chosen suggestion is inserted into the editor. Optional.
   */
  onDidInsertSuggestion?(meta: {
    /** The current text editor. */
    editor: TextEditor,
    /** The position of the cursor when the suggestion was chosen. */
    triggerPosition: Point,
    /** The suggestion that was chosen. */
    suggestion: Suggestion
  }): void;

  /**
   * Called when your provider needs to be cleaned up. Optional.
   */
  dispose?(): void;
}

```


## Registering your provider with `autocomplete-plus`

In your `package.json`, add:

```json
"providedServices": {
  "autocomplete.provider": {
    "versions": {
      "4.0.0": "provideAutocomplete"
    }
  }
}
```

You may call this value whatever you like; `provideAutocomplete` is a suggestion.

Then, in your main package export, define a method of the same name:

```js
module.exports = {
  activate() {
    // existing activation code
  }

  provideAutocomplete() {
    // Return a value that conforms to the `ServiceProvider` interface
    // described above…
    return new Provider()

    // …or return multiple such providers as an array.
    return [new Provider(), new OtherProvider()]
  }
}
```


## Tips

`autocomplete-plus` guesses at the “prefix” — that is, the range of characters before the cursor that might be part of whatever suggestion you will insert.

For some languages, you may need to override this by specifying a `replacementPrefix` value for each suggestion:

```js
let provider = {
  selector: 'source.js',
  getSuggestions({ editor, bufferPosition }) {
    let prefix = this.getPrefix(editor, bufferPosition)
  },

  getPrefix(editor, bufferPosition) {
    // Whatever your prefix regex might be.
    let regex = /[\w0-9_-]+$/

    // Get the text for the line up to the triggered buffer position.
    let line = line = editor.getTextInRange([
      [bufferPosition.row, 0],
      bufferPosition
    ])

    // Match the regex to the line, and return the match (if any).
    return line.match(regex)?.[0] ?? ''
  }

}
```
