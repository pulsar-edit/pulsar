const GitHost = require("./git-host");

// Renderer-side client providers. Each mirrors the method signature of its
// direct Git counterpart (git-repository-*-provider.js) but forwards the
// call to the git-host worker over RPC, so GitRepository can use them
// interchangeably and its existing specs (which inject fake providers) are
// unaffected. The AbortSignal is pulled out of `options` and passed to the
// transport as a cancellation channel; everything else is structured-clone-safe.

function splitSignal(options = {}) {
  const { signal, ...rest } = options;
  return { signal, rest };
}

class GitHostStatusProvider {
  getStatus(workingDirectory, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request("status", { workingDirectory, options: rest }, { signal });
  }

  getFileMode(workingDirectory, relativePosixPath, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "fileMode",
      { workingDirectory, relativePosixPath, options: rest },
      { signal },
    );
  }

  getSubmodulePaths(workingDirectory, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "submodulePaths",
      { workingDirectory, options: rest },
      { signal },
    );
  }
}

class GitHostRefsProvider {
  getRefs(workingDirectory, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request("refs", { workingDirectory, options: rest }, { signal });
  }

  getDescription(workingDirectory, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request("describe", { workingDirectory, options: rest }, { signal });
  }

  getBranchesContaining(workingDirectory, commit, params = {}, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "branchesContaining",
      { workingDirectory, commit, params, options: rest },
      { signal },
    );
  }
}

class GitHostDiffProvider {
  getDiffPatch(workingDirectory, request, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "diffPatch",
      { workingDirectory, request, options: rest },
      { signal },
    );
  }

  getLineDiffs(workingDirectory, { relativePosixPath, headOid, text, ignoreEolWhitespace }) {
    return GitHost.instance().request("lineDiff", {
      workingDirectory,
      relativePosixPath,
      headOid,
      text,
      ignoreEolWhitespace,
    });
  }
}

class GitHostConfigProvider {
  getConfigValue(workingDirectory, key, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "configGet",
      { workingDirectory, key, options: rest },
      { signal },
    );
  }
}

class GitHostHistoryProvider {
  getLog(workingDirectory, params, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "log",
      { workingDirectory, params, options: rest },
      { signal },
    );
  }

  getNameStatus(workingDirectory, sha, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "nameStatus",
      { workingDirectory, sha, options: rest },
      { signal },
    );
  }

  getFileAtRevision(workingDirectory, relativePosixPath, revision, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "fileAtRevision",
      { workingDirectory, relativePosixPath, revision, options: rest },
      { signal },
    );
  }

  getBlame(workingDirectory, relativePosixPath, params = {}, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request(
      "blame",
      { workingDirectory, relativePosixPath, params, options: rest },
      { signal },
    );
  }

  getBlob(workingDirectory, oid, options = {}) {
    const { signal, rest } = splitSignal(options);
    return GitHost.instance().request("blob", { workingDirectory, oid, options: rest }, { signal });
  }
}

module.exports = {
  GitHostStatusProvider,
  GitHostRefsProvider,
  GitHostConfigProvider,
  GitHostDiffProvider,
  GitHostHistoryProvider,
};
