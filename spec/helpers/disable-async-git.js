// A necessity test for the Windows heap-corruption crash, switched on by
// `PULSAR_DISABLE_ASYNC_GIT` and inert otherwise.
//
// Every symbolized stop we have collected — six of them, five distinct
// detection points — runs on a libuv pool thread under
// `StatusWorker::Execute`, inside libgit2's `git_diff__oid_for_entry`. That
// makes "does the crash need async git work at all?" the sharpest single
// question available, and this answers it without touching production code.
//
// `refreshStatus` is where all three async workers are reached from
// (`getStatusAsync`, `getHeadAsync`, `getAheadBehindCountAsync`), and it is
// called from the `GitRepository` constructor and from
// `GitRepositoryProvider#repositoryForGitDirectory`. Replacing it stops the
// pool threads without preventing repositories from being opened, so sync
// libgit2 work carries on as usual.
//
// Specs that assert on refreshed status will fail with this on. That is fine:
// the job that sets the variable only cares whether the renderer dies.
module.exports = function disableAsyncGit() {
  if (!process.env.PULSAR_DISABLE_ASYNC_GIT) return;

  const GitRepository = require('../../src/git-repository');
  GitRepository.prototype.refreshStatus = function () {
    return Promise.resolve();
  };

  // Logged so the run can be confirmed from CI output rather than assumed.
  console.log('PULSAR_DISABLE_ASYNC_GIT is set: GitRepository#refreshStatus stubbed.');
};
