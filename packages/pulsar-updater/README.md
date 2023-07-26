# Pulsar Updater

Update utility for Pulsar. On launch of Pulsar, `pulsar-updater` will check for any new releases available via GitHub APIs. And if one is available will display a notification for the user to be able to install the new version.

If the user seems to have installed Pulsar manually, a link will be opened directly to the resource on GitHub, allowing the user to then download the correct file as needed, and install it. Otherwise if it seems the user has installed Pulsar via various recognized package managers, then Pulsar Updater will present a notification that an update is available, and provide the commands needed to preform the update themselves if they so wish.

This package is made to be minimally invasive, while still allowing users to be aware of new Pulsar versions without any manual effort.

Additionally, since the entire process of actually installation is done by the user, there is no need for complex Squirrel logic, or expensive certifications to allow Squirrel to work.

## Command Palette

If a user would prefer to manually check for any updates available then the following commands are exposed from Pulsar Updater to do so:

* `pulsar-updater:check-for-update`: This will preform an actual update check. Showing a notification only if a new version is available.
* `pulsar-updater:clear-cache`: If needed for whatever reason, this command will clear this package's cache, ensuring information is as up to date as possible.

## The Update Notification

If an update is available, the notification that is shown is intended to be as non-invasive as possible, providing a few possible options:

* Dismiss: This will remove the notification. And save the fact that it has been cleared, where it should not appear again, until either the cache expires, or a new version is released.
* Dismiss until next launch: This will remove the notification, but only until the next update check. Which happens automatically at launch, or otherwise can be invoked manually.
* Download from GitHub: This option is only shown if the installation method was determined to be manually. And clicking it will open the GitHub page containing the specific version to update to.

## Supported/Checked/Recognized for Installation Methods

Since a major part of the functionality of this package is attempting to determine the installation method, it's important to list them all here:

* Universal: Developer Mode
* Universal: Safe Mode
* Universal: Spec Mode
* Windows: Chocolatey Installation
* Windows: winget Installation
* Windows: User Installation
* Windows: Machine Installation
* Windows: Portable Installation
* Linux: Flatpak Installation
* Linux: Deb-Get Installation
* Linux: Nix Installation
* Linux: Home Brew Installation
* Linux: Manual Installation
* macOS: Home Brew Installation
* macOS: Manual Installation

## Known Issues

It's important to remember at this stage, that this update system is in no way integrated with the rest of Pulsar at all. The toggles within Pulsar to automatically update are ignored, as no updates are preformed automatically no matter what. The about view will still be unable to alert of new versions, nor track progress on installation. Those systems should eventually be removed, or mothballed, in favour of this.
