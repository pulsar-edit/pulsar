# Grammar-Finder

Discover language grammars for unrecognized files.

## AutoFind

With 'AutoFind' enabled, when Pulsar fails to locate a grammar for the file you've just opened, defaulting to 'Plain Text', `grammar-finder` will automatically contact the Pulsar Package Registry in search of a community package that provides syntax highlighting for the file currently opened.

If any packages are found you can easily view the whole list and install the one that looks best.

When an 'AutoFind' notification appears you can quickly select:
  * 'View Available Packages' to view the packages found.
  * 'Disable Grammar-Finder for <ext>' to add this extension to the `ignoreExtList`.
  * 'Disable AutoFind' to disable 'AutoFind' completely.

## Command Palette

`grammar-finder` adds `grammar-finder:find-grammars-for-file` to the Command Palette, so that at any time you can check if any community packages provide syntax highlighting for the file you are currently working in.

This makes it possible to find grammars for _recognized_ file types — or for unrecognized file types if you’ve disabled `autoFind`.

## Configuration

### `autoFind`

When enabled, `autoFind` will show a notification inviting you to install a suitable grammar for an unrecognized file type.

### `ignoreExtList`

Any file extensions can be added to this list to disable all automatic checks for community packages for those file types. Choosing the “Disable `grammar-finder` for X” option on an `autoFind` notification will automatically add a given file extension to this list. This field should contain a comma-separated list of file extensions without any leading `.`s.
