---
status: accepted
---
# Removal of experimental watchers on Pulsar

## Removal of @atom/watcher and others

Atom had four different ways of watching for filesystem changes. Two used an
in-house library called `@atom/watcher` - one for "polling" and other for
"experimental". It also had a different library to watch files for changes that
basically used the Tree-View package's watch mechanism

## Decision Drivers

* We don't know what "experimental watcher" means, and we have no way of knowing
* We don't want to support another "in-house" library to watch files, specially
considering that it's a binary library
* We know that tree-view _can use_ Pulsar's watcher mechanism to watch files,
meaning we enter somekind of weird loop

## Considered Options

* Use `nsfw` only
* Use `chokidar` only

## Decision Outcome

Use only `nsfw` library to watch for changes, and use the community version of
that library. Make the config for "watch" in Pulsar reflect that we only have
`nsfw` as an option (Native operating system APIs).

## Validation

Files are still being watched. Config failed to watch, but that's because of a
different issue - see ADR 001

## More Information

We still have another "watch" library called Pathwatcher. It is used by
TextBuffer, atom-keymap and tree-view. It may be possible to remove this library
to use only Pulsar's watch mechanism (it is available under the public API) so
every code will basically use the public API and they will all respect the
choice of what Pulsar defined, if we decide to introduce new file watcher
libraries in the future
