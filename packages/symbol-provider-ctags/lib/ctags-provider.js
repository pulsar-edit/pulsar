const {
  BufferedProcess,
  CompositeDisposable,
  File,
  Point
} = require('atom');

const TagReader = require('./tag-reader');
const getTagsFile = require('./get-tags-file');
const fs = require('fs-plus');
const path = require('path');

class CtagsProvider {
  constructor() {
    this.watchTagsFiles();
    this.loadSymbols();
    this.packageName = 'symbol-provider-ctags';
    this.name = 'ctags';
    this.isExclusive = true;
  }

  destroy() {
    this.loadTask?.terminate?.();
    this.unwatchTagsFiles();
  }

  canProvideSymbols(meta) {
    let { editor } = meta;
    // Can't provide symbols unless a file is saved.
    if (editor.getPath() === undefined) return 0;

    // We start off with a score less than 1 because `ctags` should always lose
    // out when it's competing against the Tree-sitter provider.
    let score = 0.99;

    // If the file isn't saved on disk, this provider's results may be
    // inaccurate, so it's a less attractive candidate.
    if (editor.isModified()) score -= 0.1;

    return score;
  }

  getEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  getPath() {
    if (this.getEditor()) {
      return this.getEditor().getPath();
    }
    return undefined;
  }

  getScopeName() {
    if (this.getEditor() && this.getEditor().getGrammar()) {
      return this.getEditor().getGrammar().scopeName;
    }
    return undefined;
  }

  getPackageRoot() {
    const {resourcePath} = atom.getLoadSettings();
    const currentFileWasRequiredFromSnapshot = !fs.isAbsolute(__dirname);
    const packageRoot = currentFileWasRequiredFromSnapshot
      ? path.join(resourcePath, 'node_modules', 'symbol-provider-ctags')
      : path.resolve(__dirname, '..');

    if (path.extname(resourcePath) === '.asar' && packageRoot.indexOf(resourcePath) === 0) {
      return path.join(`${resourcePath}.unpacked`, 'node_modules', 'symbol-provider-ctags');
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

  validateTags(tags) {
    let symbols = [];
    for (let tag of tags) {
      let tagFilePath = path.join(tag.directory, tag.file);
      if (!fs.existsSync(tagFilePath)) {
        continue;
      }
      symbols.push(this.interpretTag(tag));
    }
    return symbols;
  }

  interpretTag(tag) {
    return {
      directory: tag.directory,
      file: tag.file,
      name: tag.name,
      position: this.getTagPosition(tag)
    };
  }

  getTagPosition(tag) {
    if (!tag) {
      return undefined;
    }

    if (tag.lineNumber) {
      return new Point(tag.lineNumber - 1, 0);
    }

    // Remove leading /^ and trailing $/
    if (!tag.pattern) {
      return undefined;
    }
    const pattern = tag.pattern.replace(/(^\/\^)|(\$\/$)/g, '').trim();

    if (!pattern) {
      return undefined;
    }
    const file = path.join(tag.directory, tag.file);
    if (!fs.isFileSync(file)) {
      return undefined;
    }
    const iterable = fs.readFileSync(file, 'utf8').split('\n');
    for (let index = 0; index < iterable.length; index++) {
      let line = iterable[index];
      if (pattern === line.trim()) {
        return new Point(index, 0);
      }
    }

    return undefined;
  }

  watchTagsFiles() {
    this.unwatchTagsFiles();
    this.tagsFileSubscriptions = new CompositeDisposable();
    let reloadTags = () => {
      this.reloadTags = true;
      this.watchTagsFiles();
    };

    for (let projectPath of atom.project.getPaths()) {
      let tagsFilePath = getTagsFile(projectPath);
      if (!tagsFilePath) continue;
      let tagsFile = new File(tagsFilePath);

      this.tagsFileSubscriptions.add(
        tagsFile.onDidChange(reloadTags),
        tagsFile.onDidDelete(reloadTags),
        tagsFile.onDidRename(reloadTags)
      );
    }
  }

  unwatchTagsFiles() {
    this.tagsFileSubscriptions?.dispose();
  }

  getLanguage(editor) {
    if (['.cson', '.gyp'].includes(path.extname(this.path))) {
      return 'Cson';
    }

    let scopeName = this.getScopeName(editor);

    switch (scopeName) {
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
      case 'source.ts':                return 'TypeScript';
      case 'source.ts.tsx':            return 'TypeScript';
      case 'source.yaml':              return 'Yaml';
      case 'text.html':                return 'Html';
      case 'text.html.php':            return 'Php';
      case 'text.tex.latex':           return 'Latex';
      case 'text.html.cfml':           return 'ColdFusion';
    }

    // TODO: Fall back to a grammar registry lookup?
    return undefined;
  }


  loadSymbols() {
    return new Promise(resolve => {
      this.loadTask = TagReader.getAllTags(resolve);
    });
  }

  getSymbols(meta) {
    if (meta.type === 'project') {
      return this.getSymbolsInProject(meta);
    } else if (meta.type === 'project-find') {
      return this.findDefinitionsInProject(meta);
    }
    let { editor } = meta;

    let tags = {};
    let packageRoot = this.getPackageRoot();

    let command = path.join(packageRoot, 'vendor', `ctags-${process.platform}`);
    let defaultCtagsFile = path.join(packageRoot, 'lib', 'ctags-config');

    const args = [
      `--options=${defaultCtagsFile}`,
      `--fields=+KS`
    ];

    if (atom.config.get('symbol-provider-ctags.useEditorGrammarAsCtagsLanguage')) {
      let language = this.getLanguage(editor);
      if (language) {
        args.push(`--language-force=${language}`);
      }
    }

    args.push('-nf', '-', editor.getPath());

    return new Promise(resolve => {
      let result, tag;
      return new BufferedProcess({
        command,
        args,
        stdout: lines => {
          result = [];
          for (let line of lines.split('\n')) {
            let item;
            tag = this.parseTagLine(line);
            if (tag) {
              item = tags[tag.position.row] ?
                tags[tag.position.row] :
                (tags[tag.position.row] = tag);
            }
            result.push(item);
          }
          return result;
        },
        stderr: () => {},
        exit: () => {
          return resolve(Object.values(tags));
        }
      })
    });
  }

  async getSymbolsInProject() {
    return TagReader.getAllTags();
  }

  async findDefinitionsInProject(meta) {
    let tags = await TagReader.find(meta.editor);
    return this.validateTags(tags);
  }
}

module.exports = CtagsProvider;
