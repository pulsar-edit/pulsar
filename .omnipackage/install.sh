#!/usr/bin/env bash

source /profile

set -xEeuo pipefail

BUILDROOT=$1
NAME=$2
# "" for stock `pulsar`, "-dev" for `pulsar-dev`, etc. Used to suffix the ppm
# CLI symlink so multiple Pulsar packages can coexist on the same system.
SUFFIX="${NAME#pulsar}"

# wayland-client.h, xkbcommon.h, etc. live in non-default include dirs on some
# distros; surface them via pkg-config so native module builds find them.
export CPLUS_INCLUDE_PATH=$(pkg-config --cflags-only-I wayland-client xkbcommon x11 xkbfile | tr ' ' '\n' | sed 's/^-I//' | paste -sd:)${CPLUS_INCLUDE_PATH:+:$CPLUS_INCLUDE_PATH}

nvm install
npm install -g yarn
corepack enable
nvm use
node -v

yarn install
yarn build
yarn build:apm

# Reduce electron-builder to a single `dir` target: skip the appimage/deb/rpm
# wrappers we never use, and swap tar.gz for `dir` so it stops after producing
# dist/linux-unpacked/. Saves the tar+untar round trip and the compression
# pass. (Edits the in-tree copy inside the build sandbox only — repo file is
# untouched.)
sed -i "s|target: 'tar.gz'|target: 'dir'|; /target: 'appimage'/d; /target: 'deb'/d; /target: 'rpm'/d" script/electron-builder.js
yarn dist linux

# Stage the unpacked Pulsar tree under /usr/lib/<NAME>.
mkdir -p $BUILDROOT/usr/lib/$NAME
cp -a dist/linux-unpacked/. $BUILDROOT/usr/lib/$NAME/
rm -rf $BUILDROOT/usr/lib/$NAME/resources/app/ppm/spec # shebang in some files there messes up the dependencies

# Let Chromium's setuid sandbox helper actually engage. The rpm spec installs
# chrome-sandbox as 4755 root:root (%attr); here we just strip the
# --no-sandbox flag pulsar.sh hardcodes so the sandbox is not disabled at
# launch.
sed -i 's/ --no-sandbox//g' $BUILDROOT/usr/lib/$NAME/resources/pulsar.sh

# pulsar.sh derives ATOM_EXECUTABLE_NAME from basename($0) and then checks
# $PULSAR_PATH/$ATOM_EXECUTABLE_NAME. The tarball ships the binary as `pulsar`,
# so for packages renamed away from stock (e.g. `pulsar-dev`) we need a sibling
# symlink under the package name or pulsar.sh aborts with
# "Cannot locate Pulsar".
if [ "$NAME" != "pulsar" ]; then
  ln -sf pulsar $BUILDROOT/usr/lib/$NAME/$NAME
fi

# User-facing CLI entrypoints. Suffix the ppm symlink so we do not collide with
# the stock pulsar package's /usr/bin/ppm.
mkdir -p $BUILDROOT/usr/bin/
ln -sf /usr/lib/$NAME/resources/pulsar.sh $BUILDROOT/usr/bin/$NAME
ln -sf /usr/lib/$NAME/resources/app/ppm/bin/ppm $BUILDROOT/usr/bin/ppm$SUFFIX

# Desktop entry. Exec goes through /usr/bin/$NAME (pulsar.sh) so ATOM_HOME and
# release-channel inference behave the same as terminal launches; pulsar.sh
# itself appends --no-sandbox.
mkdir -p $BUILDROOT/usr/share/applications
DISPLAY_NAME="Pulsar${SUFFIX}"
cat > $BUILDROOT/usr/share/applications/$NAME.desktop <<EOF
[Desktop Entry]
Name=$DISPLAY_NAME
GenericName=Text Editor
Comment=A Community-led Hyper-Hackable Text Editor
Exec=/usr/bin/$NAME %F
Icon=$NAME
Type=Application
StartupNotify=true
StartupWMClass=Pulsar
Categories=Utility;TextEditor;Development;
MimeType=application/javascript;application/json;application/x-httpd-php;application/x-ruby;application/x-shellscript;application/x-sql;application/xhtml+xml;application/xml;text/css;text/html;text/plain;text/xml;text/x-c++src;text/x-csrc;text/x-go;text/x-java;text/x-makefile;text/x-markdown;text/x-python;text/x-ruby;text/x-shellscript;text/yaml;inode/directory;
Actions=new-window;

[Desktop Action new-window]
Name=New Window
Exec=/usr/bin/$NAME --new-window
EOF

# polkit policy so fs-admin's pkexec-backed "save as root" flow works. The
# action id stays `pulsar.pkexec.dd` because that is what the bundled fs-admin
# requests at runtime; only the .policy filename is namespaced so the dev and
# stock packages don't claim the same path.
mkdir -p $BUILDROOT/usr/share/polkit-1/actions/
cp resources/linux/pulsar.policy $BUILDROOT/usr/share/polkit-1/actions/$NAME.policy

# Icon sizes shipped in resources/icons/.
for size in 16 22 24 32 48 64 128 256 384; do
  mkdir -p $BUILDROOT/usr/share/icons/hicolor/${size}x${size}/apps/
  cp resources/icons/${size}x${size}.png $BUILDROOT/usr/share/icons/hicolor/${size}x${size}/apps/$NAME.png
done
