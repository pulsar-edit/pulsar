#!/usr/bin/env node
//
// TEMPORARY diagnostic. Delete once the question below is answered.
//
// Does unsubscribing a child directory watch kill a parent watch that overlaps
// it? That is the shape our `adopts existing child watchers` spec hits: two
// child subscriptions, then a parent subscription, then both children
// unsubscribed — after which, on Windows, that spec has seen no events at all
// for ten seconds despite three live subscriptions.
//
// Two scenarios, because the first version of this tested only the relaxed one
// and came back clean five times on Windows while the spec still flaked:
//
//   relaxed — settle after the parent subscribes, then unsubscribe the children.
//   tight   — unsubscribe the children the instant the parent's subscribe
//             resolves, which is what our registry actually does. `subscribe`
//             resolving is not the same as the watch delivering: CI logs put the
//             first event 100-200ms later, so this tears the children down
//             inside a window where the parent isn't yet live.
//
// Talks to `@parcel/watcher` directly, with no Pulsar in the picture, so
// whichever way it comes out tells us which side of the boundary the bug is on.
//
// Usage: node script/diagnostics/parcel-nested-unsubscribe.js

const watcher = require('@parcel/watcher');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SETTLE_MS = 2000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// How long each `subscribe` took. That turns out to be the tell: in a healthy CI
// run each takes 18-100ms, and in a failing one the second and third resolve in
// under a millisecond — apparently without establishing a watch of their own. If
// a scenario here reports sub-millisecond subscribes and the parent still
// survives, then fast resolution isn't sufficient to cause the failure and the
// signature is something else.
const timings = [];
async function timedSubscribe(dir, cb) {
  const started = performance.now();
  const handle = await watcher.subscribe(dir, cb);
  timings.push(`${path.basename(dir)}=${(performance.now() - started).toFixed(1)}ms`);
  return handle;
}

function makeTree() {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'parcel-repro-')
  );
  const subs = [path.join(root, 'subdir0'), path.join(root, 'subdir1')];
  for (const dir of subs) fs.mkdirSync(dir);
  return { root, subs };
}

async function scenario(
  name,
  { settleBeforeUnsubscribe, concurrent = false, burst = false }
) {
  const { root, subs } = makeTree();
  timings.length = 0;
  const parentEvents = [];
  const collect = (err, events) => {
    if (err) {
      console.log(`    [parent] error: ${err.message}`);
      return;
    }
    parentEvents.push(...events.map(e => `${e.type} ${e.path}`));
  };

  // Subscribe in the order our registry consolidates in: children first, parent
  // afterwards.
  const children = [];
  let parent;
  if (burst) {
    // All three subscriptions issued back to back, with no settle between them.
    // This is what a failing CI run looks like: the first subscribe takes ~100ms
    // and the next two resolve in under a millisecond, all inside the same
    // millisecond overall — whereas in a healthy run each takes 18-100ms. The
    // instant returns suggest the later subscriptions are collapsing onto shared
    // state rather than establishing watches of their own, which would explain
    // why releasing the children then leaves the parent dead.
    for (const dir of subs) children.push(await timedSubscribe(dir, () => {}));
    parent = await timedSubscribe(root, collect);
  } else {
    for (const dir of subs) children.push(await timedSubscribe(dir, () => {}));
    await wait(200);
    parent = await timedSubscribe(root, collect);
  }

  let controlCount = null;
  if (settleBeforeUnsubscribe) {
    // Prove the parent is delivering before we touch anything.
    fs.writeFileSync(path.join(subs[0], 'before.txt'), 'x');
    await wait(SETTLE_MS);
    controlCount = parentEvents.length;
  }

  if (concurrent) {
    // What our worker actually does. Requests arrive as separate IPC messages
    // handled by an `async` function, so the two child releases overlap rather
    // than running one after the other — confirmed from the worker's own log,
    // where both `unwatch start` lines appear before either `unwatch done`.
    await Promise.all(children.map(child => child.unsubscribe()));
  } else {
    for (const child of children) await child.unsubscribe();
  }

  parentEvents.length = 0;
  fs.writeFileSync(path.join(subs[0], 'after-in-child.txt'), 'x');
  fs.writeFileSync(path.join(root, 'after-in-root.txt'), 'x');
  await wait(SETTLE_MS);

  const seen = parentEvents.length;
  console.log(`  ${name}:`);
  console.log(`    subscribe durations: ${timings.join(', ')}`);
  if (controlCount !== null) {
    console.log(`    control: parent saw ${controlCount} event(s) before the unsubscribes`);
  }
  console.log(`    after unsubscribing children: parent saw ${seen} of 2 write(s)`);
  for (const line of parentEvents) console.log(`      ${line}`);

  let verdict;
  if (controlCount === 0) {
    verdict = 'INCONCLUSIVE';
  } else if (seen === 0) {
    verdict = 'REPRODUCED';
  } else if (seen < 2) {
    verdict = `PARTIAL(${seen}/2)`;
  } else {
    verdict = 'survived';
  }
  console.log(`    verdict: ${verdict}`);

  await parent.unsubscribe();
  fs.rmSync(root, { recursive: true, force: true });
  return verdict;
}

async function main() {
  console.log(`platform: ${process.platform} (${process.arch})`);
  console.log(
    `@parcel/watcher: ${require('@parcel/watcher/package.json').version}\n`
  );

  const relaxed = await scenario('relaxed (settle, then unsubscribe)', {
    settleBeforeUnsubscribe: true
  });
  const tight = await scenario('tight (unsubscribe immediately)', {
    settleBeforeUnsubscribe: false
  });
  const concurrent = await scenario('concurrent (both children at once)', {
    settleBeforeUnsubscribe: false,
    concurrent: true
  });
  const burst = await scenario('burst (no settle between subscribes)', {
    settleBeforeUnsubscribe: false,
    concurrent: true,
    burst: true
  });

  console.log(
    `\nSUMMARY (${process.platform}): relaxed=${relaxed} | tight=${tight} | concurrent=${concurrent} | burst=${burst}`
  );
}

main().catch(err => {
  console.error('diagnostic failed to run:', err);
  process.exit(1);
});
