const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const packJson = require('../package.json')

module.exports = function(filter) {
  let packagePath = []

  for(let pack in packJson.packageDependencies) {
    if(pack.match(filter)) {
      let basePath = path.join('node_modules', pack)
      let testPath = path.join(basePath, 'test')
      let specPath = path.join(basePath, 'spec')
      if(fs.existsSync(testPath)) packagePath.push(testPath)
      if(fs.existsSync(specPath)) packagePath.push(specPath)
    }
  }

  runSpecs(packagePath, [])
}

function runSpecs(files, retries) {
  let env = process.env
  env.ATOM_JASMINE_REPORTER='list'
  if(retries.length > 0) {
    // Escape possible tests that can generate a regexp that will not match...
    const escaped = retries.map(str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    env.SPEC_FILTER = escaped.join("|")
  }
  const res = cp.spawn('yarn', ['start', '--test', ...files], {
    cwd: process.cwd(),
    env: env
  })

  let out;
  res.stdout.on('data', data => {
     process.stdout.write(data.toString());
  });

  res.stderr.on('data', data => {
     const strData = data.toString();
     process.stderr.write(strData);

     if(strData.match(/ALL TESTS THAT FAILED:/)) {
       out = '';
     } else if(out !== undefined) {
       out += strData;
     }
  });

  res.on('close', code => {
    if(code !== 0 && retries.length === 0) {
      const failed = filterSpecs(out)
      runSpecs(files, failed)
    } else {
      process.exit(code)
    }
  });
}

function filterSpecs(output) {
  let descriptions = []
  let start = true
  for(let out of output.split("\n")) {
    if(start) {
      if(out !== '') {
        start = false
        descriptions.push(out)
      }
    } else if(out !== '') {
      descriptions.push(out)
    } else {
      return descriptions
    }
  }
}
