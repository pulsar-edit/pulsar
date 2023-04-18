---
status: rejected
---
# Make a compatibility layer on Pulsar's "pathwatcher"

## Remove the binary dependency on "pathwatcher" and a compatibility layer to use Pulsar's public API

The idea was to keep 100% API compatibility with Pathwatcher using Pulsar's public API (using `require('atom').watchPath` code). The experiment lives on [Pulsar
Pathwatcher](https://github.com/pulsar-edit/pulsar-pathwatcher) repository

## Decision Drivers

* Avoid another watch library
* Avoid another binary dependency

## Decision Outcome

Because of the cyclic dependency between TextBuffer and Pulsar, together with
the "exports" library and other issues, this experiment didn't go far. Some
infinite loops happened, sometimes the renderer process crashed, and sometimes
other weird issues appeared depending on the order things got loaded, so
this will probably be revisited in the future, if at all.
