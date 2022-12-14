# CSS Autocomplete package

CSS property name and value autocompletions in Pulsar. Uses the
[autocomplete-plus](https://github.com/pulsar-edit/autocomplete-plus) package.

This is powered by the list of CSS property and values [here](https://github.com/adobe/brackets/blob/master/src/extensions/default/CSSCodeHints/CSSProperties.json).

![css-completions](https://cloud.githubusercontent.com/assets/671378/6357910/b9ecbe7c-bc1c-11e4-89b1-033e626c891f.gif)

You can update the prebuilt list of property names and values by running the `update.coffee` file at the root of the repository and then checking in the changed `properties.json` file.

`sorted-property-names.json` is updated manually - take a look at https://developer.microsoft.com/en-us/microsoft-edge/platform/usage/ and https://www.chromestatus.com/metrics/css/popularity for guidance.
