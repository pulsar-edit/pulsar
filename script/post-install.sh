#!/bin/sh

FILESOURCE='/opt/Pulsar/resources/pulsar.sh'
FILEDEST='/usr/bin/pulsar'

if [ -f "$FILEDEST" ]
then
  rm "$FILEDEST"
fi
cp "$FILESOURCE" "$FILEDEST"

SYMLINK_TARGET='/opt/Pulsar/resources/app/ppm/bin/apm'
SYMLINK_PATH='/usr/bin/ppm'

if [ -L "$SYMLINK_PATH" ]
then
  rm "$SYMLINK_PATH"
fi
ln -s "$SYMLINK_TARGET" "$SYMLINK_PATH"
