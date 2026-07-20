/**
  Regenerates the static `completions.json` used by `autocomplete-lumine` from
  Lumine's own core source.

  The public API is documented with Atom-style doc comments (`Public:`,
  `Extended:`, `Section:`) directly in the editor's `src/*.js`. We run those files
  through `joanna` (which extracts the documented classes, methods and instance
  properties) and `tello` (which digests that metadata into the same `api.json`
  shape Atom used to publish), then reshape each public member into an
  autocomplete suggestion.

  `joanna` ships with a Babylon 6 parser that predates optional chaining and other
  modern syntax used across the core, so before requiring it we swap its `babylon`
  dependency for `@babel/parser` (which produces a compatible AST). No
  `descriptionMoreURL` is emitted: there is no Lumine API reference site to link to.

  Run with `yarn update` (or `npm run update`) from this package directory, after
  installing this package's dev dependencies.
*/

 

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const CORE_ROOT = path.join(__dirname, "..", "..", "..");
const SRC_DIR = path.join(CORE_ROOT, "src");
const OUTPUT = path.join(__dirname, "..", "completions.json");

// Make joanna parse with @babel/parser instead of its bundled Babylon 6, so it
// can read the modern syntax used in the core source. joanna calls
// `require("babylon").parse(code, opts)`; we pre-seed the module cache at the
// exact path joanna resolves with a shim that forwards to @babel/parser.
const PARSER_PLUGINS = [
  "jsx",
  "classProperties",
  "classPrivateProperties",
  "classPrivateMethods",
  "classStaticBlock",
  "objectRestSpread",
  "optionalChaining",
  "nullishCoalescingOperator",
  "logicalAssignmentOperators",
  "numericSeparator",
  "optionalCatchBinding",
];

function parseSource(code) {
  return parser.parse(code, { sourceType: "module", plugins: PARSER_PLUGINS });
}

function patchJoannaParser() {
  const generatePath = require.resolve("joanna/src/generate");
  const babylonPath = require.resolve("babylon", { paths: [path.dirname(generatePath)] });
  require.cache[babylonPath] = {
    id: babylonPath,
    filename: babylonPath,
    loaded: true,
    exports: { parse: parseSource },
  };
}

function listSrcFiles() {
  return fs
    .readdirSync(SRC_DIR)
    .filter((entry) => entry.endsWith(".js"))
    .map((entry) => path.join(SRC_DIR, entry));
}

// atomdoc (used by tello) chokes on fenced code blocks and `## Examples`-style
// sections in doc comments, and completions only use the one-line summary anyway.
// Strip fenced code blocks and `##` section headings so the remaining prose
// parses cleanly.
function stripDocMarkup(doc) {
  if (typeof doc !== "string") return doc;
  return doc.replace(/```[\s\S]*?```/g, "").replace(/\n[ \t]*##[ \t]+[^\n]*/g, "");
}

function stripDocMarkupFromMetadata(files) {
  for (const file of Object.values(files)) {
    for (const byColumn of Object.values(file.objects ?? {})) {
      for (const object of Object.values(byColumn)) {
        object.doc = stripDocMarkup(object.doc);
      }
    }
  }
  return files;
}

// Some core classes (e.g. AtomEnvironment) are documented with a JSDoc `@class`
// block instead of an Atom-style `Public:`/`Extended:` comment. joanna tags those
// `Private:`, and tello then drops the whole class. Their public members are still
// what we want, so promote such classes to `Public:` (the class summary itself is
// unused by completions).
function promoteJsdocClasses(files) {
  for (const file of Object.values(files)) {
    for (const byColumn of Object.values(file.objects ?? {})) {
      for (const object of Object.values(byColumn)) {
        if (
          object.type === "class" &&
          typeof object.doc === "string" &&
          /@class\b/.test(object.doc) &&
          !/^(Essential|Extended|Public|Section):/.test(object.doc)
        ) {
          object.doc = `Public: ${object.name}`;
        }
      }
    }
  }
  return files;
}

function isVisible({ visibility }) {
  return ["Essential", "Extended", "Public"].includes(visibility);
}

function textComparator(a, b) {
  if (a.name > b.name) return 1;
  if (a.name < b.name) return -1;
  return 0;
}

function convertMethodToSuggestion(method) {
  const { name, summary, returnValues } = method;
  const args = method.arguments;

  let text = null;
  let snippet = null;
  if (args?.length) {
    const snippets = args.map((arg, i) => `\${${i + 1}:${arg.name}}`);
    snippet = `${name}(${snippets.join(", ")})`;
  } else {
    text = `${name}()`;
  }

  return {
    name,
    text,
    snippet,
    description: summary,
    leftLabel: returnValues?.[0]?.type,
    type: "method",
  };
}

function convertPropertyToSuggestion({ name, summary }) {
  return {
    name,
    text: name,
    description: summary,
    leftLabel: summary?.match(/\{(\w+)\}/)?.[1],
    type: "property",
  };
}

function generateApi(jsFiles) {
  patchJoannaParser();
  const joanna = require("joanna");
  const tello = require("tello");

  const { files } = joanna(jsFiles);
  stripDocMarkupFromMetadata(files);
  promoteJsdocClasses(files);
  const corePackage = require(path.join(CORE_ROOT, "package.json"));
  const metadata = {
    repository: "https://github.com/lumine-code/lumine",
    version: corePackage.version,
    files,
  };

  return tello.digest([metadata]);
}

// The name bound by a (possibly defaulted / rest) function parameter, or null for
// destructured parameters we cannot represent as a single placeholder.
function parameterName(param) {
  switch (param.type) {
    case "Identifier":
      return param.name;
    case "AssignmentPattern":
      return parameterName(param.left);
    case "RestElement":
      return parameterName(param.argument);
    default:
      return null;
  }
}

function typeFromJsdoc(comment) {
  return comment?.type === "CommentBlock" ? comment.value.match(/@type\s*\{([^}]+)\}/)?.[1] : null;
}

// Recover the pieces joanna/tello miss because the core is partway through a
// migration to JSDoc: instance properties documented with `/** @type {Class} */`
// (which drive the recursive `atom.<service>.` completions) and method parameter
// names (used to build snippets when the Atom-doc `* \`arg\`` list is absent).
// Returns { [className]: { properties: Map<name, type>, params: Map<name, string[]> } }.
function extractJsdocData(jsFiles) {
  const byClass = {};

  const collectClass = (node, name) => {
    if (!name) return;
    const entry = (byClass[name] ??= { properties: new Map(), params: new Map() });

    for (const member of node.body.body) {
      if (member.type !== "ClassMethod" || member.static) continue;

      if (member.kind === "constructor") {
        for (const statement of member.body.body) {
          const expression = statement.type === "ExpressionStatement" ? statement.expression : null;
          if (
            expression?.type !== "AssignmentExpression" ||
            expression.left.type !== "MemberExpression" ||
            expression.left.object.type !== "ThisExpression" ||
            expression.left.property.type !== "Identifier"
          ) {
            continue;
          }
          const type = typeFromJsdoc((statement.leadingComments ?? []).at(-1));
          if (type) {
            entry.properties.set(expression.left.property.name, type);
          }
        }
      } else if (member.kind === "method" && member.key.type === "Identifier") {
        entry.params.set(member.key.name, member.params.map(parameterName));
      }
    }
  };

  for (const filePath of jsFiles) {
    const ast = parseSource(fs.readFileSync(filePath, "utf8"));
    for (const statement of ast.program.body) {
      if (statement.type === "ClassDeclaration") {
        collectClass(statement, statement.id?.name);
      } else if (
        statement.type === "ExpressionStatement" &&
        statement.expression.type === "AssignmentExpression" &&
        statement.expression.right.type === "ClassExpression"
      ) {
        const classNode = statement.expression.right;
        collectClass(classNode, classNode.id?.name);
      }
    }
  }

  return byClass;
}

// Types that describe a plain value rather than an object worth completing on;
// `@type {Boolean}` and friends should not become `atom.<service>`-style entries.
const PRIMITIVE_TYPES = new Set([
  "Boolean",
  "String",
  "Number",
  "Object",
  "Array",
  "Function",
  "RegExp",
  "Date",
  "Promise",
  "Map",
  "Set",
  "Symbol",
  "Error",
  "Buffer",
  "Mixed",
  "boolean",
  "string",
  "number",
  "object",
  "array",
  "any",
  "void",
  "null",
  "undefined",
]);

// Fold the recovered JSDoc data into tello's classes so the existing suggestion
// builders pick them up: add missing instance properties documented with a
// `@type {Class}` comment, and fill in arguments for methods that have none.
function mergeJsdocData(classes, jsdoc) {
  for (const [name, cls] of Object.entries(classes)) {
    const recovered = jsdoc[name];
    if (!recovered) continue;

    const instanceProperties = (cls.instanceProperties ??= []);
    const existing = new Set(instanceProperties.map((property) => property.name));
    for (const [propertyName, rawType] of recovered.properties) {
      const type = rawType.match(/[A-Za-z_$][\w$]*/)?.[0];
      if (existing.has(propertyName) || !type || PRIMITIVE_TYPES.has(type)) continue;
      instanceProperties.push({
        name: propertyName,
        visibility: "Public",
        summary: `A {${type}} instance.`,
      });
    }

    for (const method of cls.instanceMethods ?? []) {
      if (method.arguments?.length) continue;
      const params = (recovered.params.get(method.name) ?? []).filter(Boolean);
      if (params.length) {
        method.arguments = params.map((paramName) => ({ name: paramName }));
      }
    }
  }
}

function update() {
  const jsFiles = listSrcFiles();
  const { classes } = generateApi(jsFiles);
  mergeJsdocData(classes, extractJsdocData(jsFiles));

  const publicClasses = {};
  for (const [name, { instanceProperties, instanceMethods }] of Object.entries(classes)) {
    const properties = (instanceProperties ?? [])
      .filter(isVisible)
      .map(convertPropertyToSuggestion)
      .sort(textComparator);
    const methods = (instanceMethods ?? [])
      .filter(isVisible)
      .map(convertMethodToSuggestion)
      .sort(textComparator);

    if (properties.length > 0 || methods.length > 0) {
      publicClasses[name] = properties.concat(methods);
    }
  }

  fs.writeFileSync(OUTPUT, `${JSON.stringify(publicClasses, null, "  ")}\n`);
  console.log(`Updated ${Object.keys(publicClasses).length} classes in completions.json`);
}

try {
  update();
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}
