#!/bin/bash
#
# Script to make it easy to run the Pulsar project build and Pulsar without
# having to pollute the host system, or read a too much docs
#

# Ensure script always from the container directory so all relative path
# references are correct
cd "$(dirname "$0")"

# Check if any additional arguments were passed to this script
if [ -z "$*" ]
then
  # Yarn subcommand 'run' is the standard tool to list all available targets
  # and thus the default if no command was defined
  command=(yarn run)
  echo "INFO: No command was given, default to running '${command[*]}'"
else
  # If user passed a command, run it
  command=("$@")
  echo "INFO: Running command '${command[*]}'"
fi

# Containers need either Podman (preferred) or Docker to build and run
if command -v podman > /dev/null
then
  echo "INFO: Using Podman to launch container"
elif command -v docker > /dev/null
then
  echo "INFO: Using Podman to launch container"
  alias podman=docker
else
  echo "ERROR: Neither 'podman' is 'docker' available, unable to use containers"
  exit 1
fi

# Run the container build to ensure container exists and the layers in cache
# have the latest versions of the files in this directory
podman build -t pulsar-edit .

# Ensure xhost allows X11 apps to launch from inside a local container
XAUTHORIZATION="$(xhost | grep LOCAL)"
if [ -z "$XAUTHORIZATION" ]
then
  echo "INFO: Enable local X connections to X11 apps can launch inside the container"
  xhost +local:
fi

echo "INFO: The container will automatically terminate once the command exits"

# Mount the Pulsar git repository inside the container and start it using the
# special pulsar-entrypoint.sh script that will download and build all project
# dependencies (NodeJS modules) in case the node_modules subdirectory does not
# already exists or does not have sufficient contents
#
# NOTE! The 'privileged' is required for MESA/glx draw the Electron window
podman run \
  --rm \
  --interactive \
  --tty \
  --privileged \
  --network=host \
  --shm-size=1G \
  -e DISPLAY=$DISPLAY \
  --volume=$PWD/..:/tmp/pulsar \
  --workdir=/tmp/pulsar \
  pulsar-edit "${command[@]}"
