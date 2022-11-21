const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const packagesPath = path.join(__dirname, '..', 'packages');
const apmPath = path.join(__dirname, '..', 'ppm', 'bin', process.platform === 'win32' ? 'apm.cmd' : 'apm');

const dirents = fs.readdirSync(packagesPath,{withFileTypes:true});

for (const dirent of dirents) {
  if (!dirent.isDirectory()) continue;
  const packagePath = path.join(packagesPath, dirent.name);
  console.log(`${packagePath}$ apm ci`);
  const res = cp.spawnSync(apmPath,['ci'],{
    cwd: packagePath,
    stdio: "inherit",
  });
  if (res.status) {
    process.exit(res.status);
    break;
  }
}