#!/usr/bin/env node
//
// TEMPORARY diagnostic. Delete with the rest of `script/diagnostics/`.
//
// Measures how long a fresh `@parcel/watcher` subscription takes to start
// delivering, by writing repeatedly and recording when the first event arrives.
//
// Why this and not "does it deliver at all": the specs that flake with a
// single-shot write are fixed by writing repeatedly for up to 5s, which means
// delivery does begin — just after the first write is already gone. So the
// interesting quantity is the delay, and its tail. A subscription that is merely
// late is a different problem from one that is dead, and they need different
// fixes.
//
// Reports the distribution across iterations, for one subscription and for three
// overlapping ones (two children plus their parent, which is the shape of the
// spec that still fails).
//
// Usage: node script/diagnostics/parcel-delivery-latency.js [iterations]

const watcher = require('@parcel/watcher');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ITERATIONS = Number(process.argv[2] || 30);
const POKE_EVERY_MS = 100;
const GIVE_UP_MS = 12000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function tmpTree(prefix, childCount) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), prefix));
  const dirs = [];
  for (let i = 0; i < childCount; i++) {
    const dir = path.join(root, `subdir${i}`);
    fs.mkdirSync(dir);
    dirs.push(dir);
  }
  return { root, dirs };
}

// Poke `file` every 100ms until `isSatisfied()` or we give up. Returns the delay
// in ms, or null.
async function pokeUntilDelivered(file, isSatisfied) {
  const started = Date.now();
  while (Date.now() - started < GIVE_UP_MS) {
    fs.appendFileSync(file, 'poke\n');
    await wait(POKE_EVERY_MS);
    if (isSatisfied()) return Date.now() - started;
  }
  return null;
}

async function single() {
  const { root } = tmpTree('latency-single-', 0);
  const file = path.join(root, 'existing.txt');
  fs.writeFileSync(file, 'hi\n');

  let delivered = false;
  const sub = await watcher.subscribe(root, (err, events) => {
    if (!err && events.some(e => e.path.endsWith('existing.txt'))) delivered = true;
  });

  const delay = await pokeUntilDelivered(file, () => delivered);
  await sub.unsubscribe();
  fs.rmSync(root, { recursive: true, force: true });
  return { parent: delay };
}

async function overlapping() {
  const { root, dirs } = tmpTree('latency-overlap-', 2);
  const files = {
    parent: path.join(root, 'rootfile.txt'),
    child0: path.join(dirs[0], 'subfile0.txt'),
    child1: path.join(dirs[1], 'subfile1.txt')
  };
  for (const file of Object.values(files)) fs.writeFileSync(file, 'hi\n');

  const delivered = { child0: false, child1: false, parent: false };
  const collect = (key, suffix) => (err, events) => {
    if (!err && events.some(e => e.path.endsWith(suffix))) delivered[key] = true;
  };

  // Created back to back, as the spec creates them.
  const handles = [
    await watcher.subscribe(dirs[0], collect('child0', 'subfile0.txt')),
    await watcher.subscribe(dirs[1], collect('child1', 'subfile1.txt')),
    await watcher.subscribe(root, collect('parent', 'rootfile.txt'))
  ];

  // Poke all three so each subscription has something of its own to report.
  const started = Date.now();
  const delays = { child0: null, child1: null, parent: null };
  while (Date.now() - started < GIVE_UP_MS) {
    for (const file of Object.values(files)) fs.appendFileSync(file, 'poke\n');
    await wait(POKE_EVERY_MS);
    for (const key of Object.keys(delays)) {
      if (delays[key] === null && delivered[key]) delays[key] = Date.now() - started;
    }
    if (Object.values(delays).every(d => d !== null)) break;
  }

  for (const handle of handles) await handle.unsubscribe();
  fs.rmSync(root, { recursive: true, force: true });
  return delays;
}

function summarize(label, samples) {
  const dead = samples.filter(d => d === null).length;
  const got = samples.filter(d => d !== null).sort((a, b) => a - b);
  const at = q => (got.length ? got[Math.min(got.length - 1, Math.floor(q * got.length))] : '-');
  console.log(
    `${label}: n=${samples.length} dead=${dead} ` +
      `min=${got[0] ?? '-'}ms median=${at(0.5)}ms p90=${at(0.9)}ms max=${got[got.length - 1] ?? '-'}ms`
  );
  const slow = got.filter(d => d > 1000);
  if (slow.length) console.log(`    over 1s: ${slow.join(', ')}ms`);
}

async function main() {
  console.log(`platform: ${process.platform} (${process.arch})`);
  console.log(`@parcel/watcher: ${require('@parcel/watcher/package.json').version}`);
  console.log(`iterations: ${ITERATIONS}, poke every ${POKE_EVERY_MS}ms, give up at ${GIVE_UP_MS}ms\n`);

  const singles = [];
  for (let i = 0; i < ITERATIONS; i++) singles.push((await single()).parent);
  summarize('single subscription      ', singles);

  const over = { child0: [], child1: [], parent: [] };
  for (let i = 0; i < ITERATIONS; i++) {
    const delays = await overlapping();
    for (const key of Object.keys(over)) over[key].push(delays[key]);
  }
  for (const key of Object.keys(over)) summarize(`overlapping/${key.padEnd(12)}`, over[key]);

  const allDead = [...singles, ...over.child0, ...over.child1, ...over.parent].filter(d => d === null).length;
  console.log(
    `\nVERDICT (${process.platform}): ${
      allDead ? `${allDead} subscription(s) never delivered inside ${GIVE_UP_MS}ms` : 'every subscription delivered'
    }`
  );
}

main().catch(err => {
  console.error('diagnostic failed to run:', err);
  process.exit(1);
});
