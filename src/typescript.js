'use strict';

const _ = require('underscore-plus');
const crypto = require('crypto');
const path = require('path');

const defaultOptions = {
  target: 'es2023',
  module: 'commonjs',
  sourceMap: true,
  // By default, do not complain if definition files are missing.
  skipLibCheck: true,
  types: [],
  typeRoots: []
};

let TypeScript = null;
let typescriptVersionDir = null;

function shouldCompile() {
  return true;
}

function getCachePath(sourceCode) {
  if (typescriptVersionDir == null) {
    const version = require('typescript/package.json').version;
    typescriptVersionDir = path.join(
      'ts',
      createVersionAndOptionsDigest(version, defaultOptions)
    );
  }

  return path.join(
    typescriptVersionDir,
    crypto
      .createHash('sha1')
      .update(sourceCode, 'utf8')
      .digest('hex') + '.js'
  );
}

function compile(sourceCode, filePath) {
  TypeScript ??= require('typescript');

  if (process.platform === 'win32') {
    filePath = 'file:///' + path.resolve(filePath).replace(/\\/g, '/');
  }

  // We must take the complicated path at least until we can figure out whether
  // this transpiled file is syntactically valid.
  const options = _.defaults({ filename: filePath }, defaultOptions);

  let compilerHost = TypeScript.createCompilerHost(defaultOptions);
  let originalGetSourceFile = compilerHost.getSourceFile;
  compilerHost.getSourceFile = function getSourceFile(name, languageVersion) {
    if (name === filePath) return sourceFile;
    return originalGetSourceFile.call(compilerHost, name, languageVersion);
  };

  let compilerOptions = TypeScript.parseJsonConfigFileContent(
    { compilerOptions: defaultOptions },
    TypeScript.sys,
    path.dirname(filePath),
    {},
    `tsconfig.json`
  );

  let sourceFile = TypeScript.createSourceFile(
    filePath,
    sourceCode,
    TypeScript.ScriptTarget.Latest,
    true
  );

  let program = TypeScript.createProgram([filePath], compilerOptions.options, compilerHost);
  const diagnostics = TypeScript.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    let diagnosticErrors = diagnostics.map((d) => {
      let message = TypeScript.flattenDiagnosticMessageText(d.messageText, "\n");
      let { line, character } = TypeScript.getLineAndCharacterOfPosition(d.file, d.start);
      return `${line}:${character}: ${message}`;
    });
    throw new Error(`Could not compile TypeScript:\n${diagnosticErrors.join("\n")}`);
  }

  // Once we get this far, we've asserted that transpilation can happen without
  // any fatal errors. We can now use the much simpler `transpileModule` API.
  let result = TypeScript.transpileModule(sourceCode, { compilerOptions: options });
  return result.outputText;
}

function createVersionAndOptionsDigest(version, options) {
  return crypto
    .createHash('sha1')
    .update('typescript', 'utf8')
    .update('\0', 'utf8')
    .update(version, 'utf8')
    .update('\0', 'utf8')
    .update(JSON.stringify(options), 'utf8')
    .digest('hex');
}


module.exports = {
  shouldCompile,
  getCachePath,
  compile
};
