'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const CONFIG = require('../config');

module.exports = function() {
  const cachePaths = [
    path.join(CONFIG.repositoryRootPath, 'electron'),
    path.join(CONFIG.atomHomeDirPath, '.node-gyp'),
    path.join(CONFIG.atomHomeDirPath, 'storage'),
    path.join(CONFIG.atomHomeDirPath, '.apm'),
    path.join(CONFIG.atomHomeDirPath, '.npm'),
    path.join(CONFIG.atomHomeDirPath, 'compile-cache'),
    path.join(CONFIG.atomHomeDirPath, 'snapshot-cache'),
    path.join(CONFIG.atomHomeDirPath, 'pulsar-shell'),
    path.join(CONFIG.atomHomeDirPath, 'electron'),
    path.join(os.tmpdir(), 'pulsar-build'),
    path.join(os.tmpdir(), 'pulsar-cached-pulsar-shells')
  ];
  const rmPromises = [];
  for (let path of cachePaths) {
    console.log(`Cleaning ${path}`);
    rmPromises.push(fs.remove(path));
  }

  return Promise.all(rmPromises);
};
