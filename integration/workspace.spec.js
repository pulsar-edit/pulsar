const os = require('os')
const {openAtom, runCommand, typeInEditor} = require('./helpers')
const { test, expect } = require('@playwright/test')

const languages = [
  {language: "JavaScript", code: 'function aFunction() { 10 }', checks: {numeric: '10', name: 'aFunction'}},
  {language: "Ruby", code: 'def a_function\n  10\nend', checks: {numeric: '10', name: 'a_function'}},
  {language: "Java", code: 'public int blah { return 10; }', checks: {numeric: '10', type: 'int'}},
  {language: "C", code: '10', checks: {numeric: '10'}},
  {language: "Clojure", code: '10', checks: {numeric: '10'}},
  {language: "CoffeeScript", code: '10', checks: {numeric: '10'}},
  {language: "C#", code: '10', checks: {numeric: '10'}},
  // {language: "css", code: '10', checks: {numeric: '10'}},
  // {language: "gfm", code: '10', checks: {numeric: '10'}},
  // {language: "git", code: '10', checks: {numeric: '10'}},
  {language: "Go", code: '10', checks: {numeric: '10'}},
  {language: "HTML", code: '<foo type="10"></foo>', checks: {quoted: '"10"'}},
  {language: "XML", code: '<foo type="10"></foo>', checks: {string: '"10"'}},
  // {language: "hyperlink", code: '10', checks: {numeric: '10'}},
  {language: "JSON", code: '10', checks: {numeric: '10'}},
  // {language: "less", code: '10', checks: {numeric: '10'}},
  // {language: "make", code: '10', checks: {numeric: '10'}},
  // {language: "mustache", code: '10', checks: {numeric: '10'}},
  {language: "Objective C", code: '10', checks: {numeric: '10'}},
  {language: "Perl", code: '10', checks: {numeric: '10'}},
  {language: "PHP", code: '<? $foo ?>', checks: {variable: '$foo'}},
  // {language: "property-list", code: '10', checks: {numeric: '10'}},
  {language: "Python", code: '10', checks: {numeric: '10'}},
  {language: "Ruby on Rails", code: '10', checks: {numeric: '10'}},
  {language: "Rust", code: '10', checks: {numeric: '10'}},
  // {language: "sass", code: '10', checks: {numeric: '10'}},
  {language: "Shell Script", code: 'a="10"', checks: {variable: 'a', string: '"10"'}},
  // {language: "source", code: '10', checks: {numeric: '10'}},
  {language: "SQL", code: '10', checks: {numeric: '10'}},
  // {language: "text", code: '10', checks: {numeric: '10'}},
  // {language: "todo", code: '10', checks: {numeric: '10'}},
  // {language: "toml", code: '10', checks: {numeric: '10'}},
  {language: "Typescript", code: '10', checks: {numeric: '10'}},
  {language: "YAML", code: 'a: 10', checks: {numeric: '10'}},
]

let editor
test.describe('Opening Atom for the first time', () => {
  test.beforeAll(async () => {
    editor = await openAtom("atom-home-tests", "opening-first-time")
  })

  test.afterAll(async () => {
    const closing = editor.app.close()
    await closing
  })

  test('the editor opens at the welcome page', async () => {
    const workspace = editor.page.locator('atom-workspace')
    await expect(workspace).toHaveText(/A Community-led Hyper-Hackable Text Editor/, {
      useInnerText: true,
    })
  })

  //test('shows core packages', async () => {
  //  await runCommand(editor, 'Settings View: Open')
  //  await editor.page.locator('a.icon', { hasText: 'Packages' }).click()
  //  await expect(editor.page.locator('.package-name', { hasText: 'about' }).first())
  //    .toBeVisible()
  //})

  //test('allows to install for packages', async () => {
  //  await runCommand(editor, 'Settings View: Open')
  //  await editor.page.locator('a.icon', { hasText: 'Install' }).click()
  //  await typeInEditor(editor, '.packages', "termination")
  //  await editor.page.locator('button.install-button:visible', { hasText: 'Install' }).click()
  //  test.setTimeout(120000);
  //  await expect(editor.page.locator('button', { hasText: 'Settings' }).first())
  //    .toBeVisible({ timeout: 120000 })
  //})

  test.describe('the editor have syntax highlight', async () => {
    test.beforeAll(async () => {
      const workspace = editor.page.locator('atom-workspace')
      await expect(workspace).toHaveText(/A Community-led Hyper-Hackable Text Editor/, {
        useInnerText: true,
      })
      await runCommand(editor, 'Tabs: Close All Tabs')
    })

    test.afterEach(async () => {
      if(os.platform() === 'darwin') {
        await editor.page.keyboard.press('Meta+a')
      } else {
        await editor.page.keyboard.press('Control+a')
      }
      await editor.page.keyboard.press('Delete')
      await runCommand(editor, 'Tabs: Close Tab')
    })

    languages.forEach(({language, code, checks}) => {
      test(`for ${language}`, async () => {
        await runCommand(editor, 'Application: New File')
        await editor.page.locator('atom-text-editor.is-focused').type(code)

        await editor.page.locator('grammar-selector-status').click()
        const modalInput = editor.page.locator(".modal:visible atom-text-editor.is-focused")
        await modalInput.type(language)
        await modalInput.press('Enter')

        await Promise.all(
          Object.keys(checks).map(k => {
            // let match = new RegExp(checks[k])
            return expect(syntaxElement(k, checks[k])).toContainText(checks[k])
          })
        )
      })
    })
  })
})

function syntaxElement(kind, text) {
  return editor.page.locator(
    `atom-text-editor.is-focused .syntax--${kind}:text('${text}')`
 )
}
