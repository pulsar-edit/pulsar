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

  runSpecs(packagePath, true)
}

function runSpecs(files, retry) {
  let env = process.env
  env.ATOM_JASMINE_REPORTER='list'
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

     if(strData.match(/ALL FILES THAT FAILED/)) {
       out = '';
     } else if(out !== undefined) {
       out += strData;
     }
  });

  res.on('close', code => {
    if(code !== 0 && retry) {
      const failed = filterFiles(out)
      runSpecs(failed, false)
    } else {
      process.exit(code)
    }
  });
}

function filterFiles(output) {
  let files = new Set()
  let start = true
  for(let out of output.split("\n")) {
    if(start) {
      if(out !== '') {
        start = false
        files.add(out.replace(/:\d+:\d+/, ''))
      }
    } else if(out !== '') {
      files.add(out.replace(/:\d+:\d+/, ''))
    } else {
      return files
    }
  }
}
