# Modify Windows PATH for Pulsar
# Sets Pulsar & PPM into PATH, adds 'ATOM_HOME' env var

# Example Usage:
# Pulsar User Installation:
# .\_.ps1 -installMode User -installdir "$INSTDIR" -remove 0
# Pulsar Machine Installation:
# .\_.ps1 -installMode Machine -installdir "$INSTDIR" -remove 0
# Pulsar User Uninstallation:
# .\_.ps1 -installMode User -installdir "$INSTDIR" -remove 1
# Pulsar Machine Uninstallation:
# .\_.ps1 -installMode Machine -installdir "$INSTDIR" -remove 1

param ($installMode,$installdir,[boolean]$remove=$false)

if (-not $remove) {
  if ($installMode -eq "User" -or $installMode -eq "Machine") {
    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$installdir\resources;$installdir\resources\app\ppm\bin", $installMode)
    # By using '%USERPROFILE%' this will work either for User installs or Machine
    [Environment]::SetEnvironmentVariable("ATOM_HOME", "%USERPROFILE%\.pulsar", $installMode)
  }
} else {
  if ($installMode -eq "User" -or $installMode -eq "Machine") {
    $path = [Environment]::GetEnvironmentVariable("PATH", $installMode)
    # Remove unwanted element from path
    $path = ($path.Split(";") | Where-Object { $_ -ne "$installdir\resources" }) -join ";"
    $path = ($path.Split(";") | Where-Object { $_ -ne "$installdir\resources\app\ppm\bin" }) -join ";"
    # Set our new path
    [Environment]::SetEnvironmentVariable("Path", $path, $installMode)
    # Set ATOM_HOME path
    [Environment]::SetEnvironmentVariable("ATOM_HOME", $null, $installMode)
  } # Else we have been given bad params, and will silently exit
}
