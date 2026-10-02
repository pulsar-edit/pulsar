#!/usr/bin/env node
//
// TEMPORARY diagnostic. Delete with the rest of `script/diagnostics/`.
//
// Hypothesis, arrived at by elimination rather than by guessing: on Windows,
// `@parcel/watcher` sometimes returns a subscription that never delivers
// anything. Not a lost first event — a dead subscription.
//
// The evidence for it: with Pulsar's watcher-sharing scheme bypassed entirely,
// the failing spec still fails, and the failures show one of its three
// independent subscriptions reporting nothing at all for ten seconds while the
// others work. Adoption, consolidation, reattachment and unsubscribing are all
// ruled out — every one of them was removed and the failure survived.
//
// Every earlier diagnostic missed this because they all watched one subscription
// and checked it once. This checks every subscription, many times over, which is
// what a few-percent per-subscription failure rate needs.
//
// Usage: node script/diagnostics/parcel-dead-subscription.js [iterations]

const watcher = require('@parcel/watcher');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ITERATIONS = Number(process.argv[2] || 40);
const SETTLE_MS = 2500;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// One subscription, one pre-existing file, one append. The simplest thing that
// could possibly be dead.
async function single(i) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dead-single-'));
  const file = path.join(root, 'existing.txt');
  fs.writeFileSync(file, 'hi\n');

  const seen = [];
  const sub = await watcher.subscribe(root, (err, events) => {
    if (!err) seen.push(...events.map(e => e.path));
  });

  fs.appendFileSync(file, 'change\n');
  await wait(SETTLE_MS);
  await sub.unsubscribe();
  fs.rmSync(root, { recursive: true, force: true });

  return seen.some(p => p.endsWith('existing.txt'));
}

// Three overlapping subscriptions created in quick succession — two children and
// their parent — each with its own file. Every one of them has to report its own
// file, which is what the spec actually requires and what no diagnostic has
// checked before.
async function overlapping(i) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dead-overlap-'));
  const subs = [path.join(root, 'subdir0'), path.join(root, 'subdir1')];
  for (const dir of subs) fs.mkdirSync(dir);

  const files = {
    root: path.join(root, 'rootfile.txt'),
    child0: path.join(subs[0], 'subfile0.txt'),
    child1: path.join(subs[1], 'subfile1.txt')
  };
  for (const file of Object.values(files)) fs.writeFileSync(file, 'hi\n');

  const seen = { child0: [], child1: [], parent: [] };
  const collect = key => (err, events) => {
    if (!err) seen[key].push(...events.map(e => e.path));
  };

  const handles = [];
  handles.push(await watcher.subscribe(subs[0], collect('child0')));
  handles.push(await watcher.subscribe(subs[1], collect('child1')));
  handles.push(await watcher.subscribe(root, collect('parent')));

  for (const file of Object.values(files)) fs.appendFileSync(file, 'change\n');
  await wait(SETTLE_MS);
  for (const handle of handles) await handle.unsubscribe();
  fs.rmSync(root, { recursive: true, force: true });

  // Each subscription must have seen its own file; the parent must see all three.
  const dead = [];
  if (!seen.child0.some(p => p.endsWith('subfile0.txt'))) dead.push('child0');
  if (!seen.child1.some(p => p.endsWith('subfile1.txt'))) dead.push('child1');
  for (const [key, file] of Object.entries(files)) {
    if (!seen.parent.some(p => p === file)) dead.push(`parent/${key}`);
  }
  return dead;
}

async function main() {
  console.log(`platform: ${process.platform} (${process.arch})`);
  console.log(`@parcel/watcher: ${require('@parcel/watcher/package.json').version}`);
  console.log(`iterations: ${ITERATIONS}\n`);

  let singleDead = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const ok = await single(i);
    if (!ok) {
      singleDead++;
      console.log(`  single #${i}: DEAD — no event for the append`);
    }
  }
  console.log(`single subscription: ${singleDead}/${ITERATIONS} dead`);

  let overlapDead = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const dead = await overlapping(i);
    if (dead.length) {
      overlapDead++;
      console.log(`  overlapping #${i}: DEAD — ${dead.join(', ')}`);
    }
  }
  console.log(`three overlapping subscriptions: ${overlapDead}/${ITERATIONS} with a dead one`);

  console.log(
    `\nVERDICT (${process.platform}): ${
      singleDead || overlapDead ? 'REPRODUCED' : 'not reproduced'
    }`
  );
}

main().catch(err => {
  console.error('diagnostic failed to run:', err);
  process.exit(1);
});
