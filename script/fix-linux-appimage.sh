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

if [[ "${0:x86_64}" == "x86_64" ]]; then
  APPIMAGE_ARCH="x86_64"
else
  APPIMAGE_ARCH="aarch64"
fi

APPIMAGETOOL="appimagetool-${APPIMAGE_ARCH}.AppImage"

wget "https://github.com/AppImage/AppImageKit/releases/download/continuous/${APPIMAGETOOL}"
chmod a+x "${APPIMAGETOOL}"

PULSAR_APPIMAGE="$(ls *.AppImage | xargs)"
chmod a+x "${PULSAR_APPIMAGE}"

"./$(PULSAR_APPIMAGE)" "--appimage-extract"
# Will extract to `squashfs-root`. Let's rename it just for sanity.
mv "squashfs-root" "Pulsar.AppDir"
mv "${PULSAR_APPIMAGE}" "${PULSAR_APPIMAGE%.AppImage}.old.AppImage"

# Copy the old AppRun to a temporary path.
cd "Pulsar.AppDir"
mv AppRun AppRun.old

# Replace the reference to BIN to point to `pulsar.sh` rather than the `pulsar`
# executable.
awk '{sub(/BIN=(.*?)/,"BIN=\"$APPDIR/resources/pulsar.sh\""); print}' AppRun.old > AppRun
rm -f AppRun.old

# Now that we've made the change, we can bundle everything up with the original
# file name and it'll just work.
ARCH="${APPIMAGE_ARCH}" "${APPIMAGETOOL}" "${PULSAR_APPIMAGE}"
