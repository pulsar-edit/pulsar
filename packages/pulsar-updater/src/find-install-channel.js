const Registry = require("winreg");
const shell = require("shelljs");
const fs = require("fs");

// https://github.com/shelljs/shelljs/wiki/Electron-compatibility
// ShellJS is not totally compatible within Electron.
// We may need to look at running this within a task, but otherwise this should be
// sufficient to get `exec` working
shell.config.execPath = shell.which("node").toString();

function windows_isUserInstalled() {
  return new Promise((resolve, reject) => {
    let userInstallReg = new Registry({
      hive: "HKCU",
      key: "\\SOFTWARE\\0949b555-c22c-56b7-873a-a960bdefa81f",
    });

    userInstallReg.keyExists((err, exists) => {
      if (err) {
        reject(err);
      }

      resolve(exists);
    });
  });
}

function windows_isMachineInstalled() {
  return new Promise((resolve, reject) => {
    let machineInstallReg = new Registry({
      hive: "HKLM",
      key: "\\SOFTWARE\\0949b555-c22c-56b7-873a-a960bdefa81f",
    });

    machineInstallReg.keyExists((err, exists) => {
      if (err) {
        reject(err);
      }

      resolve(exists);
    });
  });
}

function windows_chocoInstalled() {
  if (!shell.which("choco")) {
    return false;
  }

  let chocoCheck = shell.exec("choco list --local-only");

  if (chocoCheck.code !== 0) {
    return false;
  }
  
  return chocoCheck.stdout.includes("pulsar");
}

function windows_wingetInstalled() {
  if (!shell.which("winget")) {
    return false;
  }

  let wingetCheck = shell.exec("winget show Pulsar");

  if (wingetCheck.code !== 0) {
    return false;
  }

  return wingetCheck.stdout.includes("Pulsar");
}

function linux_macos_homebrewInstalled() {
  if (!shell.which("brew")) {
    return false;
  }

  let homebrewCheck = shell.exec("brew list 'pulsar'");

  if (homebrewCheck.code !== 0) {
    return false;
  }

  return homebrewCheck.stdout.includes("pulsar");
}

function linux_nixInstalled() {
  if (!fs.existsSync("/nix/store")) {
    return false;
  }

  if (!shell.which("find")) {
    // A little dishonest, but we need this to check if it exists so..
    return false;
  }

  shell.cd("/nix/store");

  let nixCheck = shell.exec('find -maxdepth 1 -name "*pulsar.nemo_action"');

  if (nixCheck.code !== 0) {
    return false;
  }

  return nixCheck.stdout.includes("pulsar.nemo_action");
}

function linux_debGetInstalled() {
  if (!shell.which("deb-get")) {
    return false;
  }

  let debGetCheck = shell.exec("deb-get list --installed");

  if (debGetCheck.code !== 0) {
    return false;
  }

  return debGetCheck.stdout.includes("pulsar");
}

function linux_flatpakInstalled() {
  return process.env.FLATPAK_ID === "dev.pulsar_edit.Pulsar";
}

module.exports = {
  windows_isUserInstalled,
  windows_isMachineInstalled,
  windows_chocoInstalled,
  windows_wingetInstalled,
  linux_macos_homebrewInstalled,
  linux_nixInstalled,
  linux_debGetInstalled,
  linux_flatpakInstalled,
};
