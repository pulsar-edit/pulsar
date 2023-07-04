let SpellCheckTask;
let idCounter = 0;

module.exports = SpellCheckTask = (function () {
    SpellCheckTask = class SpellCheckTask {
        static initClass() {
            this.handler = null;
            this.jobs = [];
        }

        constructor(manager) {
            this.manager = manager;
            this.id = idCounter++;
        }

        terminate() {
            return this.constructor.removeFromArray(
                this.constructor.jobs,
                (j) => j.args.id === this.id
            );
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

            // Remove old jobs for this SpellCheckTask from the shared jobs list.
            this.constructor.removeFromArray(
                this.constructor.jobs,
                (j) => j.args.id === this.id
            );

            // Create an job that contains everything we'll need to do the work.
            const job = {
                manager: this.manager,
                callbacks: [onDidSpellCheck],
                editorId: editor.id,
                args: {
                    id: this.id,
                    projectPath,
                    relativePath,
                    text: buffer.getText(),
                },
            };

            // If we already have a job for this work piggy-back on it with our callback.
            if (this.constructor.piggybackExistingJob(job)) {
                return;
            }

            // Do the work now if not busy or queue it for later.
            this.constructor.jobs.unshift(job);
            if (this.constructor.jobs.length === 1) {
                return this.constructor.startNextJob();
            }
        }

        static piggybackExistingJob(newJob) {
            if (this.jobs.length > 0) {
                for (let job of this.jobs) {
                    if (this.isDuplicateRequest(job, newJob)) {
                        job.callbacks = job.callbacks.concat(newJob.callbacks);
                        return true;
                    }
                }
            }
            return false;
        }

        static isDuplicateRequest(a, b) {
            return (
                a.args.projectPath === b.args.projectPath &&
                a.args.relativePath === b.args.relativePath
            );
        }

        static removeFromArray(array, predicate) {
            if (array.length > 0) {
                for (let i = 0; i < array.length; i++) {
                    if (predicate(array[i])) {
                        const found = array[i];
                        array.splice(i, 1);
                        return found;
                    }
                }
            }
        }

        static startNextJob() {
            const activeEditor = atom.workspace.getActiveTextEditor();
            if (!activeEditor) return;

            const activeEditorId = activeEditor.id;
            const job =
                this.jobs.find((j) => j.editorId === activeEditorId) ||
                this.jobs[0];

            return job.manager
                .check(job.args, job.args.text)
                .then((results) => {
                    this.removeFromArray(
                        this.jobs,
                        (j) => j.args.id === job.args.id
                    );
                    for (let callback of job.callbacks) {
                        callback(results.misspellings);
                    }

                    if (this.jobs.length > 0) {
                        return this.startNextJob();
                    }
                });
        }

        static clear() {
            return (this.jobs = []);
        }
    };
    SpellCheckTask.initClass();
    return SpellCheckTask;
})();
