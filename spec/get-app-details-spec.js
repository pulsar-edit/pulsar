const fs = require("@lumine-code/fs-plus");
const path = require("path");
const temp = require("temp").track();
const { getConfigFilePath } = require("../src/get-app-details");

describe("get-app-details", () => {
  let originalAtomHome;

  beforeEach(() => {
    originalAtomHome = process.env.ATOM_HOME;
    process.env.ATOM_HOME = temp.mkdirSync("lumine-config-");
  });

  afterEach(() => {
    if (originalAtomHome == null) {
      delete process.env.ATOM_HOME;
    } else {
      process.env.ATOM_HOME = originalAtomHome;
    }
  });

  it("uses config.json as the default path", () => {
    expect(getConfigFilePath()).toBeNull();
    expect(getConfigFilePath({ returnPlaceholder: true })).toBe(
      path.join(process.env.ATOM_HOME, "config.json"),
    );
  });

  it("prefers JSON and JSONC while retaining CSON support", () => {
    const csonPath = path.join(process.env.ATOM_HOME, "config.cson");
    const jsoncPath = path.join(process.env.ATOM_HOME, "config.jsonc");
    const jsonPath = path.join(process.env.ATOM_HOME, "config.json");

    fs.writeFileSync(csonPath, "core: telemetryConsent: 'no'");
    expect(getConfigFilePath()).toBe(csonPath);

    fs.writeFileSync(jsoncPath, "{ // comment\n}");
    expect(getConfigFilePath()).toBe(jsoncPath);

    fs.writeFileSync(jsonPath, "{}");
    expect(getConfigFilePath()).toBe(jsonPath);
  });
});
