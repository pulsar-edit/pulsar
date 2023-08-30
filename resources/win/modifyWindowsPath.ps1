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

param ($installMode,$installdir,$remove)

# When self-elevating, we can't pass a raw boolean. Meaning we accept anything then convert
$remove = [System.Convert]::ToBoolean($remove)

# Only when modifying the Machine PATH, it takes much longer than expected. So here's a loading bar
$prog = 1
Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

if ($installMode -eq "Machine") {
  # PowerShell needs to be running as Admin to modify the Machine Variables
  # So lets attempt to self-elevate
  if (-Not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')) {
    if ([int](Get-CimInstance -Class Win32_OperatingSystem | Select-Object -ExpandProperty BuildNumber) -ge 6000) {

      $processOptions = @{
        FilePath = "PowerShell.exe"
        Wait = $true
        PassThru = $true
        Verb = "RunAs"
        ArgumentList = "-File `"" + $MyInvocation.MyCommand.Path + "`" -installMode $installMode -installdir `"" + $installdir + "`" -remove $remove"
      }

      Start-Process @processOptions

      Exit
    }
  }
}

if (-not $remove) {
  if ($installMode -eq "User" -or $installMode -eq "Machine") {

    $prog = 25
    Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$installdir\resources;$installdir\resources\app\ppm\bin", $installMode)

    $prog = 50
    Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

    # While this originally attempting to use the string '%USERPROFILE%' to avoid taking
    # space on the PATH, whatever reads this path at startup in Pulsar, can't handle
    # the variable, and instead creates the directory of the same name
    # within the current folder. But only when opened via the context menu, terminal
    # is fine.
    $exitCode = [Environment]::SetEnvironmentVariable("ATOM_HOME", "$env:UserProfile\.pulsar", $installMode)

    $prog = 100
    Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

    Exit $exitCode
  }
} else {
  if ($installMode -eq "User" -or $installMode -eq "Machine") {

    $prog = 25
    Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

    $path = [Environment]::GetEnvironmentVariable("Path", $installMode)

    $prog = 50
    Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

    # Remove unwanted element from path
    $path = ($path.Split(";") | Where-Object { $_ -ne "$installdir\resources" }) -join ";"
    $path = ($path.Split(";") | Where-Object { $_ -ne "$installdir\resources\app\ppm\bin" }) -join ";"

    $prog = 75
    Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

    # Set our new path
    [Environment]::SetEnvironmentVariable("Path", $path, $installMode)

    $prog = 90
    Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

    # Set ATOM_HOME path
    $exitCode = [Environment]::SetEnvironmentVariable("ATOM_HOME", $null, $installMode)

    $prog = 100
    Write-Progress -Activity "Modifying Pulsar ($installdir) on the PATH..." -Status "$prog% Complete:" -PercentComplete $prog

    Exit $exitCode
  } # Else we have been given bad params, and will silently exit
}
