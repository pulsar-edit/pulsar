const DugiteRepositoryStatusProvider = require("./dugite-repository-status-provider");
const DugiteRepositoryRefsProvider = require("./dugite-repository-refs-provider");
const DugiteRepositoryDiffProvider = require("./dugite-repository-diff-provider");
const DugiteRepositoryHistoryProvider = require("./dugite-repository-history-provider");
const { computeLineDiffHunks } = require("./line-diff");

// Cap on cached HEAD blobs (keyed by repo+path+headOid). Immutable per key, so a
// simple insertion-order LRU keeps the worker's memory bounded across many files.
const BLOB_CACHE_MAX = 256;

// The git-host worker's operation registry. Each op receives a structured-clone
// payload from the renderer plus a worker-local AbortSignal (a real signal
// cannot cross IPC, so the renderer's cancel is translated here), and returns
// the SAME raw string / structured value the direct Dugite providers return
// today. Parsing stays in the renderer so cache keys hash byte-identical output.
//
// This module is intentionally pure: it takes a runner (or, in specs, a fake
// `execute` via the provider constructors) and is require-able and testable
// in-process without forking a worker.
module.exports = function createGitHostOps(runner) {
  const status = new DugiteRepositoryStatusProvider({ runner });
  const refs = new DugiteRepositoryRefsProvider({ runner });
  const diff = new DugiteRepositoryDiffProvider({ runner });
  const history = new DugiteRepositoryHistoryProvider({ runner });

  const withSignal = (options, signal) => ({ ...options, signal });

  // HEAD blob cache for the line-diff gutter. Keyed by a stable commit oid so a
  // HEAD move produces a fresh key automatically; entries are never invalidated
  // in place (the HEAD:path blob is immutable for a given oid).
  const blobCache = new Map();
  function cacheBlob(key, value) {
    if (blobCache.has(key)) blobCache.delete(key);
    blobCache.set(key, value);
    if (blobCache.size > BLOB_CACHE_MAX) {
      blobCache.delete(blobCache.keys().next().value);
    }
  }

  return {
    status: ({ workingDirectory, options }, { signal }) =>
      status.getStatus(workingDirectory, withSignal(options, signal)),

    refs: ({ workingDirectory, options }, { signal }) =>
      refs.getRefs(workingDirectory, withSignal(options, signal)),

    diffPatch: ({ workingDirectory, request, options }, { signal }) =>
      diff.getDiffPatch(workingDirectory, request, withSignal(options, signal)),

    log: ({ workingDirectory, params, options }, { signal }) =>
      history.getLog(workingDirectory, params, withSignal(options, signal)),

    nameStatus: ({ workingDirectory, sha, options }, { signal }) =>
      history.getNameStatus(workingDirectory, sha, withSignal(options, signal)),

    fileAtRevision: ({ workingDirectory, relativePosixPath, revision, options }, { signal }) =>
      history.getFileAtRevision(
        workingDirectory,
        relativePosixPath,
        revision,
        withSignal(options, signal),
      ),

    blame: ({ workingDirectory, relativePosixPath, params, options }, { signal }) =>
      history.getBlame(workingDirectory, relativePosixPath, params, withSignal(options, signal)),

    // Read a single git config value across the local, global, and system
    // scopes (matching libgit2's default config lookup). Returns the raw value,
    // or null when the key is unset. Uses `-z` so the value is delimited by a
    // trailing NUL rather than a newline, preserving any trailing whitespace the
    // way the libgit2-backed getConfigValue did.
    configGet: async ({ workingDirectory, key }, { signal }) => {
      const result = await runner.runResult(["config", "-z", "--get", key], workingDirectory, {
        signal,
        allowedExitCodes: [0, 1],
      });
      if (result.exitCode !== 0) return null;
      const value = String(result.stdout);
      const nul = value.indexOf("\0");
      return nul === -1 ? value : value.slice(0, nul);
    },

    // Gutter line diff: fetch (and cache) the HEAD blob, then diff it against the
    // buffer text in JS. Returns only the small hunk array, not the blob.
    lineDiff: async (
      { workingDirectory, relativePosixPath, headOid, text, ignoreEolWhitespace },
      { signal },
    ) => {
      const revision = headOid || "HEAD";
      let blob;
      if (headOid) {
        const key = `${workingDirectory}\0${relativePosixPath}\0${headOid}`;
        if (blobCache.has(key)) {
          blob = blobCache.get(key);
        } else {
          blob = await history.getFileAtRevision(workingDirectory, relativePosixPath, revision, {
            signal,
          });
          cacheBlob(key, blob);
        }
      } else {
        // Without a stable oid to key on, fetch fresh so a HEAD move can never
        // serve a stale blob.
        blob = await history.getFileAtRevision(workingDirectory, relativePosixPath, revision, {
          signal,
        });
      }
      return computeLineDiffHunks(blob, text, { ignoreEolWhitespace });
    },
  };
};
