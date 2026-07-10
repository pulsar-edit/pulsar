#!/bin/bash

echoerr() { echo "$@" 1>&2; }

if [ "$(uname)" == 'Darwin' ]; then
  OS='Mac'
elif [ "$(expr substr $(uname -s) 1 5)" == 'Linux' ]; then
  OS='Linux'
else
  echoerr "Your platform ($(uname -a)) is not supported."
  exit 1
fi

ATOM_BASE_NAME=$(basename $0)
ATOM_BASE_NAME=${ATOM_BASE_NAME%.*}
CHANNEL=stable
# Capture the name of this script so that we can use it at runtime.
export ATOM_BASE_NAME
export ATOM_CHANNEL=$CHANNEL

# Only set the ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT env var if it hasn't
# been set.
if [ -z "$ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT" ]
then
  export ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT=true
fi

ATOM_ADD=false
ATOM_NEW_WINDOW=false
EXIT_CODE_OVERRIDE=

while getopts ":anwtfvh-:" opt; do
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
        foreground|benchmark|benchmark-test|test)
          EXPECT_OUTPUT=1
          ;;
        install|uninstall|list|link|unlink)
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
    f|t|h|v)
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

# Keep a different $ATOM_HOME for each release channel.
if [ -z "$ATOM_HOME" ]
then
  ATOM_HOME="$HOME/.${ATOM_BASE_NAME}"
fi
mkdir -p "$ATOM_HOME"
export ATOM_HOME

if [ $OS == 'Mac' ]; then
  if [ -L "$0" ]; then
    SCRIPT="$(readlink "$0")"
  else
    SCRIPT="$(realpath "$0")"
  fi
  ATOM_APP="$(dirname "$(dirname "$(dirname "$SCRIPT")")")"

  # If this is a `lumine.sh` from a built version of Lumine, then `$ATOM_APP`
  # should now be the path to the user's instance of Lumine.app.
  if [[ "$ATOM_APP" == . || "$ATOM_APP" != *".app" ]]; then
    # This is a `lumine.sh` that's in the source code of Lumine or has been
    # copied to a location outside of the app (instead of symlinked). We'll try
    # another tactic.
    unset ATOM_APP
  else
    # We found the location of the Lumine.app that this script lives in.
    LUMINE_PATH="$(dirname "$ATOM_APP")"
    ATOM_APP_NAME="$(basename "$ATOM_APP")"
  fi

  if [ -n "${ATOM_APP_NAME}" ]; then
    # If ATOM_APP_NAME is known, use it as the executable name
    ATOM_EXECUTABLE_NAME="${ATOM_APP_NAME%.*}"
  else
    ATOM_EXECUTABLE_NAME="Lumine"
    ATOM_APP_NAME="${ATOM_EXECUTABLE_NAME}.app"
  fi

  if [ -z "${LUMINE_PATH}" ]; then
    # If LUMINE_PATH isn't set, check /Applications and then ~/Applications for
    # Lumine.app.
    if [ -x "/Applications/${ATOM_APP_NAME}" ]; then
      LUMINE_PATH="/Applications"
    elif [ -x "$HOME/Applications/${ATOM_APP_NAME}" ]; then
      LUMINE_PATH="$HOME/Applications"
    else
      # We still haven't found it. Let's try searching for it via
      # Spotlight.
      LUMINE_APP_SEARCH_RESULT="$(mdfind "kMDItemCFBundleIdentifier == 'io.github.lumine-code.${ATOM_BASE_NAME}'" | grep -v ShipIt | head -1)"
      if [ ! -z "$LUMINE_APP_SEARCH_RESULT" ]; then
        LUMINE_PATH="$(dirname "$LUMINE_APP_SEARCH_RESULT")"
        ATOM_APP_NAME="$(basename "$LUMINE_APP_SEARCH_RESULT")"
      fi
    fi
  fi

  LUMINE_EXECUTABLE="$LUMINE_PATH/$ATOM_APP_NAME/Contents/MacOS/$ATOM_EXECUTABLE_NAME"

  # Exit if Lumine can't be found.
  if [ ! -x "${LUMINE_EXECUTABLE}" ]; then
    echoerr "Cannot locate ${ATOM_APP_NAME}; it is usually located in /Applications. Set the LUMINE_PATH environment variable to the directory containing ${ATOM_APP_NAME}."
    exit 1
  fi

  if [ $EXPECT_OUTPUT ]; then
    "$LUMINE_EXECUTABLE" --executed-from="$(pwd)" --pid=$$ "$@"
    ATOM_EXIT=$?
    if [ ${ATOM_EXIT} -eq 0 ] && [ -n "${EXIT_CODE_OVERRIDE}" ]; then
      exit "${EXIT_CODE_OVERRIDE}"
    else
      exit ${ATOM_EXIT}
    fi
  else
    open -a "$LUMINE_PATH/$ATOM_APP_NAME" -n -g --args --executed-from="$(pwd)" --pid=$$ --path-environment="$PATH" "$@"
  fi
elif [ $OS == 'Linux' ]; then

  # Set tmpdir only if it's unset.
  : ${TMPDIR:=/tmp}

  # We think that
  #
  # * `ATOM_APP_NAME` will refer to the human-readable app name (“Lumine”)
  # * `ATOM_EXECUTABLE_NAME` will refer to the executable we must run to launch
  #   it (`lumine`)

  ATOM_EXECUTABLE_NAME=$ATOM_BASE_NAME
  ATOM_APP_NAME="Lumine"

  # If `LUMINE_PATH` is set by the user, we'll assume they know what they're
  # doing. Otherwise we should try to find it ourselves.
  if [ -z "${LUMINE_PATH}" ]; then
    # Attempt to infer the installation directory of Lumine from the location
    # of this script. When symlinked to a common location like
    # `/usr/local/bin`, this approach should find the true location of the
    # Lumine installation.
    if [ -L "$0" ]; then
      SCRIPT="$(readlink -f "$0")"
    else
      SCRIPT="$0"
    fi

    # The `lumine.sh` file lives one directory deeper than the root directory
    # that contains the `lumine` binary.
    ATOM_APP="$(dirname "$(dirname "$SCRIPT")")"
    LUMINE_PATH="$(realpath "$ATOM_APP")"

    if [ ! -f "$LUMINE_PATH/${ATOM_EXECUTABLE_NAME}" ]; then
      # If that path doesn't contain a `lumine` executable, then it's not a
      # valid path. We'll try something else.
      unset ATOM_APP
      unset LUMINE_PATH
    fi

    if [ -z "${LUMINE_PATH}" ]; then
      if [ -f "/opt/${ATOM_APP_NAME}/${ATOM_EXECUTABLE_NAME}" ]; then
        # Check the default installation directory for RPM and DEB
        # distributions.
        LUMINE_PATH="/opt/${ATOM_APP_NAME}"
      elif [ -f "$TMPDIR/lumine-build/${ATOM_APP_NAME}/${ATOM_EXECUTABLE_NAME}" ]; then
        # This is where Lumine can be found during some CI build tasks.
        LUMINE_PATH="$TMPDIR/lumine-build/${ATOM_APP_NAME}"
      else
        echoerr "Cannot locate ${ATOM_APP_NAME}. Set the LUMINE_PATH environment variable to the directory containing the \`${ATOM_BASE_NAME}\` executable."
        exit 1
      fi
    fi
  fi

  LUMINE_EXECUTABLE="$LUMINE_PATH/$ATOM_EXECUTABLE_NAME"

  if [ $EXPECT_OUTPUT ]; then
    "$LUMINE_EXECUTABLE" --executed-from="$(pwd)" --pid=$$ "$@" --no-sandbox
    ATOM_EXIT=$?
    if [ ${ATOM_EXIT} -eq 0 ] && [ -n "${EXIT_CODE_OVERRIDE}" ]; then
      exit "${EXIT_CODE_OVERRIDE}"
    else
      exit ${ATOM_EXIT}
    fi
  else
    (
    nohup "$LUMINE_EXECUTABLE" --executed-from="$(pwd)" --pid=$$ "$@" --no-sandbox > "$ATOM_HOME/nohup.out" 2>&1
    if [ $? -ne 0 ]; then
      cat "$ATOM_HOME/nohup.out"
      exit $?
    fi
    ) &
  fi
fi

# Exits this process when Lumine is used as $EDITOR
on_die() {
  exit 0
}
trap 'on_die' SIGQUIT SIGTERM

# If the wait flag is set, don't exit this process until Lumine kills it.
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
