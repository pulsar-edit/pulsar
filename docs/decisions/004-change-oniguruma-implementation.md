---
status: accepted
date: 2023-03-28
deciders: '@mauricioszabo, @confused-Techie, @savetheclocktower'
---
# Use a different Oniguruma implementation for TextMate grammars

## Current version of Oniguruma is in-house and crashes with Electron >= 21

To tokenize TextMate grammars, Pulsar uses a NPM binary library called
Oniguruma. Unfortunately, while we could make the native library work on
Electron versions 14 up to 20, when upgrading to Electron 21 it breaks because
of the new V8 Memory Model (sandboxed pointers).

## Considered Options

* Migrate to a pure-JS version of Oniguruma
* Migrate to [WASM Oniguruma](https://github.com/rebornix/wasm-oniguruma)
* Migrate to [VSCode Oniguruma](https://github.com/microsoft/vscode-oniguruma/)
* Migrate **all tokenization** to [VSCode Textmate](https://github.com/microsoft/vscode-textmate)

## Decision Outcome

Chosen option: "Migrate fo VSCode Oniguruma", because the pure JS version we found was not up-to-date with Oniguruma and could not parse most of the Regexp that our grammars need; second, WASM Oniguruma didn't see any update in the last 6 years, so we end up with vscode-oniguruma.

We basically duplicated the
[first-mate](https://github.com/pulsar-edit/first-mate/) repository and created
[second-mate](https://github.com/pulsar-edit/second-mate/), that uses the new
VSCode oniguruma version

## Pros and Cons of the Options

### Bump to Electron 23

It was confirmed that new vscode-oniguruma works with Electron 23.

### Faster

This is maybe counter-intuitive, but for some reason, the tokenizer got faster
when we migrated to vscode-oniguruma (by about 50% in some cases). We had also
lower deviation - the slowest case and the fastest one are now closer in time

### macOS problems

This broke Silicon macOS builds because if we use WASM, we need to add [Allow
JIT entitlement to the plist
file](https://github.com/pulsar-edit/pulsar/pull/454). We solved this, but with
this entitlement, Intel macOS builds also got slower ([Electron issue](https://github.com/electron/electron/issues/26143))

### Memory leaks

We found out that in some situations, we could have memory leaks - basically,
WASM doesn't have garbage collection like Node, so every time we created new
`OnigScanner` objects (discarding the old ones) that caused a new memory
allocation without any deallocation of the old memory.

To mitigate this, we basically implemented a cache of `OnigScanner`s - when
someone instantiates this class, it'll first see if a previous version was
instantiated, and if so, it'll reuse the same object. This doesn't _actually
solve_ the memory leak, but makes it controllable - TextMate grammars do not use
too many regular expressions, so everytime one opens Pulsar, even if the user
have multiple TextMate grammars only it'll only leak a couple kilobytes of
memory, so it's considered a non-issue for now.

## Usage of VSCode TextMate

VSCode TextMate is a library that basically highlights all code in VSCode. One
idea was to migrate away completely from `first-mate` and use this library as
the tokenizer. Unfortunately, `first-mate` is actually _more correct_ than
VSCode's implementation - for example, Pulsar is able to higlight XML namespaces
on attributes, like for example `<e foo:bar="attr">` (the `foo` gets
highlighted)

## Second-Mate, and VSCode-Oniguruma patches

VSCode-Oniguruma works a little bit differently than Atom's version. On VSCode's
version, when it doesn't find a match (length=0 on the result) VSCode's version
return a meaningless value on `start` and `end`, whereas Atom's return the
latest `end` from the previous match. We had to normalize this on Second-Mate.

Also, Atom's version of Oniguruma had an object called `OnigRegExp` that the new
library doesn't have. The only usage of that object was a method called `test` -
fortunatelly, this translates 100% do using `OnigScanner#findNextMatchSync`, so
we moved all usages to this new API - meaning, `second-mate` is 90% compatible
with `first-mate`, with the exception of the `firstLineRegex` and
`contentsRegex`, that now return an object of `OnigScanner` instead of
`OnigRegExp`.
