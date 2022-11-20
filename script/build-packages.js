const fs = require('fs/promises');
const cp = require('child_process');
const path = require('path');

const packagesPath = path.join(__dirname, '..', 'packages');

(async()=>{
  const responses = await Promise.all((await fs.readdir(packagesPath)).map( packName =>
    cp.spawn('npm', ['i'], {
      cwd: path.join(packagesPath, packName)
    })
  ));
  
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