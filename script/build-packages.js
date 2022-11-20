const fs = require('fs/promises');
const cp = require('child_process');
const path = require('path');

const packagesPath = path.join(__dirname, '..', 'packages');

(async()=>{
  const responses = await Promise.all((await fs.readdir(packagesPath,{withFileTypes:true})).map( dirent =>
    dirent.isDirectory ? cp.spawn('npm', ['i'], {
      cwd: path.join(packagesPath, dirent.name)
    }) : null
  )).filter( p => p );
  
  const fails = responses.filter( res => res.status !== 0 );
  if (fails.length !== 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})().catch( e => {
  console.error(e);
  process.exit(1);
});