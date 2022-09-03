## Installing Pulsar Community
<!-- ### Prerequisites
- [Git](https://git-scm.com)

### macOS

Download the latest [Pulsar release](https://github.com/pulsar-edit/pulsar/releases/latest).

Pulsar will automatically update when a new release is available.

### Windows

Download the latest [Pulsar installer](https://github.com/pulsar-edit/pulsar/releases/latest). `PulsarSetup.exe` is 32-bit. For 64-bit systems, download `PulsarSetup-x64.exe`.

Pulsar will automatically update when a new release is available.

You can also download `Pulsar-windows.zip` (32-bit) or `Pulsar-x64-windows.zip` (64-bit) from the [releases page](https://github.com/pulsar-edit/pulsar/releases/latest).
The `.zip` version will not automatically update.

Using [Chocolatey](https://chocolatey.org)? Run `cinst Pulsar` to install the latest version of Pulsar.

### Linux

Pulsar is only available for 64-bit Linux systems.

Configure your distribution's package manager to install and update Pulsar by following the [Linux installation instructions](https://flight-manual.atom.io/getting-started/sections/installing-atom/#platform-linux) in the Flight Manual.  You will also find instructions on how to install Pulsar's official Linux packages without using a package repository, though you will not get automatic updates after installing Pulsar this way.

#### Archive extraction

An archive is available for people who don't want to install `Pulsar` as root.

This version enables you to install multiple Pulsar versions in parallel. It has been built on Ubuntu 64-bit,
but should be compatible with other Linux distributions.

1. Install dependencies (on Ubuntu):
```sh
sudo apt install git libasound2 libcurl4 libgbm1 libgcrypt20 libgtk-3-0 libnotify4 libnss3 libglib2.0-bin xdg-utils libx11-xcb1 libxcb-dri3-0 libxss1 libxtst6 libxkbfile1
```
2. Download `Pulsar-amd64.tar.gz` from the [Pulsar releases page](https://github.com/pulsar-edit/pulsar/releases/latest).
3. Run `tar xf Pulsar-amd64.tar.gz` in the directory where you want to extract the Pulsar folder.
4. Launch Pulsar using the installed `Pulsar` command from the newly extracted directory.

The Linux version does not currently automatically update so you will need to
repeat these steps to upgrade to future releases. -->
Currently, to get binaries based on code by the Pulsar community:

1. browse our [_Release Branch Build_ Azure Pipeline](https://dev.azure.com/atomcommunity/atomcommunity/_build/latest?definitionId=10&branchName=master);
2. select the Job named after your OS (eg. _Linux_);
3. at the bottom of the now visible log pane, make sure `100% tests passed` is visible and then select the `artifacts produced` link to browse the `Published artifacts` page;
4. pick a file which is compatible with your system and click on the "3 dots" menu that appears when hovering the mouse on the file name (right side of the page), then:
  - click on the `Download artifacts` menu option and wait for the download to start in your web browser or
  - click on `Copy download URL` to feed the file URL to a download manager.
5. after the download is complete, extract the archive and run the executable.
