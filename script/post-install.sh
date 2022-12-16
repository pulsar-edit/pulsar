#!/bin/sh

FILESOURCE='/opt/Pulsar/resources/pulsar.sh'
FILEDEST='/usr/bin/pulsar'

if [ -f "$FILEDEST" ]
then
  rm "$FILEDEST"
else
  echo "File '$FILEDEST' not found (this is not an error)"
fi
cp "$FILESOURCE" "$FILEDEST"
