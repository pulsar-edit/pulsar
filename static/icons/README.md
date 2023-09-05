# Icons Readme

This document will detail how one should go about updating the icons here.

As anyone looking to update the octicons used within Pulsar will find out, Octicons no longer ships their icons as a font file, only as a collection of SVGs.
So this does mean you'll need to create the font file itself, or you'll need to do a huge refactor to use the SVGs instead. The instructions here will detail creating the font file itself.

## Recommended Software

To do this, I've used [FontForge](https://fontforge.org/), but I'm sure there are many other options available. You'll just need to ensure (at least it's easier to) that you'll be able to specify the UTF codes for each glyph.

## Setup

1) Install your font making software.
2) Clone locally the newest version of [octicons](https://github.com/primer/octicons)
3) Open up the previous font file. Such as `octicons-18.3.0.woff`
4) Open up a brand new font file.

## General Guidelines

You'll find in `./variables/octicon-utf-codes.less` that every single font has a UTF code expressed as `\e90b` to locate the glyph within the font file.

Additionally, after opening the previous font you'll find (within the Private Use Area) that many fonts are defined there with a location looking like `U+F030`.

The translation between the representations of codes is easy, like so `U+F030` => `\f030`.

Once you've navigated to the Private Use Area, in the previous font you'll find the names of fonts as well as the glyph itself. At the exact same location in your new font file, add in the exact same icon from the newer SVGs of `octicons`. Keeping the UTF locations the same means you don't have to update any previous ones.

Of course, if you come across an icon that no longer exists in newer `octicons` that just means you **have** to keep the old icon set for backwards compatibility, but otherwise leave that utf space blank.

Keep  in mind some icons are placed in the common utf space. Namley `U+2665:heart` and `U+26A1:zap`. The rest should be blank.

Once done with this process, you'll be able to add all new icons from the newer version of `octicons`.

As you navigate through all `octicons` svgs, I'd recommend using `View > Goto` to search glyph names, to double check you didn't add this glyph earlier.

Then to add all new glyphs navigate below `U+F324` (As this is where `octicons-18.3.0.woff` ended it's new set, but modify this as needed for newer version).

As you add the new icons below this point, ensure to mark down their exact UTF location, and name them appropriatly, for the next maintainer.

Now that you are done adding all the new icons, ensure to save the file to the `icons` folder with the new version name. (If there are no lost icons, as in new blank spaces, you may be able to replace the last version instead of creating a new version, but best to talk to the Pulsar maintainers first).

Once you've saved the version name, open up `octicons-utf-codes.less` and add the new glyph names, and their utf locations. Best to add it under a header comment such as `// Octicons 18.3.0`.

Now you can open up `variables/octicons-mixins.less` and add the new file location under `.octicon-font()` while ensuring to add a new class of `.octicon-font-OLD_MAJOR_VERSION()` with a location to that old font as well, to keep backwards compatibility.

Then after adding the new font file as a `src` within `icons/octicons.less` at the top you can add the `@font-face` to point to the backwards compatible font class.

Then the very last step is to add the `.make-icon()` class for every new font there is.
Ensure to take a look at the REGEX there to create these classes without taking to much time.

Once the font has been tested as working, you can make sure to update the core bundled package `style-guide` with all your new fonts so package maintainers can use these new fonts without having to dig through the source code.

From there you are done! It's a lot of effort, but hopefully the new glyphs and styles are worth it!
