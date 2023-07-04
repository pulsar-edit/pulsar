/*
 * This Document defines the Language Identifiers for 'Rouge'
 * That is the string used after a code block delimiter to define
 * what programming language is within the code block.
 *
 * 'Rouge' is the Syntax Highlighting Engine used by GitLab and Jekyll:
 * https://github.com/rouge-ruby/rouge
 *
 * This file can be updated here:
 * https://github.com/rouge-ruby/rouge/tree/master/lib/rouge/lexers
 * And and outdated full list with aliases can be found here:
 * https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers
 * The Wiki document does list the main identifier for each language, and may list
 * optional aliases. But like mentioned, this document seems a few years out of date.
 * Otherwise each lexer exports a `tag` and optional `aliases` from its file.
 */

module.exports = {
  c: 'source.c',
  cpp: 'source.cpp',
  'c++': 'source.cpp',
  clojure: 'source.clojure',
  clj: 'source.clojure',
  cljs: 'source.clojure',
  coffeescript: 'source.coffee',
  coffee: 'source.coffee',
  'coffee-script': 'source.coffee',
  literate_coffeescript: 'source.litcoffee',
  litcoffee: 'source.litcoffee',
  csharp: 'source.cs',
  'c#': 'source.cs',
  cs: 'source.cs',
  css: 'source.css',
  go: 'source.go',
  golang: 'source.go',
  html: 'text.html.basic',
  erb: 'text.html.erb',
  eruby: 'text.html.erb',
  rhtml: 'text.html.erb',
  jsp: 'text.html.jsp',
  java: 'source.java',
  properties: 'source.java-properties',
  javascript: 'source.js',
  js: 'source.js',
  json: 'source.json',
  make: 'source.makefile',
  makefile: 'source.makefile',
  mf: 'source.makefile',
  gnumake: 'source.makefile',
  bsdmake: 'source.makefile',
  handlebars: 'text.html.mustache',
  hbs: 'text.html.mustache',
  mustache: 'text.html.mustache',
  objective_c: 'source.objc',
  objc: 'source.objc',
  'obj-c': 'source.objc',
  obj_c: 'source.objc',
  objectivec: 'source.objc',
  perl: 'source.perl',
  pl: 'source.perl',
  php: 'source.php',
  php3: 'source.php',
  php4: 'source.php',
  php5: 'source.php',
  plist: 'text.xml.plist',
  python: 'source.python',
  py: 'source.python',
  ruby: 'source.ruby',
  rb: 'source.ruby',
  rust: 'source.rust',
  rs: 'source.rust',
  no_run: 'source.rust',
  sass: 'source.sass',
  scss: 'source.css.scss',
  console: 'source.shell',
  terminal: 'source.shell',
  shell_session: 'source.shell-session',
  'shell-session': 'source.shell-session',
  shell: 'source.shell',
  bash: 'source.shell',
  zsh: 'source.shell',
  ksh: 'source.shell',
  sh: 'source.shell',
  sql: 'source.sql',
  plaintext: 'text.plain',
  text: 'text.plain',
  toml: 'source.toml',
  tsx: 'source.tsx',
  typescript: 'source.ts',
  ts: 'source.ts',
  xml: 'text.xml',
  mxml: 'text.xml',
  yaml: 'source.yaml',
  yml: 'source.yaml'
};
