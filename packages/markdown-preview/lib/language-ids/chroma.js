/*
 * This Document defines the Language Identifiers for 'Chroma'
 * That is the string used after a code block delimiter to define
 * what programming language is within the code block.
 *
 * 'Chroma' is the Syntax Highlighting Engine used by Codeberg/Gitea/Hugo within
 * the Goldmark Markdown rendering engine:
 * https://github.com/alecthomas/chroma
 *
 * This file can be updated here:
 * https://github.com/alecthomas/chroma/tree/master/lexers
 * Where each Lexer is able to define its name, and aliases within its exported
 * Config type. Otherwise the name of the lexer file is used.
 */

module.exports = {
  bash: 'source.shell',
  sh: 'source.shell',
  ksh: 'source.shell',
  zsh: 'source.shell',
  shell: 'source.shell',
  'bash-session': 'text.shell-session',
  console: 'text.shell-session',
  'shell-session': 'text.shell-session',
  cpp: 'source.cpp',
  'c++': 'source.cpp',
  c: 'source.c',
  clojure: 'source.clojure',
  clj: 'source.clojure',
  'coffee-script': 'source.coffee',
  coffeescript: 'source.coffee',
  coffee: 'source.coffee',
  csharp: 'source.cs',
  'c#': 'source.cs',
  css: 'source.css',
  'go-html-template': 'text.html.gohtml',
  handlebars: 'text.html.mustache',
  hbs: 'text.html.mustache',
  java: 'source.java',
  js: 'source.js',
  javascript: 'source.js',
  json: 'source.json',
  'objective-c': 'source.objc',
  objectivec: 'source.objc',
  'obj-c': 'source.objc',
  objc: 'source.objc',
  perl: 'source.perl',
  pl: 'source.perl',
  php: 'source.php',
  php3: 'source.php',
  php4: 'source.php',
  php5: 'source.php',
  'java-properties': 'text.xml.plist',
  python: 'source.python',
  py: 'source.python',
  sage: 'source.python',
  python3: 'source.python',
  py3: 'source.python',
  ruby: 'source.ruby',
  rb: 'source.ruby',
  duby: 'source.ruby',
  rust: 'source.rust',
  rs: 'source.rust',
  sass: 'source.sass',
  scss: 'source.css.scss',
  sql: 'source.sql',
  toml: 'source.toml',
  ts: 'source.ts',
  tsx: 'source.tsx',
  typescript: 'source.ts',
  xml: 'text.xml',
  yaml: 'source.yaml'
};
