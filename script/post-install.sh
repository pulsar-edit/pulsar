#!/bin/bash

# Install `resources/pulsar.sh` to `/usr/bin/pulsar`.
FILESOURCE='/opt/${sanitizedProductName}/resources/${executable}.sh'
FILEDEST='/usr/bin/${executable}'

if [ -f "$FILEDEST" ]
then
  rm "$FILEDEST"
fi
cp "$FILESOURCE" "$FILEDEST"

# Find the right binary name for `ppm`, then install it to `/usr/bin/ppm`
case $executable in
  pulsar-next)
    ppm_executable=ppm-next
    ;;
  *)
    ppm_executable=ppm
    ;;
esac

SYMLINK_TARGET='/opt/${sanitizedProductName}/resources/app/ppm/bin/${ppm_executable}'
SYMLINK_PATH='/usr/bin/${ppm_executable}'

if [ -L "$SYMLINK_PATH" ]
then
  rm "$SYMLINK_PATH"
fi
ln -s "$SYMLINK_TARGET" "$SYMLINK_PATH"

# Set correct permissions on `chrome-sandbox`; this should help avoid the need
# for `--no-sandbox` and the like.

# Check if user namespaces are supported by the kernel and working with a quick test:
if ! { [[ -L /proc/self/ns/user ]] && unshare --user true; }; then
  # Use SUID chrome-sandbox only on systems without user namespaces:
  chmod 4755 '/opt/${sanitizedProductName}/chrome-sandbox' || true
else
  chmod 0755 '/opt/${sanitizedProductName}/chrome-sandbox' || true
fi

# Handle AppArmor.

# Install apparmor profile. (Ubuntu 24+)
# First check if the version of AppArmor running on the device supports our profile.
# This is in order to keep backwards compatibility with Ubuntu 22.04 which does not support abi/4.0.
# In that case, we just skip installing the profile since the app runs fine without it on 22.04.
#
# Those apparmor_parser flags are akin to performing a dry run of loading a profile.
# https://wiki.debian.org/AppArmor/HowToUse#Dumping_profiles
#
# Unfortunately, at the moment AppArmor doesn't have a good story for backwards compatibility.
# https://askubuntu.com/questions/1517272/writing-a-backwards-compatible-apparmor-profile
if apparmor_status --enabled > /dev/null 2>&1; then
  APPARMOR_PROFILE_SOURCE='/opt/${sanitizedProductName}/resources/apparmor-profile'
  APPARMOR_PROFILE_TARGET='/etc/apparmor.d/${executable}'
  if apparmor_parser --skip-kernel-load --debug "$APPARMOR_PROFILE_SOURCE" > /dev/null 2>&1; then
    cp -f "$APPARMOR_PROFILE_SOURCE" "$APPARMOR_PROFILE_TARGET"

    # Updating the current AppArmor profile is not possible and probably not meaningful in a chroot'ed environment.
    # Use cases are for example environments where images for clients are maintained.
    # There, AppArmor might correctly be installed, but live updating makes no sense.
    if ! { [ -x '/usr/bin/ischroot' ] && /usr/bin/ischroot; } && hash apparmor_parser 2>/dev/null; then
      # Extra flags taken from dh_apparmor:
      # > By using '-W -T' we ensure that any abstraction updates are also pulled in.
      # https://wiki.debian.org/AppArmor/Contribute/FirstTimeProfileImport
      apparmor_parser --replace --write-cache --skip-read-cache "$APPARMOR_PROFILE_TARGET"
    fi
  else
    echo "Skipping the installation of the AppArmor profile as this version of AppArmor does not seem to support the bundled profile"
  fi
fi
