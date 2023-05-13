const BufferedProcess = require('./buffered-process');

/**
 * @class BufferedNodeProcess
 * @classdesc Extended: Like {BufferedProcess}, but accepts a Node script as
 * the command to run.
 * This is necessary on Windows since it doesn't support shebang `#!` lines.
 * @example
 * const {BufferedNodeProcess} = require('atom');
 * @extends BufferedProcess
 */
module.exports = class BufferedNodeProcess extends BufferedProcess {
  /**
   * @memberof BufferedNodeProcess
   * Public: Runs the given Node script by spawning a new child process.
   * @param {object} options
   * @param {string} options.command - The string path to the JavaScript script
   * to execute.
   * @param {array} [options.args] - The array of arguments to pass to the script.
   * @param {object} [options.options] - THe options object to pass to Node's
   * `ChildProcess.spawn` method.
   * @param {function} [options.stdout] The callback function that receives a
   * single argument which contains the standard output from the commnad. The
   * callback is called as data is received by it's buffered to ensure only
   * complete lines are passed until the source stream closes. After the source
   * stream has closed all remaining data is sent in a final call.
   * @param {function} [options.stderr] - The callback function that receives a
   * single argument which contains the standard error output from the command.
   * The callback is called as data is received but it's buffered to ensure only
   * complete lines are pased until the source stream closes. After the source
   * stream has closed all remaining data is sent in a final call.
   * @param {function} [options.exit] - The callback function which receives a
   * single argument containing the exit status.
   */
  constructor({ command, args, options = {}, stdout, stderr, exit }) {
    options.env = options.env || Object.create(process.env);
    options.env.ELECTRON_RUN_AS_NODE = 1;
    options.env.ELECTRON_NO_ATTACH_CONSOLE = 1;

    args = args ? args.slice() : [];
    args.unshift(command);
    args.unshift('--no-deprecation');

    super({
      command: process.execPath,
      args,
      options,
      stdout,
      stderr,
      exit
    });
  }
};
