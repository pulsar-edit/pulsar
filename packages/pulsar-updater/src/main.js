const { CompositeDisposable } = require("atom");
let superagent;
let findInstallMethod;
let shell;

class PulsarUpdater {
  activate() {
    this.disposables = new CompositeDisposable();
    this.cache = require("./cache.js");

    this.disposables.add(
      atom.commands.add("atom-workspace", {
        "pulsar-updater:check-for-update": () => {
          this.checkForUpdates();
        },
        "pulsar-updater:clear-cache": () => {
          this.cache.empty("last-update-check");
          this.cache.empty(`installMethod.${atom.getVersion()}`);
        },
      })
    );

    // Setup an event listener for something after the editor has launched

    // Lets check for an update right away, likely following some config option
    if (atom.config.get("pulsar-updater.checkForUpdatesOnLaunch")) {
      this.checkForUpdates();
    }
  }

  deactivate() {
    this.disposables.dispose();
    superagent = null;
    findInstallMethod = null;
    this.cache = null;
  }

  async checkForUpdates() {
    let cachedUpdateCheck = this.cache.getCacheItem("last-update-check");

    // Null means that there is no previous check, or the last check expired
    let latestVersion = await this.newestRelease();

    let shouldUpdate = !atom.versionSatisfies(`>= ${latestVersion}`);

    if (
      cachedUpdateCheck?.latestVersion === latestVersion &&
      !cachedUpdateCheck?.shouldUpdate
    ) {
      // If the last version check has this exact version, and we are instructed not to update
      // then we will exit early, and not prompt the user for any update
      return;
    }

    if (shouldUpdate) {
      this.cache.setCacheItem("last-update-check", {
        latestVersion: latestVersion,
        shouldUpdate: shouldUpdate,
      });

      findInstallMethod ??= require("./find-install-method.js");

      let installMethod =
        this.cache.getCacheItem(`installMethod.${atom.getVersion()}`) ??
        (await findInstallMethod());

      this.cache.setCacheItem(
        `installMethod.${atom.getVersion()}`,
        installMethod
      );

      // Lets now trigger a notification to alert the user

      let objButtonForInstallMethod =
        this.getObjButtonForInstallMethod(installMethod);

      let notificationDetailText = this.getNotificationText(installMethod, latestVersion);

      // Now the notification text may return the special string of "DO_NOT_PROMPT"
      // If this text is seen, the notification is never shown
      if (notificationDetailText === "DO_NOT_PROMPT") {
        return;
      }

      const notification = atom.notifications.addInfo(
        "An update for Pulsar is available.",
        {
          detail: notificationDetailText,
          dismissable: true,
          buttons: [
            {
              text: "Dismiss this Version",
              onDidClick: () => {
                this.cache.setCacheItem("last-update-check", {
                  latestVersion: latestVersion,
                  shouldUpdate: false,
                });
                notification.dismiss();
              },
            },
            {
              text: "Dismiss until next launch",
              onDidClick: () => {
                // emptying the cache, will cause the next check to succeed
                this.cache.empty("last-update-check");
                notification.dismiss();
              },
            },
            // Below we optionally add a button for the install method. That may
            // open to a pulsar download URL, if available for installation method
            typeof objButtonForInstallMethod === "object" &&
              objButtonForInstallMethod,
          ],
        }
      );
    } // else don't update, rely on cache set above
  }

  async newestRelease() {
    superagent ??= require("superagent");

    let res = await superagent
      .get("https://api.github.com/repos/pulsar-edit/pulsar/releases")
      .set("Accept", "application/vnd.github+json")
      .set("User-Agent", "Pulsar.Pulsar-Updater");

    if (res.status !== 200) {
      // Lie and say it's something that will never update
      return "0.0.0";
    }

    // We can be fast and simply check if the top of the array is newer than our
    // current version. Since the return is ordered
    return res.body[0].tag_name;
  }

  getNotificationText(installMethod, latestVersion) {
    let returnText = `Pulsar ${latestVersion} is available.\n`;

    switch (installMethod.installMethod) {
      case "Developer Mode":
        returnText +=
          "Since you're in developer mode, Pulsy trusts you know how to update. :)";
        break;
      case "Safe Mode":
        // The text can be this special value, to abort the notification from being shown
        returnText +=
          "DO_NOT_PROMPT";
        break;
      case "Spec Mode":
        returnText +=
          "DO_NOT_PROMPT";
        break;
      case "Flatpak Installation":
        returnText += "Install the latest version by running `flatpak update`.";
        break;
      case "Deb-Get Installation":
        returnText +=
          "Install the latest version by running `sudo deb-get update`.";
        break;
      case "Nix Installation":
        // TODO find nix update command
        returnText += "Install the latest version via Nix.";
        break;
      case "Homebrew Installation":
        returnText +=
          "Install the latest version by running `brew upgrade pulsar`.";
        break;
      case "winget Installation":
        returnText +=
          "Install the latest version by running `winget upgrade pulsar`.";
        break;
      case "Chocolatey Installation":
        returnText +=
          "Install the latest version by running `choco upgrade pulsar`.";
        break;
      case "User Installation":
      case "Machine Installation":
      case "Portable Installation":
      case "Manual Installation":
      default:
        returnText +=
          "Download the latest version from the Pulsar Website or GitHub.";
        break;
    }

    return returnText;
  }

  getObjButtonForInstallMethod(installMethod) {
    let returnObj = null;

    const openWebGitHub = (e) => {
      e.preventDefault();
      shell ??= shell || require("electron").shell;
      let latestVersion = this.cache.getCacheItem("last-update-check")?.latestVersion;
      let tagSegment = latestVersion ? `tag/${latestVersion}` : "";
      shell.openExternal(`https://github.com/pulsar-edit/pulsar/releases/${tagSegment}`);
    };

    switch (installMethod.installMethod) {
      case "User Installation":
      case "Machine Installation":
      default:
        returnObj = {
          text: "Download from GitHub",
          onDidClick: openWebGitHub,
        };
        break;
    }

    return returnObj;
  }
}

module.exports = new PulsarUpdater();
