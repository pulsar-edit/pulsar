@ECHO off

echo `script\lint.cmd` is deprecated. Use `node script/lint.js` instead
node  "%~dp0\lint.js" %*
