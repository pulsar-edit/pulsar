const cp = require('child_process')

function runSpecs(files) {
  let env = process.env
  env.ATOM_JASMINE_REPORTER='list'

  const res = cp.spawn('yarn', ['start', '--test', ...files], {
    cwd: process.cwd(),
    env: env
  })

  res.stdout.on('data', data => {
     process.stdout.write(data.toString());
  });

  res.stderr.on('data', data => {
     const strData = data.toString();
     process.stderr.write(strData);
  });

  res.on('close', code => {
      process.exit(code)
  });
}

if(process.argv[0] === __filename) {
  runAllSpecs(process.argv.splice(1))
} else if(process.argv[1] === __filename) {
  runAllSpecs(process.argv.splice(2))
} else {
  module.exports = runAllSpecs
}
