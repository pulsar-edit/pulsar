const fs = require('fs/promises');
const cp = require('child_process');
const path = require('path');

const packagesPath = path.join(__dirname, '..', 'packages');

fs.readdir(packagesPath,{withFileTypes:true}).then( dirents => Promise.all(dirents.map( dirent => {
  if (!dirent.isDirectory()) return;
  return new Promise((resolve, reject) =>
    cp.exec(
      `npm i`,
      { cwd: path.join(packagesPath, dirent.name) },
      (error, stdout, stderr) => error ? reject(error) : resolve()
    )
  );
}))).catch( e => {
  console.error(e);
  process.exit(1);
});