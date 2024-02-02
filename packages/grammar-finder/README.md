# Grammar-Finder

Discover Community Package Grammars for your files.

## AutoFind

With 'AutoFind' enabled, when Pulsar fails to locate a grammar for the file you've just opened, defaulting to 'Plain Text', Grammar-Finder will automatically contact the Pulsar Package Registry in search of a Community Package that provides Syntax Highlighting for the file currently opened.

If any packages are found you can easily view the whole list and install the one that looks best.

When an 'AutoFind' notification appears you can quickly select:
  * 'View Available Packages' to view the packages found.
  * 'Disable Grammar-Finder for <ext>' to add this extension to the `ignoreExtList`.
  * 'Disable AutoFind' to disable 'AutoFind' completely.

## Command Palette

Grammar-Finder adds `grammar-finder:find-grammars-for-file` to the Command Palette, so that at any time you can check if any Community Packages provide Syntax Highlighting for the file you are currently working in.

This is a great way to find alternative packages, or if you don't like the notifications of 'AutoFind', this can be used to locate packages on your terms.

## Configuration

### `autoFind`

This can be enabled or disabled at will, effecting the 'AutoFind' feature availability.

### `ignoreExtList`

Any file extension can be added to this list to disable all checks for Community Packages. Ensure the extension is added without any preceding `.` for lookups to occur correctly.
