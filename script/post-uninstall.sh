#!/bin/sh

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
