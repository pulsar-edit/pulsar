#!/bin/bash

#Not gonna lie, this is some magical stuff, but I will try to explain it

#Automatic variables used by complete
#COMPREPLY = An array of autocompletions to pass back to the shell
#COMP_WORDS = The passed-in list of parameters
#COMP_CWORD = The index of the current word as related to the count of
#parameters

#compgen = Generates an array of autocompletions to pass back to the shell
#based on provided parameters

function __completion() {
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  opts="list install remove"

  #Determine what "level" of autocomplete we are operating on
  #1 is no params
  #2 is 1 param, in this instance the command
  #3 etc
  case ${COMP_CWORD} in
    1)
      #Generate a Word-list from opts from the current word
      COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
      ;;
    2)
      case ${prev} in
        install)
          #Generate a list of filenames (and append "all") based on the current
          #directory and current word while ignoring select files
          COMPREPLY=( $(compgen -W "all $(ls --ignore='*.md' --ignore='*.sh' --ignore='*.bash')" -- ${cur}) )
          ;;
        remove)
          #Generate a list of filenames (and append "all") based on the
          #.git/hooks directory and current word while ignoring the sample
          #files
          COMPREPLY=( $(compgen -W "all $(ls ../.git/hooks --ignore='*.sample')" -- ${cur}) )
          ;;
      esac
      ;;
    3)
      case "${COMP_WORDS[COMP_CWORD-2]}" in
        install)
          #When attempting to autocomplete for the third parameter ie copy
          #/symbolic AND the command is install
          #Generate a list of Words from the provded string
          COMPREPLY=( $(compgen -W "copy symbolic" -- ${cur}) )
          ;;
      esac
      ;;
  esac
}

#Use the function defined above, when an autocomplete event for
#./manage_hooks.sh is fired. This is why you must be in the proper directory
complete -F __completion ./manage_hooks.sh
