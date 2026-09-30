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

function makeTree() {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'parcel-repro-')
  );
  const subs = [path.join(root, 'subdir0'), path.join(root, 'subdir1')];
  for (const dir of subs) fs.mkdirSync(dir);
  return { root, subs };
}

async function scenario(name, { settleBeforeUnsubscribe }) {
  const { root, subs } = makeTree();
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
  for (const dir of subs) children.push(await watcher.subscribe(dir, () => {}));
  await wait(200);

  const parent = await watcher.subscribe(root, collect);

  let controlCount = null;
  if (settleBeforeUnsubscribe) {
    // Prove the parent is delivering before we touch anything.
    fs.writeFileSync(path.join(subs[0], 'before.txt'), 'x');
    await wait(SETTLE_MS);
    controlCount = parentEvents.length;
  }

  for (const child of children) await child.unsubscribe();

  parentEvents.length = 0;
  fs.writeFileSync(path.join(subs[0], 'after-in-child.txt'), 'x');
  fs.writeFileSync(path.join(root, 'after-in-root.txt'), 'x');
  await wait(SETTLE_MS);

  const seen = parentEvents.length;
  console.log(`  ${name}:`);
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

  console.log(`\nSUMMARY (${process.platform}): relaxed=${relaxed} | tight=${tight}`);
}

main().catch(err => {
  console.error('diagnostic failed to run:', err);
  process.exit(1);
});
