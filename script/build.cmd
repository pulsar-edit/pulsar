@ECHO off

echo `script\build.cmd` is deprecated. Use `node script/build.js` instead
node  "%~dp0\build.js" %*
