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
  // Public
  static fromPath(filePath) {
    return new RepositoryFile(filePath);
  }

  constructor(filePath) {
    this.filePath = filePath;
    this.type = "none";
    this.repo = atom.repositories.resolveForPathSync(this.filePath);

    if (this.repo != null) {
      if (this.repo && this.gitURL()) {
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
    }
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
    const configured = this.repo
      .getConfigValue("atom.open-repository.provider", this.filePath)
      ?.toLowerCase();
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
      return this.repo.getConfigValue(`remote.${remoteName}.url`, this.filePath);
    } else {
      return this.repo.getConfigValue(`remote.origin.url`, this.filePath);
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
    return this.repo.getRepo(this.filePath).relativize(this.filePath);
  }

  // Internal
  remoteName() {
    const gitConfigRemote = this.repo.getConfigValue("atom.open-repository.remote", this.filePath);

    if (gitConfigRemote) {
      return gitConfigRemote;
    }

    const shortBranch = this.repo.getShortHead(this.filePath);

    if (!shortBranch) {
      return null;
    }

    const branchRemote = this.repo.getConfigValue(`branch.${shortBranch}.remote`, this.filePath);

    if (branchRemote && branchRemote.length > 0) {
      return branchRemote;
    }

    return null;
  }

  // Internal
  sha() {
    return this.repo.getReferenceTarget("HEAD", this.filePath);
  }

  // Internal
  branchName() {
    const shortBranch = this.repo.getShortHead(this.filePath);

    if (!shortBranch) {
      return null;
    }

    const branchMerge = this.repo.getConfigValue(`branch.${shortBranch}.merge`, this.filePath);
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
    const gitConfigBranch = this.repo.getConfigValue("atom.open-repository.branch", this.filePath);

    if (gitConfigBranch) {
      return gitConfigBranch;
    } else if (this.remoteName() != null) {
      return this.encodeSegments(this.branchName());
    } else {
      return "master";
    }
  }
}
