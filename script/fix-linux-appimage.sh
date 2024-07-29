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

cd dist
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

echo "Rewrote BIN to read:"
cat AppRun | grep "BIN="

echo "Removing AppRun.old…"
rm -f AppRun.old

# Now that we've made the change, we can bundle everything up with the original
# file name and it'll just work.
cd ../..

echo "Current directory is: $(pwd)"

echo "Downloading runtime…"
wget "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${APPIMAGE_ARCH}" -o appimagetool
echo "Making runtime executable…"
chmod +x appimagetool

# mksquashfs "dist/Pulsar.AppDir" "Pulsar.squashfs" -root-owned -noappend
# cat runtime >> "dist/${PULSAR_APPIMAGE}"
# cat "Pulsar.squashfs" >> "dist/${PULSAR_APPIMAGE}"
# chmod a+x "dist/${PULSAR_APPIMAGE}"

appimagetool --appimage-extract-and-run "dist/Pulsar.AppDir" "dist/${PULSAR_APPIMAGE}"

echo "Removing old AppImage…"
rm -f "dist/${PULSAR_APPIMAGE%.AppImage}.old.AppImage"

echo "…done!"
