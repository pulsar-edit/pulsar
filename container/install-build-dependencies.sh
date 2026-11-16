#!/bin/bash
#
# Install all system dependencies needed to build Pulsar
#

if ! command -v apt-get > /dev/null
then
  echo "ERROR: This script can currently only run on systems with 'apt-get'"
  exit 1
fi

packages=(
  # Pulsar project main build tool. Installing it automatically pulls in 191
  # MB of dependencies, including NodeJS.
  yarnpkg

  # 'yarn install' needs git to resolve multiple dependencies defined as git
  # urls with git commit ids
  git

  # 'yarn build' needs 'node-gyp' build native binaries in NodeJS modules
  # @pulsar-edit/fuzzy-native and @pulsar-edit/keyboard-layout
  node-gyp

  # @pulsar-edit/fuzzy-native native binary build dependencies (yes, it runs
  # both Python and make)
  python3-setuptools
  make
  g++

  # @pulsar-edit/keyboard-layout native binary build dependencies
  pkg-config
  libwayland-dev
  libxkbcommon-x11-dev
  libxkbfile-dev
)

apt-get install --yes --quiet --update --no-install-recommends "${packages[@]}"

# In Debian/Ubuntu, 'yarn' name is taken, so manually install a symlink to make 'yarn' refer to it
ln -s /usr/bin/yarnpkg /usr/bin/yarn
