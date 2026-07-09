"use strict";
// This file is required by compile-cache, which is required directly from
// apm, so it can only use the subset of newer JavaScript features that apm's
// version of Node supports. Strict mode is required for block scoped declarations.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const minimatchModule = require("minimatch");
const minimatch =
  typeof minimatchModule === "function" ? minimatchModule : minimatchModule.minimatch;

let Resolve = null;

class PackageTranspilationRegistry {
  constructor() {
    this.configByPackagePath = {};
    this.specByFilePath = {};
    this.transpilerPaths = {};
  }

  addTranspilerConfigForPath(packagePath, packageName, packageMeta, config) {
    const normalizedPackagePath = normalizeFilePath(packagePath);
    this.configByPackagePath[normalizedPackagePath] = {
      name: packageName,
      meta: packageMeta,
      path: normalizedPackagePath,
      specs: config.map((spec) => Object.assign({}, spec)),
    };
  }

  removeTranspilerConfigForPath(packagePath) {
    const normalizedPackagePath = normalizeFilePath(packagePath);
    delete this.configByPackagePath[normalizedPackagePath];
    const packagePathWithSep = normalizedPackagePath.endsWith(path.sep)
      ? path.join(normalizedPackagePath)
      : path.join(normalizedPackagePath) + path.sep;
    Object.keys(this.specByFilePath).forEach((filePath) => {
      if (path.join(filePath).startsWith(packagePathWithSep)) {
        delete this.specByFilePath[filePath];
      }
    });
  }

  // Wraps the transpiler in an object with the same interface
  // that falls back to the original transpiler implementation if and
  // only if a package hasn't registered its desire to transpile its own source.
  wrapTranspiler(transpiler) {
    return {
      getCachePath: (sourceCode, filePath) => {
        const spec = this.getPackageTranspilerSpecForFilePath(filePath);
        if (spec) {
          return this.getCachePath(sourceCode, filePath, spec);
        }

        return transpiler.getCachePath(sourceCode, filePath);
      },

      compile: (sourceCode, filePath) => {
        const spec = this.getPackageTranspilerSpecForFilePath(filePath);
        if (spec) {
          return this.transpileWithPackageTranspiler(sourceCode, filePath, spec);
        }

        return transpiler.compile(sourceCode, filePath);
      },

      shouldCompile: (sourceCode, filePath) => {
        if (this.transpilerPaths[filePath]) {
          return false;
        }
        const spec = this.getPackageTranspilerSpecForFilePath(filePath);
        if (spec) {
          return true;
        }

        return transpiler.shouldCompile(sourceCode, filePath);
      },
    };
  }

  getPackageTranspilerSpecForFilePath(filePath) {
    const normalizedFilePath = normalizeFilePath(filePath);
    if (this.specByFilePath[normalizedFilePath] !== undefined) {
      return this.specByFilePath[normalizedFilePath];
    }

    let thisPath = normalizedFilePath;
    let lastPath = null;
    // Iterate parents from the file path to the root, checking at each level
    // to see if a package manages transpilation for that directory.
    // This means searching for a config for `/path/to/file/here.js` only
    // only iterates four times, even if there are hundreds of configs registered.
    while (thisPath !== lastPath) {
      // until we reach the root
      let config = this.configByPackagePath[thisPath];
      if (config) {
        const relativePath = path.relative(thisPath, normalizedFilePath);
        if (
          relativePath.startsWith(`node_modules${path.sep}`) ||
          relativePath.indexOf(`${path.sep}node_modules${path.sep}`) > -1
        ) {
          return false;
        }
        const globPath = normalizeGlobPath(relativePath);
        for (let i = 0; i < config.specs.length; i++) {
          const spec = config.specs[i];
          if (minimatch(globPath, normalizeGlobPath(spec.glob))) {
            spec._config = config;
            this.specByFilePath[normalizedFilePath] = spec;
            return spec;
          }
        }
      }

      lastPath = thisPath;
      thisPath = path.join(thisPath, "..");
    }

    this.specByFilePath[normalizedFilePath] = null;
    return null;
  }

  getCachePath(sourceCode, filePath, spec) {
    const transpilerPath = this.getTranspilerPath(spec);
    const transpilerSource = spec._transpilerSource || fs.readFileSync(transpilerPath, "utf8");
    spec._transpilerSource = transpilerSource;
    const transpiler = this.getTranspiler(spec);

    let hash = crypto
      .createHash("sha1")
      .update(JSON.stringify(spec.options || {}))
      .update(transpilerSource, "utf8")
      .update(sourceCode, "utf8");

    if (transpiler && transpiler.getCacheKeyData) {
      const meta = this.getMetadata(spec);
      const additionalCacheData = transpiler.getCacheKeyData(
        sourceCode,
        filePath,
        spec.options || {},
        meta,
      );
      hash.update(additionalCacheData, "utf8");
    }

    return path.join("package-transpile", spec._config.name, hash.digest("hex"));
  }

  transpileWithPackageTranspiler(sourceCode, filePath, spec) {
    const transpiler = this.getTranspiler(spec);

    if (transpiler) {
      const meta = this.getMetadata(spec);
      const result = transpiler.transpile(sourceCode, filePath, spec.options || {}, meta);
      if (result === undefined || (result && result.code === undefined)) {
        return sourceCode;
      } else if (result.code) {
        return result.code.toString();
      } else {
        throw new Error(
          "Could not find a property `.code` on the transpilation results of " + filePath,
        );
      }
    } else {
      const err = new Error(
        "Could not resolve transpiler '" + spec.transpiler + "' from '" + spec._config.path + "'",
      );
      throw err;
    }
  }

  getMetadata(spec) {
    return {
      name: spec._config.name,
      path: spec._config.path,
      meta: spec._config.meta,
    };
  }

  getTranspilerPath(spec) {
    Resolve = Resolve || require("resolve");
    return Resolve.sync(spec.transpiler, {
      basedir: spec._config.path,
      // eslint-disable-next-line n/no-deprecated-api -- Atom module system relies on require.extensions
      extensions: Object.keys(require.extensions),
    });
  }

  getTranspiler(spec) {
    const transpilerPath = this.getTranspilerPath(spec);
    if (transpilerPath) {
      const transpiler = require(transpilerPath);
      this.transpilerPaths[transpilerPath] = true;
      return transpiler;
    }
  }
}

const normalizeFilePath = (filePath) => path.normalize(filePath);
const normalizeGlobPath = (filePath) => filePath.replace(/\\/g, "/");

module.exports = PackageTranspilationRegistry;
