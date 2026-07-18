const assert = require('./keymap-spec-helpers/assert')
/** @babel */
/* eslint-env mocha */
/* global assert */

const PartialKeyupMatcher = require('../src/partial-keyup-matcher.js')
const {KeyBinding} = require('../src/key-binding')

describe('PartialKeyupMatcher', () => {
  it('returns a simple single-modifier-keyup match', () => {
    const matcher = new PartialKeyupMatcher()
    const kb = keyBindingArgHelper('ctrl-tab ^ctrl')
    matcher.addPendingMatch(kb)
    const matches = matcher.getMatches('^ctrl')
    assert.equal(matches.length, 1)
    assert.equal(matches[0], kb)
    assert.equal(matcher.getMatches('^ctrl').length, 0)
  })

  it('does not match multiple keyup binding on single keyup events', () => {
    const matcher = new PartialKeyupMatcher()
    const kb = keyBindingArgHelper('ctrl-shift-tab ^ctrl-shift')
    matcher.addPendingMatch(kb)
    let matches = matcher.getMatches('^ctrl')
    assert.equal(matches.length, 0)
    matches = matcher.getMatches('^shift')
    assert.equal(matches.length, 0)
  })

  it('for multi-keystroke bindings, matches only when all keyups are received', () => {
    const matcher = new PartialKeyupMatcher()
    const kb = keyBindingArgHelper('ctrl-shift-tab ^ctrl ^shift')
    matcher.addPendingMatch(kb)
    let matches = matcher.getMatches('^shift') // no-op should return no match
    assert.equal(matches.length, 0)
     // should return no match but set state to match on next ^ctrl
    matches = matcher.getMatches('^ctrl')
    assert.equal(matches.length, 0)
    matches = matcher.getMatches('^shift')
    assert.equal(matches.length, 1)
    assert.equal(matches[0], kb)
    assert.equal(matcher.getMatches('^ctrl').length, 0)
  })
})

function keyBindingArgHelper (binding) {
  return new KeyBinding('test', 'test', binding, 'body', 0)
}
