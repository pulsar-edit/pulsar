/** @babel */

import { BufferedProcess, Point } from 'atom';
import path from 'path';
import fs from 'fs-plus';

export default class TagGenerator {
  constructor(path1, scopeName) {
    this.path = path1;
    this.scopeName = scopeName;
  }

  getPackageRoot() {
    const {resourcePath} = atom.getLoadSettings();
    const currentFileWasRequiredFromSnapshot = !fs.isAbsolute(__dirname);
    const packageRoot = currentFileWasRequiredFromSnapshot
      ? path.join(resourcePath, 'node_modules', 'symbols-view')
      : path.resolve(__dirname, '..');

    if (path.extname(resourcePath) === '.asar' && packageRoot.indexOf(resourcePath) === 0) {
      return path.join(`${resourcePath}.unpacked`, 'node_modules', 'symbols-view');
    } else {
      return packageRoot;
    }
  }

  parseTagLine(line) {
    let sections = line.split('\t');
    if (sections.length > 3) {
      return {
        position: new Point(parseInt(sections[2], 10) - 1),
        name: sections[0],
      };
    }
    return null;
  }

  getLanguage() {
    if (['.cson', '.gyp'].includes(path.extname(this.path))) {
      return 'Cson';
    }

    switch (this.scopeName) {
      case 'source.c':                 return 'C';
      case 'source.cpp':               return 'C++';
      case 'source.clojure':           return 'Lisp';
      case 'source.capnp':             return 'Capnp';
      case 'source.cfscript':          return 'ColdFusion';
      case 'source.cfscript.embedded': return 'ColdFusion';
      case 'source.coffee':            return 'CoffeeScript';
      case 'source.css':               return 'Css';
      case 'source.css.less':          return 'Css';
      case 'source.css.scss':          return 'Css';
      case 'source.elixir':            return 'Elixir';
      case 'source.fountain':          return 'Fountain';
      case 'source.gfm':               return 'Markdown';
      case 'source.go':                return 'Go';
      case 'source.java':              return 'Java';
      case 'source.js':                return 'JavaScript';
      case 'source.js.jsx':            return 'JavaScript';
      case 'source.jsx':               return 'JavaScript';
      case 'source.json':              return 'Json';
      case 'source.julia':             return 'Julia';
      case 'source.makefile':          return 'Make';
      case 'source.objc':              return 'C';
      case 'source.objcpp':            return 'C++';
      case 'source.python':            return 'Python';
      case 'source.ruby':              return 'Ruby';
      case 'source.sass':              return 'Sass';
      case 'source.yaml':              return 'Yaml';
      case 'text.html':                return 'Html';
      case 'text.html.php':            return 'Php';
      case 'text.tex.latex':           return 'Latex';
      case 'text.html.cfml':           return 'ColdFusion';
    }
    return undefined;
  }

  generate() {
    let tags = {};
    const packageRoot = this.getPackageRoot();
    const command = path.join(packageRoot, 'vendor', `ctags-${process.platform}`);
    const defaultCtagsFile = path.join(packageRoot, 'lib', 'ctags-config');
    const args = [`--options=${defaultCtagsFile}`, '--fields=+KS'];

    if (atom.config.get('symbols-view.useEditorGrammarAsCtagsLanguage')) {
      const language = this.getLanguage();
      if (language) {
        args.push(`--language-force=${language}`);
      }
    }

    args.push('-nf', '-', this.path);

    return new Promise((resolve) => {
      let result, tag;
      return new BufferedProcess({
        command: command,
        args: args,
        stdout: (lines) => {
          return (() => {
            result = [];
            for (const line of Array.from(lines.split('\n'))) {
              let item;
              if (tag = this.parseTagLine(line)) {
                item = tags[tag.position.row] ? tags[tag.position.row] : (tags[tag.position.row] = tag);
              }
              result.push(item);
            }
            return result;
          })();
        },
        stderr() {},
        exit() {
          tags = ((() => {
            result = [];
            for (const row in tags) {
              tag = tags[row];
              result.push(tag);
            }
            return result;
          })());
          return resolve(tags);
        },
      });
    });
  }
}
