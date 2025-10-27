#!/bin/sh

FILESOURCE='/opt/${sanitizedProductName}/resources/${executable}.sh'
FILEDEST='/usr/bin/${executable}'

if [ -f "$FILEDEST" ]
then
  rm "$FILEDEST"
fi
cp "$FILESOURCE" "$FILEDEST"

case $executable in
  pulsar-next)
    ppm_executable=ppm-next
    ;;
  *)
    ppm_executable=ppm
    ;;
esac

SYMLINK_TARGET='/opt/${sanitizedProductName}/resources/app/ppm/bin/${ppm_executable}'
SYMLINK_PATH='/usr/bin/${ppm_executable}'

if [ -L "$SYMLINK_PATH" ]
then
  rm "$SYMLINK_PATH"
fi
ln -s "$SYMLINK_TARGET" "$SYMLINK_PATH"
