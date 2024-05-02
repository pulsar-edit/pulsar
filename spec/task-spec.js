const Task = require('../src/task');
const Grim = require('grim');

describe('Task', function() {
  describe('@once(taskPath, args..., callback)', () =>
    it('terminates the process after it completes', async function(done) {
      let handlerResult = null;
      let task;
      let processErroredCallbak = jasmine.createSpy();
      let childProcess;

      await new Promise((resolve) => {
        task = Task.once(
          require.resolve('./fixtures/task-spec-handler'),
          (result) => {
            handlerResult = result;
            resolve();
          }
        );

        childProcess = task.childProcess;
        spyOn(childProcess, 'kill').and.callThrough();
        task.childProcess.on('error', processErroredCallbak);
      })

      expect(handlerResult).toBe('hello');
      expect(childProcess.kill).toHaveBeenCalled();
      expect(processErroredCallbak).not.toHaveBeenCalled();

      done();
    }));

  it('calls listeners registered with ::on when events are emitted in the task', async function(done) {
    const task = new Task(require.resolve('./fixtures/task-spec-handler'));

    const eventSpy = jasmine.createSpy('eventSpy');
    task.on('some-event', eventSpy);

    await new Promise((resolve) => task.start(resolve))

    expect(eventSpy).toHaveBeenCalledWith(1, 2, 3);

    done();
  });

  it('unregisters listeners when the Disposable returned by ::on is disposed', async function(done) {
    const task = new Task(require.resolve('./fixtures/task-spec-handler'));

    const eventSpy = jasmine.createSpy('eventSpy');
    const disposable = task.on('some-event', eventSpy);
    disposable.dispose();

    await new Promise((resolve) => task.start(resolve))

    expect(eventSpy).not.toHaveBeenCalled();

    done();
  });

  it('reports deprecations in tasks', async function(done) {
    jasmine.snapshotDeprecations();
    const handlerPath = require.resolve(
      './fixtures/task-handler-with-deprecations'
    );
    const task = new Task(handlerPath);
    await new Promise((resolve) => task.start(resolve))

    const deprecations = Grim.getDeprecations();
    expect(deprecations.length).toBe(1);
    expect(deprecations[0].getStacks()[0][1].fileName).toBe(handlerPath);
    jasmine.restoreDeprecationsSnapshot();

    done();
  });

  it('adds data listeners to standard out and error to report output', function() {
    const task = new Task(require.resolve('./fixtures/task-spec-handler'));
    const { stdout, stderr } = task.childProcess;

    task.start();
    task.start();
    expect(stdout.listeners('data').length).toBe(1);
    expect(stderr.listeners('data').length).toBe(1);

    task.terminate();
    expect(stdout.listeners('data').length).toBe(0);
    expect(stderr.listeners('data').length).toBe(0);
  });

  it('does not throw an error for forked processes missing stdout/stderr', function() {
    spyOn(require('child_process'), 'fork').and.callFake(function() {
      const Events = require('events');
      const fakeProcess = new Events();
      fakeProcess.send = function() {};
      fakeProcess.kill = function() {};
      return fakeProcess;
    });

    const task = new Task(require.resolve('./fixtures/task-spec-handler'));
    expect(() => task.start()).not.toThrow();
    expect(() => task.terminate()).not.toThrow();
  });

  describe('::cancel()', function() {
    it("dispatches 'task:cancelled' when invoked on an active task", function() {
      const task = new Task(require.resolve('./fixtures/task-spec-handler'));
      const cancelledEventSpy = jasmine.createSpy('eventSpy');
      task.on('task:cancelled', cancelledEventSpy);
      const completedEventSpy = jasmine.createSpy('eventSpy');
      task.on('task:completed', completedEventSpy);

      expect(task.cancel()).toBe(true);
      expect(cancelledEventSpy).toHaveBeenCalled();
      expect(completedEventSpy).not.toHaveBeenCalled();
    });

    it("does not dispatch 'task:cancelled' when invoked on an inactive task", async function(done) {
      let task = null;

      await new Promise(resolve => {
        task = Task.once(
          require.resolve('./fixtures/task-spec-handler'),
          resolve
        );
      })

      const cancelledEventSpy = jasmine.createSpy('eventSpy');
      task.on('task:cancelled', cancelledEventSpy);
      expect(task.cancel()).toBe(false);
      expect(cancelledEventSpy).not.toHaveBeenCalled();

      done();
    });
  });
});
