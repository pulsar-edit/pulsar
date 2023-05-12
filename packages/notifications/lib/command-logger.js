/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// Originally from lee-dohm/bug-report
// https://github.com/lee-dohm/bug-report/blob/master/lib/command-logger.coffee

// Command names that are ignored and not included in the log. This uses an Object to provide fast
// string matching.
let CommandLogger;
const ignoredCommands = {
  'show.bs.tooltip': true,
  'shown.bs.tooltip': true,
  'hide.bs.tooltip': true,
  'hidden.bs.tooltip': true,
  'editor:display-updated': true,
  'mousewheel': true
};

// Ten minutes in milliseconds.
const tenMinutes = 10 * 60 * 1000;

// Public: Handles logging all of the Pulsar commands for the automatic repro steps feature.
//
// It uses an array as a circular data structure to log only the most recent commands.
module.exports =
(CommandLogger = (function() {
  CommandLogger = class CommandLogger {
    static initClass() {
  
      // Public: Maximum size of the log.
      this.prototype.logSize = 16;
    }
    static instance() {
      return this._instance != null ? this._instance : (this._instance = new CommandLogger);
    }

    static start() {
      return this.instance().start();
    }

    // Public: Creates a new logger.
    constructor() {
      this.initLog();
    }

    start() {
      return atom.commands.onWillDispatch(event => {
        return this.logCommand(event);
      });
    }

    // Public: Formats the command log for the bug report.
    //
    // * `externalData` An {Object} containing other information to include in the log.
    //
    // Returns a {String} of the Markdown for the report.
    getText(externalData) {
      const lines = [];
      const lastTime = Date.now();

      this.eachEvent(event => {
        if (event.time > lastTime) { return; }
        if (!event.name || ((lastTime - event.time) >= tenMinutes)) { return; }
        return lines.push(this.formatEvent(event, lastTime));
      });

      if (externalData) {
        lines.push(`     ${this.formatTime(0)} ${externalData.title}`);
      }

      lines.unshift('```');
      lines.push('```');
      return lines.join("\n");
    }

    // Public: Gets the latest event from the log.
    //
    // Returns the event {Object}.
    latestEvent() {
      return this.eventLog[this.logIndex];
    }

    // Public: Logs the command.
    //
    // * `command` Command {Object} to be logged
    //   * `type` Name {String} of the command
    //   * `target` {String} describing where the command was triggered
    logCommand(command) {
      const {type: name, target, time} = command;
      if (command.detail != null ? command.detail.jQueryTrigger : undefined) { return; }
      if (name in ignoredCommands) { return; }

      let event = this.latestEvent();

      if (event.name === name) {
        return event.count++;
      } else {
        this.logIndex = (this.logIndex + 1) % this.logSize;
        event = this.latestEvent();
        event.name = name;
        event.targetNodeName = target.nodeName;
        event.targetClassName = target.className;
        event.targetId = target.id;
        event.count = 1;
        return event.time = time != null ? time : Date.now();
      }
    }

    // Private: Calculates the time of the last event to be reported.
    //
    // * `data` Data from an external bug passed in from another package.
    //
    // Returns the {Date} of the last event that should be reported.
    calculateLastEventTime(data) {
      if (data) { return data.time; }

      let lastTime = null;
      this.eachEvent(event => lastTime = event.time);
      return lastTime;
    }

    // Private: Executes a function on each event in chronological order.
    //
    // This function is used instead of similar underscore functions because the log is held in a
    // circular buffer.
    //
    // * `fn` {Function} to execute for each event in the log.
    //   * `event` An {Object} describing the event passed to your function.
    //
    // ## Examples
    //
    // This code would output the name of each event to the console.
    //
    // ```coffee
    // logger.eachEvent (event) ->
    //   console.log event.name
    // ```
    eachEvent(fn) {
      for (let offset = 1, end = this.logSize, asc = 1 <= end; asc ? offset <= end : offset >= end; asc ? offset++ : offset--) {
        fn(this.eventLog[(this.logIndex + offset) % this.logSize]);
      }
    }

    // Private: Format the command count for reporting.
    //
    // Returns the {String} format of the command count.
    formatCount(count) {
      switch (false) {
        case !(count < 2): return '    ';
        case !(count < 10): return `  ${count}x`;
        case !(count < 100): return ` ${count}x`;
      }
    }

    // Private: Formats a command event for reporting.
    //
    // * `event` Event {Object} to be formatted.
    // * `lastTime` {Date} of the last event to report.
    //
    // Returns the {String} format of the command event.
    formatEvent(event, lastTime) {
      const {count, time, name, targetNodeName, targetClassName, targetId} = event;
      const nodeText = targetNodeName.toLowerCase();
      const idText = targetId ? `#${targetId}` : '';
      let classText = '';
      if (targetClassName != null) { for (var klass of Array.from(targetClassName.split(" "))) { classText += `.${klass}`; } }
      return `${this.formatCount(count)} ${this.formatTime(lastTime - time)} ${name} (${nodeText}${idText}${classText})`;
    }

    // Private: Format the command time for reporting.
    //
    // * `time` {Date} to format
    //
    // Returns the {String} format of the command time.
    formatTime(time) {
      const minutes = Math.floor(time / 60000);
      let seconds = Math.floor(((time % 60000) / 1000) * 10) / 10;
      if (seconds < 10) { seconds = `0${seconds}`; }
      if (Math.floor(seconds) !== seconds) { seconds = `${seconds}.0`; }
      return `-${minutes}:${seconds}`;
    }

    // Private: Initializes the log structure for speed.
    initLog() {
      this.logIndex = 0;
      return this.eventLog = __range__(0, this.logSize, false).map((i) => ({
        name: null,
        count: 0,
        targetNodeName: null,
        targetClassName: null,
        targetId: null,
        time: null
      }));
    }
  };
  CommandLogger.initClass();
  return CommandLogger;
})());

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}