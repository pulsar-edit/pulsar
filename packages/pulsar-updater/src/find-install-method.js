const findInstallChannel = require("./find-install-channel.js");

const INSTALL_CHANNELS = {
  macos: {
    fallback: "Manual Installation",
    channels: [
      {
        string: "Homebrew Installation",
        func: findInstallChannel.linux_macos_homebrewInstalled,
      },
    ],
  },
  linux: {
    fallback: "Manual Installation",
    channels: [
      {
        string: "Flatpak Installation",
        func: findInstallChannel.linux_flatpakInstalled,
      },
      {
        string: "Deb-Get Installation",
        func: findInstallChannel.linux_debGetInstalled,
      },
      {
        string: "Nix Installation",
        func: findInstallChannel.linux_nixInstalled,
      },
      {
        string: "Homebrew Installation",
        func: findInstallChannel.linux_macos_homebrewInstalled,
      },
      // TODO AUR
    ],
  },
  windows: {
    fallback: "Portable Installation",
    channels: [
      {
        string: "Chocolatey Installation",
        func: findInstallChannel.windows_chocoInstalled,
      },
      {
        string: "winget Installation",
        func: findInstallChannel.windows_wingetInstalled,
      },
      // We must check for package installs on windows before, user & machine
      // Since package installs trigger either a user or machine install
      {
        string: "User Installation",
        func: findInstallChannel.windows_isUserInstalled,
      },
      {
        string: "Machine Installation",
        func: findInstallChannel.windows_isMachineInstalled,
      },
    ],
  },
};

// This module will do whatever it can to determine the installation method.
// This doesn't just mean to determine what platform Pulsar is installed on
// this also means to determine what program installed it, and what variant
// of the Pulsar binary is in use.

async function main() {
  let returnValue = "";

  if (atom.inDevMode()) {
    returnValue = "Developer Mode";
  }

  if (atom.inSafeMode()) {
    returnValue = "Safe Mode";
  }

  if (atom.inSpecMode()) {
    returnValue = "Spec Mode";
  }

  if (atom.getReleaseChannel() !== 'stable') {
    // This would only be the case if
    //
    // * `yarn start` was used by a developer,
    // * someone built a local binary without removing `-dev` from the version,
    //   or
    // * someone was using a preview build of PulsarNext.
    returnValue = 'Custom Release Channel';
  }

  if (returnValue.length > 0) {
    // Return early
    return {
      platform: process.platform,
      arch: process.arch,
      installMethod: returnValue,
    };
  }

  if (process.platform === "win32") {
    returnValue = await determineChannel(
      INSTALL_CHANNELS.windows.channels,
      INSTALL_CHANNELS.windows.fallback
    );
  } else if (process.platform === "darwin") {
    returnValue = await determineChannel(
      INSTALL_CHANNELS.macos.channels,
      INSTALL_CHANNELS.macos.fallback
    );
  } else if (process.platform === "linux") {
    returnValue = await determineChannel(
      INSTALL_CHANNELS.linux.channels,
      INSTALL_CHANNELS.linux.fallback
    );
  }
  // Unused aix, freebsd, openbsd, sunos, android

  return {
    platform: process.platform,
    arch: process.arch,
    installMethod: returnValue,
  };
}

async function determineChannel(channels, fallback) {
  for (let i = 0; i < channels.length; i++) {
    let channel = channels[i];

    let install = await channel.func();

    if (
      typeof install === "boolean" &&
      install &&
      typeof channel.string === "string"
    ) {
      return channel.string;
    }
  }

  // Since we know that Pulsar hasn't been installed via an above method,
  // we should assume the fallback method
  return fallback;
}

module.exports = main;
