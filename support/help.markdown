# Language

**Note**: you should always select the `HTML` language when working with PHP (and not the `PHP` language). You can switch language by selecting `HTML` from the status bar at the bottom of the window, or by pressing `⌃⌥⇧H`.

# Snippets

## Control Structures

The PHP bundle includes snippets for the common control structures, such as `if`, `while`, `switch` and `for`, as well as `function` and `class` definitions.
These snippets are accessible through a tab trigger for the relevant keyword.  
Some snippets are also available in the HTML scope for use in templating using PHP; these will be wrapped in `<?php … ?>` blocks (See the Short Tags section below for details on how to use short tags instead).

These snippets are designed to conform to the [PEAR style guide][]. To summarise:

  * Control structures have a space between the keyword and opening parenthesis and have their opening brace on the same line.
  * Functions should be called with no spaces between the function name, the opening parenthesis, and the first parameter.
  * Function and class definitions have their brace on the line following the prototype.

[PEAR style guide]: http://pear.php.net/manual/en/standards.php

## PHPDoc

There are several snippets available for use when writing PHPDoc blocks. See the separate Help command for more information.

# Commands

## Completion

Standard completion for built-in function names is provided by pressing the ⎋ key.  
Additionally, completing a built-in function using ⌥⎋ will display a list of available options, and will expand the chosen option into a snippet for the function prototype.  
When ⎋ completion is invoked inside of a string following an `include`/`require`, the filename will be completed instead. The environment variable `PHP_INCLUDE_PATH` is used to look for matching files - see "Include Path Configuration" below for details on this.

## Function Reference

There are 2 help commands, both of which work on the current word:

  * Pressing ⌃H will open a browser showing the function definition on the PHP website (or a local file, see `PHP Manual Location` below).
  * Pressing ⌥F1 will display a tooltip showing the function prototype and a brief description of its use.

## Drag Commands

Dragging a .php file (from the Project Drawer or Finder, for example) into PHP source will generate an `include` for that file.  
If the environment variable `PHP_INCLUDE_PATH` is set to your PHP environment's `include_path` directive, it will be searched for the optimal path to the dropped file to include.
You can hold ⌃ when you drop the file to generate a `require` instead, and you can hold ⌥ to use the `_once` variant of either method.

## Project Navigation

The command ⇧⌘D can be used to jump to a file included from the current document. If invoked on a line with an `include`/`require` directive, it will search for that file. Otherwise, a menu of all the included files will be displayed. The environment variable `PHP_INCLUDE_PATH` is searched for the included path as above.

# Setup

## PHP Versions

If you use PHP 5 (rather than PHP 4 which is bundled with OS X) then you’ll want to make sure TextMate is using PHP 5 so that the Validate and Run commands work. To do this you’ll need to have PHP 5 installed – I recommend [these packages](http://www.entropy.ch/software/macosx/php/).

Once PHP is installed, you need to make TextMate use the new PHP binary. You can either replace the default `/usr/bin/php` with the PHP 5 binary (e.g. with a symlink) or you can set the `TM_PHP` environment variable to the absolute path to the PHP executable through TextMate → Preferences → Advanced → Shell Variables.

## Include Path Configuration

The environment variable `PHP_INCLUDE_PATH` is used for the 2 commands above. This variable should contain a colon-separated list of directories to scan for PHP include files (as in your PHP configuration). The correct value for this variable can be found either by checking the output of phpInfo() or printing the result of get\_include_path(). The best way to set this up is as a [Project Dependent Variable](?project_dependent_variables) – make sure nothing is selected in the project drawer and then press the ⓘ icon to configure these.

See section 9, "Environment variables" in the [TextMate help](?environment_variables) for more information on setting environment variables.

## PHP Manual Location

If you don't have a persistent internet connection (or you just want a quicker response), you can store a local copy of the PHP manual for documentation lookups. You need to download and extract a copy of the “Many HTML files” manual package in your language from [the PHP website](http://www.php.net/download-docs.php). Then set an environment variable `PHP_MANUAL_LOCATION` to the full path of the extracted files, and your local copy will be used instead of routing to the PHP website.

## TextMate Support File

The bundle contains a file with support code that you can include in your project by using the snippet `tmphp⇥`. This file currently contains 2 things:

  * A function `textmate_backtrace`() which works just like `debug_print_backtrace`() but will add a link to jump to files in TextMate
  * JavaScript code which will scan the page for PHP errors and add links to open the relevant file and line in TextMate
    
    There are 3 ways to include this JavaScript:
    1. If `TEXMATE_ERRORS` is define()d before the support file is included then the script tags will automatically be printed at the end of the page. This has the disadvantage that it will invalidate the page source.
    2. You can call `textmate_print_error_handler`() anywhere in your code to print the JavaScript.
    3. Alternatively, you can use the `phperr⇥` snippet in HTML to insert the script tags directly into your template.

## Short Tags

If you want the various snippets to use short tags, i.e. `<? … ?>` rather than `<?php … ?>`, then you can set a shell variable in Preferences (under Advanced):

   * Set `TM_PHP_OPEN_TAG` to an empty value to use short-tags.
   * Set `TM_PHP_OPEN_TAG_WITH_ECHO` to either `" echo"` (without the quotes) to use short tags, or to `=` to use the short-form for echo statements.


## Miscellaneous

You may find it preferable to add ‘`$`’ to the list of word characters recognised by TextMate. To do this, open the TextMate → Preferences… → Text Editing dialog and type a single ‘`$`’ character in the “Word Characters” text field. With this change, moving by a word with ⌥← and ⌥→ will jump over PHP variables instead of stopping at the ‘`$`’ symbol.
