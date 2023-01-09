#!/bin/sh

PULSAR_SCRIPT_PATH='/usr/bin/pulsar'

if [ -f "$PULSAR_SCRIPT_PATH" ]
then
  rm "$PULSAR_SCRIPT_PATH"
fi

PPM_SYMLINK_PATH='/usr/bin/ppm'

if [ -L "$PPM_SYMLINK_PATH" ]
then
  rm "$PPM_SYMLINK_PATH"
fi
