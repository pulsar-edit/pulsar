let idCounter = 0;

// Each `SpellCheckView` owns a `SpellCheckTask`. Tasks share one queue of
// jobs, and the queue runs one check at a time.
//
// A job checks one buffer in one state. Every task that asks about that same
// state (e.g., the editors on either side of a split pane) shares the job, so
// a job keeps a request per task: its `requests` map task ids to the callback
// and editor that asked. A task has at most one request at any time; asking
// again withdraws the old one.
class SpellCheckTask {
  static handler = null;
  static jobs = [];
  // The job whose check is in flight. It is removed from `jobs` while it runs.
  static currentJob = null;

  // Withdraws a task's request from whichever job holds it. A queued job with
  // no requests left is dropped. The in-flight job still finishes, but only
  // the requests that remain get its results.
  static withdrawRequest(taskId) {
    if (this.currentJob?.requests.delete(taskId)) return true;
    for (let [index, job] of this.jobs.entries()) {
      if (!job.requests.delete(taskId)) continue;
      if (job.requests.size === 0) this.jobs.splice(index, 1);
      return true;
    }
    return false;
  }

  // Returns the job requested by the given editor, or else the newest job.
  static findJobByEditorId(editorId) {
    let match = this.jobs.find((job) => {
      for (let request of job.requests.values()) {
        if (request.editorId === editorId) return true;
      }
      return false;
    });
    return match ?? this.jobs[0];
  }

  static addJob(job) {
    this.jobs.unshift(job);
    // No-op if a check is already in flight; it'll pick this job up when done.
    this.startNextJob();
  }

  static clearJobs() {
    this.jobs = [];
    this.currentJob?.requests.clear();
    this.currentJob = null;
  }

  static async startNextJob() {
    if (this.currentJob || this.jobs.length === 0) return;

    // Prefer the active editor's job, but don't wait for an editor to be
    // active; otherwise the queue can wedge permanently.
    let activeEditorId = atom.workspace.getActiveTextEditor()?.id;
    let job = this.findJobByEditorId(activeEditorId);
    this.jobs.splice(this.jobs.indexOf(job), 1);
    this.currentJob = job;

    try {
      let results = await job.manager.check(job.args, job.args.text);
      // A callback may withdraw other requests (by restarting a task); `Map`
      // iteration skips entries deleted before they're reached.
      for (let { callback } of job.requests.values()) {
        callback(results.misspellings);
      }
    } catch (err) {
      console.error('Error running job:', job);
      console.error(err);
    } finally {
      // `clearJobs` may have replaced `currentJob` while we were waiting.
      if (this.currentJob === job) this.currentJob = null;
      this.startNextJob();
    }
  }

  // Adds the new job's requests to a queued job for the same buffer state, if
  // there is one. The in-flight job isn't eligible, since it's not in `jobs`.
  static piggybackExistingJob(newJob) {
    let job = this.jobs.find((j) => this.isDuplicateRequest(j, newJob));
    if (!job) return false;
    for (let [taskId, request] of newJob.requests) {
      job.requests.set(taskId, request);
    }
    return true;
  }

  // Whether two jobs check the same buffer in the same state. Comparing the
  // text is cheap: `TextBuffer#getText` caches its string until the next
  // change, so an unchanged buffer yields the very same string object.
  static isDuplicateRequest(a, b) {
    return (
      a.manager === b.manager &&
      a.buffer === b.buffer &&
      a.args.text === b.args.text
    );
  }

  constructor(manager) {
    this.manager = manager;
    this.id = idCounter++;
  }

  terminate() {
    return SpellCheckTask.withdrawRequest(this.id);
  }

  start(editor, onDidSpellCheck) {
    // Figure out the paths since we need that for checkers that are project-specific.
    const buffer = editor.getBuffer();
    let projectPath = null;
    let relativePath = null;

    if (buffer != null && buffer.file && buffer.file.path) {
      [projectPath, relativePath] = atom.project.relativizePath(
        buffer.file.path
      );
    }
    // Withdraw this task's previous request, if any.
    SpellCheckTask.withdrawRequest(this.id);

    let job = {
      manager: this.manager,
      buffer,
      requests: new Map([
        [this.id, { callback: onDidSpellCheck, editorId: editor.id }],
      ]),
      args: {
        id: this.id,
        projectPath,
        relativePath,
        text: buffer.getText(),
      },
    };

    // If another task already asked about this buffer state, share its job.
    if (SpellCheckTask.piggybackExistingJob(job)) {
      return;
    }
    // Do the work now if not busy or queue it for later.
    SpellCheckTask.addJob(job);
  }
}

module.exports = SpellCheckTask;
