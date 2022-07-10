@ECHO off

echo `script\verify-snapshot-script.cmd` is deprecated. Use `node script/verify-snapshot-script.js` instead
node  "%~dp0\verify-snapshot-script.js" %*