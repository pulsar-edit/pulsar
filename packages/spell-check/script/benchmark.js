#!/usr/bin/env node

const handler = require('../lib/spell-check-handler');
const fs = require('fs');

const pathToCheck = process.argv[2];
console.log('Spellchecking %s...', pathToCheck);

const text = fs.readFileSync(pathToCheck, 'utf8');

const t0 = Date.now();
const result = handler({ id: 1, text });
const t1 = Date.now();

console.log(
    'Found %d misspellings in %d milliseconds',
    result.misspellings.length,
    t1 - t0
);
