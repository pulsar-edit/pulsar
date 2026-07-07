#!/bin/sh

# https://github.com/lumine-editor/lumine/issues/544
# This check works only for RPMs
if [ $1 -ge 1 ]; then
    # Package upgrade, do not uninstall
    exit 0
fi

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
