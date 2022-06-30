## Installing
<!-- ### Prerequisites
- [Git](https://git-scm.com)

### macOS

Download the latest [Atom release](https://github.com/atom/atom/releases/latest).

Atom will automatically update when a new release is available.

### Windows

Download the latest [Atom installer](https://github.com/atom/atom/releases/latest). `AtomSetup.exe` is 32-bit. For 64-bit systems, download `AtomSetup-x64.exe`.

Atom will automatically update when a new release is available.

You can also download `atom-windows.zip` (32-bit) or `atom-x64-windows.zip` (64-bit) from the [releases page](https://github.com/atom/atom/releases/latest).
The `.zip` version will not automatically update.

Using [Chocolatey](https://chocolatey.org)? Run `cinst Atom` to install the latest version of Atom.

### Linux

Atom is only available for 64-bit Linux systems.

Configure your distribution's package manager to install and update Atom by following the [Linux installation instructions](https://flight-manual.atom.io/getting-started/sections/installing-atom/#platform-linux) in the Flight Manual.  You will also find instructions on how to install Atom's official Linux packages without using a package repository, though you will not get automatic updates after installing Atom this way.

#### Archive extraction

An archive is available for people who don't want to install `atom` as root.

This version enables you to install multiple Atom versions in parallel. It has been built on Ubuntu 64-bit,
but should be compatible with other Linux distributions.

1. Install dependencies (on Ubuntu):
```sh
sudo apt install git libasound2 libcurl4 libgbm1 libgcrypt20 libgtk-3-0 libnotify4 libnss3 libglib2.0-bin xdg-utils libx11-xcb1 libxcb-dri3-0 libxss1 libxtst6 libxkbfile1
```
2. Download `atom-amd64.tar.gz` from the [Atom releases page](https://github.com/atom/atom/releases/latest).
3. Run `tar xf atom-amd64.tar.gz` in the directory where you want to extract the Atom folder.
4. Launch Atom using the installed `atom` command from the newly extracted directory.

The Linux version does not currently automatically update so you will need to
repeat these steps to upgrade to future releases. -->
Currently, to get binaries based on code by the Atom community, binaries can be downloaded from the [Azure Pipeline](https://dev.azure.com/atomcommunity/atomcommunity/_build/latest?definitionId=10&branchName=master). From this pipeline, the latest run can be selected. From there, the `8 published` link should be selected to download the files.