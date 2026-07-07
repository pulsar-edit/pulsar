#!/bin/sh

LUMINE_SCRIPT_PATH='/usr/bin/${executable}'

if [ -f "$LUMINE_SCRIPT_PATH" ]
then
  rm "$LUMINE_SCRIPT_PATH"
fi
