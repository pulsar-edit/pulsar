#!/bin/sh

FILESOURCE='/opt/Pulsar/resources/pulsar.sh'
FILEDEST='/usr/bin/pulsar'

if [ -f "$FILEDEST" ]
then
  rm "$FILEDEST"
fi
cp "$FILESOURCE" "$FILEDEST"
