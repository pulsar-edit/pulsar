---
status: accepted
date: 2023-08-10
deciders: '@confused-Techie, @Daeraxa, @savetheclocktower, @mauricioszabo'
---
# Remove original AutoUpdate Functionality

## Context and Problem Statement

To provide users with some form of autoupdate functionality, many thought we could
adopt the original method used by the Atom team, and de-facto method within Electron
applications, Squirrel. While Squirrel is great for AutoUpdating, it has some big
issues, mainly it requires that every platform has signed binaries, which can be
prohibitively expensive. Additionally, it only supports Windows and macOS.

## Decision Drivers

* Users need a way to fulfill AutoUpdate functionality

## Considered Options

* Sign Windows and macOS (Already do) binaries, and setup Squirrel.
* Remove AutoUpdate totally.
* Use core package to assist in update installation.

## Decision Outcome

Chosen option: "Use core package to assist in update installation", to allow similar
behavior, we opted to create a core package that could help alert users of updates
to Pulsar being available, while technically not actually preforming any installation.
This new core package was added to Pulsar in [`pulsar-edit/pulsar#656`](https://github.com/pulsar-edit/pulsar/pull/656).
This package alerts and assists in users installing new updates to Pulsar, while no
longer relying on any form of AutoUpdate functionality from Squirrel.

This means, that we can now remove all Squirrel and AutoUpdate functionality that's
built right into Pulsar, hopefully cutting down on startup time.

<!-- This is an optional element. Feel free to remove. -->
### Consequences

* Good, because this allows a semblence of AutoUpdate functionality without ever having to hit our own backend.
* Good, because it allows users to be more in control, and automatically notified of new versions.
* Good, because it sections off the logic to a package that can be disabled or replaced as needed.
* Bad, because it does not actually preform any autoupdates.

## Pros and Cons of the Options

### Sign Windows and macOS binaries, and setup Squirrel

This would return things to the status quo, of Atom AutoUpdate functionality.

* Good, because users would know what to expect.
* Good, because it would provide AutoUpdates to Windows and macOS users.
* Bad, because it would be prohibitively expensive, and would fail to work if we ever
didn't have the funds for expensive binary signing costs.
* Bad, because this would leave Linux users with still zero support for AutoUpdates.
* Bad, because it would add additional complexity into our CI for signing Windows binaries.

### Remove AutoUpdates totally

This is essentially, what we have been doing since we took over Atom. Provided zero methodology
for users to preform autoupdates within Pulsar.

* Good, because it requires zero effort on our end.
* Good, because there are no signing costs.
* Bad, because it provides users no method to easily update.
* Bad, because users would be misinformed about Atom's ability to autoupdate being lost.
* Bad, because autoupdates of some kind is an expected and standard feature in any modern application.

## More Information

This decision is not one taken lightly, and could still stir some controversy on best implementations.

There was also additional concerns about not deleting the code used for Squirrel's AutoUpdate functionality
in case we ever did want to return to that behavior, since it already works perfectly, if properly setup.

For that reason, instead of keeping the code within the repo, below will be details about where the code that comprises
of the Squirrel AutoUpdate logic will be kept within Git, so that it can always be retrieved if ever needed.

* Last Commit Before Removal: `bf60fbe6fc267b737a70d5d39c03cad1629ea128`
* PR Where it was Removed: [`pulsar-edit/pulsar#668`](https://github.com/pulsar-edit/pulsar/pull/668)
