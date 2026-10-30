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

test.describe('Opening an existing file', () => {
  test.beforeAll(async () => {
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulsar-open-file-'))
    editor = await openAtom("atom-home-open-file", "opening-existing-file")
    // A renderer crash doesn't make pending Playwright calls fail, and
    // Playwright's own `crash` event doesn't fire for Electron windows; Pulsar
    // just puts up its "editor has crashed" dialog and the test times out. The
    // main process survives the crash, though, so we have it keep a record
    // that `step()` below can poll.
    await editor.app.evaluate(({ app }) => {
      global.__rendererGone = null
      app.on('render-process-gone', (_event, _webContents, details) => {
        global.__rendererGone = { reason: details.reason, exitCode: details.exitCode }
      })
    })
  })

  test.afterAll(async () => {
    // A crashed window can keep `close()` waiting indefinitely.
    const closed = await Promise.race([
      editor.app.close().then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 10000))
    ])
    if (!closed) editor.app.process().kill()
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  })

  test('opens, highlights, edits, and saves a file without crashing', async () => {
    const filePath = path.join(fixtureDir, 'sample.js')
    fs.writeFileSync(filePath, 'function aFunction() { return 10 }\n')
    const textEditor = editor.page.locator('atom-text-editor.is-focused')

    // Loading the file is the first point at which the buffer asks its native
    // half for a digest of the file's contents.
    await step('open the file', async () => {
      await editor.page.evaluate(async (p) => {
        await atom.workspace.open(p)
      }, filePath)
      await expect(textEditor).toContainText('function aFunction()')
    })

    // Nobody picked a grammar, so this also checks that Pulsar chose one from
    // the file extension.
    await step('check syntax highlighting', async () => {
      await expect(syntaxElement('numeric', '10')).toContainText('10')
      await expect(syntaxElement('name', 'aFunction')).toContainText('aFunction')
    })

    // Saving asks for another digest.
    await step('edit and save the file', async () => {
      await textEditor.type('const a = 1; ')
      await editor.page.evaluate(async () => {
        await atom.workspace.getActiveTextEditor().save()
      })
      expect(fs.readFileSync(filePath, 'utf8')).toBe('const a = 1; function aFunction() { return 10 }\n')
    })

    await step('check the renderer is still responsive', async () => {
      // `realpathSync` on both sides, since on macOS the temp directory lives
      // behind a symlink (`/var` → `/private/var`).
      const activePath = await editor.page.evaluate(() => atom.workspace.getActiveTextEditor().getPath())
      expect(fs.realpathSync(activePath)).toBe(fs.realpathSync(filePath))
    })
  })
})

// Runs `body` as a named test step, failing within about half a second if the
// renderer crashes while it runs.
function step(title, body) {
  return test.step(title, async () => {
    let finished = false
    const crashed = (async () => {
      while (!finished) {
        const gone = await editor.app.evaluate(() => global.__rendererGone)
        if (gone) return gone
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    })()
    try {
      await Promise.race([
        body(),
        crashed.then((gone) => {
          // `gone` is empty if polling stopped because `body` finished first.
          if (gone) {
            throw new Error(`The renderer crashed during: ${title} (reason: ${gone.reason}, exit code: ${gone.exitCode})`)
          }
        })
      ])
    } finally {
      finished = true
    }
  })
}

function syntaxElement(kind, text) {
  return editor.page.locator(
    `atom-text-editor.is-focused .syntax--${kind}:text('${text}')`
  )
}
