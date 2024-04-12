#!/bin/bash

if [ "$(uname)" == 'Darwin' ]; then
  OS='Mac'
elif [ "$(expr substr $(uname -s) 1 5)" == 'Linux' ]; then
  OS='Linux'
else
  echo "Your platform ($(uname -a)) is not supported."
  exit 1
fi

# Only set the ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT env var if it hasn't been set.
if [ -z "$ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT" ]
then
  export ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT=true
fi

ATOM_ADD=false
ATOM_NEW_WINDOW=false
EXIT_CODE_OVERRIDE=

while getopts ":anwtfvhp-:" opt; do
  case "$opt" in
    -)
      case "${OPTARG}" in
        add)
          ATOM_ADD=true
          ;;
        new-window)
          ATOM_NEW_WINDOW=true
          ;;
        wait)
          WAIT=1
          ;;
        help|version)
          EXPECT_OUTPUT=1
          ;;
        foreground|benchmark|benchmark-test|test|package)
          EXPECT_OUTPUT=1
          ;;
        enable-electron-logging)
          export ELECTRON_ENABLE_LOGGING=1
          ;;
      esac
      ;;
    a)
      ATOM_ADD=true
      ;;
    n)
      ATOM_NEW_WINDOW=true
      ;;
    w)
      WAIT=1
      ;;
    f|t|h|v|p)
      EXPECT_OUTPUT=1
      ;;
  esac
done

if [ "${ATOM_ADD}" = "true" ] && [ "${ATOM_NEW_WINDOW}" = "true" ]; then
  EXPECT_OUTPUT=1
  EXIT_CODE_OVERRIDE=1
fi

if [ $REDIRECT_STDERR ]; then
  exec 2> /dev/null
fi

ATOM_HOME="${ATOM_HOME:-$HOME/.pulsar}"
mkdir -p "$ATOM_HOME"

if [ $OS == 'Mac' ]; then
  if [ -L "$0" ]; then
    SCRIPT="$(readlink "$0")"
  else
    SCRIPT="$0"
  fi

  ATOM_APP="$(dirname "$(dirname "$(dirname "$SCRIPT")")")"

  if [ "$ATOM_APP" == . ]; then
    unset ATOM_APP
  else
    PULSAR_PATH="$(dirname "$ATOM_APP")"
    ATOM_APP_NAME="$(basename "$ATOM_APP")"
  fi

  if [ -n "${ATOM_APP_NAME}" ]; then
    # If ATOM_APP_NAME is known, use it as the executable name
    ATOM_EXECUTABLE_NAME="${ATOM_APP_NAME%.*}"
  else
    # Else choose it from the inferred channel name
    ATOM_EXECUTABLE_NAME="Pulsar"
  fi

  if [ -z "${PULSAR_PATH}" ]; then
    # If PULSAR_PATH isn't set, check /Applications and then ~/Applications for Atom.app
    if [ -x "/Applications/$ATOM_APP_NAME" ]; then
      PULSAR_PATH="/Applications"
    elif [ -x "$HOME/Applications/$ATOM_APP_NAME" ]; then
      PULSAR_PATH="$HOME/Applications"
    else
      # We haven't found an Pulsar.app, use spotlight to search for Pulsar
      PULSAR_PATH="$(mdfind "kMDItemCFBundleIdentifier == 'dev.pulsar-edit.pulsar'" | grep -v ShipIt | head -1 | xargs -0 dirname)"

      # Exit if Pulsar can't be found
      if [ ! -x "$PULSAR_PATH/$ATOM_APP_NAME" ]; then
        echo "Cannot locate ${ATOM_APP_NAME}, it is usually located in /Applications. Set the PULSAR_PATH environment variable to the directory containing ${ATOM_APP_NAME}."
        exit 1
      fi
    fi
  fi

  if [ $EXPECT_OUTPUT ]; then
    "$PULSAR_PATH/$ATOM_APP_NAME/Contents/MacOS/$ATOM_EXECUTABLE_NAME" --executed-from="$(pwd)" --pid=$$ "$@"
    ATOM_EXIT=$?
    if [ ${ATOM_EXIT} -eq 0 ] && [ -n "${EXIT_CODE_OVERRIDE}" ]; then
      exit "${EXIT_CODE_OVERRIDE}"
    else
      exit ${ATOM_EXIT}
    fi
  else
    open -a "$PULSAR_PATH/$ATOM_APP_NAME" -n -g --args --executed-from="$(pwd)" --pid=$$ --path-environment="$PATH" "$@"
  fi
elif [ $OS == 'Linux' ]; then
  SCRIPT=$(readlink -f "$0")

  PULSAR_PATH="/opt/Pulsar/pulsar"

  #Set tmpdir only if tmpdir is unset
  : ${TMPDIR:=/tmp}

  [ -x "$PULSAR_PATH" ] || PULSAR_PATH="$TMPDIR/pulsar-build/Pulsar/pulsar"

  if [ $EXPECT_OUTPUT ]; then
    "$PULSAR_PATH" --executed-from="$(pwd)" --pid=$$ "$@" --no-sandbox
    ATOM_EXIT=$?
    if [ ${ATOM_EXIT} -eq 0 ] && [ -n "${EXIT_CODE_OVERRIDE}" ]; then
      exit "${EXIT_CODE_OVERRIDE}"
    else
      exit ${ATOM_EXIT}
    fi
  else
    (
    nohup "$PULSAR_PATH" --executed-from="$(pwd)" --pid=$$ "$@" --no-sandbox > "$ATOM_HOME/nohup.out" 2>&1
    if [ $? -ne 0 ]; then
      cat "$ATOM_HOME/nohup.out"
      exit $?
    fi
    ) &
  fi
fi

# Exits this process when Pulsar is used as $EDITOR
on_die() {
  exit 0
}
trap 'on_die' SIGQUIT SIGTERM

# If the wait flag is set, don't exit this process until Pulsar kills it.
if [ $WAIT ]; then
  WAIT_FIFO="$ATOM_HOME/.wait_fifo"

  if [ ! -p "$WAIT_FIFO" ]; then
    rm -f "$WAIT_FIFO"
    mkfifo "$WAIT_FIFO"
  fi

  # Block endlessly by reading from a named pipe.
  exec 2>/dev/null
  read < "$WAIT_FIFO"

  # If the read completes for some reason, fall back to sleeping in a loop.
  while true; do
    sleep 1
  done
fi
