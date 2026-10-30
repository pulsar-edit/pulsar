# Bumping Electron

We expect to be bumping Electron versions much more frequently these days… first to catch up with the latest Electron release, then to keep up with it. These notes that may come in handy with future bumps.

## Bump in `pulsar`

Choose the Electron version you want to install. We’ll call it X.Y.Z.

```bash
yarn install electron@X.Y.Z
```

Build the app:

```bash
yarn dist # or `yarn dist --next` if you want better isolation from main Pulsar
```

Launch the app. Do some sanity checking. Read the Electron release notes between the current version and X.Y.Z to make sure you’re not missing any major gotchas. (If the release notes mention dropping support for any specific OS versions, note that; that applies to Pulsar as well.)

Open the dev tools console and run `process.versions`. Inspect the result to find out the version of Node that this version of Electron is using. We’ll call it T.U.V.

If it works fine, proceed; if not, troubleshoot.

## Update the version references

The Node version is written down in more places than you’d expect, and nothing will fail loudly if you miss one. Update all of these to T.U.V:

* the `electronVersion` field in `package.json`
* the `engines.node` field in `package.json`
* `.nvmrc`
* `ppm/BUNDLED_NODE_VERSION` (see the next section)

## Bump Node version in `ppm`

Open the `ppm` repo and read `docs/bumping-the-node-version.md` to proceed. In some places you’ll need to supply the new Node version (`T.U.V`) and in some places the new Electron version (`X.Y.Z`).

## Push to a branch and verify the builds

The proof is in “the pudding,” which is my nickname for CI. If, after these changes, CI can produce a working binary on each platform that uses the intended Electron version, we’re in great shape. Otherwise, troubleshoot what went wrong (perhaps one of the items noted below).

## Other notes

### Native dependencies: `nan` and `node-abi`

These two are pinned in the `resolutions` block of `package.json`, and a version of either that predates X.Y.Z will break the build in a way that is not always obvious. Both are pinned to _exact_ versions on purpose — the point of a resolution is determinism, and `node-abi` in particular is ABI-mapping-sensitive.

**`node-abi`** maps a runtime version to an ABI number. Its `abi_registry.json` is a static table, so a version published before X.Y.Z existed simply doesn’t know about it. The symptom is a wrong or missing ABI at prebuild-download time rather than a compiler error.

**`nan`** is a compatibility shim over the V8 C++ API. Each Electron bump tends to bring a V8 that has removed something `nan` was still using, so an old `nan` fails at the `electron-rebuild` step with a C++ compile error naming the removed symbol.

#### Finding the real floor

Don’t guess from changelogs! The changelog entry that fixes your problem is often not the one that sounds like it does. Compile something small against the new Electron’s headers instead:

```bash
mkdir /tmp/nantest && cd /tmp/nantest
curl -sL "https://registry.npmjs.org/@pulsar-edit/fuzzy-native/-/fuzzy-native-1.3.2.tgz" \
  | tar -xz --strip-components=1 -C .

for v in 2.19.0 2.20.0 2.21.0 2.22.0 2.23.0; do
  rm -rf node_modules build && mkdir -p node_modules/nan
  curl -sL "https://registry.npmjs.org/nan/-/nan-$v.tgz" \
    | tar -xz --strip-components=1 -C node_modules/nan
  if npx node-gyp rebuild --target=X.Y.Z --dist-url=https://electronjs.org/headers > "log-$v.txt" 2>&1
  then echo "nan $v => OK"
  else echo "nan $v => FAILED: $(grep -oE 'error: .{0,80}' "log-$v.txt" | head -1)"
  fi
done
```

`fuzzy-native` is a good canary: it’s small, it’s pure `nan`, and it has historically been the first thing to break on an Electron bump.

For `node-abi`, check the table directly:

```bash
curl -sL "https://registry.npmjs.org/node-abi/-/node-abi-<version>.tgz" \
  | tar -xz --strip-components=1 -C . package/abi_registry.json
node -e "console.log(require('./abi_registry.json').filter(e => e.runtime === 'electron' && e.target.startsWith('X.')))"
```

#### Known floors (as of Electron 32.3.3)

Verified by the procedure above, building against Electron 32.3.3 headers:

| Dependency | Floor | What fails below it |
| ---------- | ----- | ------------------- |
| `nan`      | **2.22.0** | 2.19.0: `no template named 'CopyablePersistentTraits' in namespace 'v8'`<br>2.20.0: `no member named 'IdleNotificationDeadline' in 'v8::Isolate'`<br>2.21.0: `no member named 'SetAccessor' in 'v8::ObjectTemplate'` |
| `node-abi` | **3.65.0** | 3.64.0 and earlier top out at Electron 31; 3.65.0 is the first to know Electron 32 (ABI 128) |

But remember:

* If you ever pin `nan` to the bare floor, use **2.22.2**, not 2.22.0. 2.22.1 fixed a build incompatibility with Python ≥ 3.12, and CI builds with Python 3.12.
* **Do not move `node-abi` to 4.x until Node 22.12.0.** `node-abi@4.0.0` declares `engines: { node: ">=22.12.0" }`, which conflicts with our own `engines.node`. Stay on the 3.x line until Pulsar’s is using a version of Electron that bundles Node 22.12.0 or greater.

We pin the versions we’ve actually shipped CI-green builds with, not the bare floors. The floors are recorded here so the next bump knows how much room it has.

### Linux builds: the `glibc` floor and the compiler toolchain

`.github/workflows/build.yml` carries a long comment explaining the mechanism; this is the summary and the maintenance checklist.

#### Old OS, new compiler

We build Linux binaries inside an old OS image so that the resulting binaries keep working on old distributions. That way the `glibc` version of the build image becomes the floor for every user.

But V8 now (first encountered in Electron 32.2.3) requires a compiler that understands C++20, and old distros’ stock compilers don’t. Those two requirements pull in opposite directions.

The resolution is the PyPA’s `manylinux_2_28` image (`quay.io/pypa/manylinux_2_28_x86_64` and `_aarch64`): AlmaLinux 8, so `glibc` 2.28, with a modern GCC from Red Hat’s `gcc-toolset` first on `PATH`. It’s the image Python projects use to build C++ extension wheels for old distros. No compiler overrides are needed; every step that compiles anything just uses `gcc`/`g++`.

#### Why `gcc-toolset`, and never `-static-libstdc++`

A modern GCC emits code that references symbols from its own, newer `libstdc++` (`GLIBCXX_3.4.29` and up), which old distros don’t have. There are two ways to deal with that:

1. **Link `libstdc++` statically** with `-static-libstdc++`. *This crashes Pulsar.* Every native module gets its own private C++ runtime, while GTK, Mesa and friends have already loaded the system’s `libstdc++.so.6` into the renderer. The dynamic linker merges some of the module runtime’s symbols with the system copy (notably `STB_GNU_UNIQUE` ones like `std::locale::id` instances), the two runtimes end up disagreeing about locale facet indices, and the renderer segfaults the first time a module touches an iostream. Pulsar 1.133.0 shipped exactly this way, using conda-forge’s GCC; see [#1685](https://github.com/pulsar-edit/pulsar/issues/1685).
2. **Use `gcc-toolset`.** Its `libstdc++.so` is a linker script — `INPUT ( /usr/lib64/libstdc++.so.6 -lstdc++_nonshared )` — so modules link dynamically against the *system* `libstdc++`, and only the symbols newer than the system library come statically from `libstdc++_nonshared.a`. One C++ runtime per process, and no `GLIBCXX` requirement beyond what the build image ships.

The “Verify toolchain - Linux” step fails the build if `g++` ever stops resolving `libstdc++.so` to that linker script.

#### The ABI floor check

`script/check-linux-abi-floor.sh` inspects every `*.node` under `node_modules` and fails the build if any of them

* requires a `glibc` or `libstdc++` newer than our declared floor, or
* defines C++ runtime internals (`__gxx_personality_v0`, `std::locale`) — i.e., has a C++ runtime statically linked into it.

It runs as the “Verify Linux ABI Floor” step, right after the Linux rebuild. Both failures are invisible in CI otherwise: the test job runs on `ubuntu-latest`, which has a new enough `libstdc++` for anything, and the static-runtime crash didn’t reproduce there either.

The floor lives in `build.yml`’s top-level `env` block:

```yaml
MAX_GLIBC_VERSION: '2.31'
MAX_GLIBCXX_VERSION: '3.4.28'
```

That’s the support pledge on our website, not the build image. The image itself targets `glibc` 2.28 / `GLIBCXX_3.4.25`, so anything we compile comes in well under; the slack is there for third-party prebuilt binaries we ship as-is. If the check fails, **fix the build rather than raising these numbers** — raising them silently drops support for distros we currently ship to. You can run it locally against a Linux build tree:

```bash
MAX_GLIBC_VERSION=2.31 MAX_GLIBCXX_VERSION=3.4.28 script/check-linux-abi-floor.sh node_modules
```

It also fails if it finds zero `.node` files, so that a wrong path can’t masquerade as a pass.

This is a… _thorough_ step. We could choose to run it only selectively if we wanted to speed up most builds; once we get a positive result, it should be good until the next time we bump a dependency.

#### Choosing the build image

**Don’t target a higher `glibc` than Electron itself requires.** Doing so needlessly drops users. Targeting a lower one is harmless but buys nothing, since Electron’s own binaries won’t run there anyway.

If you change images, keep to the `manylinux` family (or anything else whose compiler is a `gcc-toolset`/`devtoolset`), and update `MAX_GLIBC_VERSION` and `MAX_GLIBCXX_VERSION` if our support pledge changes with it. `manylinux_2_28` is based on AlmaLinux 8, which is supported until 2029.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `no member named '...' in 'v8::...'` during `electron-rebuild`, but the initial `yarn install` succeeded | `nan` is too old. Electron’s V8 is much newer than the V8 in the Node version it bundles, so a module can build fine on standalone Node and still fail here. |
| Rebuild fails only on Linux, with C++20 complaints | Something overrode `CC`/`CXX`, or the image’s `gcc-toolset` is too old. Check the output of “Verify toolchain - Linux.” |
| “Verify Linux ABI Floor” fails with “contains its own copy of the C++ runtime” | Something linked that module with `-static-libstdc++`, or it’s a third-party prebuild that was. Shipping it risks a renderer crash; see above. |
| “Verify Linux ABI Floor” fails with a `GLIBC_*`/`GLIBCXX_*` version | Usually a third-party prebuilt binary built against a newer distro. |
| Prebuilds download for the wrong ABI, or none is found | `node-abi` is too old to know about X.Y.Z. |
| Linux build fails at “Install build dependencies” | A package was renamed or moved between EL8 repositories (`baseos`, `appstream`, `powertools`). |
