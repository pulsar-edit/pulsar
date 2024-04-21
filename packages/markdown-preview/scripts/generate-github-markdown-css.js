
// Run this script whenever the `github-markdown-css` dependency is updated in
// order to regenerate GitHub styles.

const fs = require('fs/promises');
const path = require('path');
const dedent = require('dedent');

const ASSETS = path.resolve(__dirname, '..', 'assets')

const ASSET_LIGHT = require.resolve('github-markdown-css/github-markdown-light.css')
const ASSET_DARK = require.resolve('github-markdown-css/github-markdown-dark.css')

async function run() {
  let lightContents = (await fs.readFile(ASSET_LIGHT)).toString();
  let darkContents = (await fs.readFile(ASSET_DARK)).toString();

  let lightCSSAuto = lightContents.replace(/\.markdown-body\b/g, '.markdown-preview[data-use-github-style="auto"]');
  let darkCSSAuto = darkContents.replace(/\.markdown-body\b/g, '.markdown-preview[data-use-github-style="auto"]');

  const autoCSSMode = dedent`
  @media (prefers-color-scheme: light) {
    ${lightCSSAuto}
  }
  @media (prefers-color-scheme: dark) {
    ${darkCSSAuto}
  }
  `;

  let lightCSSMode = lightContents.replace(/\.markdown-body\b/g, '.markdown-preview[data-use-github-style="light"]');
  let darkCSSMode = darkContents.replace(/\.markdown-body\b/g, '.markdown-preview[data-use-github-style="dark"]');

  await fs.writeFile(path.join(ASSETS, 'github-markdown-auto.css'), autoCSSMode);
  await fs.writeFile(path.join(ASSETS, 'github-markdown-light.css'), lightCSSMode);
  await fs.writeFile(path.join(ASSETS, 'github-markdown-dark.css'), darkCSSMode);
}

run()
