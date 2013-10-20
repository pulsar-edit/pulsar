#!/bin/bash

A_OUT=$(mktemp -t "${TM_DISPLAYNAME:-untitled}")
trap 'rm "$A_OUT"' EXIT

"$@" -o "$A_OUT"

if [ $? -eq 0 ]; then
  "$A_OUT"
fi
