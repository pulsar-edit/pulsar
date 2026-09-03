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

#### Why there are two compilers

We build Linux binaries inside an old Debian container so that the resulting binaries keep working on old distributions. That way the `glibc` version of the build host becomes the floor for every user.

But V8 now (first encountered in Electron 32.2.3) requires a compiler that understands C++20, and old Debian’s `gcc` doesn’t. Those two requirements pull in opposite directions.

The resolution: keep the old Debian image for its `glibc`, but install a newer `gcc` from conda-forge (via a pinned `micromamba`) and point it back at the *system* headers and libraries with `-I/usr/include` and `-L/usr/lib/...`. That gives us a modern compiler targeting an old `glibc`.

The vendored toolchain is currently used **only** for the `electron-rebuild` step, since Electron is the only thing demanding C++20. Everything else still builds with Debian’s stock `gcc`. To widen it, point the relevant step’s `CC`/`CXX`/`CFLAGS`/`CXXFLAGS`/`LDFLAGS` at the `PULSAR_*` variables the “Configure Modern GCC Toolchain” step exports.

But we will need it everywhere eventually! The V8 that first forced this on us was 12.8, and Node itself didn’t ship a V8 that new until 23.0.0. Once we’re on an Electron that bundles Node 24, the stock compiler probably won’t build anything. (But then it’s possible that that Electron release will have bumped to a newer `glibc` and a newer Debian!)

#### `-static-libstdc++` is not optional

Targeting an old `glibc` is only half the job. GCC 12 will happily emit code referencing symbols from *its own* much newer `libstdc++` (`GLIBCXX_3.4.29` and up) — and we don’t ship the conda environment to users. Without `-static-libstdc++ -static-libgcc` in `LDFLAGS`, you get binaries that build clean, test green, and then fail to load on exactly the older distros this whole arrangement exists to support:

```
/lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.29' not found
```

Because that failure is invisible in CI (the test job runs on `ubuntu-latest`, which has a new enough `libstdc++` for anything) we verify it explicitly.

#### The ABI floor check

`script/check-linux-abi-floor.sh` disassembles every `*.node` under `node_modules` and fails the build if any of them requires a `glibc` or `libstdc++` newer than our declared floor. It runs as the “Verify Linux ABI Floor” step, right after the Linux rebuild.

The floor lives in `build.yml`’s top-level `env` block:

```yaml
MAX_GLIBC_VERSION: '2.31'
MAX_GLIBCXX_VERSION: '3.4.28'
```

Those correspond to the Debian image we build in. If the check fails, **fix the compiler flags rather than raising these numbers** — raising them silently drops support for distros we currently ship to. You can run it locally against a Linux build tree:

```bash
MAX_GLIBC_VERSION=2.31 MAX_GLIBCXX_VERSION=3.4.28 script/check-linux-abi-floor.sh node_modules
```

It also fails if it finds zero `.node` files, so that a wrong path can’t masquerade as a pass.

This is a… _thorough_ step. We could choose to run it only selectively if we wanted to speed up most builds; once we get a positive result, it should be good until the next time we bump a dependency.

#### Choosing the Debian image

**Track whatever Debian version Electron itself uses to build its Linux binaries.** Targeting a *higher* `glibc` than Electron does needlessly drops users; targeting a *lower* one buys nothing, since Electron’s own binaries won’t run there anyway. Electron 32 builds on Debian 11, hence `glibc` 2.31.

When you change the image, update `MAX_GLIBC_VERSION` and `MAX_GLIBCXX_VERSION` to match it. For reference, Debian 11 ships `glibc` 2.31 / `GLIBCXX_3.4.28`; Debian 12 ships `glibc` 2.36.

Note also that Debian releases go EOL and their packages move to `archive.debian.org`, at which point `apt-get update` starts 404ing inside the container. Debian 11’s LTS ended 2026-08-31. The first step of the Linux build detects this and rewrites `apt`’s sources automatically, so it should heal itself — but if a build suddenly fails at `apt-get update`, that’s the first place to look.

### Pinned toolchain versions

`micromamba` is pinned by version *and* by SHA-256 in `build.yml`, because it’s the root of trust for the entire compiler toolchain. To bump it, change `MICROMAMBA_VERSION` and paste in the new hashes from the release’s published `micromamba-<arch>.sha256` files. The toolchain itself is cached under a key derived from `GCC_VERSION` and `MICROMAMBA_VERSION`, so changing either gets you a fresh one automatically.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `no member named '...' in 'v8::...'` during `electron-rebuild`, but the initial `yarn install` succeeded | `nan` is too old. Electron’s V8 is much newer than the V8 in the Node version it bundles, so a module can build fine on standalone Node and still fail here. |
| Rebuild fails only on Linux, with C++20 complaints | The vendored toolchain isn’t being used for that step. Point it at the `PULSAR_*` variables. |
| “Verify Linux ABI Floor” fails | Missing `-static-libstdc++ -static-libgcc`, or a dependency ignored our `CFLAGS` and compiled against the conda environment’s headers. |
| Prebuilds download for the wrong ABI, or none is found | `node-abi` is too old to know about X.Y.Z. |
| Linux build fails at `apt-get update` | The Debian release has gone EOL and moved to `archive.debian.org`. |
