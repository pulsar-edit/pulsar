/* eslint-disable no-new */
const path = require('path');
const BufferedNodeProcess = require('../src/buffered-node-process');

describe('BufferedNodeProcess', function() {
  it('executes the script in a new process', async function() {
    let output = '';
    const stdout = lines => (output += lines);
    let error = '';
    const stderr = lines => (error += lines);
    const args = ['hi'];
    const command = path.join(__dirname, 'fixtures', 'script.js');

    await new Promise((resolve) => {
      new BufferedNodeProcess({ command, args, stdout, stderr, exit: resolve });
    })

    expect(output).toBe('hi');
    expect(error).toBe('');
    expect(args).toEqual(['hi']);
  });

  it('suppresses deprecations in the new process', async function() {
    const exit = jasmine.createSpy('exitCallback');
    let output = '';
    const stdout = lines => (output += lines);
    let error = '';
    const stderr = lines => (error += lines);
    const command = path.join(
      __dirname,
      'fixtures',
      'script-with-deprecations.js'
    );

    await new Promise((resolve) => {
      new BufferedNodeProcess({ command, stdout, stderr, exit: resolve });
    })

    expect(output).toBe('hi');
    expect(error).toBe('');
  });
});
