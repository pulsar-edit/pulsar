const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const packagesPath = path.join(__dirname, '..', 'packages');

const dirents = fs.readdirSync(packagesPath,{withFileTypes:true});

const [command,...args] = ['npm','install','--legacy-peer-deps'/* this should be removed if possible */];

for (const dirent of dirents) {
  if (!dirent.isDirectory()) continue;
  const packagePath = path.join(packagesPath, dirent.name);
  console.log(`${packagePath}$ ${command} ${args.join(' ')}`);
  const res = cp.spawnSync(command,args,{
    cwd: packagePath,
    shell: true,
    stdio: "inherit",
  });
  if (res.status) {
    process.exit(res.status);
    break;
  }
}