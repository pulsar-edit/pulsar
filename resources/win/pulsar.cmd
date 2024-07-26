@echo off

SET EXPECT_OUTPUT=
SET WAIT=
SET PSARGS=%*
SET ELECTRON_ENABLE_LOGGING=
SET ATOM_ADD=
SET ATOM_NEW_WINDOW=
SET PACKAGE_MODE=
SET PACKAGE_MODE_ARGS=

FOR %%a IN (%*) DO (
  IF /I "%%a"=="-f"                         SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="--foreground"               SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="-h"                         SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="--help"                     SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="-t"                         SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="--test"                     SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="--benchmark"                SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="--benchmark-test"           SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="-v"                         SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="--version"                  SET EXPECT_OUTPUT=YES
  IF /I "%%a"=="--enable-electron-logging"  SET ELECTRON_ENABLE_LOGGING=YES
  IF /I "%%a"=="-a"                         SET ATOM_ADD=YES
  IF /I "%%a"=="--add"                      SET ATOM_ADD=YES
  IF /I "%%a"=="-n"                         SET ATOM_NEW_WINDOW=YES
  IF /I "%%a"=="--new-window"               SET ATOM_NEW_WINDOW=YES
  IF /I "%%a"=="-p"                         SET PACKAGE_MODE=YES
  IF /I "%%a"=="--package"                  SET PACKAGE_MODE=YES
  IF /I "%%a"=="-w"           (
    SET EXPECT_OUTPUT=YES
    SET WAIT=YES
  )
  IF /I "%%a"=="--wait"       (
    SET EXPECT_OUTPUT=YES
    SET WAIT=YES
  )
)

IF "%ATOM_ADD%"=="YES" (
  IF "%ATOM_NEW_WINDOW%"=="YES" (
    SET EXPECT_OUTPUT=YES
  )
)
if "%PACKAGE_MODE%"=="YES" (
  REM In package mode, we should shell out directly to `ppm` instead of
  REM invoking `Pulsar.exe` at all. But first we need to assemble a list of
  REM arguments that `ppm.cmd` will understand.

  REM Since batch files don't have `while` loops, we've got to fake them with
  REM labels and GOTO.
  goto :trim_args_for_package_mode

:package_mode_return
  "%~dp0\app\ppm\bin\ppm.cmd" %PACKAGE_MODE_ARGS%
  exit 0
)

IF "%EXPECT_OUTPUT%"=="YES" (
  IF "%WAIT%"=="YES" (
    powershell -noexit "Start-Process -FilePath \"%~dp0\..\Pulsar.exe\" -ArgumentList \"--pid=$pid $env:PSARGS\" ; wait-event"
    exit 0
  ) ELSE (
    "%~dp0\..\Pulsar.exe" %*
  )
) ELSE (
  "%~dp0\app\ppm\bin\node.exe" "%~dp0\pulsar.js" "Pulsar.exe" %*
)

REM Jump past the subroutines below.
goto :eof

REM The subroutine for assembling a list of arguments to pass to `ppm`.
REM First we trim any arguments that appear previous to `-p` or `--package` on
REM the line.
:trim_args_for_package_mode
if not "%1"=="--package" (
  if not "%1"=="-p" (
    REM Roughly the same as `ARGV.shift`. Everything except the initial
    REM argument moves forward, and the second argument is removed from the
    REM list.
    SHIFT /1
    goto :trim_args_for_package_mode
  )
)
REM When we reach this point, `-p`/`--package` is the argument in the %1
REM position. Now we'll call `shift` once more to remove it from the list.
SHIFT /1

:build_args_for_package_mode
REM We need to pass all the remaining arguments to `ppm.cmd`. If all the
REM shifting we did above affected %*, that'd be perfect. But since it doesn't,
REM we'll loop through the remaining arguments and concatenate them into a
REM variable.
if not "%1"=="" (
  SET PACKAGE_MODE_ARGS=%PACKAGE_MODE_ARGS% %1%
  SHIFT /1
  goto :build_args_for_package_mode
)
REM Return from our subroutines so we can finally call `ppm.cmd`.
goto :package_mode_return
