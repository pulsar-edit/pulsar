// Timing probes for the Windows CI slowdown.
//
// Some Windows runners execute this suite roughly 3.4x slower than others —
// same commit, same runner image, same `windows-2022` label. The penalty is
// established within the first hundred specs and holds to the end, and it
// does not touch `yarn install` or `yarn build`, which take the same time on
// fast and slow hosts alike. Specs that compute are unaffected; specs that
// wait take about 2.5x longer.
//
// So the question is which kind of waiting got slower. Each probe below
// isolates one kind, and `cpu` is the control: the build timings predict it
// will read the same everywhere.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ipcRenderer } = require('electron');

// The harness replaces `Date.now`, `window.setTimeout`, `window.setInterval`
// and `_.debounce` with fakes in a global `beforeEach` — see
// `jasmine2-time.js`. Capture the genuine implementations while this module
// is being required, which happens before `jasmineEnv.execute()` installs
// those spies.
const realSetTimeout = window.setTimeout.bind(window);
const realRequestAnimationFrame = window.requestAnimationFrame.bind(window);

// `performance.now()` is the one clock the harness leaves alone. `Date.now()`
// is pinned to 0 for the whole run, so it cannot measure anything here.
const now = () => performance.now();

const SLEEP_MS = 10000;
const SAMPLE_MS = 2000;
const MICROTASK_TURNS = 20000;
const IO_TURNS = 200;
const CPU_ITERATIONS = 5e6;

// Keeps the CPU probe's loop from being optimized away.
let sink = 0;

// Whether the renderer thinks it is on screen. Chromium throttles a hidden
// window's frames to roughly 1fps, so if the frame count collapses later in
// the run, this says whether that is the reason.
function windowState() {
  let focus;
  try {
    focus = document.hasFocus();
  } catch (error) {
    focus = 'unknown';
  }

  return [
    `visibility=${document.visibilityState}`,
    `hidden=${document.hidden}`,
    `focus=${focus}`,
    `size=${window.innerWidth}x${window.innerHeight}`
  ].join(' ');
}

function timeCpu() {
  const started = now();
  let accumulator = 0;
  for (let i = 1; i <= CPU_ITERATIONS; i++) {
    accumulator += Math.sqrt(i);
  }
  sink = accumulator;
  return now() - started;
}

async function timeMicrotasks() {
  const started = now();
  for (let i = 0; i < MICROTASK_TURNS; i++) {
    await Promise.resolve();
  }
  return now() - started;
}

// Frames and timer turns are sampled by counting how many arrive in a fixed
// window, rather than by timing how long a fixed number takes. An earlier
// version did the latter, and it could not tell a renderer ticking over at
// 1fps — which is what Chromium does to a window it thinks is hidden — from
// one that had stopped compositing altogether. Both simply failed to deliver
// their quota before the deadline. A count distinguishes them: 2 and 0 are
// different answers.
function countFrames(ms) {
  return new Promise(resolve => {
    const started = now();
    let frames = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      resolve({ count: frames, elapsed: now() - started });
    };

    const tick = () => {
      frames += 1;
      if (now() - started < ms) {
        realRequestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    realRequestAnimationFrame(tick);
    // The callback may never arrive at all, so close the sample on a real
    // timer regardless. Zero frames is the interesting answer, not a hang.
    realSetTimeout(finish, ms + 500);
  });
}

function countTimerTurns(ms) {
  return new Promise(resolve => {
    const started = now();
    let turns = 0;

    const tick = () => {
      turns += 1;
      if (now() - started < ms) {
        realSetTimeout(tick, 0);
      } else {
        resolve({ count: turns, elapsed: now() - started });
      }
    };

    realSetTimeout(tick, 0);
  });
}

function timeFileSystem() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pulsar-probe-'));
  const started = now();
  for (let i = 0; i < IO_TURNS; i++) {
    const file = path.join(directory, `probe-${i}`);
    fs.writeFileSync(file, 'probe');
    fs.statSync(file);
    fs.unlinkSync(file);
  }
  const elapsed = now() - started;
  fs.rmdirSync(directory);
  return elapsed;
}

// The control for the clock itself: if a real ten-second timer reads as
// anything but ten seconds, every other number here is suspect.
function timeSleep() {
  return new Promise(resolve => {
    const started = now();
    realSetTimeout(() => resolve(now() - started), SLEEP_MS);
  });
}

// Where the probe's own copy of its output goes. `ATOM_HOME` is the natural
// home for it on CI, since the crash-dump collector already knows how to
// translate that path; override with `PULSAR_PROBE_LOG` to put it elsewhere.
function logPath() {
  return (
    process.env.PULSAR_PROBE_LOG ||
    path.join(process.env.ATOM_HOME || os.tmpdir(), 'environment-probe.log')
  );
}

// Renderer `console.log` has not been dependable for getting diagnostics out
// of this harness, so send the result three ways and let whichever survives
// deliver it:
//
//   * `write-to-stderr`, the IPC channel the spec reporter itself uses to
//     reach the CI log (see `jasmine2-test-runner.js`) — the proven path;
//   * a file, which does not care what happens to the streams afterwards;
//   * `console.log`, which is the convenient one when running locally.
function report(line) {
  try {
    ipcRenderer.send('write-to-stderr', `${line}\n`);
  } catch (error) {
    // Not fatal — the other two channels still have it.
  }

  try {
    fs.appendFileSync(logPath(), `${line}\n`);
  } catch (error) {
    // Likewise.
  }

  console.log(line);
}

function format(label, value) {
  return `${label}=${value.toFixed(1)}ms`;
}

// Turns per second, and the average gap between turns — the latter is what
// makes timer clamping legible at a glance.
function rate(label, sample) {
  const perSecond = (1000 * sample.count) / sample.elapsed;
  const gap = sample.count === 0 ? 0 : sample.elapsed / sample.count;
  return `${label}=${sample.count} ${label}PerSec=${perSecond.toFixed(1)} ${label}Gap=${gap.toFixed(1)}ms`;
}

// Generous enough that a slow host cannot fail the spec, since a failure here
// would cost a timeout and tell us nothing.
exports.TIMEOUT_MS = SLEEP_MS + 120000;

exports.run = async label => {
  const cpu = timeCpu();
  // Read immediately before and after the frame sample: a window that goes
  // hidden partway through would otherwise be invisible in the output.
  const stateBeforeFrames = windowState();
  const frames = await countFrames(SAMPLE_MS);
  const stateAfterFrames = windowState();
  const microtasks = await timeMicrotasks();
  const timers = await countTimerTurns(SAMPLE_MS);
  const io = timeFileSystem();
  const slept = await timeSleep();

  const fields = [
    stateBeforeFrames === stateAfterFrames
      ? stateBeforeFrames
      : `${stateBeforeFrames} -> ${stateAfterFrames}`,
    format('cpu', cpu),
    rate('raf', frames),
    rate('timer', timers),
    format(`microtasks${MICROTASK_TURNS}`, microtasks),
    format(`io${IO_TURNS}`, io),
    format(`sleep${SLEEP_MS}`, slept)
  ];

  report(`PROBE[${label}] platform=${process.platform} ${fields.join(' ')}`);
};
