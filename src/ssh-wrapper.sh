#!/bin/sh
#
# On Linux, detach ssh from the controlling terminal that owns the editor so it
# honors SSH_ASKPASS instead of prompting for key passphrases on that tty. Fail
# gracefully when setsid is unavailable, and respect an existing GIT_SSH_COMMAND
# or core.sshCommand.

set -eu

SSH_CMD=${LUMINE_GIT_AUTH_ORIGINAL_SSH_COMMAND:-}
[ -z "${SSH_CMD}" ] && SSH_CMD=$(git config core.sshCommand || printf '')
[ -z "${SSH_CMD}" ] && SSH_CMD='ssh'

if type setsid >/dev/null 2>&1; then
  setsid ${SSH_CMD} "${@:-}"
else
  sh -c "${SSH_CMD} ${@:-}"
fi
