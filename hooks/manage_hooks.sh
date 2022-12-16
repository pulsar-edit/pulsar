#!/bin/bash

cd "$(dirname "$(readlink -f "$0")")"

USAGEMSG="Usage: manage_hooks <action> <hook> <option>"

if [[ $# -lt 1 ]] || [[ $# -gt 3 ]]; then
  echo "$USAGEMSG"
  exit 1
fi

action="$1"

case $1 in
  list)
    ls --color=if-tty -l ../.git/hooks --ignore='*.sample'
    ;;
  install)
    if [[ "$2" == "all" ]]; then
      hooks=( $(readlink -f $(ls --ignore='*.md' --ignore='*.sh' --ignore='*.bash')) )
    else
      hooks=( $(readlink -f "$2") )
    fi

    if [[ -z $3 ]]; then
      option="symbolic"
    else
      option="$3"
    fi

    case $option in
      hardlink)
        hooks+=( "$(readlink -f "update_editor.sh")" "${hooks[@]}" )
        for hook in "${hooks[@]}"; do
          if [[ ! -f "../.git/hooks/$(basename "$hook")" ]]; then
            echo "$hook"
            cp "$hook" "../.git/hooks"
          fi
        done
        ;;
      symbolic)
        cd "../.git/hooks"
        for hook in "${hooks[@]}"; do
          if [[ ! -f "$(basename $hook)" ]]; then
            echo "$(readlink -f .)/$(basename $hook)"
            ln --symbolic --relative "../../hooks/$(basename "$hook")"
          fi
        done
        ;;
    esac
    ;;
  remove)
    cd "../.git/hooks"
    if [[ "$2" == "all" ]]; then
      hooks=( $(realpath --no-symlinks $(ls --ignore='*.sample' --ignore='*.sh')) )
    else
      hooks=( $(realpath --no-symlinks "$2") )
    fi

    for hook in "${hooks[@]}"; do
      echo "$hook"
      rm "$hook"
    done
    ;;
  *)
    echo "$USAGEMSG"
    exit 1
    ;;
esac
