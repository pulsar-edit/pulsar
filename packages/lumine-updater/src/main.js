const { CompositeDisposable } = require("atom");

let superagent;
let findInstallMethod;

class LumineUpdater {
  activate() {
    this.disposables = new CompositeDisposable();
    this.cache = require("./cache.js");

    this.disposables.add(
      atom.commands.add("atom-workspace", {
        "lumine-updater:check-for-update": () => {
          this.checkForUpdates({ manual: true }).catch((error) =>
            console.warn("Lumine update check failed:", error),
          );
        },
        "lumine-updater:clear-cache": () => {
          this.cache.empty("last-update-check");
          this.cache.empty(`installMethod.${atom.getVersion()}`);
        },
      }),
    );

    if (atom.config.get("lumine-updater.checkForUpdatesOnLaunch")) {
      this.checkForUpdates().catch((error) => console.warn("Lumine update check failed:", error));
    }
  }

  deactivate() {
    this.disposables.dispose();
    this.cache = null;
  }

  async findNewestRelease() {
    superagent ??= require("superagent");

    let res;
    try {
      res = await superagent
        .get("https://api.github.com/repos/lumine-code/lumine/releases")
        .set("Accept", "application/vnd.github+json")
        .set("User-Agent", "Lumine.Lumine-Updater");
    } catch {
      // superagent rejects on network errors, timeouts, and non-2xx responses
      // (e.g. a 504 from GitHub). Treat any failure as "no update available"
      // rather than letting it surface as an unhandled rejection.
      return "0.0.0";
    }

    if (res.status !== 200) {
      // Lie and say it's something that will never update
      return "0.0.0";
    }

    // We get the results ordered by newest tag first, so we can just check the
    // first item. If the repo has no releases yet, the body is an empty array,
    // so fall back to the "never update" sentinel.
    if (!Array.isArray(res.body) || res.body.length === 0) {
      return "0.0.0";
    }

    return res.body[0].tag_name;
  }

  async checkForUpdates({ manual = false } = {}) {
    let cachedUpdateCheck = this.cache.getCacheItem("last-update-check");

    // Null means that there is no previous check, or the last check expired
    let latestVersion = await this.findNewestRelease();
    let shouldUpdate = !atom.versionSatisfies(`>= ${latestVersion}`);

    if (cachedUpdateCheck?.latestVersion === latestVersion && !cachedUpdateCheck?.shouldUpdate) {
      // The user has already been notified about this version and told us not
      // to notify them again until the next release.
      if (manual) {
        await this.notifyAboutUpdate(latestVersion);
      }
      return;
    }

    if (shouldUpdate) {
      await this.notifyAboutUpdate(latestVersion);
    } else {
      // This can be a no-op or something that generates an actual notification
      // based on how the update check was invoked.
      await this.notifyAboutCurrent(latestVersion, manual);
    }
  }

  notifyAboutCurrent(latestVersion, manual) {
    if (!manual) return;
    atom.notifications.addInfo("Lumine is already up to date.", { dismissable: true });
  }

  async notifyAboutUpdate(latestVersion) {
    this.cache.setCacheItem("last-update-check", {
      latestVersion: latestVersion,
      shouldUpdate: true,
    });

    findInstallMethod ??= require("./find-install-method.js");

    let installMethod =
      this.cache.getCacheItem(`installMethod.${atom.getVersion()}`) ?? (await findInstallMethod());

    this.cache.setCacheItem(`installMethod.${atom.getVersion()}`, installMethod);

    let objButtonForInstallMethod = this.getObjButtonForInstallMethod(installMethod);
    let notificationDetailText = this.getNotificationText(installMethod, latestVersion);

    // Notification text of `null` means that we shouldn't show a notification
    // after all.
    if (notificationDetailText === null) {
      return;
    }

    const notification = atom.notifications.addInfo("An update for Lumine is available.", {
      description: notificationDetailText,
      dismissable: true,
      buttons: [
        {
          text: "Dismiss this Version",
          onDidClick: () => {
            this.ignoreForThisVersion(latestVersion);
            notification.dismiss();
          },
        },
        {
          text: "Dismiss until next launch",
          onDidClick: () => {
            this.ignoreUntilNextLaunch();
            notification.dismiss();
          },
        },
        // Below we optionally add a button for the install method. That may
        // open to a Lumine download URL, if available for installation method
        typeof objButtonForInstallMethod === "object" && objButtonForInstallMethod,
      ],
    });
  }

  ignoreForThisVersion(version) {
    this.cache.setCacheItem("last-update-check", {
      latestVersion: version,
      shouldUpdate: false,
    });
  }

  ignoreUntilNextLaunch() {
    // emptying the cache, will cause the next check to succeed
    this.cache.empty("last-update-check");
  }

  getNotificationText(installMethod, latestVersion) {
    let returnText = `Lumine ${latestVersion} is available.\n`;

    switch (installMethod.installMethod) {
      case "Developer Mode":
        returnText += "Since you're in developer mode, Lumine trusts you know how to update.";
        break;
      case "Safe Mode":
        return null;
      case "Spec Mode":
        return null;
      case "Custom Release Channel":
        return null;
      case "Flatpak Installation":
        returnText += "Install the latest version by running `flatpak update`.";
        break;
      case "Deb-Get Installation":
        returnText +=
          "Install the latest version by running `deb-get update && deb-get install lumine`.";
        break;
      case "Nix Installation":
        // TODO find nix update command
        returnText += "Install the latest version via Nix.";
        break;
      case "Homebrew Installation":
        returnText += "Install the latest version by running `brew upgrade lumine`.";
        break;
      case "winget Installation":
        returnText += "Install the latest version by running `winget upgrade lumine`.";
        break;
      case "Chocolatey Installation":
        returnText += "Install the latest version by running `choco upgrade lumine`.";
        break;
      case "User Installation":
      case "Machine Installation":
      case "Portable Installation":
      case "Manual Installation":
      default:
        returnText += "Download the latest version from the Lumine website or GitHub.";
        break;
    }

    return returnText;
  }

  getObjButtonForInstallMethod(installMethod) {
    let returnObj = null;

    const openWebGitHub = (e) => {
      e.preventDefault();
      let latestVersion = this.cache.getCacheItem("last-update-check")?.latestVersion;
      let tagSegment = latestVersion ? `tag/${latestVersion}` : "";
      atom.openExternal(`https://github.com/lumine-code/lumine/releases/${tagSegment}`);
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

module.exports = new LumineUpdater();
