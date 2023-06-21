# This is all handled within a PowerShell file to avoid length limits within NSIS Scripts
# And to avoid having to include plugins for NSIS, PowerShell can do this natively

# -remove 0 is FALSE | -remove 1 is TRUE
param ($installMode,$installdir,[boolean]$remove=$false)

if (-not $remove) {
  if ($installMode -eq "User" -or $installMode -eq "Machine") {
    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$installdir\resources;$installdir\resources\app\ppm\bin", $installMode)
  }
  # Now only add the ATOM_HOME env var if a user install, since we don't have a plan
  # on it's location for a machine install
  if ($installMode -eq "User") {
    [Environment]::SetEnvironmentVariable("ATOM_HOME", "$env:USERPROFILE\.pulsar", "User")
  }
} else {
  if ($installMode -eq "User" -or $installMode -eq "Machine") {
    $path = [Environment]::GetEnvironmentVariable("PATH", $installMode)
    # Remove unwanted element from path
    $path = ($path.Split(";") | Where-Object { $_ -ne "$installdir\resources" }) -join ";"
    $path = ($path.Split(";") | Where-Object { $_ -ne "$installdir\resources\app\ppm\bin" }) -join ";"
    # Set our new path
    [Environment]::SetEnvironmentVariable("Path", $path, $installMode)
  } # Else we have been given bad params, and will silently exit
  if ($installMode -eq "User") {
    [Environment]::SetEnvironmentVariable("ATOM_HOME", $null, "User")
  }
}
