# Modify Windows PATH for Pulsar
# Sets Pulsar & PPM into PATH, adds 'ATOM_HOME' env var

# Example Usage:
# Pulsar User Installation:
# .\_.ps1 -installdir "$INSTDIR" -remove FALSE
# Pulsar Machine Installation:
# .\_.ps1 -installdir "$INSTDIR" -remove FALSE
# Pulsar User Uninstallation:
# .\_.ps1 -installdir "$INSTDIR" -remove TRUE
# Pulsar Machine Uninstallation:
# .\_.ps1 -installdir "$INSTDIR" -remove TRUE

# For safe interaction with environment variables taken from:
# https://github.com/chocolatey/choco/blob/HEAD/src/chocolatey.resources/helpers/functions/Set-EnvironmentVariable.ps1
# https://github.com/chocolatey/choco/blob/HEAD/src/chocolatey.resources/helpers/functions/Get-EnvironmentVariable.ps1
# https://github.com/chocolatey/choco/blob/HEAD/src/chocolatey.resources/helpers/functions/Install-ChocolateyPath.ps1

param ($installdir,$remove)

# When self-elevating, we can't pass a raw boolean. Meaning we accept anything then convert
$remove = [System.Convert]::ToBoolean($remove)

if (-not $remove) {
  # We want to add Pulsar path values

  # Lets first save a copy of the users current path
  $env:Path > prior2addition.txt;

  $originalPathToInstall = $installdir

  $pulsarPath = $installdir + "\resources";
  $ppmPath = $installdir + "\resources\app\ppm\bin";

  # Get the current PATH variable
  $envPath = $env:PATH;
  if (!$envPath.toLower().Contains($installdir.ToLower())) {
    # we don't already have the correct environment variable
    $actualPath = [Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User);

    $statementTerminator = ";";

    $pathToInstall = $pulsarPath + $statementTerminator + $ppmPath + $statementTerminator;

    # Does the path end in ';'?
    $hasStatementTerminator = $actualPath -ne $null -and $actualPath.EndsWith($statementTerminator);
    # If the last digit is not ';', then add it
    if (!$hasStatementTerminator -and $actualPath -ne $null) {
      $pathToInstall = $statementTerminator + $pathToInstall;
    }

    $actualPath = $actualPath + $pathToInstall;

    # Now to actually set the path to the system
    $registryType = [Microsoft.Win32.RegistryValueKind]::ExpandString;
    $keyHive = "HKEY_CURRENT_USER";
    $registryKey = "Environment";

    $exitCode = [Microsoft.Win32.Registry]::SetValue($keyHive + "\" + $registryKey, "Path", $actualPath, [System.EnvironmentVariableTarget]::User);

    Exit $exitCode;
  } else {
    Write-Host "Pulsar is already present on the User PATH.";
  }

} else {
  # We want to remove Pulsar from the user path

  # Lets first save a copy of the users current path
  $env:Path > prior2removal.txt;

  $pulsarPath = $installdir + "\resources";
  $ppmPath = $installdir + "\resources\app\ppm\bin";

  # Get the current PATH variable
  $envPath = $env:PATH;
  if ($envPath.toLower().Contains($installdir.ToLower())) {
    # the install dir is in fact on the path
    $actualPath = [Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User);

    $actualPath = ($actualPath.Split(";") | Where-Object { $_ -ne $ppmPath }) -join ";";
    # Order is important, as Pulsar's path INCLUDES ppm's path
    $actualPath = ($actualPath.Split(";") | Where-Object { $_ -ne $pulsarPath }) -join ";";

    # Now to actually set the path to the system
    $registryType = [Microsoft.Win32.RegistryValueKind]::ExpandString;
    $keyHive = "HKEY_CURRENT_USER";
    $registryKey = "Environment";

    $exitCode = [Microsoft.Win32.Registry]::SetValue($keyHive + "\" + $registryKey, "Path", $actualPath, [System.EnvironmentVariableTarget]::User);

    Exit $exitCode;
  } else {
    Write-Host "Pulsar is not present on the User PATH.";
  }
}
