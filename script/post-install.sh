#!/bin/sh

if [ -f "/usr/bin/pulsar" ]
then
  rm /usr/bin/pulsar
else
  echo "File '/usr/bin/pulsar' not found (this is not an error)"
fi
cp /opt/Pulsar/resources/pulsar.sh /usr/bin/pulsar
