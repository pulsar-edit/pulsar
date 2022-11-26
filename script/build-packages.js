const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const arch = process.arch;
const target = "12.2.3"; // targeted electron version
const disturl = "https://electronjs.org/headers";

const packagesPath = path.join(__dirname, '..', 'packages');
const dirents = fs.readdirSync(packagesPath,{withFileTypes:true});
const env = Object.assign({},process.env,{
  npm_config_target: "12.2.3",
  npm_config_arch: process.arch,
  npm_config_target_arch: process.arch,
  npm_config_disturl: "https://electronjs.org/headers",
  npm_config_runtime: "electron",
});

for (const dirent of dirents) {
  if (!dirent.isDirectory()) continue;
  const packagePath = path.join(packagesPath, dirent.name);
  console.log(`${packagePath}$ npm i`);
  const res = cp.spawnSync('npm',['i','--legacy-peer-deps','--target=' + target,'--disturl=' + disturl,'--arch=' + arch],{
    cwd: packagePath,
    env,
    shell: true,
    stdio: "inherit",
  });
  if (res.status) {
    process.exit(res.status);
    break;
  }
}
