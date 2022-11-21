const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const packagesPath = path.join(__dirname, '..', 'packages');

const dirents = fs.readdirSync(packagesPath,{withFileTypes:true});

for (const dirent of dirents) {
  if (!dirent.isDirectory()) continue;
  const packagePath = path.join(packagesPath, dirent.name);
  console.log(`${packagePath}$ npm ci`);
  const res = cp.spawnSync('npm',['ci','--legacy-peer-deps'],{
    cwd: packagePath,
    shell: true,
    stdio: "inherit",
  });
  if (res.status) {
    process.exit(res.status);
    break;
  }
}