const path = require("path");
const fs = require("fs");

const { UI_VARIABLES, UI_VARIABLES_EXTENDED, SYNTAX_VARIABLES } = require("../src/theme-variables");

// The theme variable contract exists in three places that must stay in sync:
// the manifest in src/theme-variables.js, the legacy Less fallbacks in
// static/variables/*.less, and the CSS custom-property fallbacks in
// static/variables/base-variables.css.
describe("the theme variable contract", () => {
  const variablesDir = path.join(__dirname, "..", "static", "variables");

  function lessVariableNames(fileName) {
    const source = fs.readFileSync(path.join(variablesDir, fileName), "utf8");
    const names = [];
    const definitionRegex = /^\s*@([\w-]+)\s*:/gm;
    let match;
    while ((match = definitionRegex.exec(source)) !== null) {
      names.push(match[1]);
    }
    return names;
  }

  function cssCustomPropertyNames(fileName) {
    const source = fs.readFileSync(path.join(variablesDir, fileName), "utf8");
    const names = new Set();
    const declarationRegex = /--([\w-]+)\s*:/g;
    let match;
    while ((match = declarationRegex.exec(source)) !== null) {
      names.add(match[1]);
    }
    return names;
  }

  it("defines the same UI variable names in the manifest and ui-variables.less", () => {
    const lessNames = lessVariableNames("ui-variables.less");
    expect([...lessNames].sort()).toEqual([...UI_VARIABLES].sort());
  });

  it("defines the same syntax variable names in the manifest and syntax-variables.less", () => {
    const lessNames = lessVariableNames("syntax-variables.less");
    expect([...lessNames].sort()).toEqual([...SYNTAX_VARIABLES].sort());
  });

  it("provides a CSS fallback in base-variables.css for every manifest variable", () => {
    const cssNames = cssCustomPropertyNames("base-variables.css");
    const manifestNames = [...UI_VARIABLES, ...UI_VARIABLES_EXTENDED, ...SYNTAX_VARIABLES];
    const missing = manifestNames.filter((name) => !cssNames.has(name));
    expect(missing).toEqual([]);
  });

  it("contains no duplicate names within or across the manifest lists", () => {
    const manifestNames = [...UI_VARIABLES, ...UI_VARIABLES_EXTENDED, ...SYNTAX_VARIABLES];
    const duplicates = manifestNames.filter((name, index) => manifestNames.indexOf(name) !== index);
    expect(duplicates).toEqual([]);
  });
});
