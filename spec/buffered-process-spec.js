/* eslint-disable no-new */
const ChildProcess = require('child_process');
const path = require('path');
const fs = require('fs-plus');
const BufferedProcess = require('../src/buffered-process');

describe('BufferedProcess', function() {
  describe('when a bad command is specified', function() {
    let windowOnErrorSpy;

    beforeEach(function() {
      windowOnErrorSpy = spyOn(window, 'onerror');
    });

    describe('when there is an error handler specified', function() {
      describe('when an error event is emitted by the process', () =>
        it('calls the error handler and does not throw an exception', async function() {
          const bufferedProcess = new BufferedProcess({
            command: 'bad-command-nope1',
            args: ['nothing'],
            options: { shell: false }
          });

          const errorSpy = jasmine.createSpy()

          await new Promise((resolve) => {
            errorSpy.and.callFake((error) => {
              error.handle();
              resolve();
            });
            bufferedProcess.onWillThrowError(errorSpy);;
          })

          expect(window.onerror).not.toHaveBeenCalled();
          expect(errorSpy).toHaveBeenCalled();
          expect(errorSpy.calls.mostRecent().args[0].error.message).toContain(
            'spawn bad-command-nope1 ENOENT'
          );
        }));

      describe('when an error is thrown spawning the process', () =>
        it('calls the error handler and does not throw an exception', async function() {
          spyOn(ChildProcess, 'spawn').and.callFake(function() {
            const error = new Error('Something is really wrong');
            error.code = 'EAGAIN';
            throw error;
          });

          const bufferedProcess = new BufferedProcess({
            command: 'ls',
            args: [],
            options: {}
          });

          const errorSpy = jasmine.createSpy();

          await new Promise((resolve) => {
            errorSpy.and.callFake(error => {
              error.handle();
              resolve();
            });
            bufferedProcess.onWillThrowError(errorSpy);
          })

          expect(window.onerror).not.toHaveBeenCalled();
          expect(errorSpy).toHaveBeenCalled();
          expect(errorSpy.calls.mostRecent().args[0].error.message).toContain(
            'Something is really wrong'
          );
        }));
    });

    describe('when there is not an error handler specified', () =>
      it('does throw an exception', async function() {
        await new Promise((resolve) => {
          window.onerror.and.callFake(resolve);

          new BufferedProcess({
            command: 'bad-command-nope2',
            args: ['nothing'],
            options: {shell: false}
          });
        });

        expect(window.onerror).toHaveBeenCalled();
        expect(window.onerror.calls.mostRecent().args[0]).toContain(
          'Failed to spawn command `bad-command-nope2`'
        );
        expect(window.onerror.calls.mostRecent().args[4].name).toBe(
          'BufferedProcessError'
        );
      }));
  });

  describe('when autoStart is false', () =>
    /**
    * TODO: FAILING TEST - This test fails with the following output:
    * timeout: timed out after 120000 msec waiting for condition
    */
    xit('doesnt start unless start method is called', async function() {
      let stdout = '';
      let stderr = '';
      const exitCallback = jasmine.createSpy('exit callback');
      const apmProcess = new BufferedProcess({
        autoStart: false,
        command: atom.packages.getApmPath(),
        args: ['-h'],
        options: {},
        stdout(lines) {
          stdout += lines;
        },
        stderr(lines) {
          stderr += lines;
        },
        exit: exitCallback
      });

      expect(apmProcess.started).not.toBe(true);

      await new Promise((resolve) => {
        exitCallback.and.callFake(() => {
          expect(apmProcess.started).toBe(true);
          resolve();
        })

        apmProcess.start();
      })

      expect(stderr).toContain('apm - Atom Package Manager');
      expect(stdout).toEqual('');
    }));
  /**
  * TODO: FAILING TEST - This test fails with the following output:
  * timeout: timed out after 120000 msec waiting for condition
  */
  xit('calls the specified stdout, stderr, and exit callbacks', async function() {
    let stdout = '';
    let stderr = '';

    await new Promise((resolve) => {
      new BufferedProcess({
        command: atom.packages.getApmPath(),
        args: ['-h'],
        options: {},
        stdout(lines) {
          stdout += lines;
        },
        stderr(lines) {
          stderr += lines;
        },
        exit: resolve
      });
    })

    expect(stderr).toContain('apm - Atom Package Manager');
    expect(stdout).toEqual('');
  });

  it('calls the specified stdout callback with whole lines', async function() {
    const exitCallback = jasmine.createSpy('exit callback');
    const loremPath = require.resolve('./fixtures/lorem.txt');
    const content = fs.readFileSync(loremPath).toString();
    let stdout = '';
    let allLinesEndWithNewline = true;

    await new Promise((resolve) => {
      exitCallback.and.callFake(resolve)

      new BufferedProcess({
        command: process.platform === 'win32' ? 'type' : 'cat',
        args: [loremPath],
        options: {},
        stdout(lines) {
          const endsWithNewline = lines.charAt(lines.length - 1) === '\n';
          if (!endsWithNewline) {
            allLinesEndWithNewline = false;
          }
          stdout += lines;
        },
        exit: exitCallback
      });
    });

    expect(allLinesEndWithNewline).toBe(true);
    expect(stdout).toBe(content);
  });

  describe('on Windows', function() {
    let originalPlatform = null;

    beforeEach(function() {
      // Prevent any commands from actually running and affecting the host
      spyOn(ChildProcess, 'spawn');
      originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
    });

    afterEach(() =>
      Object.defineProperty(process, 'platform', { value: originalPlatform })
    );

    describe('when the explorer command is spawned on Windows', () =>
      it("doesn't quote arguments of the form /root,C...", function() {
        new BufferedProcess({
          command: 'explorer.exe',
          args: ['/root,C:\\foo']
        });
        expect(ChildProcess.spawn.calls.argsFor(0)[1][3]).toBe(
          '"explorer.exe /root,C:\\foo"'
        );
      }));

    it('spawns the command using a cmd.exe wrapper when options.shell is undefined', function() {
      new BufferedProcess({ command: 'dir' });
      expect(path.basename(ChildProcess.spawn.calls.argsFor(0)[0])).toBe(
        'cmd.exe'
      );
      expect(ChildProcess.spawn.calls.argsFor(0)[1][0]).toBe('/s');
      expect(ChildProcess.spawn.calls.argsFor(0)[1][1]).toBe('/d');
      expect(ChildProcess.spawn.calls.argsFor(0)[1][2]).toBe('/c');
      expect(ChildProcess.spawn.calls.argsFor(0)[1][3]).toBe('"dir"');
    });
  });
});
