# CSS Autocomplete package

CSS property name and value autocompletions in Pulsar. Uses the
[autocomplete-plus](https://github.com/pulsar-edit/autocomplete-plus) package.

This is powered by the list of CSS property and values [here](https://github.com/adobe/brackets/blob/master/src/extensions/default/CSSCodeHints/CSSProperties.json).

![css-completions](https://cloud.githubusercontent.com/assets/671378/6357910/b9ecbe7c-bc1c-11e4-89b1-033e626c891f.gif)

You can update the prebuilt list of completions by running `node update.js` at the root of this package and checking for changes within `completions.json`. This does rely on having dev dependencies installed, so ensure you install all dependencies before doing so.
