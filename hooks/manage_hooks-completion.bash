#!/bin/bash

function __completion() {
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  opts="list install remove"

  case ${COMP_CWORD} in
    1)
      COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
      ;;
    2)
      case ${prev} in
        install)
          COMPREPLY=( $(compgen -W "all $(ls --ignore='*.md' --ignore='*.sh' --ignore='*.bash')" -- ${cur}) )
          ;;
        remove)
          COMPREPLY=( $(compgen -W "all $(ls ../.git/hooks --ignore='*.sample')" -- ${cur}) )
          ;;
      esac
      ;;
    3)
      case "${COMP_WORDS[COMP_CWORD-2]}" in
        install)
          COMPREPLY=( $(compgen -W "hardlink symbolic" -- ${cur}) )
          ;;
      esac
      ;;
  esac
}

complete -F __completion ./manage_hooks.sh
