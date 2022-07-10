@ECHO off

echo `script\clean.cmd` is deprecated. Use `node script/clean.js` instead
node  "%~dp0\clean.js" %*
