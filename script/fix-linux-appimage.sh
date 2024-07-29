#!/usr/bin/env bash

# Usage: Takes a single argument for the architecture — either `x86_64` or
# `ARM_64` — and “fixes” an AppImage file as emitted by `electron-builder` so
# that it points to `pulsar.sh` internally and runs _that_ when invoked instead
# of the direct binary.
#
# This is important for a couple of reasons:
#
# 1. Some command-line arguments, like `--wait`, don't work properly unless
#    they rely on `pulsar.sh` to do some work for them.
# 2. `pulsar.sh` can intercept the `-p`/`--package` switch (signaling that the
#     user wants to run `ppm`) and call it more quickly than Pulsar can.
#
# This is pretty easy to do with an AppImage, but `electron-builder` isn't
# customizable enough for us to make that change without it affecting other
# things. Luckily, AppImage is straightforward enough as a tool that we can
# do it manually.

set -e

if [[ "${1:x86_64}" == "x86_64" ]]; then
  APPIMAGE_ARCH="x86_64"
else
  APPIMAGE_ARCH="aarch64"
fi

echo "Architecture is: ${APPIMAGE_ARCH}"

cd binaries
PULSAR_APPIMAGE="$(ls *.AppImage | xargs)"
echo "Making ${PULSAR_APPIMAGE} executable…"
chmod +x "${PULSAR_APPIMAGE}"

echo "Extracting ${PULSAR_APPIMAGE}…"
"./${PULSAR_APPIMAGE}" "--appimage-extract"
# Will extract to `squashfs-root`. Let's rename it just for sanity.
mv "squashfs-root" "Pulsar.AppDir"
mv "${PULSAR_APPIMAGE}" "${PULSAR_APPIMAGE%.AppImage}.old.AppImage"

# Copy the old AppRun to a temporary path.
cd "Pulsar.AppDir"
echo "Moving AppRun to AppRun.old…"
mv AppRun AppRun.old
rm -f AppRun

# Replace the reference to BIN to point to `pulsar.sh` rather than the `pulsar`
# executable.
echo "Making new AppRun…"
awk '{sub(/BIN=(.*?)/,"BIN=\"$APPDIR/resources/pulsar.sh\""); print}' AppRun.old > AppRun
chmod a+x AppRun

echo "Rewrote BIN to read:"
cat AppRun | grep "BIN="

echo "Removing AppRun.old…"
rm -f AppRun.old

# Now that we've made the change, we can bundle everything up with the original
# file name and it'll just work.
cd ../..

echo "Current directory is: $(pwd)"

echo "Downloading appimagetool…"
wget "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${APPIMAGE_ARCH}.AppImage" -O appimagetool
echo "Making appimagetool executable…"
chmod +x appimagetool

# echo "Downloading AppImage runtime…"
# wget "https://github.com/AppImage/AppImageKit/releases/download/continuous/runtime-${APPIMAGE_ARCH}" -O runtime
# echo "Making runtime executable…"
# chmod +x runtime

# echo "Manually building AppImage…"
# mksquashfs "binaries/Pulsar.AppDir" "Pulsar.squashfs" -root-owned -noappend
# cat runtime >> "binaries/${PULSAR_APPIMAGE}"
# cat "Pulsar.squashfs" >> "binaries/${PULSAR_APPIMAGE}"

# Docker can't run AppImage apps natively, but we can use the
# `--appimage-extract-and-run` option to extract the app to a location on disk
# instead.
ARCH="${APPIMAGE_ARCH}" ./appimagetool --appimage-extract-and-run "binaries/Pulsar.AppDir" "binaries/${PULSAR_APPIMAGE}"

echo "Making binary executable…"
chmod a+x "binaries/${PULSAR_APPIMAGE}"
echo "…done building appimage at binaries/${PULSAR_APPIMAGE}."

echo "Removing temporary Pulsar.AppDir…"
rm -rf "binaries/Pulsar.AppDir"

echo "Removing old AppImage…"
rm -f "binaries/${PULSAR_APPIMAGE%.AppImage}.old.AppImage"

echo "…done!"
