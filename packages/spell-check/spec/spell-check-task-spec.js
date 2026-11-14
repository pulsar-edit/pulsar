const path = require('path');
const SpellCheckTask = require('../lib/spell-check-task');
const { it, beforeEach, afterEach } = require('./async-spec-helpers');

// Lets pending promise callbacks and `async` continuations run.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

// A stand-in for `SpellCheckManager` whose `check` calls stay pending until
// the spec settles them. By default each call resolves with a misspelling
// list containing the checked text, so a spec can tell which version of a
// buffer a callback's results came from.
function createFakeManager({
  respond = (text) => ({ misspellings: [text] }),
} = {}) {
  const manager = {
    calls: [],
    inFlight: 0,
    maxInFlight: 0,
    check(args, text) {
      manager.inFlight++;
      manager.maxInFlight = Math.max(manager.maxInFlight, manager.inFlight);
      return new Promise((resolve, reject) => {
        manager.calls.push({
          args,
          text,
          settled: false,
          settle() {
            this.settled = true;
            try {
              resolve(respond(text));
            } catch (err) {
              reject(err);
            }
          },
        });
      }).finally(() => manager.inFlight--);
    },
  };
  return manager;
}

// Settles pending `check` calls one at a time, in the order they were made,
// until none remain.
async function drain(manager, limit = 20) {
  for (let i = 0; i < limit; i++) {
    await tick();
    const call = manager.calls.find((c) => !c.settled);
    if (!call) return;
    call.settle();
  }
  throw new Error(`drain: still settling calls after ${limit} rounds`);
}

let nextEditorId = 100000;

// Just enough of a `TextBuffer` for `SpellCheckTask#start`. Pass a `filePath`
// of `null` for an untitled buffer.
function createFakeBuffer({ filePath = null, text = '' } = {}) {
  const buffer = {
    file: filePath ? { path: filePath } : null,
    text,
    getText: () => buffer.text,
  };
  return buffer;
}

// Just enough of a `TextEditor` for `SpellCheckTask#start`. Pass `buffer` to
// put several editors on one buffer (e.g., a split pane); otherwise the
// options go to `createFakeBuffer`.
function createFakeEditor({ buffer, ...bufferOptions } = {}) {
  buffer ??= createFakeBuffer(bufferOptions);
  return {
    id: nextEditorId++,
    getBuffer: () => buffer,
    // Shorthand for the buffer's text, which every editor on it shares.
    get text() {
      return buffer.text;
    },
    set text(value) {
      buffer.text = value;
    },
  };
}

const fakePath = (name) => path.join(__dirname, 'fake-files', name);

describe('SpellCheckTask queue', () => {
  let activeEditor;

  beforeEach(() => {
    jasmine.useRealClock();
    activeEditor = null;
    spyOn(atom.workspace, 'getActiveTextEditor').andCallFake(
      () => activeEditor
    );
  });

  afterEach(() => {
    SpellCheckTask.clearJobs();
  });

  describe('when no text editor is active', () => {
    it('still runs queued jobs', async () => {
      const manager = createFakeManager();
      const editorA = createFakeEditor({
        filePath: fakePath('a.txt'),
        text: 'a',
      });
      const editorB = createFakeEditor({
        filePath: fakePath('b.txt'),
        text: 'b',
      });
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');

      new SpellCheckTask(manager).start(editorA, callbackA);
      new SpellCheckTask(manager).start(editorB, callbackB);
      await drain(manager);

      expect(callbackA).toHaveBeenCalledWith(['a']);
      expect(callbackB).toHaveBeenCalledWith(['b']);
    });

    it('does not leave the queue stuck once an editor becomes active', async () => {
      const manager = createFakeManager();
      const editorA = createFakeEditor({
        filePath: fakePath('a.txt'),
        text: 'a1',
      });
      const editorB = createFakeEditor({
        filePath: fakePath('b.txt'),
        text: 'b1',
      });
      const taskA = new SpellCheckTask(manager);
      const taskB = new SpellCheckTask(manager);
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');

      // Both jobs are queued while nothing is active (e.g., during startup).
      taskA.start(editorA, callbackA);
      taskB.start(editorB, callbackB);
      await tick();

      // Then an editor becomes active and both buffers change.
      activeEditor = editorA;
      editorA.text = 'a2';
      taskA.start(editorA, callbackA);
      editorB.text = 'b2';
      taskB.start(editorB, callbackB);
      await drain(manager);

      expect(callbackA).toHaveBeenCalledWith(['a2']);
      expect(callbackB).toHaveBeenCalledWith(['b2']);
    });
  });

  describe('when a check fails', () => {
    beforeEach(() => {
      spyOn(console, 'error');
    });

    it('moves on to the next job after a rejection', async () => {
      let calls = 0;
      const manager = createFakeManager({
        respond(text) {
          if (calls++ === 0) throw new Error('checker failed');
          return { misspellings: [text] };
        },
      });
      const editorA = createFakeEditor({
        filePath: fakePath('a.txt'),
        text: 'a',
      });
      const editorB = createFakeEditor({
        filePath: fakePath('b.txt'),
        text: 'b',
      });
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');
      activeEditor = editorA;

      new SpellCheckTask(manager).start(editorA, callbackA);
      new SpellCheckTask(manager).start(editorB, callbackB);
      await drain(manager);

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledWith(['b']);
    });

    it('moves on to the next job after a synchronous throw', async () => {
      const manager = createFakeManager();
      const realCheck = manager.check;
      let calls = 0;
      manager.check = (...args) => {
        if (calls++ === 0) throw new Error('checker threw');
        return realCheck(...args);
      };
      const editorA = createFakeEditor({
        filePath: fakePath('a.txt'),
        text: 'a',
      });
      const editorB = createFakeEditor({
        filePath: fakePath('b.txt'),
        text: 'b',
      });
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');
      activeEditor = editorA;

      new SpellCheckTask(manager).start(editorA, callbackA);
      new SpellCheckTask(manager).start(editorB, callbackB);
      await drain(manager);

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledWith(['b']);
    });
  });

  describe('when a task restarts while its check is in flight', () => {
    it('never runs two checks at once', async () => {
      const manager = createFakeManager();
      const editor = createFakeEditor({
        filePath: fakePath('a.txt'),
        text: 'one',
      });
      const task = new SpellCheckTask(manager);
      activeEditor = editor;

      task.start(editor, () => {});
      editor.text = 'two';
      task.start(editor, () => {});
      await drain(manager);

      expect(manager.maxInFlight).toBe(1);
    });

    it('delivers only the newer results, and only to the newer callback', async () => {
      const manager = createFakeManager();
      const editor = createFakeEditor({
        filePath: fakePath('a.txt'),
        text: 'one',
      });
      const task = new SpellCheckTask(manager);
      const staleCallback = jasmine.createSpy('staleCallback');
      const freshCallback = jasmine.createSpy('freshCallback');
      activeEditor = editor;

      task.start(editor, staleCallback);
      editor.text = 'two';
      task.start(editor, freshCallback);
      await drain(manager);

      expect(staleCallback).not.toHaveBeenCalled();
      expect(freshCallback).toHaveBeenCalledWith(['two']);
    });
  });

  describe('when a task is terminated while its check is in flight', () => {
    it('does not invoke its callback', async () => {
      const manager = createFakeManager();
      const editor = createFakeEditor({
        filePath: fakePath('a.txt'),
        text: 'a',
      });
      const task = new SpellCheckTask(manager);
      const callback = jasmine.createSpy('callback');
      activeEditor = editor;

      task.start(editor, callback);
      await tick();
      task.terminate();
      await drain(manager);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // When several editors are open on one buffer (e.g., a split pane), a
  // request for a buffer state that's already queued shares that job's check
  // instead of queueing another.
  describe('piggybacking', () => {
    let manager, busyEditor;

    // Starts a check that stays in flight until the spec drains, so that the
    // jobs a spec queues after it wait in the queue.
    function occupyQueue() {
      activeEditor = busyEditor;
      new SpellCheckTask(manager).start(busyEditor, () => {});
    }

    const callsFor = (text) => manager.calls.filter((c) => c.text === text);

    beforeEach(() => {
      manager = createFakeManager();
      busyEditor = createFakeEditor({
        filePath: fakePath('busy.txt'),
        text: 'busy',
      });
    });

    it('checks a buffer once for all editors on it in the same state', async () => {
      const buffer = createFakeBuffer({
        filePath: fakePath('a.txt'),
        text: 'one',
      });
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');

      occupyQueue();
      new SpellCheckTask(manager).start(
        createFakeEditor({ buffer }),
        callbackA
      );
      new SpellCheckTask(manager).start(
        createFakeEditor({ buffer }),
        callbackB
      );
      await drain(manager);

      expect(callsFor('one').length).toBe(1);
      expect(callbackA).toHaveBeenCalledWith(['one']);
      expect(callbackB).toHaveBeenCalledWith(['one']);
    });

    it('checks an untitled buffer once for all editors on it in the same state', async () => {
      const buffer = createFakeBuffer({ text: 'untitled' });
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');

      occupyQueue();
      new SpellCheckTask(manager).start(
        createFakeEditor({ buffer }),
        callbackA
      );
      new SpellCheckTask(manager).start(
        createFakeEditor({ buffer }),
        callbackB
      );
      await drain(manager);

      expect(callsFor('untitled').length).toBe(1);
      expect(callbackA).toHaveBeenCalledWith(['untitled']);
      expect(callbackB).toHaveBeenCalledWith(['untitled']);
    });

    it('does not treat two untitled buffers as the same request', async () => {
      const untitledA = createFakeEditor({ text: 'untitled a' });
      const untitledB = createFakeEditor({ text: 'untitled b' });
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');

      occupyQueue();
      new SpellCheckTask(manager).start(untitledA, callbackA);
      new SpellCheckTask(manager).start(untitledB, callbackB);
      await drain(manager);

      expect(callbackA).toHaveBeenCalledWith(['untitled a']);
      expect(callbackB).toHaveBeenCalledWith(['untitled b']);
    });

    it('does not reuse a queued check once the buffer has changed', async () => {
      // E.g., a new split opens on a buffer whose queued job was captured
      // before the latest edit.
      const buffer = createFakeBuffer({
        filePath: fakePath('a.txt'),
        text: 'one',
      });
      const callbackB = jasmine.createSpy('callbackB');

      occupyQueue();
      new SpellCheckTask(manager).start(createFakeEditor({ buffer }), () => {});
      buffer.text = 'two';
      new SpellCheckTask(manager).start(
        createFakeEditor({ buffer }),
        callbackB
      );
      await drain(manager);

      expect(callbackB).toHaveBeenCalledWith(['two']);
    });

    it('does not attach a request to a check that is already in flight', async () => {
      const buffer = createFakeBuffer({
        filePath: fakePath('a.txt'),
        text: 'one',
      });
      const editorA = createFakeEditor({ buffer });
      const callbackB = jasmine.createSpy('callbackB');
      activeEditor = editorA;

      new SpellCheckTask(manager).start(editorA, () => {});
      await tick();
      buffer.text = 'two';
      new SpellCheckTask(manager).start(
        createFakeEditor({ buffer }),
        callbackB
      );
      await drain(manager);

      expect(callbackB).toHaveBeenCalledWith(['two']);
    });

    it('does not drop a piggybacked callback when the original task restarts', async () => {
      const buffer = createFakeBuffer({
        filePath: fakePath('a.txt'),
        text: 'one',
      });
      const editorA = createFakeEditor({ buffer });
      const taskA = new SpellCheckTask(manager);
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');

      occupyQueue();
      taskA.start(editorA, () => {});
      new SpellCheckTask(manager).start(
        createFakeEditor({ buffer }),
        callbackB
      );
      buffer.text = 'two';
      taskA.start(editorA, callbackA);
      await drain(manager);

      // Each gets results for the state it asked about.
      expect(callbackA).toHaveBeenCalledWith(['two']);
      expect(callbackB).toHaveBeenCalledWith(['one']);
    });

    it('does not drop a piggybacked callback when the original task is terminated', async () => {
      // E.g., one side of a split pane is closed while its check is queued.
      const buffer = createFakeBuffer({
        filePath: fakePath('a.txt'),
        text: 'one',
      });
      const taskA = new SpellCheckTask(manager);
      const callbackA = jasmine.createSpy('callbackA');
      const callbackB = jasmine.createSpy('callbackB');

      occupyQueue();
      taskA.start(createFakeEditor({ buffer }), callbackA);
      new SpellCheckTask(manager).start(
        createFakeEditor({ buffer }),
        callbackB
      );
      taskA.terminate();
      await drain(manager);

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledWith(['one']);
    });
  });
});
