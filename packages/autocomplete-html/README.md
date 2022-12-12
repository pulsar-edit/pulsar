# HTML Autocomplete package
[![OS X Build Status](https://travis-ci.org/atom/autocomplete-html.svg?branch=master)](https://travis-ci.org/atom/autocomplete-html) [![Windows Build Status](https://ci.appveyor.com/api/projects/status/bsaqbg1fljpd9q1b/branch/master?svg=true)](https://ci.appveyor.com/project/Atom/autocomplete-html/branch/master) [![Dependency Status](https://david-dm.org/atom/autocomplete-html.svg)](https://david-dm.org/atom/autocomplete-html)

HTML tag and attribute autocompletions in Atom.

Tag and attribute autocompletions are powered by the list of HTML tags [here](https://github.com/adobe/brackets/blob/master/src/extensions/default/HTMLCodeHints/HtmlTags.json) and HTML attributes [here](https://github.com/adobe/brackets/blob/master/src/extensions/default/HTMLCodeHints/HtmlAttributes.json).
Descriptions are powered by [MDN](https://developer.mozilla.org).

![html-completions](https://cloud.githubusercontent.com/assets/2766036/25668197/ffd24928-2ff3-11e7-85fc-b327ac2287e6.gif)

You can update the prebuilt list of tags and attributes names and values by running the `update.coffee` file at the root of the repository and then checking-in the changed `completions.json` file.
