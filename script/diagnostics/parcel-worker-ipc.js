#!/usr/bin/env node
//
// TEMPORARY diagnostic. Delete with the rest of `script/diagnostics/`.
//
// The next rung up from `parcel-nested-unsubscribe.js`. That one talks to
// `@parcel/watcher` directly and has now survived 30 scenario runs on Windows
// under both hosts, while the `adopts existing child watchers` spec keeps
// failing about one run in three.
//
// So this drives the *real* worker instead: forks `watcher-task-bootstrap.js`
// with `parcel-watcher-worker.js` exactly as `WatcherTask` does, and sends it
// the same `watcher:watch` / `watcher:unwatch` messages the registry sends
// during an adoption. That adds the Electron host, the IPC channel, the
// bootstrap and the worker's own code — everything except Pulsar's registry and
// `PathWatcher`.
//
// Usage: node script/diagnostics/parcel-worker-ipc.js

const { fork } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SETTLE_MS = 5000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function makeTree() {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'parcel-ipc-')
  );
  const subs = [path.join(root, 'subdir0'), path.join(root, 'subdir1')];
  for (const dir of subs) fs.mkdirSync(dir);
  // Exactly as the spec does: the files exist before anything is watching.
  fs.writeFileSync(path.join(root, 'rootfile.txt'), 'rootfile\n');
  fs.writeFileSync(path.join(subs[0], 'subfile0.txt'), 'subfile 0\n');
  fs.writeFileSync(path.join(subs[1], 'subfile1.txt'), 'subfile 1\n');
  return { root, subs };
}

async function main() {
  const { root, subs } = makeTree();
  const events = [];
  const replies = new Map();
  let ready = null;

  const child = fork(
    path.join(ROOT, 'src', 'watcher-task-bootstrap.js'),
    ['--no-deprecation', path.join(ROOT, 'src', 'path-watchers', 'parcel-watcher-worker.js')],
    {
      execPath: require('electron'),
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        ELECTRON_NO_ATTACH_CONSOLE: '1',
        userAgent: 'diagnostic'
      },
      silent: true
    }
  );

  child.stderr.on('data', d => console.log('[worker stderr]', d.toString().trim()));
  child.on('message', ({ event, args }) => {
    if (event === 'watcher:ready') {
      if (ready) ready();
      return;
    }
    if (event === 'watcher:reply') {
      const [{ id }] = args;
      const resolve = replies.get(id);
      if (resolve) {
        replies.delete(id);
        resolve();
      }
      return;
    }
    if (event === 'watcher:events') {
      const [{ id, events: batch }] = args;
      for (const e of batch) events.push(`${id} ${e.action} ${e.path}`);
      return;
    }
    if (event === 'task:log' || event === 'task:error') {
      console.log('[worker]', ...args[0]);
    }
  });

  let seq = 0;
  const send = (event, args) => {
    const id = `req${++seq}`;
    const settled = new Promise(resolve => replies.set(id, resolve));
    child.send(JSON.stringify({ id, event, args }));
    return settled;
  };

  await new Promise(resolve => {
    ready = resolve;
    child.send({ event: 'start', args: [{ logging: true }] });
  });

  // The adoption sequence, in the order the registry issues it.
  //
  // `PIPELINE=1` sends them without waiting for each reply. Awaiting paces the
  // messages by a full IPC round trip, and the worker's own log shows that
  // matters: in a failing spec run the whole handover collapses into ~2ms, with
  // the second and third subscribes resolving in 0.2ms each, while this
  // diagnostic's paced version takes ~7ms with 2ms subscribes — and survives.
  // A passing spec run is slower still, ~20ms. Pipelining is the closest we can
  // get to the failing cadence.
  const pipeline = process.env.PIPELINE === '1';
  const watches = [
    send('watcher:watch', { normalizedPath: subs[0], instance: 'child0', ignored: [] }),
    ...(pipeline ? [] : [null])
  ].filter(Boolean);
  if (pipeline) {
    watches.push(
      send('watcher:watch', { normalizedPath: subs[1], instance: 'child1', ignored: [] }),
      send('watcher:watch', { normalizedPath: root, instance: 'parent', ignored: [] })
    );
    await Promise.all(watches);
  } else {
    await watches[0];
    await send('watcher:watch', { normalizedPath: subs[1], instance: 'child1', ignored: [] });
    await send('watcher:watch', { normalizedPath: root, instance: 'parent', ignored: [] });
  }

  // Both children released at once, without awaiting either — matching the
  // `[4] unwatch start` / `[5] unwatch start` pairing in the worker's own log.
  await Promise.all([
    send('watcher:unwatch', { instance: 'child0' }),
    send('watcher:unwatch', { instance: 'child1' })
  ]);

  events.length = 0;
  fs.appendFileSync(path.join(root, 'rootfile.txt'), 'change\n');
  fs.appendFileSync(path.join(subs[0], 'subfile0.txt'), 'change\n');
  fs.appendFileSync(path.join(subs[1], 'subfile1.txt'), 'change\n');
  await wait(SETTLE_MS);

  console.log(`\nevents reported after the handover (${events.length}):`);
  for (const line of events) console.log(`    ${line}`);

  const saw = name => events.some(line => line.includes(name));
  const missing = ['rootfile.txt', 'subfile0.txt', 'subfile1.txt'].filter(f => !saw(f));
  const verdict = missing.length === 0
    ? 'survived'
    : `REPRODUCED — never saw: ${missing.join(', ')}`;
  console.log(
    `\nVERDICT (${process.platform}, real worker over IPC, ${pipeline ? 'pipelined' : 'paced'}): ${verdict}`
  );

  child.kill();
  fs.rmSync(root, { recursive: true, force: true });
}

main().catch(err => {
  console.error('diagnostic failed to run:', err);
  process.exit(1);
});
