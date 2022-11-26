const fs = require('fs');
const cp = require('child_process');
const path = require('path');

/*
    env.npm_config_runtime = "electron"
    env.npm_config_target = @electronVersion
    env.npm_config_disturl = config.getElectronUrl()
    env.npm_config_arch = config.getElectronArch()
    env.npm_config_target_arch = config.getElectronArch() # for node-pre-gyp

*/

const packagesPath = path.join(__dirname, '..', 'packages');
const dirents = fs.readdirSync(packagesPath,{withFileTypes:true});
const env = Object.assign({},process.env,{
  npm_config_target: "12.2.3",
  npm_config_arch: process.arch,
  npm_config_target_arch: process.arch,
  npm_config_disturl: "https://electronjs.org/headers",
  npm_config_runtime: "electron",
  // HOME: path.join(process.env.USERPROFILE,"./.electron-gyp"),
});

/*
export npm_config_target=1.2.3
export npm_config_arch=x64
export npm_config_target_arch=x64
export npm_config_disturl=https://electronjs.org/headers
export npm_config_runtime=electron
export npm_config_build_from_source=true
HOME=~/.electron-gyp npm install
*/

for (const dirent of dirents) {
  if (!dirent.isDirectory()) continue;
  const packagePath = path.join(packagesPath, dirent.name);
  if (false) {
    fs.rmSync(packagePath,{recursive:true});
    break;
  }
  console.log(`${packagePath}$ npm i`);
  const res = cp.spawnSync('npm',['i','--legacy-peer-deps','--target=12.2.3','--disturl=https://atom.io/download/electron','--arch=' + process.arch],{
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
