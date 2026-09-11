#!/usr/bin/env bash

set -xEeuo pipefail

# Make sure node-gyp gets a modern python3. Some distros default
# /usr/bin/python3 to a stale interpreter (e.g. openSUSE Leap 15.6 → 3.6,
# which chokes on walrus-operator code in modern node-gyp). Point `python3`
# at the newest /usr/bin/python3.NN via /usr/local/bin (higher PATH priority
# than /usr/bin on every supported distro, so we don't touch the system's
# /usr/bin/python3 and distro tools like zypper keep working). No-op when the
# system python3 is already current.
mkdir -p /usr/local/bin
for py in /usr/bin/python3.13 /usr/bin/python3.12 /usr/bin/python3.11 /usr/bin/python3.10 /usr/bin/python3.9 /usr/bin/python3.8; do
  if [ -x "$py" ]; then
    ln -sf "$py" /usr/local/bin/python3
    break
  fi
done

# Capability-based opt-in: where dnf + a [crb] repo section exist
# (AlmaLinux/Rocky 9+), enable CRB and pull in libxkbfile-devel + the X11
# proto headers — they live there and we can't list them in
# build_dependencies because the initial `dnf install` runs before this
# script. AlmaLinux ships /etc/yum.repos.d/almalinux-crb.repo; Rocky packs
# every section into one rocky.repo. So we grep for the section header
# rather than glob filenames. Fedora has no [crb] section → skipped;
# non-dnf distros → skipped.
if command -v dnf >/dev/null 2>&1 && \
   grep -qER '^\[(crb|CRB)\]' /etc/yum.repos.d/ 2>/dev/null; then
  # libxkbfile-devel       — XKBfile.h (linked by @pulsar-edit/keyboard-layout)
  # xorg-x11-proto-devel   — XKBrules.h (included by the same module on Linux);
  #                          openSUSE pulls this transitively via libX11-devel,
  #                          EL clones do not. Modern name is xorgproto-devel
  #                          but RHEL 9/10 still ship the legacy name.
  dnf install -y --enablerepo=crb libxkbfile-devel xorg-x11-proto-devel
fi

export NVM_DIR=/nvm
export PROFILE=/profile

mkdir -p $NVM_DIR
touch $PROFILE

if nvm --version; then
  exit 0
fi

wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
source $PROFILE

nvm --version
