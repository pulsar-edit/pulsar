/** @babel */

import { Range } from "atom";
import path from "path";

// Web-URL schemes for the supported hosting providers. Each entry maps a
// repository web URL (`base`), a git ref and a repo-relative path to the routes
// that provider exposes. Only the standard "repository" hosts live here; the
// GitHub-only wiki and gist layouts are handled directly on the class because
// their URLs are shaped too differently to share this interface.
const PROVIDERS = {
  github: {
    label: "GitHub",
    blobURL: (base, ref, filePath) => `${base}/blob/${ref}/${filePath}`,
    blameURL: (base, ref, filePath) => `${base}/blame/${ref}/${filePath}`,
    historyURL: (base, ref, filePath) => `${base}/commits/${ref}/${filePath}`,
    issuesURL: (base) => `${base}/issues`,
    pullRequestsURL: (base) => `${base}/pulls`,
    branchCompareURL: (base, branch) => `${base}/compare/${branch}`,
    lineRange: (startRow, endRow) =>
      startRow === endRow ? `#L${startRow}` : `#L${startRow}-L${endRow}`,
  },
  gitlab: {
    label: "GitLab",
    blobURL: (base, ref, filePath) => `${base}/-/blob/${ref}/${filePath}`,
    blameURL: (base, ref, filePath) => `${base}/-/blame/${ref}/${filePath}`,
    historyURL: (base, ref, filePath) => `${base}/-/commits/${ref}/${filePath}`,
    issuesURL: (base) => `${base}/-/issues`,
    pullRequestsURL: (base) => `${base}/-/merge_requests`,
    // GitLab has no single-ref compare page; its analog of GitHub's "compare"
    // (which prompts to open a PR) is the "new merge request" form.
    branchCompareURL: (base, branch) =>
      `${base}/-/merge_requests/new?merge_request[source_branch]=${branch}`,
    lineRange: (startRow, endRow) =>
      startRow === endRow ? `#L${startRow}` : `#L${startRow}-${endRow}`,
  },
  bitbucket: {
    label: "Bitbucket",
    blobURL: (base, ref, filePath) => `${base}/src/${ref}/${filePath}`,
    blameURL: (base, ref, filePath) => `${base}/annotate/${ref}/${filePath}`,
    historyURL: (base, ref, filePath) => `${base}/history-node/${ref}/${filePath}`,
    issuesURL: (base) => `${base}/issues`,
    pullRequestsURL: (base) => `${base}/pull-requests`,
    branchCompareURL: (base, branch) => `${base}/pull-requests/new?source=${branch}`,
    lineRange: (startRow, endRow) =>
      startRow === endRow ? `#lines-${startRow}` : `#lines-${startRow}:${endRow}`,
  },
};

export default class RepositoryFile {
  // Public: Resolve a RepositoryFile whose git data (refs snapshot + the git
  // config keys it consults) has been loaded off the renderer thread. The URL
  // builders below stay synchronous by reading the values cached here.
  static async fromPath(filePath) {
    const file = new RepositoryFile(filePath);
    await file.load();
    return file;
  }

  constructor(filePath) {
    this.filePath = filePath;
    this.type = "none";
    this.repo = filePath ? atom.repositories.resolveForPathSync(filePath) : null;
    this.configCache = {};
    this.shortHead = null;
    this.headSha = null;
    this.providerKey = undefined;
  }

  // Internal: Load everything the URL builders need — the refs snapshot (for the
  // HEAD branch, SHA, and remote URLs) plus the handful of git config keys this
  // package honors — and detect the hosting provider. Resolving happens through
  // the git-host worker so the renderer thread never blocks on libgit2 or a git
  // subprocess.
  async load() {
    if (!this.repo) return this;

    const snapshot = await this.repo.ensureRefsSnapshot();
    const head = snapshot.head;
    this.shortHead = head
      ? head.name || (head.detached && head.oid ? head.oid.slice(0, 7) : null)
      : null;
    this.headSha = head?.oid ?? null;

    const [providerOverride, remoteOverride, branchOverride] = await Promise.all([
      this.repo.getConfigValueAsync("atom.open-repository.provider"),
      this.repo.getConfigValueAsync("atom.open-repository.remote"),
      this.repo.getConfigValueAsync("atom.open-repository.branch"),
    ]);
    this.configCache["atom.open-repository.provider"] = providerOverride;
    this.configCache["atom.open-repository.remote"] = remoteOverride;
    this.configCache["atom.open-repository.branch"] = branchOverride;

    if (this.shortHead) {
      const [branchRemote, branchMerge] = await Promise.all([
        this.repo.getConfigValueAsync(`branch.${this.shortHead}.remote`),
        this.repo.getConfigValueAsync(`branch.${this.shortHead}.merge`),
      ]);
      this.configCache[`branch.${this.shortHead}.remote`] = branchRemote;
      this.configCache[`branch.${this.shortHead}.merge`] = branchMerge;
    }

    // Resolve the tracking remote's URL from the refs snapshot when possible,
    // falling back to a direct config read (covers a remote configured without
    // a fetch refspec).
    const remoteName = this.remoteName() ?? "origin";
    const snapshotRemote = snapshot.remotes.find((remote) => remote.name === remoteName);
    this.configCache[`remote.${remoteName}.url`] =
      snapshotRemote?.fetchUrl ?? (await this.repo.getConfigValueAsync(`remote.${remoteName}.url`));

    if (this.gitURL()) {
      const webURL = this.repoWebURL();
      if (this.isWikiURL(webURL)) {
        this.type = "wiki";
      } else if (this.isGistURL(webURL)) {
        this.type = "gist";
      } else {
        this.type = "repo";
        this.providerKey = this.detectProvider(webURL);
      }
    }
    return this;
  }

  // Internal: the URL scheme for the detected host. Only meaningful when
  // `this.type === "repo"`.
  get provider() {
    return PROVIDERS[this.providerKey];
  }

  // Internal: choose the hosting provider for a plain repository URL. An explicit
  // `git config atom.open-repository.provider` wins (useful for self-hosted
  // instances); otherwise we guess from the host and default to GitHub, which
  // also covers GitHub Enterprise and unknown hosts.
  detectProvider(webURL) {
    const configured = this.getConfigValue("atom.open-repository.provider")?.toLowerCase();
    if (configured && PROVIDERS[configured]) {
      return configured;
    }

    const host = this.hostOf(webURL).toLowerCase();
    if (host === "gitlab.com" || host.startsWith("gitlab.")) {
      return "gitlab";
    }
    if (host === "bitbucket.org") {
      return "bitbucket";
    }
    return "github";
  }

  // Internal: a git config value preloaded during {::load}. The URL builders
  // stay synchronous by reading this cache instead of hitting libgit2.
  getConfigValue(key) {
    return this.configCache[key] ?? null;
  }

  // Public
  open(lineRange) {
    if (this.validateRepo()) {
      this.openURLInBrowser(this.blobURL() + this.getLineRangeSuffix(lineRange));
    }
  }

  // Public
  openOnMaster(lineRange) {
    if (this.validateRepo()) {
      this.openURLInBrowser(this.blobURLForMaster() + this.getLineRangeSuffix(lineRange));
    }
  }

  // Public
  blame(lineRange) {
    if (this.validateRepo()) {
      if (this.type === "repo") {
        this.openURLInBrowser(this.blameURL() + this.getLineRangeSuffix(lineRange));
      } else {
        atom.notifications.addWarning(`Blames do not exist for ${this.type}s`);
      }
    }
  }

  history() {
    if (this.validateRepo()) {
      this.openURLInBrowser(this.historyURL());
    }
  }

  copyURL(lineRange) {
    if (this.validateRepo()) {
      atom.clipboard.write(this.shaURL() + this.getLineRangeSuffix(lineRange));
    }
  }

  openBranchCompare() {
    if (this.validateRepo()) {
      if (this.type === "repo") {
        this.openURLInBrowser(this.branchCompareURL());
      } else {
        atom.notifications.addWarning(`Branches do not exist for ${this.type}s`);
      }
    }
  }

  openIssues() {
    if (this.validateRepo()) {
      if (this.type === "repo") {
        this.openURLInBrowser(this.issuesURL());
      } else {
        atom.notifications.addWarning(`Issues do not exist for ${this.type}s`);
      }
    }
  }

  openPullRequests() {
    if (this.validateRepo()) {
      if (this.type === "repo") {
        this.openURLInBrowser(this.pullRequestsURL());
      } else {
        atom.notifications.addWarning(`Pull requests do not exist for ${this.type}s`);
      }
    }
  }

  openRepository() {
    if (this.validateRepo()) {
      this.openURLInBrowser(this.repoWebURL());
    }
  }

  getLineRangeSuffix(lineRange) {
    if (!lineRange || this.type === "wiki") {
      return "";
    }
    if (!atom.config.get("open-repository.includeLineNumbersInUrls")) {
      return "";
    }

    const range = Range.fromObject(lineRange);
    const startRow = range.start.row + 1;
    const endRow = range.end.row + 1;

    if (this.type === "gist") {
      return startRow === endRow ? `-L${startRow}` : `-L${startRow}-L${endRow}`;
    }

    return this.provider.lineRange(startRow, endRow);
  }

  // Internal
  validateRepo() {
    if (!this.repo) {
      atom.notifications.addWarning(`No repository found for path: ${this.filePath}.`);
      return false;
    } else if (!this.gitURL()) {
      atom.notifications.addWarning(`No URL defined for remote: ${this.remoteName()}`);
      return false;
    }
    return true;
  }

  // Internal
  openURLInBrowser(url) {
    atom.openExternal(url);
  }

  // Internal
  blobURL() {
    const base = this.repoWebURL();
    const repoRelativePath = this.repoRelativePath();

    if (this.type === "wiki") {
      return `${base}/${this.extractFileName(repoRelativePath)}`;
    } else if (this.type === "gist") {
      return `${base}#file-${this.encodeSegments(repoRelativePath.replace(/\./g, "-"))}`;
    } else {
      return this.provider.blobURL(
        base,
        this.remoteBranchName(),
        this.encodeSegments(repoRelativePath),
      );
    }
  }

  // Internal
  blobURLForMaster() {
    if (this.type === "repo") {
      return this.provider.blobURL(
        this.repoWebURL(),
        "master",
        this.encodeSegments(this.repoRelativePath()),
      );
    } else {
      return this.blobURL(); // Only repos have branches
    }
  }

  // Internal
  shaURL() {
    const base = this.repoWebURL();
    const encodedSHA = this.encodeSegments(this.sha());
    const repoRelativePath = this.repoRelativePath();

    if (this.type === "wiki") {
      return `${base}/${this.extractFileName(repoRelativePath)}/${encodedSHA}`;
    } else if (this.type === "gist") {
      return `${base}/${encodedSHA}#file-${this.encodeSegments(repoRelativePath.replace(/\./g, "-"))}`;
    } else {
      return this.provider.blobURL(base, encodedSHA, this.encodeSegments(repoRelativePath));
    }
  }

  // Internal
  blameURL() {
    return this.provider.blameURL(
      this.repoWebURL(),
      this.remoteBranchName(),
      this.encodeSegments(this.repoRelativePath()),
    );
  }

  // Internal
  historyURL() {
    const base = this.repoWebURL();

    if (this.type === "wiki") {
      return `${base}/${this.extractFileName(this.repoRelativePath())}/_history`;
    } else if (this.type === "gist") {
      return `${base}/revisions`;
    } else {
      return this.provider.historyURL(
        base,
        this.remoteBranchName(),
        this.encodeSegments(this.repoRelativePath()),
      );
    }
  }

  // Internal
  issuesURL() {
    return this.provider.issuesURL(this.repoWebURL());
  }

  // Internal
  pullRequestsURL() {
    return this.provider.pullRequestsURL(this.repoWebURL());
  }

  // Internal
  branchCompareURL() {
    return this.provider.branchCompareURL(
      this.repoWebURL(),
      this.encodeSegments(this.branchName()),
    );
  }

  encodeSegments(segments = "") {
    return segments
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  // Internal
  extractFileName(relativePath = "") {
    return path.parse(relativePath).name;
  }

  // Internal
  gitURL() {
    const remoteName = this.remoteName();
    if (remoteName != null) {
      return this.getConfigValue(`remote.${remoteName}.url`);
    } else {
      return this.getConfigValue(`remote.origin.url`);
    }
  }

  // Internal: normalize the git remote URL to a browsable `https://host/owner/repo`
  // web URL, regardless of the protocol the remote uses.
  repoWebURL() {
    let url = this.gitURL();

    if (url.match(/git@[^:]+:/)) {
      // git@github.com:user/repo.git
      url = url.replace(/^git@([^:]+):(.+)$/, (match, host, repoPath) => {
        repoPath = repoPath.replace(/^\/+/, "");
        return `https://${host}/${repoPath}`; // -> https://github.com/user/repo.git
      });
    } else if (url.match(/^ssh:\/\/git@([^/]+)\//)) {
      // ssh://git@github.com/user/repo.git
      url = `https://${url.substring(10)}`; // -> https://github.com/user/repo.git
    } else if (url.match(/^git:\/\/[^/]+\//)) {
      // git://github.com/user/repo.git
      url = `https${url.substring(3)}`; // -> https://github.com/user/repo.git
    } else if (url.match(/^https?:\/\/\w+@/)) {
      // https://user@github.com/user/repo.git
      url = url.replace(/^https?:\/\/\w+@/, "https://"); // -> https://github.com/user/repo.git
    }

    // Remove trailing .git and trailing slashes
    url = url.replace(/\.git$/, "").replace(/\/+$/, "");
    // Change .wiki to /wiki
    url = url.replace(/\.wiki$/, "/wiki");

    return url;
  }

  isGistURL(url = this.repoWebURL()) {
    return this.hostOf(url) === "gist.github.com";
  }

  // Internal: the host of a URL, or "" when it cannot be parsed.
  hostOf(url) {
    try {
      return new URL(url).host;
    } catch {
      return "";
    }
  }

  isWikiURL(url) {
    return /\/wiki$/.test(url);
  }

  // Internal
  repoRelativePath() {
    return this.repo.relativize(this.filePath);
  }

  // Internal
  remoteName() {
    const gitConfigRemote = this.getConfigValue("atom.open-repository.remote");

    if (gitConfigRemote) {
      return gitConfigRemote;
    }

    const shortBranch = this.shortHead;

    if (!shortBranch) {
      return null;
    }

    const branchRemote = this.getConfigValue(`branch.${shortBranch}.remote`);

    if (branchRemote && branchRemote.length > 0) {
      return branchRemote;
    }

    return null;
  }

  // Internal
  sha() {
    return this.headSha;
  }

  // Internal
  branchName() {
    const shortBranch = this.shortHead;

    if (!shortBranch) {
      return null;
    }

    const branchMerge = this.getConfigValue(`branch.${shortBranch}.merge`);
    if (!(branchMerge && branchMerge.length > 11)) {
      return shortBranch;
    }

    if (branchMerge.indexOf("refs/heads/") !== 0) {
      return shortBranch;
    }

    return branchMerge.substring(11);
  }

  // Internal
  remoteBranchName() {
    const gitConfigBranch = this.getConfigValue("atom.open-repository.branch");

    if (gitConfigBranch) {
      return gitConfigBranch;
    } else if (this.remoteName() != null) {
      return this.encodeSegments(this.branchName());
    } else {
      return "master";
    }
  }
}
