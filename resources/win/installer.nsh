!macro customInstall
  # Set the 'InstallLocation' Registry Key for GitHub Desktop
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" "InstallLocation" "$INSTDIR"
!macroend

!macro customUnInstall
  # This uninstall script is ready to go. Just a question if we want to modify PATH on uninstall
  ${if} $installMode == "all"
    # Machine Install
    #ExecWait 'powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\resources\modifyWindowsPath.ps1" -installMode Machine -installdir "$INSTDIR" -remove 1'
  ${else}
    # User Install
    #ExecWait 'powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\resources\modifyWindowsPath.ps1" -installMode User -installdir "$INSTDIR" -remove 1'
  ${endif}
!macroend
