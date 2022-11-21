const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const packagesPath = path.join(__dirname, '..', 'packages');

const dirents = fs.readdirSync(packagesPath,{withFileTypes:true});

for (const dirent of dirents) {
  if (!dirent.isDirectory()) continue;
  const packagePath = path.join(packagesPath, dirent.name);
  console.log(`${packagePath}$ npm i`);
  const res = cp.spawnSync('npm',['i','--legacy-peer-deps'],{
    cwd: packagePath,
    shell: true,
    stdio: "inherit",
  });
  if (res.status) {
    process.exit(res.status);
    break;
  }
}