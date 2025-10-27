#!/bin/sh

# https://github.com/pulsar-edit/pulsar/issues/544
# This check works only for RPMs
if [ $1 -ge 1 ]; then
    # Package upgrade, do not uninstall
    exit 0
fi

PULSAR_SCRIPT_PATH='/usr/bin/${executable}'

if [ -f "$PULSAR_SCRIPT_PATH" ]
then
  rm "$PULSAR_SCRIPT_PATH"
fi

case $executable in
  pulsar-next)
    ppm_executable=ppm-next
    ;;
  *)
    ppm_executable=ppm
    ;;
esac

PPM_SYMLINK_PATH='/usr/bin/${ppm_executable}'

if [ -L "$PPM_SYMLINK_PATH" ]
then
  rm "$PPM_SYMLINK_PATH"
fi
