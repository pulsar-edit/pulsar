/** @babel */
/** @jsx etch.dom */

import { CompositeDisposable, Disposable } from "atom";
import etch from "etch";
import BadgeView from "./badge-view";
import fs from "fs";
import path from "path";
import semver from "semver";

import {
  ownerFromRepository,
  repoUrlFromRepository,
  repoReferenceFromRepository,
  packageOrigin,
  getInstalledPackageMetadata,
} from "./utils";

export default class PackageCard {
  constructor(pack, settingsView, packageManager, options = {}) {
    this.pack = pack;
    this.settingsView = settingsView;
    this.packageManager = packageManager;
    this.disposables = new CompositeDisposable();

    // It might be useful to either wrap this.pack in a class that has a
    // ::validate method, or add a method here. At the moment I think all cases
    // of malformed package metadata are handled here and in ::content but belt
    // and suspenders, you know
    this.client = this.packageManager.getClient();
    this.type = this.pack.theme ? "theme" : "package";
    this.name = this.pack.name;
    this.onSettingsView = options.onSettingsView;

    if (this.pack.latestVersion !== this.pack.version) {
      this.newVersion = this.pack.latestVersion;
    }

    if (this.pack.apmInstallSource && this.pack.apmInstallSource.type === "git") {
      if (this.pack.apmInstallSource.sha !== this.pack.latestSha) {
        this.newSha = this.pack.latestSha;
      }
    }

    this.adoptInstalledState();

    etch.initialize(this);

    this.handlePackageEvents();
    this.handleButtonEvents(options);
    this.loadCachedMetadata();
    this.addBadges();

    // themes have no status and cannot be dis/enabled
    if (this.type === "theme") {
      this.refs.statusIndicator.remove();
      this.refs.enablementButton.remove();
    }

    // Only strip the install/uninstall buttons for the genuine bundled package.
    // A community package that merely shares a bundled package's name keeps its
    // buttons so the conflict state can show a disabled Install with a reason.
    if (atom.packages.isBundledPackage(this.pack.name) && !this.installedOriginDiffers()) {
      this.refs.installButtonGroup.remove();
      this.refs.uninstallButton.remove();
    }

    if (!this.newVersion && !this.newSha) {
      this.refs.updateButtonGroup.style.display = "none";
    }

    this.hasCompatibleVersion = true;
    this.updateInterfaceState();
  }

  render() {
    // Before install, a Git card's `name` is the raw source (e.g.
    // "owner/repo@1.0.0"), so fall back to the repository's project name for a
    // clean label. Once installed we know the real package.json name, which can
    // differ from the repository name (repo "pulsar-invert-colors" ships package
    // "invert-colors"), so prefer it.
    const knowsRealName = this.pack.apmInstallSource != null || this.isInstalled();
    const displayName =
      (this.pack.gitUrlInfo && !knowsRealName ? this.pack.gitUrlInfo.project : this.pack.name) ||
      "";
    const owner = ownerFromRepository(this.pack.repository);
    const repoReference = repoReferenceFromRepository(this.pack.repository);
    const description = this.pack.description || "";
    const cardClasses = `package-card col-lg-8${
      this.pack.source === "pulsar" ? " pulsar-source" : ""
    }`;

    return (
      <div className={cardClasses}>
        <div ref="statsContainer" className="stats pull-right">
          <span ref="packageSha" className="stats-item" style={{ display: "none" }}>
            <span className="icon icon-git-branch" />
            <span ref="shaValue" className="value" />
          </span>
        </div>

        <div className="body">
          <h4 className="card-name">
            <a className="package-name" ref="packageName">
              {displayName}
            </a>
            <span className="package-version">
              <span ref="versionValue" className="value">
                {this.pack.version == null ? "" : String(this.pack.version)}
              </span>
            </span>
            {repoReference ? (
              <a ref="repoLink" className="package-repo">
                {repoReference}
              </a>
            ) : null}
          </h4>
          <span ref="packageDescription" className="package-description">
            {description}
          </span>
          <div ref="packageMessage" className="package-message" />
        </div>

        <div className="meta">
          <div ref="metaUserContainer" className="meta-user">
            <a ref="avatarLink">
              {/* A transparent gif so there is no "broken border" */}
              <img
                ref="avatar"
                className="avatar"
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              />
            </a>
            <a ref="loginLink" className="author">
              {owner}
            </a>
          </div>
          <div className="meta-controls">
            <div className="btn-toolbar">
              <span ref="badges" className="package-badges"></span>
              <div ref="updateButtonGroup" className="btn-group">
                <button
                  type="button"
                  className="btn btn-info icon icon-cloud-download install-button"
                  ref="updateButton"
                >
                  Update
                </button>
              </div>
              <div ref="installButtonGroup" className="btn-group">
                <button
                  type="button"
                  className="btn btn-info icon icon-cloud-download install-button"
                  ref="installButton"
                >
                  Install
                </button>
                <button
                  type="button"
                  className="btn btn-warning icon icon-sync replace-button"
                  ref="replaceButton"
                  style={{ display: "none" }}
                >
                  Replace
                </button>
              </div>
              <div ref="packageActionButtonGroup" className="btn-group">
                <button type="button" className="btn icon icon-gear settings" ref="settingsButton">
                  Settings
                </button>
                <button
                  type="button"
                  className="btn icon icon-trashcan uninstall-button"
                  ref="uninstallButton"
                >
                  Uninstall
                </button>
                <button
                  type="button"
                  className="btn icon icon-playback-pause enablement"
                  ref="enablementButton"
                >
                  <span className="disable-text">Disable</span>
                </button>
                <button
                  type="button"
                  className="btn status-indicator"
                  tabIndex="-1"
                  ref="statusIndicator"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  locateCompatiblePackageVersion(callback) {
    this.packageManager.loadCompatiblePackageVersion(this.pack.name, (err, pack) => {
      if (err != null) {
        console.error(err);
      }

      const packageVersion = pack.version;

      // A compatible version exist, we activate the install button and
      // set this.installablePack so that the install action installs the
      // compatible version of the package.
      if (packageVersion) {
        this.refs.versionValue.textContent = packageVersion;
        if (packageVersion !== this.pack.version) {
          this.refs.versionValue.classList.add("text-warning");
          this.compatibleVersionNote = `Version ${packageVersion} is the latest that is compatible with your Lumine version, not the newest available.`;
        } else {
          this.compatibleVersionNote = null;
        }

        this.installablePack = pack;
        this.hasCompatibleVersion = true;
      } else {
        this.hasCompatibleVersion = false;
        this.compatibleVersionNote = null;
        this.refs.versionValue.classList.add("text-error");
        console.error(
          `No available version compatible with the installed Lumine version: ${atom.getVersion()}`,
        );
      }

      callback();
    });
  }

  handleButtonEvents(options) {
    if (options && options.onSettingsView) {
      this.refs.settingsButton.style.display = "none";
    } else {
      const clickHandler = (event) => {
        event.stopPropagation();
        // The installed package merely shares its name — don't link to it.
        if (this.originConflict) return;
        this.settingsView.showPanel(this.pack.name, {
          back: options ? options.back : null,
          pack: this.pack,
        });
      };

      this.element.addEventListener("click", clickHandler);
      this.disposables.add(
        new Disposable(() => {
          this.element.removeEventListener("click", clickHandler);
        }),
      );

      this.refs.settingsButton.addEventListener("click", clickHandler);
      this.disposables.add(
        new Disposable(() => {
          this.refs.settingsButton.removeEventListener("click", clickHandler);
        }),
      );
    }

    const installButtonClickHandler = (event) => {
      event.stopPropagation();
      this.install();
    };
    this.refs.installButton.addEventListener("click", installButtonClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.installButton.removeEventListener("click", installButtonClickHandler);
      }),
    );

    const replaceButtonClickHandler = (event) => {
      event.stopPropagation();
      this.replace();
    };
    this.refs.replaceButton.addEventListener("click", replaceButtonClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.replaceButton.removeEventListener("click", replaceButtonClickHandler);
      }),
    );

    const uninstallButtonClickHandler = (event) => {
      event.stopPropagation();
      this.uninstall();
    };
    this.refs.uninstallButton.addEventListener("click", uninstallButtonClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.uninstallButton.removeEventListener("click", uninstallButtonClickHandler);
      }),
    );

    const updateButtonClickHandler = (event) => {
      event.stopPropagation();

      // Capture the version labels before updating: the "updated" event clears
      // newVersion/newSha, and a tag-tracked git update has no latestSha, so
      // branch on which kind of update this is rather than assuming a sha.
      let oldVersion = "";
      let newVersion = "";
      if (this.newSha) {
        const installedSha = this.pack.apmInstallSource && this.pack.apmInstallSource.sha;
        oldVersion = installedSha ? installedSha.substr(0, 8) : "";
        newVersion = this.newSha.substr(0, 8);
      } else if (this.newVersion) {
        oldVersion =
          (this.pack.apmInstallSource && this.pack.apmInstallSource.version) ||
          this.pack.version ||
          "";
        newVersion = this.newVersion;
      }
      const detail = oldVersion && newVersion ? `${oldVersion} -> ${newVersion}` : "";

      this.update().then(() => {
        const notification = atom.notifications.addSuccess(
          `Restart Lumine to complete the update of \`${this.pack.name}\`.`,
          {
            dismissable: true,
            buttons: [
              {
                text: "Restart now",
                onDidClick() {
                  return atom.restartApplication();
                },
              },
              {
                text: "I'll do it later",
                onDidClick() {
                  notification.dismiss();
                },
              },
            ],
            detail,
          },
        );
      });
    };
    this.refs.updateButton.addEventListener("click", updateButtonClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.updateButton.removeEventListener("click", updateButtonClickHandler);
      }),
    );

    const packageNameClickHandler = (event) => {
      event.stopPropagation();
      const repoUrl = repoUrlFromRepository(this.pack.repository);
      if (repoUrl) {
        atom.openExternal(repoUrl);
      }
    };
    if (this.refs.repoLink) {
      this.refs.repoLink.addEventListener("click", packageNameClickHandler);
      this.disposables.add(
        new Disposable(() => {
          this.refs.repoLink.removeEventListener("click", packageNameClickHandler);
        }),
      );
    }
    this.refs.packageName.addEventListener("click", packageNameClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.packageName.removeEventListener("click", packageNameClickHandler);
      }),
    );

    const packageAuthorClickHandler = (event) => {
      event.stopPropagation();
      const owner = ownerFromRepository(this.pack.repository);
      if (owner) {
        atom.openExternal(`https://github.com/${owner}`);
      }
    };
    this.refs.loginLink.addEventListener("click", packageAuthorClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.loginLink.removeEventListener("click", packageAuthorClickHandler);
      }),
    );
    this.refs.avatarLink.addEventListener("click", packageAuthorClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.avatarLink.removeEventListener("click", packageAuthorClickHandler);
      }),
    );

    const enablementButtonClickHandler = (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (this.isDisabled()) {
        atom.packages.enablePackage(this.pack.name);
      } else {
        atom.packages.disablePackage(this.pack.name);
      }
    };
    this.refs.enablementButton.addEventListener("click", enablementButtonClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.enablementButton.removeEventListener("click", enablementButtonClickHandler);
      }),
    );

    const packageMessageClickHandler = (event) => {
      const target = event.target.closest("a");
      if (target) {
        event.stopPropagation();
        event.preventDefault();
        if (target.href && target.href.startsWith("atom:")) {
          atom.workspace.open(target.href);
        }
      }
    };
    this.refs.packageMessage.addEventListener("click", packageMessageClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.packageMessage.removeEventListener("click", packageMessageClickHandler);
      }),
    );
  }

  destroy() {
    this.destroyed = true;
    if (this.installNoteTooltip) {
      this.installNoteTooltip.dispose();
      this.installNoteTooltip = null;
    }
    if (this.badgeViews) {
      for (const badgeView of this.badgeViews) badgeView.destroy();
      this.badgeViews = [];
    }
    this.disposables.dispose();
    return etch.destroy(this);
  }

  loadCachedMetadata() {
    if (repoUrlFromRepository(this.pack.repository) === atom.branding.urlCoreRepo) {
      // Don't hit the web for our bundled packages. Just use the local image.
      let avatarPath = path.join(process.resourcesPath, "lumine.png");
      if (!fs.existsSync(avatarPath)) {
        avatarPath = path.join(atom.getLoadSettings().resourcePath, "resources", "lumine.png");
      }
      this.refs.avatar.src = `file://${avatarPath}`;
    } else {
      this.client.avatar(ownerFromRepository(this.pack.repository), (err, avatarPath) => {
        if (!err && avatarPath) {
          this.refs.avatar.src = `file://${avatarPath}`;
        }
      });
    }
  }

  updateInterfaceState() {
    this.refs.versionValue.textContent =
      (this.installablePack ? this.installablePack.version : null) || this.pack.version;

    // The Git ref indicator describes what is installed, so only show it while
    // the package is actually installed — not on an Install card or after an
    // uninstall.
    const gitRef = this.isInstalled() ? this.gitInstallRef() : null;
    if (gitRef) {
      this.refs.shaValue.textContent = gitRef;
      this.refs.packageSha.style.display = "";
    } else {
      this.refs.packageSha.style.display = "none";
    }

    this.updateSettingsState();
    this.updateInstalledState();
    this.updateDisabledState();
    this.updateDirectoryNameWarning();
  }

  // Warns when a package's install directory does not match its package.json
  // "name". The directory IS the install slot, so a mismatch silently breaks the
  // package's require path, command prefix, config namespace, and activation.
  // This happens with packages placed or linked by hand — e.g. a repository
  // cloned into a folder named after the repo rather than the package.
  updateDirectoryNameWarning() {
    const message = this.refs.packageMessage;
    const dirName = this.pack.directoryName;
    if (dirName && this.pack.name && dirName !== this.pack.name) {
      message.classList.add("text-error");
      message.textContent =
        `This package is installed in a directory named “${dirName}”, but its ` +
        `package.json name is “${this.pack.name}”. Rename the directory to ` +
        `“${this.pack.name}” so its commands, settings, and activation work.`;
      message.style.display = "";
    } else if (message.classList.contains("text-error")) {
      message.classList.remove("text-error");
      message.textContent = "";
      message.style.display = "none";
    }
  }

  // The Git ref worth showing beside the version: a branch name or short commit
  // for branch/commit installs. Tag and latest-tag installs return null because
  // the version already reflects the installed tag.
  gitInstallRef() {
    const install = this.pack.apmInstallSource;
    if (!install || install.type !== "git") return null;
    const selector = install.selector;
    if (selector) {
      if (selector.type === "tag" || selector.type === "latest") return null;
      if (selector.type === "branch") return selector.value;
      if (selector.type === "commit") return (selector.value || install.sha || "").substr(0, 8);
    }
    // Legacy installs without a selector fall back to the commit sha.
    return install.sha ? install.sha.substr(0, 8) : null;
  }

  updateSettingsState() {
    if (this.hasSettings() && !this.onSettingsView) {
      this.refs.settingsButton.style.display = "";
    } else {
      this.refs.settingsButton.style.display = "none";
    }
  }

  addBadges() {
    this.badgeViews = [];
    if (Array.isArray(this.pack.badges)) {
      // This safety check is especially needed, as any cached package
      // data will not contain the badges field
      for (const badge of this.pack.badges) {
        const badgeView = new BadgeView(badge);
        this.badgeViews.push(badgeView);
        this.refs.badges.appendChild(badgeView.element);
      }
    }
  }

  // Section: disabled state updates

  updateDisabledState() {
    if (this.isDisabled()) {
      this.displayDisabledState();
    } else if (this.element.classList.contains("disabled")) {
      this.displayEnabledState();
    }
  }

  displayEnabledState() {
    this.element.classList.remove("disabled");
    if (this.type === "theme") {
      this.refs.enablementButton.style.display = "none";
    }
    this.refs.enablementButton.querySelector(".disable-text").textContent = "Disable";
    this.refs.enablementButton.classList.add("icon-playback-pause");
    this.refs.enablementButton.classList.remove("icon-playback-play");
    this.refs.statusIndicator.classList.remove("is-disabled");
  }

  displayDisabledState() {
    this.element.classList.add("disabled");
    this.refs.enablementButton.querySelector(".disable-text").textContent = "Enable";
    this.refs.enablementButton.classList.add("icon-playback-play");
    this.refs.enablementButton.classList.remove("icon-playback-pause");
    this.refs.statusIndicator.classList.add("is-disabled");
    this.refs.enablementButton.disabled = false;
  }

  // Section: installed state updates

  updateInstalledState() {
    if (this.isInstalled()) {
      if (this.installedOriginDiffers()) {
        this.displayConflictingOriginState();
        return;
      }
      this.clearConflictingOriginState();
      this.displayInstalledState();
    } else {
      this.clearConflictingOriginState();
      this.displayNotInstalledState();
    }
  }

  // Annotates the Install button with a hover note explaining a caveat. When
  // `blocking` is true the button is also shown disabled (install is not
  // possible); otherwise it stays usable and the note is purely informational.
  setInstallNote(message, blocking) {
    this.installBlocked = !!blocking;
    this.refs.installButton.classList.toggle("disabled", !!blocking);
    if (this.installNote !== message) {
      if (this.installNoteTooltip) {
        this.installNoteTooltip.dispose();
        this.installNoteTooltip = null;
      }
      if (message) {
        this.installNoteTooltip = atom.tooltips.add(this.refs.installButtonGroup, {
          title: message,
        });
      }
      this.installNote = message;
    }
  }

  clearInstallNote() {
    this.installBlocked = false;
    this.installNote = null;
    this.refs.installButton.classList.remove("disabled");
    if (this.installNoteTooltip) {
      this.installNoteTooltip.dispose();
      this.installNoteTooltip = null;
    }
  }

  incompatibleMessage() {
    const engine = this.pack.engines && this.pack.engines.atom ? this.pack.engines.atom : "*";
    return `No version of this package is compatible with your Lumine version. It requires ${engine}.`;
  }

  // The installed package merely shares its name with this card's package.
  // Keep Install visible but disabled — installing would overwrite the
  // unrelated package — and explain why on hover. Uninstall/settings stay
  // hidden so they can't act on the unrelated package.
  displayConflictingOriginState() {
    this.originConflict = true;
    this.refs.updateButtonGroup.style.display = "none";
    this.refs.packageActionButtonGroup.style.display = "none";
    this.refs.installButtonGroup.style.display = "";

    if (atom.packages.isBundledPackage(this.pack.name)) {
      // The name belongs to a bundled package, which cannot be uninstalled — so
      // Replace is impossible. Keep a disabled Install with the reason.
      this.refs.installButton.style.display = "";
      this.refs.replaceButton.style.display = "none";
      this.setInstallNote(
        `“${this.pack.name}” is a bundled Lumine package and cannot be replaced.`,
        true,
      );
      return;
    }

    // A plain Install would overwrite the unrelated package, so offer only
    // Replace; the reason is on hover.
    this.refs.installButton.style.display = "none";
    this.refs.replaceButton.style.display = "";
    this.setInstallNote(
      `A different package named “${this.pack.name}” is already installed. Replace uninstalls it and installs this one.`,
      true,
    );
  }

  clearConflictingOriginState() {
    if (!this.originConflict) return;
    this.originConflict = false;
    this.clearInstallNote();
  }

  // When the card's package is already installed from the same origin, adopt
  // the installed package's install source and offer an update if this card
  // describes a newer version.
  adoptInstalledState() {
    if (!this.pack.version || !this.pack.repository || !this.isInstalled()) return;
    const metadata = this.getInstalledMetadata();
    if (!metadata || this.installedOriginDiffers()) return;
    if (metadata.apmInstallSource && !this.pack.apmInstallSource) {
      this.pack.apmInstallSource = metadata.apmInstallSource;
    }
    if (
      semver.valid(metadata.version) &&
      semver.valid(this.pack.version) &&
      semver.gt(this.pack.version, metadata.version)
    ) {
      this.newVersion = this.pack.version;
    }
  }

  getInstalledMetadata() {
    return getInstalledPackageMetadata(this.pack.name);
  }

  // True when this card's package shares its NAME with an installed package but
  // comes from a different ORIGIN (source path) — i.e. installing this one would
  // collide with an unrelated same-named package that is already installed.
  installedOriginDiffers() {
    // A pack with a local install path was read from the install slot itself,
    // so this card IS the installed package — never a same-name collision.
    if (this.pack.path) return false;
    const cardOrigin = packageOrigin(this.pack);
    if (!cardOrigin) return false;
    const installedOrigin = packageOrigin(this.getInstalledMetadata());
    return !!installedOrigin && installedOrigin !== cardOrigin;
  }

  displayInstalledState() {
    this.clearInstallNote();
    if (this.newVersion || this.newSha) {
      this.refs.updateButtonGroup.style.display = "";
      if (this.newVersion) {
        this.refs.updateButton.textContent = `Update to ${this.newVersion}`;
      } else if (this.newSha) {
        this.refs.updateButton.textContent = `Update to ${this.newSha.substr(0, 8)}`;
      }
    } else {
      this.refs.updateButtonGroup.style.display = "none";
    }

    this.refs.installButtonGroup.style.display = "none";
    this.refs.packageActionButtonGroup.style.display = "";
    this.refs.uninstallButton.style.display = "";
  }

  displayNotInstalledState() {
    this.refs.uninstallButton.style.display = "none";
    const atomVersion = this.packageManager.normalizeVersion(atom.getVersion());
    if (!this.packageManager.satisfiesVersion(atomVersion, this.pack)) {
      this.hasCompatibleVersion = false;
      this.setNotInstalledStateButtons();
      this.locateCompatiblePackageVersion(() => {
        this.setNotInstalledStateButtons();
      });
    } else {
      this.setNotInstalledStateButtons();
    }
  }

  setNotInstalledStateButtons() {
    // Replace only applies in the conflict state; a plain not-installed card
    // shows a normal Install and no Replace.
    this.refs.replaceButton.style.display = "none";
    this.refs.installButton.style.display = "";
    if (!this.hasCompatibleVersion) {
      // No compatible version: show a disabled Install with the reason on hover.
      this.setInstallNote(this.incompatibleMessage(), true);
      this.refs.installButtonGroup.style.display = "";
      this.refs.updateButtonGroup.style.display = "none";
    } else if (this.newVersion || this.newSha) {
      this.clearInstallNote();
      this.refs.updateButtonGroup.style.display = "";
      this.refs.installButtonGroup.style.display = "none";
    } else {
      // Usable Install, optionally with an informational compatibility note.
      this.setInstallNote(this.compatibleVersionNote || null, false);
      this.refs.updateButtonGroup.style.display = "none";
      this.refs.installButtonGroup.style.display = "";
    }
    this.refs.packageActionButtonGroup.style.display = "none";
  }

  displayGitPackageInstallInformation() {
    this.refs.metaUserContainer.remove();
    this.refs.statsContainer.remove();
    const { gitUrlInfo } = this.pack;
    if (!gitUrlInfo) {
      this.refs.packageDescription.textContent = this.pack.repository || this.pack.name;
    } else if (gitUrlInfo.default === "shortcut") {
      this.refs.packageDescription.textContent = gitUrlInfo.https();
    } else {
      this.refs.packageDescription.textContent = gitUrlInfo.toString();
    }
    this.refs.installButton.classList.remove("icon-cloud-download");
    this.refs.installButton.classList.add("icon-git-commit");
    this.refs.updateButton.classList.remove("icon-cloud-download");
    this.refs.updateButton.classList.add("icon-git-commit");
  }

  displayAvailableUpdate(newVersion) {
    this.newVersion = newVersion;
    this.updateInterfaceState();
  }

  handlePackageEvents() {
    this.disposables.add(
      atom.packages.onDidDeactivatePackage((pack) => {
        if (pack.name === this.pack.name) {
          this.updateDisabledState();
        }
      }),
    );

    this.disposables.add(
      atom.packages.onDidActivatePackage((pack) => {
        if (pack.name === this.pack.name) {
          this.updateDisabledState();
        }
      }),
    );

    this.disposables.add(
      atom.config.onDidChange("core.disabledPackages", () => {
        this.updateDisabledState();
      }),
    );

    this.subscribeToPackageEvent("package-installing theme-installing", (pack) => {
      if (this.isSameOriginEvent(pack)) {
        this.updateInterfaceState();
        this.refs.installButton.disabled = true;
        this.refs.installButton.classList.add("is-installing");
      } else {
        // A different package with the same name is being installed; this one
        // can't be installed until that finishes, so show it disabled — not the
        // "installing" spinner.
        this.setInstallNote(`Installing “${pack.name}”…`, true);
      }
    });

    this.subscribeToPackageEvent("package-updating theme-updating", (pack) => {
      if (!this.isSameOriginEvent(pack)) return;
      this.updateInterfaceState();
      this.refs.updateButton.disabled = true;
      this.refs.updateButton.classList.add("is-installing");
    });

    this.subscribeToPackageEvent("package-uninstalling theme-uninstalling", (pack) => {
      if (!this.isSameOriginEvent(pack)) return;
      this.updateInterfaceState();
      this.refs.enablementButton.disabled = true;
      this.refs.uninstallButton.disabled = true;
      this.refs.uninstallButton.classList.add("is-uninstalling");
    });

    this.subscribeToPackageEvent(
      "package-installed package-install-failed theme-installed theme-install-failed",
      (pack) => {
        // A different same-named install finished: re-evaluate — this card is
        // now either in conflict (it succeeded) or installable again (it failed).
        if (!this.isSameOriginEvent(pack)) {
          this.updateInterfaceState();
          return;
        }
        const loadedPack = atom.packages.getLoadedPackage(this.pack.name);
        const version = loadedPack && loadedPack.metadata ? loadedPack.metadata.version : null;
        if (version) {
          this.pack.version = version;
        }
        this.refs.installButton.disabled = false;
        this.refs.installButton.classList.remove("is-installing");
        this.updateInterfaceState();
      },
    );

    this.subscribeToPackageEvent("package-updated theme-updated", (pack) => {
      if (!this.isSameOriginEvent(pack)) {
        this.updateInterfaceState();
        return;
      }
      const loadedPack = atom.packages.getLoadedPackage(this.pack.name);
      const metadata = loadedPack ? loadedPack.metadata : null;
      if (metadata && metadata.version) {
        this.pack.version = metadata.version;
      }

      if (metadata && metadata.apmInstallSource) {
        this.pack.apmInstallSource = metadata.apmInstallSource;
      }

      this.newVersion = null;
      this.newSha = null;
      this.refs.updateButton.disabled = false;
      this.refs.updateButton.classList.remove("is-installing");
      this.updateInterfaceState();
    });

    this.subscribeToPackageEvent("package-update-failed theme-update-failed", (pack) => {
      if (!this.isSameOriginEvent(pack)) return;
      this.refs.updateButton.disabled = false;
      this.refs.updateButton.classList.remove("is-installing");
      this.updateInterfaceState();
    });

    this.subscribeToPackageEvent(
      "package-uninstalled package-uninstall-failed theme-uninstalled theme-uninstall-failed",
      (pack) => {
        if (!this.isSameOriginEvent(pack)) {
          this.updateInterfaceState();
          return;
        }
        this.newVersion = null;
        this.newSha = null;
        this.refs.enablementButton.disabled = false;
        this.refs.uninstallButton.disabled = false;
        this.refs.uninstallButton.classList.remove("is-uninstalling");
        this.updateInterfaceState();
      },
    );
  }

  // The event's pack shares this card's NAME (subscribeToPackageEvent filters by
  // name). Returns whether it is also the SAME package by origin — i.e. the
  // event is about this card's package rather than a different same-named one.
  isSameOriginEvent(pack) {
    const cardOrigin = packageOrigin(this.pack);
    const eventOrigin = packageOrigin(pack);
    if (!cardOrigin || !eventOrigin) return true;
    return cardOrigin === eventOrigin;
  }

  isInstalled() {
    return this.packageManager.isPackageInstalled(this.pack.name);
  }

  isDisabled() {
    return atom.packages.isPackageDisabled(this.pack.name);
  }

  hasSettings() {
    return this.packageManager.packageHasSettings(this.pack.name);
  }

  subscribeToPackageEvent(event, callback) {
    this.disposables.add(
      this.packageManager.on(event, ({ pack, error }) => {
        if (pack.pack != null) {
          pack = pack.pack;
        }

        const packageName = pack.name;
        if (packageName === this.pack.name) {
          callback(pack, error);
        }
      }),
    );
  }

  /*
  Section: Methods that should be on a Package model
  */

  install() {
    // Install is blocked (name conflict or no compatible version); the button
    // is shown disabled with a hover note explaining why.
    if (this.installBlocked) {
      return;
    }
    this.packageManager.install(
      this.installablePack != null ? this.installablePack : this.pack,
      (error) => {
        if (error != null) {
          console.error(
            `Installing ${this.type} ${this.pack.name} failed`,
            error.stack != null ? error.stack : error,
            error.stderr,
          );
        } else {
          // if a package was disabled before installing it, re-enable it
          if (this.isDisabled()) {
            atom.packages.enablePackage(this.pack.name);
          }
        }
      },
    );
  }

  // Conflict-state action: the install slot (name) is taken by a different
  // package, so uninstall that one and install this one in a single step. The
  // reused name means this package inherits the existing `name.*` settings and
  // `name:` keybindings.
  replace() {
    const button = this.refs.replaceButton;
    if (button.disabled) return;
    const installedMetadata = this.getInstalledMetadata();
    const occupant = {
      name: this.pack.name,
      theme: installedMetadata ? installedMetadata.theme : this.pack.theme,
    };
    button.disabled = true;
    button.classList.add("is-installing");
    this.packageManager.uninstall(occupant, (uninstallError) => {
      if (uninstallError != null) {
        button.disabled = false;
        button.classList.remove("is-installing");
        console.error(
          `Uninstalling ${this.type} ${this.pack.name} for replacement failed`,
          uninstallError.stack != null ? uninstallError.stack : uninstallError,
          uninstallError.stderr,
        );
        return;
      }
      // The slot is free now; install this package. The install/uninstall events
      // re-render the card, so the Replace button is superseded automatically.
      this.originConflict = false;
      this.installBlocked = false;
      this.packageManager.install(
        this.installablePack != null ? this.installablePack : this.pack,
        (installError) => {
          if (installError != null) {
            console.error(
              `Installing ${this.type} ${this.pack.name} failed`,
              installError.stack != null ? installError.stack : installError,
              installError.stderr,
            );
          }
        },
      );
    });
  }

  update() {
    if (!this.newVersion && !this.newSha) {
      return Promise.resolve();
    }

    const pack = this.installablePack != null ? this.installablePack : this.pack;
    const version = this.newVersion ? `v${this.newVersion}` : `#${this.newSha.substr(0, 8)}`;
    return new Promise((resolve, reject) => {
      this.packageManager.update(pack, this.newVersion, (error) => {
        if (error != null) {
          atom.assert(false, "Package update failed", (assertionError) => {
            assertionError.metadata = {
              type: this.type,
              name: pack.name,
              version,
              errorMessage: error.message,
              errorStack: error.stack,
              errorStderr: error.stderr,
            };
          });
          console.error(
            `Updating ${this.type} ${pack.name} to ${version} failed:\n`,
            error,
            error.stderr != null ? error.stderr : "",
          );
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  uninstall() {
    this.packageManager.uninstall(this.pack, (error) => {
      if (error != null) {
        console.error(
          `Uninstalling ${this.type} ${this.pack.name} failed`,
          error.stack != null ? error.stack : error,
          error.stderr,
        );
      }
    });
  }
}
