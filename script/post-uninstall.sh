#!/bin/sh

LUMINE_SCRIPT_PATH='/usr/bin/${executable}'

if [ -f "$LUMINE_SCRIPT_PATH" ]
then
  rm "$LUMINE_SCRIPT_PATH"
fi

ppm_executable=ppm

PPM_SYMLINK_PATH="/usr/bin/${ppm_executable}"

if [ -L "$PPM_SYMLINK_PATH" ]
then
  rm "$PPM_SYMLINK_PATH"
fi
