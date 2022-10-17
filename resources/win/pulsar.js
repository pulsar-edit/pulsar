const path = require('path');
const spawn = require('child_process').spawn;

const atomCommandPath = path.resolve(__dirname, '..', '..', process.argv[2]);
const args = process.argv.slice(3);
args.unshift('--executed-from', process.cwd());
const options = { detached: true, stdio: 'ignore' };
spawn(atomCommandPath, args, options);
process.exit(0);
