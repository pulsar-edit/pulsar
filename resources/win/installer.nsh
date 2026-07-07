!include "${BUILD_RESOURCES_DIR}\..\resources\win\EnvVarUpdate.nsh" ; Relative to 'build\'
!include "${BUILD_RESOURCES_DIR}\..\resources\win\GetWindowsVersion.nsh"
!include nsDialogs.nsh
XPStyle on

!macro customInit ; Macro called by electron-builder; inserted at start of .OnInit callback
  ; Check the current windows version
  ${GetWindowsVersion} $R0

  ${Switch} $R0
    ${Case} '10.0' ; Support Windows 10
    ${Case} '' ; Support Windows versions unknown to GetWindowsVersion v4.1.1 (Win11)
      ${Break} ; Do nothing if supported version.
    ${Default}
      MessageBox MB_OK "Lumine >=v1.131.0 is only supported on Windows 10 or 11."
      Quit
      ${Break}
  ${EndSwitch}
!macroend

!macro customInstall ; Macro called by electron-builder
  ; Set the 'InstallLocation' Registry Key for GitHub Desktop
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" "InstallLocation" "$INSTDIR"
!macroend

!macro customUnInstall ; Macro called by electron-builder
  ; Since adding the PATH occurs during installation, we want to ensure to remove it.
  ; Luckily 'EnvVarUpdate' handles the case of it not being present
  ${ifNot} ${isUpdated}
    ; Only run uninstall steps if truly uninstalling. Prevents this step from
    ; running during an upgrade, where it technically runs after the upgrade's
    ; install steps, ultimately removing Lumine from the PATH
    ${un.EnvVarUpdate} $0 "PATH" "R" "HKCU" "$INSTDIR\resources"

    ; Remove the Explorer context menu and shell entries that Lumine registers
    ; at runtime (see src/main-process/win-shell.js). Those verbs are keyed on
    ; the app name, which for non-stable channels gets a suffix (e.g. "Lumine
    ; Dev", "Lumine Beta") via getAppName(). So we can't just delete "Lumine" —
    ; we enumerate each container and remove every verb named "Lumine" or
    ; "Lumine <Channel>".
    Push "Software\Classes\*\shell"
    Call un.RemoveLumineShellVerbs
    Push "Software\Classes\Directory\shell"
    Call un.RemoveLumineShellVerbs
    Push "Software\Classes\Directory\background\shell"
    Call un.RemoveLumineShellVerbs

    ; File handler entry. The executable name has no channel suffix (it follows
    ; productName), so a single key covers it. DeleteRegKey is a no-op when the
    ; key is absent.
    DeleteRegKey HKCU "Software\Classes\Applications\Lumine.exe"
  ${endIf}
!macroend

; Deletes every subkey of the given HKCU container whose name is "Lumine" or
; begins with "Lumine " (covering channel-suffixed names). Takes the container
; path (relative to HKCU) on the stack.
Function un.RemoveLumineShellVerbs
  Exch $R0 ; container key path
  Push $R1 ; enumeration index
  Push $R2 ; current subkey name
  Push $R3 ; name prefix scratch

  StrCpy $R1 0
  loop:
    EnumRegKey $R2 HKCU "$R0" $R1
    StrCmp $R2 "" done
    ; Exact "Lumine"?
    StrCmp $R2 "Lumine" delete
    ; Channel-suffixed "Lumine <...>"?
    StrCpy $R3 $R2 7
    StrCmp $R3 "Lumine " delete
    ; No match: advance to the next subkey.
    IntOp $R1 $R1 + 1
    Goto loop
  delete:
    ; Deleting shifts the remaining subkeys down into this index, so re-read
    ; the same index rather than incrementing.
    DeleteRegKey HKCU "$R0\$R2"
    Goto loop
  done:

  Pop $R3
  Pop $R2
  Pop $R1
  Pop $R0
FunctionEnd

!macro MUI_PAGE_ADD_TO_PATH ; Define our custom macro

  ; Define our variables
  Var Dialog
  Var LuminePathCheckbox_Label
  Var LuminePathCheckbox
  Var LuminePathCheckbox_State

  Var LuminePathAdd_Status

  Page custom AddToPathPage AddToPathFunction ; Call our page with creator_function leave_function

  Function AddToPathPage

    !insertmacro MUI_HEADER_TEXT "Choose Installation Options" ""

    nsDialogs::Create 1018 ; Create custom dialog
    Pop $Dialog

    ${If} $Dialog == error
      Abort ; Abort if we fail to create dialog
    ${EndIf}

    ; Enter our custom dialog controls
    ${NSD_CreateLabel} 0 0 100% 24u "You can choose to add the 'lumine' command to your PATH. This allows you to easily invoke Lumine from the shell."
    Pop $LuminePathCheckbox_Label

    ${NSD_CreateCheckbox} 0 30u 100% 10u "&Add Lumine to the User PATH"
    Pop $LuminePathCheckbox

    ; Check the boxes by default
    ${NSD_Check} $LuminePathCheckbox

    ; The below 'If's add memory to the selection. Meaning if the user clicks
    ; forward then returns, their selection will be remembered.
    ${If} $LuminePathCheckbox_State == ${BST_UNCHECKED}
      ${NSD_Uncheck} $LuminePathCheckbox
    ${EndIf}

    nsDialogs::Show ; Show custom dialog

  FunctionEnd

  Function AddToPathFunction
    ; Here we set the memory of the users selection after leaving the page.
    ${NSD_GetState} $LuminePathCheckbox $LuminePathCheckbox_State

    ; Now to add this data to the User PATH
    ${If} $LuminePathCheckbox_State == ${BST_CHECKED}
      ${EnvVarUpdate} $LuminePathAdd_Status "PATH" "A" "HKCU" "$INSTDIR\resources"
    ${EndIf}

  FunctionEnd

  Section
  SectionEnd

!macroend

!macro customPageAfterChangeDir ; Macro called by electron-builder

  !insertmacro MUI_PAGE_ADD_TO_PATH ; Add our custom dialog into the regular installation process

!macroend
