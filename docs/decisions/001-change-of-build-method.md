---
status: accepted
date: 2022-08-01
---
# Removal of the old build scripts, V8 Snapshots, and migration to `yarn`

## Build scripts on Atom

It was _really difficult_ to understand the old build scripts. They basically
transpiled the old code and copied some dependencies on a directory called
`app`; then, some dependencies were installed, some other steps were run, like
creating some manifests and metadata; finally, this transpiled code was passed
through another script that basically generated a `mksnapshot` script command,
and everything was _manually packaged_ into an ASAR file.

The problems: the script was too big, it depended on `npm` < 7.0, it used to
fail constantly (needing multiple "clean" commands), it took too much time, and
basically the "snapshots" depended on the source file _structure_ on the disk -
if we decided to rename some file, or move some `require`s around, the script
would break; also, some of the dependencies of that script were also made
in-house, making for new work to keep in Pulsar

## Decision Drivers

* Easier to install dependencies
* Easier to build binaries, in a way that can work in the first run instead
of multiple retries
* Make it easier to build and start hacking the editor
* Faster to build and hack, specially after bumping dependencies

## Considered Options

* Rewrite the scripts
* Remove the scripts completely and migrate to electron-build

## Decision Outcome

Chosen option: "Remove the scripts". It makes things easier because we don't
need to keep any in-house packaging of Electron, ASAR creation, and
RPM/DEB/AppImage generation for Linux, or binaries for Mac / Windows.

### Consequences

* Faster editor bootstrap, and easier to bump dependencies, specially Electron
* The editor is _way slower_ to load
* We had some bugs because we are not using V8 Snapshots anymore - basically,
with V8 Snapshots, the global object `atom` was present where it wasn't supposed
to
