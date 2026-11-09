#!/bin/bash
#
# Install all NodeJS dependencies needed to build and run Pulsar, and build it
#

if [ ! -f node_modules ]
then
  echo "INFO: node_modules have not been installed -> installing now"
  # Install all additional required NodeJS modules (~1000 MB)
  yarn install
fi

if [ ! -f ./node_modules/.bin/electron-rebuild ]
then
  echo "INFO: Pulsar has not been built -> building now"
  # Run 'electron-rebuild' as defined in package.json to build Pulsar
  yarn build

  # Even with all dependencies downloaded in `yarn install`, a network connection
  # is still needed during `yarn build` as the package @pulsar-edit/fuzzy-native
  # downloads the external dependency
  # [https://www.electronjs.org/headers/v30.0.9/node-v30.0.9-headers.tar.gz]
  # during the build.

  if [ ! -f ppm/node_modules/git-utils/build/Release/git.node ]
  then
    echo "INFO: The Pulsar Package Manager has not been built -> building now"
    # Using custom Yarn command (package.json: `cd ppm && yarn install`)
    yarn build:apm

    # In addition to standard NodeJS modules the above step also downloads the
    # bundled
    # [https://nodejs.org/download/release/v20.11.1/node-v20.11.1-headers.tar.gz] in
    # addition to the ones defined explicitly in `ppm/package.json`.

    # Note: The 'node script/postinstall.js' is not idempotent and it will rebuild
    # the git-utils module from scratch on every run
  fi
fi

if [ -n "$*" ]
then
  "$@"
else
  echo "ERROR: No command was passed to the container"
fi
