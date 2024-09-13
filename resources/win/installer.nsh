!include "${BUILD_RESOURCES_DIR}\..\resources\win\EnvVarUpdate.nsh" ; Relative to 'build\'
!include nsDialogs.nsh
XPStyle on

!macro customInstall ; Macro called by electron-builder
  ; Set the 'InstallLocation' Registry Key for GitHub Desktop
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" "InstallLocation" "$INSTDIR"
!macroend

!macro customUnInstall ; Macro called by electron-builder
  ; Since adding the PATH occurs during installation, we want to ensure to remove it.
  ; Luckily 'EnvVarUpdate' handles the case of it not being present
  ${un.EnvVarUpdate} $0 "PATH" "R" "HKCU" "$INSTDIR\resources"
  ${un.EnvVarUpdate} $0 "PATH" "R" "HKCU" "$INSTDIR\resources\app\ppm\bin"
!macroend

!macro MUI_PAGE_ADD_TO_PATH ; Define our custom macro

  ; Define our variables
  Var Dialog
  Var PulsarPathCheckbox_Label
  Var PulsarPathCheckbox
  Var PulsarPathCheckbox_State
  Var PpmPathCheckbox
  Var PpmPathCheckbox_State

  Var PulsarPathAdd_Status
  Var PpmPathAdd_Status

  Page custom AddToPathPage AddToPathFunction ; Call our page with creator_function leave_function

  Function AddToPathPage

    !insertmacro MUI_HEADER_TEXT "Choose Installation Options" ""

    nsDialogs::Create 1018 ; Create custom dialog
    Pop $Dialog

    ${If} $Dialog == error
      Abort ; Abort if we fail to create dialog
    ${EndIf}

    ; Enter our custom dialog controls
    ${NSD_CreateLabel} 0 0 100% 24u "You can choose to add the 'pulsar' and 'ppm' commands to your PATH. This allows you to easily invoke Pulsar and PPM (Pulsar Package Manager) from the shell."
    Pop $PulsarPathCheckbox_Label

    ${NSD_CreateCheckbox} 0 30u 100% 10u "&Add Pulsar to the User PATH"
    Pop $PulsarPathCheckbox

    ${NSD_CreateCheckbox} 0 45u 100% 10u "&Add PPM to the User PATH"
    Pop $PpmPathCheckbox

    ; Check the boxes by default
    ${NSD_Check} $PulsarPathCheckbox
    ${NSD_Check} $PpmPathCheckbox

    ; The below 'If's add memory to the selection. Meaning if the user clicks
    ; forward then returns, their selection will be remembered.
    ${If} $PulsarPathCheckbox_State == ${BST_UNCHECKED}
      ${NSD_Uncheck} $PulsarPathCheckbox
    ${EndIf}

    ${If} $PpmPathCheckbox_State == ${BST_UNCHECKED}
      ${NSD_Uncheck} $PpmPathCheckbox
    ${EndIf}

    nsDialogs::Show ; Show custom dialog

  FunctionEnd

  Function AddToPathFunction
    ; Here we set the memory of the users selection after leaving the page.
    ${NSD_GetState} $PulsarPathCheckbox $PulsarPathCheckbox_State
    ${NSD_GetState} $PpmPathCheckbox $PpmPathCheckbox_State

    ; Now to add this data to the User PATH
    ${If} $PulsarPathCheckbox_State == ${BST_CHECKED}
      ${EnvVarUpdate} $PulsarPathAdd_Status "PATH" "A" "HKCU" "$INSTDIR\resources"
    ${EndIf}

    ${If} $PpmPathCheckbox_State == ${BST_CHECKED}
      ${EnvVarUpdate} $PpmPathAdd_Status "PATH" "A" "HKCU" "$INSTDIR\resources\app\ppm\bin"
    ${EndIf}

  FunctionEnd

  Section
  SectionEnd

!macroend

!macro customPageAfterChangeDir ; Macro called by electron-builder

  !insertmacro MUI_PAGE_ADD_TO_PATH ; Add our custom dialog into the regular installation process

!macroend
