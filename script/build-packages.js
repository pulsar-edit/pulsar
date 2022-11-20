const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const packagesPath = path.join(__dirname, '..', 'packages');

const dirents = fs.readdirSync(packagesPath,{withFileTypes:true});

const [command,...args] = ['npm','install','--omit=dev','--legacy-peer-deps'/* this should be removed if possible */];

for (const dirent of dirents) {
  if (!dirent.isDirectory()) continue;
  console.log(`packages/${dirent.name}> ${command} ${args.join(' ')}`);
  const res = cp.spawnSync(command,args,{
    cwd: path.join(packagesPath, dirent.name),
    shell: true,
    stdio: "inherit",
  });
  if (res.status) {
    process.exit(res.status);
    break;
  }
}