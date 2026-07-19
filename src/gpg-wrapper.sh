#!/bin/sh
set -e

# Read the real gpg program from git config, defaulting to a PATH search like
# git itself. When a signing passphrase dialog is requested, collect it through
# the askpass helper and feed it to gpg on fd 3.
unset GIT_CONFIG_PARAMETERS
GPG_PROGRAM=$(git config gpg.program || echo 'gpg')
PASSPHRASE_ARG=

if [ -n "${LUMINE_GIT_AUTH_GPG_PROMPT:-}" ] && [ -n "${GIT_ASKPASS:-}" ]; then
  SIGNING_KEY=$(git config user.signingkey || printf '')
  if [ -n "${SIGNING_KEY}" ]; then
    PROMPT="Please enter the passphrase for the GPG key '${SIGNING_KEY}'."
  else
    PROMPT="Please enter the passphrase for your default GPG signing key."
  fi

  PASSPHRASE=$(${GIT_ASKPASS} "${PROMPT}")
  PASSPHRASE_ARG="--passphrase-fd 3"
fi

exec "${GPG_PROGRAM}" --batch --no-tty --yes ${PASSPHRASE_ARG} "$@" 3<<EOM
${PASSPHRASE}
EOM
