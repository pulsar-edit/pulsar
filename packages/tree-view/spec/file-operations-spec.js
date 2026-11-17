const FileOperations = require('../lib/file-operations');
const { timeoutPromise: wait } = require('./async-spec-helpers');

describe('FileOperations', () => {
  let fileOperations;

  // Small, so that timeouts don't slow the suite down; the waits below are
  // sized relative to it.
  const BUDGET = 100;

  const deletion = (oldPath) => ({ kind: 'file', oldPath });
  const succeedAll = async (actions) => actions;

  beforeEach(() => {
    // The budget is enforced with `setTimeout`, which the spec helper
    // otherwise fakes.
    jasmine.useRealClock();
    atom.config.set('tree-view.fileOperationTimeout', BUDGET);
    fileOperations = new FileOperations();
  });

  afterEach(() => fileOperations.dispose());

  describe('without consumers', () => {
    it('performs the operation and resolves with the actions that succeeded', async () => {
      const actions = [deletion('/a'), deletion('/b')];
      const perform = jasmine.createSpy('perform').andCallFake(async (actions) => [actions[1]]);

      const result = await fileOperations.run('delete', actions, perform);

      expect(perform).toHaveBeenCalledWith(actions);
      expect(result).toEqual([actions[1]]);
    });

    it('does not perform an empty batch', async () => {
      const perform = jasmine.createSpy('perform');
      const result = await fileOperations.run('delete', [], perform);
      expect(perform).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('onWill* and onDid* callbacks', () => {
    it('calls onWill callbacks with the actions and a handle, before performing', async () => {
      const events = [];
      const actions = [deletion('/a')];
      let received;
      fileOperations.onWill('delete', (actions, handle) => {
        received = { actions, handle };
        events.push('will');
      });

      await fileOperations.run('delete', actions, async (actions) => {
        events.push('perform');
        return actions;
      });

      expect(events).toEqual(['will', 'perform']);
      expect(received.actions).toEqual(actions);
      expect(typeof received.handle.waitUntil).toBe('function');
      expect(received.handle.signal instanceof AbortSignal).toBe(true);
    });

    it('calls onDid callbacks after performing, with only the actions that succeeded', async () => {
      const events = [];
      const actions = [deletion('/a'), deletion('/b')];
      let received;
      fileOperations.onDid('delete', (actions) => {
        received = actions;
        events.push('did');
      });

      await fileOperations.run('delete', actions, async (actions) => {
        events.push('perform');
        return [actions[0]];
      });

      expect(events).toEqual(['perform', 'did']);
      expect(received).toEqual([actions[0]]);
    });

    it('does not call onDid callbacks when nothing succeeded', async () => {
      const didDelete = jasmine.createSpy('didDelete');
      fileOperations.onDid('delete', didDelete);
      await fileOperations.run('delete', [deletion('/a')], async () => []);
      expect(didDelete).not.toHaveBeenCalled();
    });

    it('only notifies callbacks registered for the operation type', async () => {
      const willMove = jasmine.createSpy('willMove');
      const didCreate = jasmine.createSpy('didCreate');
      fileOperations.onWill('move', willMove);
      fileOperations.onDid('create', didCreate);

      await fileOperations.run('delete', [deletion('/a')], succeedAll);

      expect(willMove).not.toHaveBeenCalled();
      expect(didCreate).not.toHaveBeenCalled();
    });

    it('stops notifying a callback once its disposable is disposed', async () => {
      const willDelete = jasmine.createSpy('willDelete');
      fileOperations.onWill('delete', willDelete).dispose();
      await fileOperations.run('delete', [deletion('/a')], succeedAll);
      expect(willDelete).not.toHaveBeenCalled();
    });
  });

  describe('handle.waitUntil', () => {
    it('returns nothing', async () => {
      let returned = 'not called';
      fileOperations.onWill('delete', (_actions, handle) => {
        returned = handle.waitUntil(() => {});
      });
      await fileOperations.run('delete', [deletion('/a')], succeedAll);
      expect(returned).toBeUndefined();
    });

    it('delays the operation until the work is done', async () => {
      const events = [];
      fileOperations.onWill('delete', (_actions, handle) => {
        handle.waitUntil(async () => {
          await wait(BUDGET / 4);
          events.push('consumer finished');
        });
      });

      await fileOperations.run('delete', [deletion('/a')], async (actions) => {
        events.push('perform');
        return actions;
      });

      expect(events).toEqual(['consumer finished', 'perform']);
    });

    it('does not abort the signal when the work finishes in time', async () => {
      let signal;
      fileOperations.onWill('delete', (_actions, handle) => {
        signal = handle.signal;
        handle.waitUntil(() => wait(BUDGET / 4));
      });
      await fileOperations.run('delete', [deletion('/a')], succeedAll);
      expect(signal.aborted).toBe(false);
    });

    it('stops waiting when the budget runs out, aborting the signal before performing', async () => {
      let signal;
      let consumerFinished = false;
      let abortedDuringPerform;
      fileOperations.onWill('delete', (_actions, handle) => {
        signal = handle.signal;
        handle.waitUntil(async () => {
          await wait(BUDGET * 3);
          consumerFinished = true;
        });
      });

      const start = Date.now();
      await fileOperations.run('delete', [deletion('/a')], async (actions) => {
        abortedDuringPerform = signal.aborted;
        return actions;
      });
      const elapsed = Date.now() - start;

      expect(abortedDuringPerform).toBe(true);
      expect(signal.reason.name).toBe('TimeoutError');
      expect(consumerFinished).toBe(false);
      expect(elapsed).toBeLessThan(BUDGET * 3);
    });

    it('still notifies onDid callbacks after a timeout', async () => {
      const didDelete = jasmine.createSpy('didDelete');
      fileOperations.onWill('delete', (_actions, handle) => {
        handle.waitUntil(() => wait(BUDGET * 3));
      });
      fileOperations.onDid('delete', didDelete);
      await fileOperations.run('delete', [deletion('/a')], succeedAll);
      expect(didDelete).toHaveBeenCalled();
    });

    it("doesn't wait at all when the budget is 0", async () => {
      atom.config.set('tree-view.fileOperationTimeout', 0);
      let signal;
      let consumerStarted = false;
      fileOperations.onWill('delete', (_actions, handle) => {
        signal = handle.signal;
        handle.waitUntil(async () => {
          // The work still starts…
          consumerStarted = true;
          await wait(BUDGET);
        });
      });

      const start = Date.now();
      await fileOperations.run('delete', [deletion('/a')], succeedAll);

      // …but nothing waits for it.
      expect(consumerStarted).toBe(true);
      expect(signal.aborted).toBe(true);
      expect(Date.now() - start).toBeLessThan(BUDGET);
    });

    it('waits for several consumers concurrently, sharing one budget', async () => {
      // Each consumer takes most of the budget. Run one after the other, they
      // would exceed it; run together, they don't.
      const finished = [];
      let signal;
      for (const name of ['first', 'second']) {
        fileOperations.onWill('delete', (_actions, handle) => {
          signal = handle.signal;
          handle.waitUntil(async () => {
            await wait(BUDGET * 0.7);
            finished.push(name);
          });
        });
      }

      await fileOperations.run('delete', [deletion('/a')], succeedAll);

      expect(finished.sort()).toEqual(['first', 'second']);
      expect(signal.aborted).toBe(false);
    });

    it('throws when called after the callback has returned', async () => {
      let handle;
      fileOperations.onWill('delete', (_actions, h) => { handle = h; });
      await fileOperations.run('delete', [deletion('/a')], succeedAll);
      expect(() => handle.waitUntil(() => {})).toThrow();
    });

    it('throws when called after an `await` in an async callback', async () => {
      let error;
      fileOperations.onWill('delete', async (_actions, handle) => {
        await Promise.resolve();
        try {
          handle.waitUntil(() => {});
        } catch (e) {
          error = e;
        }
      });
      await fileOperations.run('delete', [deletion('/a')], succeedAll);
      expect(error).toBeDefined();
    });
  });

  describe('errors in consumers', () => {
    beforeEach(() => spyOn(window, 'reportError'));

    it('reports an error thrown by waitUntil work and performs the operation anyway', async () => {
      const error = new Error('sync failure');
      const perform = jasmine.createSpy('perform').andCallFake(succeedAll);
      fileOperations.onWill('delete', (_actions, handle) => {
        handle.waitUntil(() => { throw error; });
      });

      await fileOperations.run('delete', [deletion('/a')], perform);

      expect(window.reportError).toHaveBeenCalledWith(error);
      expect(perform).toHaveBeenCalled();
    });

    it('reports a rejection from waitUntil work and performs the operation anyway', async () => {
      const error = new Error('async failure');
      const perform = jasmine.createSpy('perform').andCallFake(succeedAll);
      fileOperations.onWill('delete', (_actions, handle) => {
        handle.waitUntil(async () => {
          await wait(0);
          throw error;
        });
      });

      await fileOperations.run('delete', [deletion('/a')], perform);

      expect(window.reportError).toHaveBeenCalledWith(error);
      expect(perform).toHaveBeenCalled();
    });

    it('reports a rejection from an async onWill callback that did not use waitUntil', async () => {
      const error = new Error('stray async work');
      fileOperations.onWill('delete', async () => {
        await Promise.resolve();
        throw error;
      });
      await fileOperations.run('delete', [deletion('/a')], succeedAll);
      await wait(0);
      expect(window.reportError).toHaveBeenCalledWith(error);
    });

    it('reports a rejection from an async onDid callback', async () => {
      const error = new Error('did failure');
      fileOperations.onDid('delete', async () => {
        await Promise.resolve();
        throw error;
      });
      await fileOperations.run('delete', [deletion('/a')], succeedAll);
      await wait(0);
      expect(window.reportError).toHaveBeenCalledWith(error);
    });
  });

  describe('the queue', () => {
    it('runs operations one at a time, in order', async () => {
      const events = [];
      fileOperations.onWill('delete', (actions, handle) => {
        events.push(`will ${actions[0].oldPath}`);
        handle.waitUntil(() => wait(BUDGET / 4));
      });
      fileOperations.onDid('delete', (actions) => events.push(`did ${actions[0].oldPath}`));

      await Promise.all([
        fileOperations.run('delete', [deletion('/a')], succeedAll),
        fileOperations.run('delete', [deletion('/b')], succeedAll)
      ]);

      expect(events).toEqual(['will /a', 'did /a', 'will /b', 'did /b']);
    });

    it('plans an operation only once earlier operations have finished', async () => {
      const events = [];
      const first = fileOperations.run('delete', [deletion('/a')], async (actions) => {
        await wait(BUDGET / 4);
        events.push('first performed');
        return actions;
      });
      const second = fileOperations.run(
        'delete',
        () => {
          events.push('second planned');
          return [deletion('/b')];
        },
        succeedAll
      );

      await Promise.all([first, second]);

      expect(events).toEqual(['first performed', 'second planned']);
    });

    it('accepts a planner that returns a promise', async () => {
      const actions = [deletion('/a')];
      const result = await fileOperations.run('delete', async () => actions, succeedAll);
      expect(result).toEqual(actions);
    });

    it('keeps going after an operation fails', async () => {
      const error = new Error('perform failed');
      const first = fileOperations.run('delete', [deletion('/a')], async () => { throw error; });
      const second = fileOperations.run('delete', [deletion('/b')], succeedAll);

      let firstError;
      try {
        await first;
      } catch (e) {
        firstError = e;
      }

      expect(firstError).toBe(error);
      expect(await second).toEqual([deletion('/b')]);
    });
  });
});
