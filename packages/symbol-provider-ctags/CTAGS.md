# Where our `ctags` comes from

This package used to vendor prebuilt [Exuberant Ctags](https://ctags.sourceforge.net/) 5.8 binaries for each platform. They were all built for x86, which meant Rosetta on Apple Silicon and no working binary at all on Linux arm64 ([#1635](https://github.com/pulsar-edit/pulsar/issues/1635)).

We now build `ctags` from source on install (`binding.gyp`, `vendor/ctags/`). This document explains how we got to that source, since most of it had to be reconstructed. [`vendor/ctags/README.md`](vendor/ctags/README.md) describes the result: the upstream checksum, the patches, and how to verify `src/`.

## The old macOS binary was Homebrew's

The vendored `ctags-darwin` came from Atom's `symbols-view` package. Its last update was [atom/symbols-view#252](https://github.com/atom/symbols-view/pull/252) (February 2020), which swapped in a binary built against a newer macOS SDK so Atom could pass notarization. The PR doesn't say where the binary came from, and its final commit is titled "find another file to overcome illegal --options."

Three pieces of evidence point to Homebrew's `ctags` formula:

* The binary identifies itself as plain Exuberant Ctags 5.8, but stock 5.8 produces different output for some JavaScript files.
* Homebrew builds 5.8 with a couple of patches (see below).
* With those patches applied, our build's output matches the old binary's byte for byte, across about 38,000 tags from roughly 400 files in this repo.

We never found a record of that binary being copied from Homebrew, so treat the attribution as very likely rather than certain. Either way, the patch set below is what reproduces its behavior.

## The patches

All three are needed:

1. **Renaming `__unused__` to `CTAGS_ATTR_UNUSED`.** Stock 5.8 defines a macro called `__unused__`, which breaks modern system headers that use `__attribute__((__unused__))`. Homebrew works around this by disabling the macro (`#if 0`). We use the rename instead, which is how Universal Ctags and Debian fixed it.
2. **Making `File` non-`const`.** Stock 5.8 declares the reader's global state, `File`, as `extern const` everywhere except `read.c`, the file that writes to it. Optimizing compilers are therefore free to reuse stale reads, which made some JavaScript `property` tags come out one line too early. This is from Homebrew's macOS-only `Patches/ctags/5.8.patch`, and it's the patch that made our output match the old binary.
3. **Upstream r782.** A fix committed to `ctags`' SVN trunk after 5.8 and never released: `memmove` instead of an overlapping `strcpy` when canonicalizing paths. Homebrew carries it as a backport.

## Why we don't run `./configure`

The usual `./configure && make` build looks like it works, but on a modern compiler it quietly produces a crippled binary. configure checks whether `regcomp()` works by compiling a small test program. That program relies on implicit `int` and an undeclared `exit()`, both of which current clang rejects as errors. configure takes the failed compile to mean `regcomp()` is broken, defines `REGCOMP_BROKEN`, and builds `ctags` **without regex support**.

`ctags` itself builds and runs fine that way, but every `--langdef` and `--regex-*` in `lib/ctags-config` stops working. That means no symbols at all for Go, TypeScript, CoffeeScript, Markdown, and the other config-defined languages, plus fewer for JavaScript. The provider ignores `ctags`' stderr, so the only sign is missing symbols. (Homebrew avoids the problem by adding `-Wno-implicit-function-declaration -Wno-implicit-int` to `CFLAGS`.)

So `binding.gyp` skips configure entirely. `vendor/ctags/config/{darwin,linux}/config.h` are hand-written from configure's macOS output, without `REGCOMP_BROKEN` and without machine-specific values such as the build machine's `$TMPDIR`. Windows uses the defines from 5.8's own `mk_mvc.mak`, including its bundled GNU regex. The spec for Go symbols (`spec/fixtures/go`) exists to catch a regex-less build: Go is defined only in `lib/ctags-config`, so without regex support it gets no symbols.

## Why `node-gyp`?

`ctags` is a standalone executable, not a Node addon. We build it with `node-gyp` because every environment that builds Pulsar already has `node-gyp` and a working C toolchain, and because `node-gyp` builds for the target architecture without any extra work. `yarn` runs it automatically for any package that has a `binding.gyp`, and so does `electron-rebuild` (`yarn build`), which is harmless.
