# Plugins

The `spell-check` allows for additional dictionaries to be used at the same time using Atom's `providedServices` element in the `package.json` file.

    "providedServices": {
      "spell-check": {
        "versions": {
          "1.0.0": "nameOfFunctionToProvideSpellCheck"
        }
      }
    }

The `nameOfFunctionToProvideSpellCheck` function may return either a single `require`able path or an array of them. This must be an absolute path to a class that provides a checker instance (below).

    provideSpellCheck: ->
      require.resolve './project-checker'

The path given must either resolve to a singleton instance of a class or a default export in a ES6 module.

    class ProjectChecker
      # Magical code
    checker = new ProjectChecker()
    module.exports = checker

For a default using Typescript:

    export default class ProjectChecker {}

See the `spell-check-project` for an example implementation.

# Checker

A common parameter type is `checkArgs`, this is a hash with the following signature.

    args = {
      projectPath: "/absolute/path/to/project/root,
      relativePath: "relative/path/from/project/root"
    }

Below the required methods for the checker instance.

* getId(): string
    * This returns the canonical identifier for this plugin. Typically, this will be the package name with an optional suffix for options, such as `spell-check-project` or `spell-check:en-US`. This identifier will be used for some control plugins (such as `spell-check-project`) to enable or disable the plugin.
     * This will also used to pass information from the Atom process into the background task once that is implemented.
* getPriority(): number
    * Determines how significant the plugin is for information with lower numbers being more important. Typically, user-entered data (such as the config `knownWords` configuration or a project's dictionary) will be lower than system data (priority 100).
* isEnabled(): boolean
    * If this returns true, then the plugin will considered for processing.
* providesSpelling(checkArgs): boolean
    * If this returns true, then the plugin will be included when looking for incorrect and correct words via the `check` function.
* check(checkArgs, text: string): [results]
    * This takes the entire text buffer and will be called once per buffer.
    * The output is an array with three parameters, all optional: `{ invertIncorrectAsCorrect: true, incorrect: [ranges], correct: [ranges] }`
        * The ranges are a zero-based index of a start and stop character (`[1, 23]`).
        * `invertIncorrectAsCorrect` means take the incorrect range and assume everything not in this list is correct.
    * Correct words always take precedence, even if another checker indicates a word is incorrect.
    * If a word or character is neither correct or incorrect, it is considered correct.
* providesSuggestions(checkArgs): boolean
    * If this returns true, then the plugin will be included when querying for suggested words via the `suggest` function.
* suggest(checkArgs, word: string): [suggestion: string]
    * Returns a list of suggestions for a given word ordered so the most important is at the beginning of the list.
* providesAdding(checkArgs): boolean
    * If this returns true, then the dictionary allows a word to be added to the dictionary.
* getAddingTargets(checkArgs): [target]
    * Gets a list of targets to show to the user.
    * The `target` object has a minimum signature of `{ label: stringToShowTheUser }`. For example, `{ label: "Ignore word (case-sensitive)" }`.
    * This is a list to allow plugins to have multiple options, such as adding it as a case-sensitive or insensitive, temporary verses configuration, etc.
* add(buffer, target, word)
    * Adds a word to the dictionary, using the target for identifying which one is used.
