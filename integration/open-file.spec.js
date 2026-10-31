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
//
// A crash can't be detected by asking Pulsar: pending Playwright calls just
// wait until the test times out, Playwright's `crash` event doesn't fire for
// Electron windows, and the main process stops answering `app.evaluate`. But
// Pulsar's crash reporter writes a dump to `$ATOM_HOME/crashdumps` within a
// second of the crash, so we watch for that instead. (Pulsar doesn't start the
// crash reporter on macOS; there, a crash still shows up as a timeout.)
function step(title, body) {
  return test.step(title, async () => {
    const existingDumps = new Set(findCrashDumps())
    let finished = false
    const crashed = (async () => {
      while (!finished) {
        const newDump = findCrashDumps().find((dump) => !existingDumps.has(dump))
        if (newDump) return newDump
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    })()
    try {
      await Promise.race([
        body(),
        crashed.then((dump) => {
          // `dump` is empty if polling stopped because `body` finished first.
          if (dump) {
            throw new Error(`Pulsar crashed during: ${title} (crash dump: ${dump})`)
          }
        })
      ])
    } finally {
      finished = true
    }
  })
}

// Every `.dmp` file under `$ATOM_HOME/crashdumps`, at any depth (Crashpad
// moves them between `new`, `pending`, and `completed`).
function findCrashDumps(dir = path.resolve(process.env.ATOM_HOME, 'crashdumps')) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch (_) {
    return []
  }
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return findCrashDumps(entryPath)
    return entry.name.endsWith('.dmp') ? [entryPath] : []
  })
}

function syntaxElement(kind, text) {
  return editor.page.locator(
    `atom-text-editor.is-focused .syntax--${kind}:text('${text}')`
  )
}
