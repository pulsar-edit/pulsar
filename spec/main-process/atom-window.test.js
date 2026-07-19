/* globals assert */

const path = require("path");
const fs = require("@lumine-code/fs-plus");
const url = require("url");
const { EventEmitter } = require("events");
const temp = require("temp").track();
const sandbox = require("sinon").createSandbox();
const dedent = require("dedent");
const { BrowserWindow, webContents } = require("electron");

const AtomWindow = require("../../src/atom-window");
const { emitterEventPromise } = require("../helpers/async-spec-helpers");

describe("AtomWindow", function () {
  let sinon, app, service;

  beforeEach(function () {
    sinon = sandbox;
    app = new StubApplication(sinon);
    service = new StubRecoveryService(sinon);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe("creating a real window", function () {
    let resourcePath, windowInitializationScript, atomHome;
    let original;

    this.timeout(10 * 1000);

    beforeEach(async function () {
      original = {
        ATOM_HOME: process.env.ATOM_HOME,
        ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT:
          process.env.ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT,
      };

      resourcePath = path.resolve(__dirname, "../..");

      windowInitializationScript = require.resolve(
        path.join(resourcePath, "src/initialize-application-window"),
      );

      atomHome = await new Promise((resolve, reject) => {
        temp.mkdir("launch-", (err, rootPath) => {
          if (err) {
            reject(err);
          } else {
            resolve(rootPath);
          }
        });
      });

      await new Promise((resolve, reject) => {
        const config = dedent`
          '*':
            about:
              showOnStartup: false
        `;

        fs.writeFile(path.join(atomHome, "config.cson"), config, { encoding: "utf8" }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      process.env.ATOM_HOME = atomHome;
      process.env.ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT = "true";
    });

    afterEach(async function () {
      process.env.ATOM_HOME = original.ATOM_HOME;
      process.env.ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT =
        original.ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT;
    });

    it("creates a real, properly configured BrowserWindow", async function () {
      const w = new AtomWindow(app, service, {
        resourcePath,
        windowInitializationScript,
        headless: true,
        extra: "extra-load-setting",
      });
      const { browserWindow } = w;

      assert.isFalse(browserWindow.isVisible());
      assert.isTrue(browserWindow.getTitle().startsWith("Lumine"));

      const settings = JSON.parse(browserWindow.loadSettingsJSON);
      assert.strictEqual(settings.userSettings, "stub-config");
      assert.strictEqual(settings.extra, "extra-load-setting");
      assert.strictEqual(settings.resourcePath, resourcePath);
      assert.strictEqual(settings.atomHome, atomHome);
      assert.isFalse(settings.devMode);
      assert.isFalse(settings.safeMode);
      assert.isFalse(settings.clearWindowState);

      await emitterEventPromise(browserWindow, "ready-to-show");

      assert.strictEqual(
        browserWindow.webContents.getURL(),
        url.format({
          protocol: "file",
          pathname: `${resourcePath.replace(/\\/g, "/")}/static/index.html`,
          slashes: true,
        }),
      );
    });
  });

  describe("launch behavior", function () {
    it("sets the Lumine window icon for source launches on Windows", function () {
      const { browserWindow } = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });

      if (process.platform === "win32" && process.defaultApp) {
        assert.isDefined(browserWindow.options.icon);
        assert.isFalse(browserWindow.options.icon.isEmpty());
      }
    });

    it('sets frame to "false" for a hidden title bar on non-spec windows', function () {
      app.config["core.titleBar"] = "hidden";

      const { browserWindow: w0 } = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      assert.isFalse(w0.options.frame);

      const { browserWindow: w1 } = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        isSpec: true,
      });
      assert.isUndefined(w1.options.frame);
    });

    it("opens initial locations", async function () {
      const locationsToOpen = [
        {
          pathToOpen: "file.txt",
          initialLine: 1,
          initialColumn: 2,
          isDirectory: false,
          hasWaitSession: false,
        },
        {
          pathToOpen: "/directory",
          initialLine: null,
          initialColumn: null,
          isDirectory: true,
          hasWaitSession: false,
        },
      ];

      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });
      assert.deepEqual(w.projectRoots, ["/directory"]);

      const loadPromise = emitterEventPromise(w, "window:loaded");
      w.browserWindow.emit("window:loaded");
      await loadPromise;

      assert.deepEqual(w.browserWindow.sent, [["message", "open-locations", locationsToOpen]]);
    });

    it("does not open an initial null location", async function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen: [{ pathToOpen: null }],
      });

      const loadPromise = emitterEventPromise(w, "window:loaded");
      w.browserWindow.emit("window:loaded");
      await loadPromise;

      assert.lengthOf(w.browserWindow.sent, 0);
    });

    it("does not open initial locations in spec mode", async function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen: [{ pathToOpen: "file.txt" }],
        isSpec: true,
      });

      const loadPromise = emitterEventPromise(w, "window:loaded");
      w.browserWindow.emit("window:loaded");
      await loadPromise;

      assert.lengthOf(w.browserWindow.sent, 0);
    });

    it("focuses the webView for specs", function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        isSpec: true,
      });

      assert.isTrue(w.browserWindow.behavior.focusOnWebView);
    });
  });

  describe("sendToRenderer", function () {
    it("relays window state events to the renderer", function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });

      w.browserWindow.emit("focus");
      w.browserWindow.emit("blur");

      assert.deepEqual(w.browserWindow.sent, [["did-focus-window"], ["did-blur-window"]]);
    });

    it("drops messages once the window or its renderer is gone", function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      w.browserWindow.destroy();

      w.browserWindow.emit("focus");
      w.browserWindow.emit("blur");
      w.sendMessage("some-message");

      assert.lengthOf(w.browserWindow.sent, 0);
    });

    it("swallows a send to a frame disposed after the destroyed checks", function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      w.browserWindow.webContents.send = () => {
        throw new Error("Render frame was disposed before WebFrameMain could be accessed");
      };

      assert.doesNotThrow(() => w.browserWindow.emit("blur"));
    });
  });

  describe("reload", function () {
    it("prepares to unload without waiting for package deactivation", async function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      w.prepareToUnload = sinon.stub().resolves(true);

      w.reload();
      await Promise.resolve();

      assert.isTrue(w.prepareToUnload.calledWith({ deactivatePackages: false }));
      assert.isTrue(w.browserWindow.behavior.reloaded);
    });
  });

  describe("isWebViewFocused", function () {
    it("returns false when no web contents are focused", function () {
      sinon.stub(webContents, "getFocusedWebContents").returns(null);

      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });

      assert.isFalse(w.isWebViewFocused());
    });

    it("returns true when this window's web contents are focused", function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      sinon.stub(webContents, "getFocusedWebContents").returns(w.browserWindow.webContents);

      assert.isTrue(w.isWebViewFocused());
    });

    it("returns true when a webview owned by this window is focused", function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      const focusedWebContents = {
        hostWebContents: w.browserWindow.webContents,
      };
      sinon.stub(webContents, "getFocusedWebContents").returns(focusedWebContents);

      assert.isTrue(w.isWebViewFocused());
    });

    it("returns false when another window owns the focused web contents", function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      const otherWindow = new StubBrowserWindow({});
      const focusedWebContents = otherWindow.webContents;
      sinon.stub(webContents, "getFocusedWebContents").returns(focusedWebContents);
      sinon.stub(BrowserWindow, "fromWebContents").returns(otherWindow);

      assert.isFalse(w.isWebViewFocused());
    });
  });

  describe("project root tracking", function () {
    it("knows when it has no roots", function () {
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      assert.isFalse(w.hasProjectPaths());
    });

    it("is initialized from directories in the initial locationsToOpen", function () {
      const locationsToOpen = [
        { pathToOpen: "file.txt", exists: true, isFile: true },
        { pathToOpen: "directory0", exists: true, isDirectory: true },
        { pathToOpen: "directory1", exists: true, isDirectory: true },
        { pathToOpen: "new-file.txt" },
        { pathToOpen: null },
      ];

      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });

      assert.deepEqual(w.projectRoots, ["directory0", "directory1"]);
      assert.isTrue(w.loadSettings.hasOpenFiles);
      assert.deepEqual(w.loadSettings.initialProjectRoots, ["directory0", "directory1"]);
      assert.isTrue(w.hasProjectPaths());
    });

    it("is updated synchronously by openLocations", async function () {
      const locationsToOpen = [
        { pathToOpen: "file.txt", isFile: true },
        { pathToOpen: "directory1", isDirectory: true },
        { pathToOpen: "directory0", isDirectory: true },
        { pathToOpen: "directory0", isDirectory: true },
        { pathToOpen: "new-file.txt" },
      ];

      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
      });
      assert.deepEqual(w.projectRoots, []);

      const promise = w.openLocations(locationsToOpen);
      assert.deepEqual(w.projectRoots, ["directory0", "directory1"]);
      w.resolveLoadedPromise();
      await promise;
    });

    it("is updated by setProjectRoots", function () {
      const locationsToOpen = [{ pathToOpen: "directory0", exists: true, isDirectory: true }];

      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });
      assert.deepEqual(w.projectRoots, ["directory0"]);
      assert.deepEqual(w.loadSettings.initialProjectRoots, ["directory0"]);

      w.setProjectRoots(["directory1", "directory0", "directory2"]);
      assert.deepEqual(w.projectRoots, ["directory0", "directory1", "directory2"]);
      assert.deepEqual(w.loadSettings.initialProjectRoots, [
        "directory0",
        "directory1",
        "directory2",
      ]);
    });

    it("never reports that it owns the empty path", function () {
      const locationsToOpen = [
        { pathToOpen: "directory0", exists: true, isDirectory: true },
        { pathToOpen: "directory1", exists: true, isDirectory: true },
        { pathToOpen: null },
      ];

      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });
      assert.isFalse(w.containsLocation({ pathToOpen: null }));
    });

    it("discovers an exact path match", function () {
      const locationsToOpen = [
        { pathToOpen: "directory0", exists: true, isDirectory: true },
        { pathToOpen: "directory1", exists: true, isDirectory: true },
      ];
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });

      assert.isTrue(w.containsLocation({ pathToOpen: "directory0" }));
      assert.isFalse(w.containsLocation({ pathToOpen: "directory2" }));
    });

    it("discovers the path of a file within any project root", function () {
      const locationsToOpen = [
        { pathToOpen: "directory0", exists: true, isDirectory: true },
        { pathToOpen: "directory1", exists: true, isDirectory: true },
      ];
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });

      assert.isTrue(
        w.containsLocation({
          pathToOpen: path.join("directory0/file-0.txt"),
          exists: true,
          isFile: true,
        }),
      );
      assert.isTrue(
        w.containsLocation({
          pathToOpen: path.join("directory0/deep/file-0.txt"),
          exists: true,
          isFile: true,
        }),
      );
      assert.isFalse(
        w.containsLocation({
          pathToOpen: path.join("directory2/file-9.txt"),
          exists: true,
          isFile: true,
        }),
      );
      assert.isFalse(
        w.containsLocation({
          pathToOpen: path.join("directory2/deep/file-9.txt"),
          exists: true,
          isFile: true,
        }),
      );
    });

    it("reports that it owns nonexistent paths within a project root", function () {
      const locationsToOpen = [
        { pathToOpen: "directory0", exists: true, isDirectory: true },
        { pathToOpen: "directory1", exists: true, isDirectory: true },
      ];
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });

      assert.isTrue(
        w.containsLocation({
          pathToOpen: path.join("directory0/file-1.txt"),
          exists: false,
        }),
      );
      assert.isTrue(
        w.containsLocation({
          pathToOpen: path.join("directory1/subdir/file-0.txt"),
          exists: false,
        }),
      );
    });

    it("never reports that it owns directories within a project root", function () {
      const locationsToOpen = [
        { pathToOpen: "directory0", exists: true, isDirectory: true },
        { pathToOpen: "directory1", exists: true, isDirectory: true },
      ];
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });

      assert.isFalse(
        w.containsLocation({
          pathToOpen: path.join("directory0/subdir-0"),
          exists: true,
          isDirectory: true,
        }),
      );
    });

    it("checks a full list of paths and reports if it owns all of them", function () {
      const locationsToOpen = [
        { pathToOpen: "directory0", exists: true, isDirectory: true },
        { pathToOpen: "directory1", exists: true, isDirectory: true },
      ];
      const w = new AtomWindow(app, service, {
        browserWindowConstructor: StubBrowserWindow,
        locationsToOpen,
      });

      assert.isTrue(
        w.containsLocations([
          { pathToOpen: "directory0" },
          {
            pathToOpen: path.join("directory1/file-0.txt"),
            exists: true,
            isFile: true,
          },
        ]),
      );
      assert.isFalse(
        w.containsLocations([{ pathToOpen: "directory2" }, { pathToOpen: "directory0" }]),
      );
      assert.isFalse(
        w.containsLocations([{ pathToOpen: "directory2" }, { pathToOpen: "directory1" }]),
      );
    });
  });
});

class StubApplication {
  constructor(sinon) {
    this.config = {
      "core.titleBar": "hidden",
      get: (key) => this.config[key] || null,
    };
    this.configFile = {
      get() {
        return "stub-config";
      },
    };

    this.removeWindow = sinon.spy();
    this.saveCurrentWindowOptions = sinon.spy();
  }
}

class StubRecoveryService {
  constructor(sinon) {
    this.didCloseWindow = sinon.spy();
    this.didCrashWindow = sinon.spy();
  }
}

class StubBrowserWindow extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.sent = [];
    this.destroyed = false;
    this.behavior = {
      focusOnWebView: false,
      reloaded: false,
    };

    this.webContents = new EventEmitter();
    this.webContents.send = (...args) => {
      this.sent.push(args);
    };
    this.webContents.setVisualZoomLevelLimits = () => {};
    this.webContents.isDestroyed = () => this.destroyed;
  }

  loadURL() {}

  isDestroyed() {
    return this.destroyed;
  }

  destroy() {
    this.destroyed = true;
  }

  reload() {
    this.behavior.reloaded = true;
  }

  focusOnWebView() {
    this.behavior.focusOnWebView = true;
  }
}
