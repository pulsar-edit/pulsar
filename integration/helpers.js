const os = require('os')
const path = require('path')
const p = require('playwright')
const electron = p._electron
const { expect } = require('@playwright/test')

async function openAtom(profilePath, videoName) {
  const env = process.env
  env.ATOM_HOME = path.join("tmp", profilePath)
  // `ATOM_HOME` doesn't cover Electron's `userData` directory, which holds
  // IndexedDB, among other things. Without this, every instance shares the
  // default one, and when two run at once, the second can't open IndexedDB.
  const userDataArg = `--user-data-dir=${path.resolve("tmp", profilePath, "user-data")}`

  const config = {
    args: ["--no-sandbox", userDataArg, "."],
    cwd: ".",
    env: env,
    timeout: 50000
  }
  if(env.BINARY_NAME) {
    config.executablePath = env.BINARY_NAME
    config.args = ["--no-sandbox", userDataArg]
  }

  if(process.env.CI) {
    config.recordVideo = {
      dir: path.join('tests', 'videos', videoName)
    }
  }
  const app = await electron.launch(config)
  const page = await app.firstWindow()
  await expect(page.locator('.tab-bar').first()).toBeVisible()

  return {app, page}
}

async function runCommand({page}, command) {
  if(os.platform() === 'darwin') {
    await page.locator('atom-workspace').press('Meta+Shift+p')
  } else {
    await page.locator('atom-workspace').press('Control+Shift+p')
  }
  await expect(page.locator('atom-panel.modal:visible')).toBeVisible()
  const palette = page.locator('.command-palette atom-text-editor.is-focused')
  await palette.type(command)
  await page.locator('.selected div', { hasText: command }).first().click()
  await expect(page.locator('.modal:visible')).toBeHidden()
}

async function typeInEditor({page}, locator, text) {
  const editor = page.locator(`${locator} atom-text-editor.is-focused`)
  await expect(editor).toBeVisible()
  await editor.type(text)
}

module.exports = {
  openAtom,
  runCommand,
  typeInEditor
}
