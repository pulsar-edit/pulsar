#!/bin/bash

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
    #Grab our list of files if all was passed.
    #Couldn't get * to function without globbing
    if [[ "$2" == "all" ]]; then
      hooks=( $(readlink -f $(ls --ignore='*.md' --ignore='*.sh' --ignore='*.bash')) )
    else
      hooks=( $(readlink -f "$2") )
    fi

    #Default to symbolic
    if [[ -z $3 ]]; then
      option="symbolic"
    else
      option="$3"
    fi

    case $option in
      copy)
        #If copying, copy the update_editor file as well
        hooks+=( "$(readlink -f "update_editor.sh")" "${hooks[@]}" )

        for hook in "${hooks[@]}"; do
          #If the file doesnt already exist copy it over
          if [[ ! -f "../.git/hooks/$(basename "$hook")" ]]; then
            echo "$hook"
            cp "$hook" "../.git/hooks"
          fi
        done
        ;;

      symbolic)
        #Switch to the git hook directory, because symlink hooks are required
        #to be relative
        cd "../.git/hooks"

        for hook in "${hooks[@]}"; do
          #If the file doesnt already exist, symlink it
          if [[ ! -f "$(basename $hook)" ]]; then
            echo "$(readlink -f .)/$(basename $hook)"
            ln --symbolic --relative "../../hooks/$(basename "$hook")"
          fi
        done
        ;;
    esac
    ;;
  remove)
    #Switch to the git hook directory, so we dont have to deal with
    #relative file paths
    cd "../.git/hooks"

    #Grab the canonical path to the file, readlink always follows symlinks
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
