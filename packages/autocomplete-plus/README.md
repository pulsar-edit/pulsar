# Autocomplete+ package
[![macOS Build Status](https://travis-ci.org/atom/autocomplete-plus.svg?branch=master)](https://travis-ci.org/atom/autocomplete-plus) [![Windows Build status](https://ci.appveyor.com/api/projects/status/9bpokrud2apgqsq0/branch/master?svg=true)](https://ci.appveyor.com/project/Atom/autocomplete-plus/branch/master) [![Dependency Status](https://david-dm.org/atom/autocomplete-plus.svg)](https://david-dm.org/atom/autocomplete-plus)

Displays possible autocomplete suggestions on keystroke (or manually by typing `ctrl-space`) and inserts a suggestion in the editor if confirmed.

![autocomplete+](https://cloud.githubusercontent.com/assets/744740/7656861/9fb8bcc4-faea-11e4-9814-9dca218ded93.png)

[Changelog](https://github.com/atom/autocomplete-plus/releases)

## Installation

`autocomplete+` is bundled with Atom. You don't have to do anything to install it.

## Providers

`autocomplete+` has a powerful autocomplete provider API, allowing provider authors to add language-specific behavior to this package.

You should *definitely* install additional providers (the default provider bundled with this package is somewhat crude): https://github.com/atom/autocomplete-plus/wiki/Autocomplete-Providers

## Usage

Just type some stuff, and autocomplete+ will automatically show you some suggestions.
Press `UP` and `DOWN` to select another suggestion, press `TAB` or `ENTER` to confirm your selection. You can change the default keymap in `Preferences`:

* Keymap For Confirming A Suggestion

Additionally, the confirm keymap can be customized in your keymap.cson:

```coffeescript
'atom-text-editor.autocomplete-active':
  'tab': 'unset!'
  'ctrl-shift-a': 'autocomplete-plus:confirm'
```

If setting custom keybindings, use the `none` setting for the confirmation keymap. All this option does is not set any other keybindings. This allows the `TAB` and `ENTER` keys to be used like normal, without side effects.

### Remapping Movement Commands

By default, autocomplete-plus commandeers the editor's core movement commands when the suggestion list is open. You may want to change these movement commands to use your own keybindings.

First you need to set the `autocomplete-plus.useCoreMovementCommands` setting to `false`, which you can do from the `autocomplete-plus` settings in the settings view.

![core-movement](https://cloud.githubusercontent.com/assets/69169/8839134/72a9c7e6-3087-11e5-9d1f-8d3d15961327.jpg)

Or by adding this to your config file:

```coffee
"*":
  "autocomplete-plus":
    "useCoreMovementCommands": false
```

Then add these to your keymap file:

```coffeescript
'body atom-text-editor.autocomplete-active':
  'ctrl-p': 'autocomplete-plus:move-up'
  'ctrl-n': 'autocomplete-plus:move-down'
  'pageup': 'autocomplete-plus:page-up'
  'pagedown': 'autocomplete-plus:page-down'
  'home': 'autocomplete-plus:move-to-top'
  'end': 'autocomplete-plus:move-to-bottom'
```

## Features

* Shows suggestions while typing
* Includes a default provider (`SymbolProvider`):
  * Wordlist generation happens when you open a file, while editing the file, and on save
  * Suggestions are calculated using `fuzzaldrin`
* Exposes a provider API which can be used to extend the functionality of the package and provide targeted / contextually correct suggestions
* Disable autocomplete for file(s) via blacklisting, e.g. `*.md` to blacklist Markdown files
* Disable autocomplete for editor scope(s) via blacklisting
* Expands a snippet if an autocomplete+ provider includes one in a suggestion
* Allows external editors to register for autocompletions

## Provider API

Great autocomplete depends on having great autocomplete providers. If there is not already a great provider for the language / grammar that you are working in, please consider creating a provider.

[Read the `Provider API` documentation](https://github.com/atom/autocomplete-plus/wiki/Provider-API) to learn how to create a new autocomplete provider.

## `SymbolProvider` Configuration

If the default `SymbolProvider` is missing useful information for the language / grammar you're working with, please take a look at the [`SymbolProvider` Config API](https://github.com/atom/autocomplete-plus/wiki/SymbolProvider-Config-API).

## The `watchEditor` API

The `watchEditor` method on the `AutocompleteManager` object is exposed as a [provided service](http://flight-manual.atom.io/behind-atom/sections/interacting-with-other-packages-via-services/), named `autocomplete.watchEditor`. The method allows external editors to register for autocompletions from providers with a given set of labels. Disposing the returned object will undo this request. External packages can access this service with the following code.

In `package.json`:
```
{
  "consumedServices": {
    "autocomplete.watchEditor": {
      "versions": {
        "1.0.0": "consumeAutocompleteWatchEditor"
      }
    }
  }
}
```
In the main module file:
```
consumeAutocompleteWatchEditor(watchEditor) {
  this.autocompleteDisposable = watchEditor(
    this.editor, ['symbol-provider']
  )
}
```
