#!/bin/bash
#
# Install all system dependencies needed to run Electron
#

if ! command -v apt-get > /dev/null
then
  echo "ERROR: This script can currently only run on systems with 'apt-get'"
  exit 1
fi

# Electron dependencies mapped:
# objdump -p  /tmp/pulsar/node_modules/electron/dist/electron | grep NEEDED
# NEEDED               ld-linux-x86-64.so.2   (provided by glibc/core system)
# NEEDED               libasound.so.2         libasound2t64
# NEEDED               libatk-1.0.so.0        libatk1.0-0t64
# NEEDED               libatk-bridge-2.0.so.0 libatk-bridge2.0-0t64
# NEEDED               libatspi.so.0          libatspi2.0-0t64
# NEEDED               libc.so.6              (provided by glibc/core system)
# NEEDED               libcairo.so.2          libcairo2
# NEEDED               libcups.so.2           libcups2t64
# NEEDED               libdbus-1.so.3         dbus-tests
# NEEDED               libdl.so.2             (provided by glibc/core system)
# NEEDED               libdrm.so.2            libdrm2
# NEEDED               libexpat.so.1          libexpat1
# NEEDED               libffmpeg.so           qmmp
# NEEDED               libgbm.so.1            libgbm1
# NEEDED               libgcc_s.so.1          (provided by glibc/core system)
# NEEDED               libgio-2.0.so.0        libglib2.0-0t64
# NEEDED               libglib-2.0.so.0       libglib2.0-0t64
# NEEDED               libgobject-2.0.so.0    libglib2.0-0t64
# NEEDED               libgtk-3.so.0          libgtk-3-0t64
# NEEDED               libm.so.6              (provided by glibc/core system)
# NEEDED               libnspr4.so            libnspr4
# NEEDED               libnss3.so             libnss3
# NEEDED               libnssutil3.so         libnss3
# NEEDED               libpango-1.0.so.0      libpango-1.0-0
# NEEDED               libpthread.so.0        (provided by glibc/core system)
# NEEDED               libsmime3.so           libnss3
# NEEDED               libX11.so.6            libx11-6
# NEEDED               libxcb.so.1            libxcb1
# NEEDED               libXcomposite.so.1     libxcomposite1
# NEEDED               libXdamage.so.1        libxdamage1
# NEEDED               libXext.so.6           libxext6
# NEEDED               libXfixes.so.3         libxfixes3
# NEEDED               libxkbcommon.so.0      libxkbcommon0
# NEEDED               libXrandr.so.2         libxrandr2

packages=(
  dbus-tests
  libasound2t64
  libatk-bridge2.0-0t64
  libatk1.0-0t64
  libatspi2.0-0t64
  libcairo2
  libcups2t64
  libdrm2
  libexpat1
  libgbm1
  libglib2.0-0t64
  libgtk-3-0t64
  libnspr4
  libnss3
  libpango-1.0-0
  libx11-6
  libxcb1
  libxcomposite1
  libxdamage1
  libxext6
  libxfixes3
  libxkbcommon0
  libxrandr2
  qmmp
)

apt-get install --yes --quiet --update --no-install-recommends "${packages[@]}"
