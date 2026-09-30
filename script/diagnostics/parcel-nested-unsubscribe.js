#!/usr/bin/env node
//
// TEMPORARY diagnostic. Delete once the question below is answered.
//
// Does unsubscribing a child directory watch kill a parent watch that overlaps
// it? That is the exact shape our `adopts existing child watchers` spec hits:
// two child subscriptions, then a parent subscription, then both children
// unsubscribed — after which, on Windows, that spec sees no events at all for
// ten seconds despite three live subscriptions.
//
// This talks to `@parcel/watcher` directly, with no Pulsar in the picture, so
// whichever way it comes out tells us which side of the boundary the bug is on.
//
// Usage: node script/diagnostics/parcel-nested-unsubscribe.js

const watcher = require('@parcel/watcher');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SETTLE_MS = 2000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'parcel-repro-')
  );
  const sub0 = path.join(root, 'subdir0');
  const sub1 = path.join(root, 'subdir1');
  fs.mkdirSync(sub0);
  fs.mkdirSync(sub1);

  console.log(`platform: ${process.platform} (${process.arch})`);
  console.log(`@parcel/watcher: ${require('@parcel/watcher/package.json').version}`);
  console.log(`root: ${root}\n`);

  const seen = { parent: [], child0: [], child1: [] };
  const collect = key => (err, events) => {
    if (err) {
      console.log(`[${key}] error: ${err.message}`);
      return;
    }
    for (const event of events) seen[key].push(`${event.type} ${event.path}`);
  };

  // Subscribe in the order our registry does when it consolidates: the children
  // already exist, and the parent arrives afterwards.
  const child0 = await watcher.subscribe(sub0, collect('child0'));
  const child1 = await watcher.subscribe(sub1, collect('child1'));
  await wait(200);
  const parent = await watcher.subscribe(root, collect('parent'));
  await wait(200);

  // Control: with all three live, does the parent hear about a write?
  fs.writeFileSync(path.join(sub0, 'before.txt'), 'x');
  await wait(SETTLE_MS);
  const controlCount = seen.parent.length;
  console.log(`control — parent saw ${controlCount} event(s) while children were subscribed`);
  for (const line of seen.parent) console.log(`    ${line}`);

  // The step under suspicion.
  await child0.unsubscribe();
  await child1.unsubscribe();
  await wait(200);

  seen.parent.length = 0;
  fs.writeFileSync(path.join(sub0, 'after-in-child.txt'), 'x');
  fs.writeFileSync(path.join(root, 'after-in-root.txt'), 'x');
  await wait(SETTLE_MS);

  console.log(`\nafter unsubscribing both children — parent saw ${seen.parent.length} event(s)`);
  for (const line of seen.parent) console.log(`    ${line}`);

  let verdict;
  if (controlCount === 0) {
    verdict = 'INCONCLUSIVE — the parent heard nothing even before the unsubscribes';
  } else if (seen.parent.length === 0) {
    verdict = 'REPRODUCED — unsubscribing the children killed the parent watch';
  } else if (seen.parent.length < 2) {
    verdict = `PARTIAL — parent saw ${seen.parent.length} of 2 writes after the unsubscribes`;
  } else {
    verdict = 'NOT REPRODUCED — the parent watch survived';
  }
  console.log(`\nVERDICT (${process.platform}): ${verdict}`);

  await parent.unsubscribe();
  fs.rmSync(root, { recursive: true, force: true });
}

main().catch(err => {
  console.error('diagnostic failed to run:', err);
  process.exit(1);
});
