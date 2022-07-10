@ECHO off

echo `script\bootstrap.cmd` is deprecated. Use `node script/bootstrap.js` instead
node  "%~dp0\bootstrap.js" %*