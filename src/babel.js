"use strict";

const crypto = require("crypto");
const path = require("path");
const defaultOptions = require("./babel.config.js");
const configFile = path.join(__dirname, "./babel.config.js");

let babel = null;
let babelVersionDirectory = null;

const PREFIXES = ["/** @babel */", '"use babel"', "'use babel'", "/* @flow */", "// @flow"];

const PREFIX_LENGTH = Math.max.apply(
  Math,
  PREFIXES.map(function (prefix) {
    return prefix.length;
  }),
);

exports.shouldCompile = function (sourceCode) {
  const start = sourceCode.substr(0, PREFIX_LENGTH);
  return PREFIXES.some(function (prefix) {
    return start.indexOf(prefix) === 0;
  });
};

exports.getCachePath = function (sourceCode) {
  if (babelVersionDirectory == null) {
    const babelVersion = require("@babel/core/package.json").version;
    babelVersionDirectory = path.join(
      "js",
      "babel",
      createVersionAndOptionsDigest(babelVersion, defaultOptions),
    );
  }

  return path.join(
    babelVersionDirectory,
    crypto.createHash("sha1").update(sourceCode, "utf8").digest("hex") + ".js",
  );
};

exports.compile = function (sourceCode, filePath) {
  if (process.platform === "win32") {
    filePath = "file:///" + path.resolve(filePath).replace(/\\/g, "/");
  }

  const stdoutWrite = process.stdout.write;
  const stderrWrite = process.stderr.write;

  process.stdout.write = () => true;
  process.stderr.write = () => true;

  try {
    if (!babel) {
      babel = require("@babel/core");
    }

    return babel.transformSync(sourceCode, {
      filename: filePath,
      configFile,
    }).code;
  } finally {
    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
  }
};

function createVersionAndOptionsDigest(version, options) {
  return crypto
    .createHash("sha1")
    .update("@babel/core", "utf8")
    .update("\0", "utf8")
    .update(version, "utf8")
    .update("\0", "utf8")
    .update(JSON.stringify(options), "utf8")
    .digest("hex");
}
