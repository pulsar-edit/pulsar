@ECHO off

echo `script\test.cmd` is deprecated. Use `node script/test.js` instead
node  "%~dp0\test.js" %*