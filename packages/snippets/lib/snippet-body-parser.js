let parser
try {
  // When the .pegjs file is stable and you're ready for release, run `npx
  // pegjs lib/snippet-body.pegjs` to compile the parser. That way end users
  // won't have to pay the cost of runtime evaluation.
  parser = require('./snippet-body')
} catch (error) {
  // When you're iterating on the parser, rename or delete `snippet-body.js` so
  // you can make changes to the .pegjs file and have them reflected after a
  // window reload.
  const fs = require('fs')
  const PEG = require('pegjs')

  const grammarSrc = fs.readFileSync(require.resolve('./snippet-body.pegjs'), 'utf8')
  parser = PEG.generate(grammarSrc)
}

module.exports = parser
