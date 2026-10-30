const fs = require('fs')
const os = require('os')
const path = require('path')
const {openAtom} = require('./helpers')
const { test, expect } = require('@playwright/test')

// Pulsar 1.133.0 crashed the renderer on Linux as soon as a file was opened
// from disk (pulsar-edit/pulsar#1685). The crash was in a native module's code
// path that runs only for buffers backed by a file — on load, on save, and on
// serialization — so tests that only edit untitled buffers never reach it.
// This one opens, edits, and saves a real file.
let editor
let fixtureDir
let crashed = false

test.describe('Opening an existing file', () => {
  test.beforeAll(async () => {
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulsar-open-file-'))
    editor = await openAtom("atom-home-open-file", "opening-existing-file")
    editor.page.on('crash', () => { crashed = true })
  })

  test.afterAll(async () => {
    await editor.app.close()
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  })

  test('opens, highlights, edits, and saves a file without crashing', async () => {
    const filePath = path.join(fixtureDir, 'sample.js')
    fs.writeFileSync(filePath, 'function aFunction() { return 10 }\n')

    // Loading the file is the first point at which the buffer asks its native
    // half for a digest of the file's contents.
    await editor.page.evaluate(async (p) => {
      await atom.workspace.open(p)
    }, filePath)
    const textEditor = editor.page.locator('atom-text-editor.is-focused')
    await expect(textEditor).toContainText('function aFunction()')

    // Nobody picked a grammar, so this also checks that Pulsar chose one from
    // the file extension.
    await expect(syntaxElement('numeric', '10')).toContainText('10')
    await expect(syntaxElement('name', 'aFunction')).toContainText('aFunction')

    // Saving asks for another digest.
    await textEditor.type('const a = 1; ')
    await editor.page.evaluate(async () => {
      await atom.workspace.getActiveTextEditor().save()
    })
    expect(fs.readFileSync(filePath, 'utf8')).toBe('const a = 1; function aFunction() { return 10 }\n')

    // A crashed renderer fails any further `evaluate` with "Target crashed",
    // but say so explicitly in case the crash lands between our steps.
    expect(crashed).toBe(false)
    expect(await editor.page.evaluate(() => atom.workspace.getTextEditors().length)).toBe(1)
  })
})

function syntaxElement(kind, text) {
  return editor.page.locator(
    `atom-text-editor.is-focused .syntax--${kind}:text('${text}')`
  )
}
