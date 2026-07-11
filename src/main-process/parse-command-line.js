"use strict";

const dedent = require("dedent");
const yargs = require("yargs");
const { app } = require("electron");

module.exports = function parseCommandLine(processArgs) {
  // macOS Gatekeeper adds a flag ("-psn_0_[six or seven digits here]") when it intercepts Lumine launches.
  // (This happens for fresh downloads, new installs, or first launches after upgrading).
  // We don't need this flag, and yargs interprets it as many short flags. So, we filter it out.
  const filteredArgs = processArgs.filter((arg) => !arg.startsWith("-psn_"));

  const options = yargs(filteredArgs).wrap(yargs.terminalWidth());
  const version = app.getVersion();
  options.usage(
    dedent`Lumine Editor v${version}

    Usage:
      lumine
      lumine [options] [path ...]
      lumine file[:line[:column]]

    One or more paths to files or folders may be specified. If there is an
    existing Lumine window that contains all of the given folders, the paths
    will be opened in that window. Otherwise, they will be opened in a new
    window.

    A file may be opened at the desired line (and optionally column) by
    appending the numbers right after the file name, e.g. \`lumine file:5:8\`.

    Paths that start with \`atom://\` will be interpreted as URLs.

    Package Management:
      lumine --install <repository>   Install a package from its latest semver tag.
      lumine --uninstall <name>       Uninstall an installed package.
      lumine --list                   List installed packages.
      lumine --link <path>            Symlink a local package (add --dev for dev packages).
      lumine --unlink <path|name>     Remove a symlinked package.

    Environment Variables:

      LUMINE_RESOURCE_PATH    The path from which Lumine loads source code in dev mode.
                              Defaults to \`~/github/atom\`.

      ATOM_HOME               The root path for all configuration files and folders.
                              Defaults to \`~/.lumine\`.`,
  );
  options.alias("d", "dev").boolean("d").describe("d", "Run in development mode.");
  options
    .alias("f", "foreground")
    .boolean("f")
    .describe("f", "Keep the main process in the foreground.");
  options.help(false);
  options.alias("h", "help").boolean("h").describe("h", "Print this usage message.");
  options
    .alias("l", "log-file")
    .string("l")
    .describe("l", "Log all output to file when running tests.");
  options.alias("n", "new-window").boolean("n").describe("n", "Open a new window.");
  options
    .boolean("profile-startup")
    .describe("profile-startup", "Create a profile of the startup execution time.");
  options
    .boolean("crashdump")
    .describe("crashdump", "Generate a crashdump in ~/.lumine/crashdumps in the event of a crash.");
  options
    .alias("r", "resource-path")
    .string("r")
    .describe("r", "Set the path to the Lumine source directory and enable dev-mode.");
  options
    .boolean("safe")
    .describe("safe", "Do not load packages from ~/.lumine/packages or ~/.lumine/dev/packages.");
  options.boolean("benchmark").describe("benchmark", "This option is no longer supported.");
  options
    .boolean("benchmark-test")
    .describe("benchmark-test", "This option is no longer supported.");
  options
    .alias("t", "test")
    .boolean("t")
    .describe("t", "Run the specified specs and exit with error code on failures.");
  options
    .alias("m", "main-process")
    .boolean("m")
    .describe("m", "Run the specified specs in the main process.");
  options
    .string("timeout")
    .describe(
      "timeout",
      "When in test mode, waits until the specified time (in minutes) and kills the process (exit code: 130).",
    );
  options
    .alias("w", "wait")
    .boolean("w")
    .describe("w", "Wait for window to be closed before returning.");
  options
    .alias("a", "add")
    .boolean("a")
    .describe("add", "Open path as a new project in last used window.");
  options.string("user-data-dir");
  options
    .boolean("clear-window-state")
    .describe("clear-window-state", "Delete all Lumine environment state.");
  options
    .boolean("enable-electron-logging")
    .describe("enable-electron-logging", "Enable low-level logging messages from Electron.");
  options
    .alias("p", "package")
    .boolean("p")
    .describe("package", "Deprecated. Use --install, --uninstall, --list, --link or --unlink.");
  options
    .string("install")
    .describe(
      "install",
      "Install from owner/repo[@tag|#commit|~branch], or use #branch:, #tag:, or #commit: with a Git URL.",
    );
  options
    .string("uninstall")
    .describe("uninstall", "Uninstall an installed community package by name.");
  options.boolean("list").describe("list", "List installed community and development packages.");
  options
    .string("link")
    .describe(
      "link",
      "Symlink a local package directory into ~/.lumine/packages (add --dev to link into dev/packages).",
    );
  options
    .string("unlink")
    .describe(
      "unlink",
      "Remove a symlinked package by name or path (add --dev to only affect dev/packages).",
    );
  options.boolean("uri-handler");
  options
    .version(
      dedent`Lumine  : ${version}
             Electron: ${process.versions.electron}
             Chrome  : ${process.versions.chrome}
             Node    : ${process.versions.node}`,
    )
    .alias("v", "version");

  // NB: if --help or --version are given, this also displays the relevant message and exits
  let args = options.argv;

  if (args["package"]) {
    process.stderr.write(
      "The `--package`/`-p` option has been replaced. Use `lumine --install owner/repo`, " +
        "`--uninstall <name>`, `--list`, `--link <path>` or `--unlink <path>`.\n",
    );
    process.exit(1);
    return;
  }

  if (args["help"]) {
    options.showHelp();
    process.exit(0);
    return;
  }

  // If --uri-handler is set, then we parse NOTHING else
  if (args.uriHandler) {
    args = {
      uriHandler: true,
      "uri-handler": true,
      _: args._.filter((str) => str.startsWith("atom://")).slice(0, 1),
    };
  }

  const addToLastWindow = args["add"];
  const safeMode = args["safe"];
  const benchmark = args["benchmark"];
  const benchmarkTest = args["benchmark-test"];
  const test = args["test"];
  const mainProcess = args["main-process"];
  const timeout = args["timeout"];
  const newWindow = args["new-window"];
  const useCrashReporter = args["crashdump"];
  let executedFrom;
  if (args["executed-from"] && args["executed-from"].toString()) {
    executedFrom = args["executed-from"].toString();
  } else {
    executedFrom = process.cwd();
  }

  if (newWindow && addToLastWindow) {
    process.stderr.write(
      `Only one of the --add and --new-window options may be specified at the same time.\n\n${options.help()}`,
    );

    // Exiting the main process with a nonzero exit code on macOS causes the app open to fail with the mysterious
    // message "LSOpenURLsWithRole() failed for the application /Applications/Lumine Dev.app with error -10810."
    process.exit(0);
  }

  let pidToKillWhenClosed = null;
  if (args["wait"]) {
    pidToKillWhenClosed = args["pid"];
  }

  const logFile = args["log-file"];
  const userDataDir = args["user-data-dir"];
  const profileStartup = args["profile-startup"];
  const clearWindowState = args["clear-window-state"];
  let pathsToOpen = [];
  let urlsToOpen = [];
  let devMode = args["dev"];

  for (const path of args._) {
    if (typeof path !== "string") {
      // Sometimes non-strings (such as numbers or boolean true) get into args._
      // In the next block, .startsWith() only works on strings. So, skip non-string arguments.
      continue;
    }
    if (path.startsWith("atom://")) {
      urlsToOpen.push(path);
    } else {
      pathsToOpen.push(path);
    }
  }

  if (args.resourcePath || test) {
    devMode = true;
  }

  if (args["path-environment"]) {
    // On Yosemite the $PATH is not inherited by the "open" command, so we have to
    // explicitly pass it by command line, see http://git.io/YC8_Ew.
    process.env.PATH = args["path-environment"];
  }

  // Headless package-management commands. When present, `start.js` runs the
  // command and exits without opening an editor window. `--dev` links/unlinks
  // packages under `dev/packages` instead of `packages`.
  let packageCommand = null;
  const linkToDev = Boolean(args["dev"]);
  if (typeof args["install"] === "string") {
    packageCommand = { name: "install", arg: args["install"], dev: linkToDev };
  } else if (typeof args["uninstall"] === "string") {
    packageCommand = { name: "uninstall", arg: args["uninstall"], dev: linkToDev };
  } else if (args["list"]) {
    packageCommand = { name: "list", arg: null, dev: linkToDev };
  } else if (typeof args["link"] === "string") {
    packageCommand = { name: "link", arg: args["link"], dev: linkToDev };
  } else if (typeof args["unlink"] === "string") {
    packageCommand = { name: "unlink", arg: args["unlink"], dev: linkToDev };
  }

  return {
    packageCommand,
    pathsToOpen,
    urlsToOpen,
    executedFrom,
    test,
    version,
    pidToKillWhenClosed,
    devMode,
    safeMode,
    newWindow,
    logFile,
    userDataDir,
    profileStartup,
    timeout,
    clearWindowState,
    addToLastWindow,
    mainProcess,
    useCrashReporter,
    benchmark,
    benchmarkTest,
    env: process.env,
  };
};
