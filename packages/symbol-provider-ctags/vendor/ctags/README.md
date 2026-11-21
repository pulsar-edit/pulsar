# Exuberant Ctags 5.8

This directory holds the source for the `ctags` executable that `symbol-provider-ctags` runs. It's built from source on install by `binding.gyp` at the package root, so the binary always matches the platform and architecture it runs on. The output is `build/Release/ctags` (`ctags.exe` on Windows).

We build from source instead of vendoring prebuilt binaries because those binaries ended up stuck on one architecture: x86-64 on macOS and Linux, 32-bit x86 on Windows. On Apple Silicon they needed Rosetta, and on Linux arm64 they didn't work at all. See [pulsar-edit/pulsar#1635](https://github.com/pulsar-edit/pulsar/issues/1635).

We stay on Exuberant Ctags rather than its maintained successor, Universal Ctags, because `lib/ctags-config` and the tag-line parser in `lib/ctags-provider.js` are written against 5.8's behavior. It’s possible we may migrate to Universal Ctags in the future… but this is no longer our preferred way of providing symbols to Pulsar, so it’s not a priority.

## Provenance

* Upstream: <https://downloads.sourceforge.net/project/ctags/ctags/5.8/ctags-5.8.tar.gz>
* SHA-256: `0e44b45dcabe969e0bbbb11e30c246f81abe5d32012db37395eb57d66e9e99c7`

`src/` is a subset of that tarball with the patches in `patches/` already applied. It contains the files listed under `SOURCES` in the tarball's `source.mak`, every header, `gnu_regex/` (used only on Windows), and `COPYING`. Docs, makefiles for other platforms, and the autoconf machinery are left out.

## Patches

Applied in order; each applies with `patch -p1` from inside an extracted `ctags-5.8` directory.

1. **`01-ctags-attr-unused.patch`**: renames the `__unused__` macro to `CTAGS_ATTR_UNUSED`. The old name collides with modern system headers (recent macOS SDKs, glibc 2.34+).
2. **`02-non-const-file.patch`**: stops declaring the global `File` as `const` outside `read.c`, which writes to it. Without this, optimizing compilers can reuse stale values, and the JavaScript parser reports some tags one line too early. (From Homebrew.)
3. **`03-r782-memmove.patch`**: upstream SVN r782, which was never released. It replaces an overlapping `strcpy` in path canonicalization with `memmove`. (Also carried by Homebrew.)
4. **`04-modification-notices.patch`**: adds a comment to the top of each file changed by patches 1–3, stating that it was modified and when, as GPL-2.0 §2(a) requires. It doesn't change any code. If you add a patch that touches another file, add a notice to that file too.

With patches 1–3 applied, the output is identical to the prebuilt macOS binary this replaces (which appears to have been Homebrew's build) across a corpus of about 38,000 tags.

## Configuration

5.8 normally runs `./configure` to produce a `config.h`. We don't. `config/darwin/config.h` and `config/linux/config.h` are written by hand, and Windows uses the defines from 5.8's `mk_mvc.mak` (see `binding.gyp`). That's deliberate: on modern compilers, configure's test for a working `regcomp()` fails to compile, so configure concludes `regcomp()` is broken and silently builds ctags **without regex support**. Every `--langdef`/`--regex-*` in `lib/ctags-config` then stops working.

If you change the build, run something like this from the package root afterward:

```sh
build/Release/ctags --options=lib/ctags-config --version
```

It should print no `regex support not available` warnings.

## Verifying `src/`

```sh
curl -LO https://downloads.sourceforge.net/project/ctags/ctags/5.8/ctags-5.8.tar.gz
shasum -a 256 ctags-5.8.tar.gz   # compare against the checksum above
tar xzf ctags-5.8.tar.gz
cd ctags-5.8
for p in /path/to/vendor/ctags/patches/*.patch; do patch -p1 < "$p"; done
for f in $(cd /path/to/vendor/ctags/src && find . -type f); do cmp "$f" "/path/to/vendor/ctags/src/$f"; done
```

## Running specs from `packages/`

yarn copies this package into `node_modules/symbol-provider-ctags` and builds it there. To run its specs from `packages/symbol-provider-ctags` instead, build it in place first with `npx node-gyp rebuild`.

## License

Exuberant Ctags is GPL-2.0; see `src/COPYING`. The bundled `gnu_regex/`, which is compiled in only on Windows, is LGPL-2.1. Only the `ctags` executable is distributed with Pulsar, and nothing links against it. Pulsar's packaging leaves this directory out, so the package's `LICENSE.md` carries both license texts and a link back to this source.
