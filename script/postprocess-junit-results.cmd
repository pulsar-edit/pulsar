@ECHO off

echo `script\postprocess-junit-results.cmd` is deprecated. Use `node script/postprocess-junit-results.js` instead
node  "%~dp0\postprocess-junit-results.js" %*
