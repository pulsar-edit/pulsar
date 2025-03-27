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

# Only set the ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT env var if it hasn't
# been set.
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
        foreground|benchmark|benchmark-test|test)
          EXPECT_OUTPUT=1
          ;;
        package)
          PACKAGE_MODE=1
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
    p)
      PACKAGE_MODE=1
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

ATOM_HOME="${ATOM_HOME:-$HOME/.pulsar}"
mkdir -p "$ATOM_HOME"

if [ $PACKAGE_MODE ]; then
  # If `-p` or `--package` is present, then we'll be discarding all arguments
  # prior to (and including) `-p`/`--package` and passing the rest to `ppm`.
  loop_done=0
  while [ $loop_done -eq 0 ]
  do
    if [[ "$1" == "-p" || "$1" == "--package" || "$1" == "" ]]; then
      # We'll shift one last time and then we'll be done.
      loop_done=1
    fi
    shift
  done
fi

if [ $OS == 'Mac' ]; then
  if [ -L "$0" ]; then
    SCRIPT="$(readlink "$0")"
  else
    SCRIPT="$0"
  fi
  ATOM_APP="$(dirname "$(dirname "$(dirname "$SCRIPT")")")"

  # If this is a `pulsar.sh` from a built version of Pulsar, then `$ATOM_APP`
  # should now be the path to the user's instance of Pulsar.app.
  if [[ "$ATOM_APP" == . || "$ATOM_APP" != *".app" ]]; then
    # This is a `pulsar.sh` that's in the source code of Pulsar or has been
    # copied to a location outside of the app (instead of symlinked). We'll try
    # another tactic.
    unset ATOM_APP
  else
    # We found the location of the Pulsar.app that this script lives in.
    PULSAR_PATH="$(dirname "$ATOM_APP")"
    ATOM_APP_NAME="$(basename "$ATOM_APP")"
  fi

  # Fall back to the default Pulsar.app as the app name.
  ATOM_APP_NAME=${ATOM_APP_NAME:-Pulsar.app}
  # The executable name will be the same thing but without the `.app` suffix.
  ATOM_EXECUTABLE_NAME="${ATOM_APP_NAME%.*}"

  if [ -z "${PULSAR_PATH}" ]; then
    # If PULSAR_PATH isn't set, check /Applications and then ~/Applications for
    # Pulsar.app.
    if [ -x "/Applications/${ATOM_APP_NAME}" ]; then
      PULSAR_PATH="/Applications"
    elif [ -x "$HOME/Applications/${ATOM_APP_NAME}" ]; then
      PULSAR_PATH="$HOME/Applications"
    else
      # We still haven't found a Pulsar.app. Let's try searching for it via
      # Spotlight.
      PULSAR_APP_SEARCH_RESULT="$(mdfind "kMDItemCFBundleIdentifier == 'dev.pulsar-edit.pulsar'" | grep -v ShipIt | head -1)"
      if [ ! -z "$PULSAR_APP_SEARCH_RESULT" ]; then
        PULSAR_PATH="$(dirname "$PULSAR_APP_SEARCH_RESULT")"
        ATOM_APP_NAME="$(basename "$PULSAR_APP_SEARCH_RESULT")"
      fi
    fi
  fi

  PULSAR_EXECUTABLE="$PULSAR_PATH/$ATOM_APP_NAME/Contents/MacOS/$ATOM_EXECUTABLE_NAME"
  PPM_EXECUTABLE="$PULSAR_PATH/$ATOM_APP_NAME/Contents/Resources/app/ppm/bin/ppm"

  # Exit if Pulsar can't be found.
  if [ ! -x "${PULSAR_EXECUTABLE}" ]; then
    echoerr "Cannot locate ${ATOM_APP_NAME}; it is usually located in /Applications. Set the PULSAR_PATH environment variable to the directory containing ${ATOM_APP_NAME}."
    exit 1
  fi

  # If `-p` or `--package` was specified, call `ppm` with all the arguments
  # that followed it instead of calling the Pulsar executable directly.
  if [ $PACKAGE_MODE ]; then
    "$PPM_EXECUTABLE" "$@"
    exit $?
  fi

  if [ $EXPECT_OUTPUT ]; then
    "$PULSAR_EXECUTABLE" --executed-from="$(pwd)" --pid=$$ "$@"
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

  # Set tmpdir only if it's unset.
  : ${TMPDIR:=/tmp}

  ATOM_EXECUTABLE_NAME="pulsar"

  # If `PULSAR_PATH` is set by the user, we'll assume they know what they're
  # doing. Otherwise we should try to find it ourselves.
  if [ -z "${PULSAR_PATH}" ]; then
    # Attempt to infer the installation directory of Pulsar from the location
    # of this script. When symlinked to a common location like
    # `/usr/local/bin`, this approach should find the true location of the
    # Pulsar installation.
    if [ -L "$0" ]; then
      SCRIPT="$(readlink -f "$0")"
    else
      SCRIPT="$0"
    fi

    # The `pulsar.sh` file lives one directory deeper than the root directory
    # that contains the `pulsar` binary.
    ATOM_APP="$(dirname "$(dirname "$SCRIPT")")"
    PULSAR_PATH="$(realpath "$ATOM_APP")"

    if [ ! -f "$PULSAR_PATH/pulsar" ]; then
      # If that path doesn't contain a `pulsar` executable, then it's not a
      # valid path. We'll try something else.
      unset ATOM_APP
      unset PULSAR_PATH
    fi

    if [ -z "${PULSAR_PATH}" ]; then
      if [ -f "/opt/Pulsar/pulsar" ]; then
        # Check the default installation directory for RPM and DEB
        # distributions.
        PULSAR_PATH="/opt/Pulsar"
      elif [ -f "$TMPDIR/pulsar-build/Pulsar/pulsar" ]; then
        # This is where Pulsar can be found during some CI build tasks.
        PULSAR_PATH="$TMPDIR/pulsar-build/Pulsar"
      else
        echoerr "Cannot locate Pulsar. Set the PULSAR_PATH environment variable to the directory containing the \`pulsar\` executable."
        exit 1
      fi
    fi
  fi

  PULSAR_EXECUTABLE="$PULSAR_PATH/$ATOM_EXECUTABLE_NAME"
  PPM_EXECUTABLE="$PULSAR_PATH/resources/app/ppm/bin/ppm"

  # If `-p` or `--package` was specified, call `ppm` with all the arguments
  # that followed it instead of calling the Pulsar executable directly.
  if [ $PACKAGE_MODE ]; then
    "$PPM_EXECUTABLE" "$@"
    exit $?
  fi

  if [ $EXPECT_OUTPUT ]; then
    "$PULSAR_EXECUTABLE" --executed-from="$(pwd)" --pid=$$ "$@" --no-sandbox
    ATOM_EXIT=$?
    if [ ${ATOM_EXIT} -eq 0 ] && [ -n "${EXIT_CODE_OVERRIDE}" ]; then
      exit "${EXIT_CODE_OVERRIDE}"
    else
      exit ${ATOM_EXIT}
    fi
  else
    (
    nohup "$PULSAR_EXECUTABLE" --executed-from="$(pwd)" --pid=$$ "$@" --no-sandbox > "$ATOM_HOME/nohup.out" 2>&1
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
