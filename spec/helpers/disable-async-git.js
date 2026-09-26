// A necessity test for the Windows heap-corruption crash, switched on by
// `PULSAR_DISABLE_ASYNC_GIT` and inert otherwise.
//
// Every symbolized Windows crash we have — six page-heap verifier stops across
// five distinct detection points, plus a natural `0xC0000005` in
// `git!dowild` — runs on a libuv pool thread under `StatusWorker::Execute`,
// inside libgit2's status scan. So the sharpest single question available is
// whether the crash needs that pool-thread work at all.
//
// The four async methods on git-utils' `Repository` each have a synchronous
// counterpart, so we redirect them rather than neutering them. Behaviour is
// preserved — real branch, real statuses, real ahead/behind counts, and
// `GitRepository#refreshStatus` still does its bookkeeping and emits
// `did-change-statuses` — while the work moves from a pool thread to the main
// thread.
//
// An earlier version of this stubbed `refreshStatus` itself to return a bare
// resolved promise. That removed the pool-thread work but also stopped the
// event ever firing, so every spec waiting on a status change sat there until
// it timed out. Hence the redirection: it isolates the thread, and nothing
// else.
module.exports = function disableAsyncGit() {
  if (!process.env.PULSAR_DISABLE_ASYNC_GIT) return;

  const GitUtils = require('@pulsar-edit/git-utils');

  const patch = prototype => {
    prototype.getHeadAsync = function () {
      return Promise.resolve(this.getHead());
    };
    prototype.getStatusAsync = function () {
      return Promise.resolve(this.getStatus());
    };
    prototype.getStatusForPathsAsync = function (paths) {
      return Promise.resolve(this.getStatusForPaths(paths));
    };
    prototype.getAheadBehindCountAsync = function (branch = 'HEAD') {
      return Promise.resolve(this.getAheadBehindCount(branch));
    };
  };

  // The module exports only `open`, so the prototype has to come from an
  // instance. Opening the working directory is the cheap way to get one; if
  // that is not a repository, fall back to patching on first open instead.
  const sample = GitUtils.open(process.cwd());
  if (sample) {
    patch(Object.getPrototypeOf(sample));
    console.log(
      'PULSAR_DISABLE_ASYNC_GIT: async git redirected to sync (prototype patched eagerly).'
    );
    return;
  }

  const open = GitUtils.open;
  let patched = false;
  GitUtils.open = function (...args) {
    const repository = open.apply(this, args);
    if (repository && !patched) {
      patched = true;
      patch(Object.getPrototypeOf(repository));
      console.log(
        'PULSAR_DISABLE_ASYNC_GIT: async git redirected to sync (patched on first open).'
      );
    }
    return repository;
  };
};
