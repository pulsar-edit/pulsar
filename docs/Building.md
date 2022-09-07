
## Building

There are two ways of building and staring hacking on Pulsar's core. One is following the documentation of the flight manual:

* [Linux](https://flight-manual.atom.io/hacking-atom/sections/hacking-on-atom-core/#platform-linux)
* [macOS](https://flight-manual.atom.io/hacking-atom/sections/hacking-on-atom-core/#platform-mac)
* [Windows](https://flight-manual.atom.io/hacking-atom/sections/hacking-on-atom-core/#platform-windows)

### Alternative method

First, install `yarn`. Pulsar currently does not work with `npm` (although it will
probably work in the future). Be sure you're using Node.JS versions between 10 and 16, and
then run:

```shell
yarn install
yarn build
yarn build:apm
```

_If a Windows user it is recommended to install Pulsar on a path with no Spaces_

This will install the packages, rebuild them for Electron, and build the Atom Package
Manager. Finally, you can run the editor with `yarn start`. This command will accept the
same arguments as the final binary.

### Running tests

You can run tests for the editor (both the core editor, or specific packages) the same way
you would run with the final binary: by issuing `yarn --test <path-to-test>`.
