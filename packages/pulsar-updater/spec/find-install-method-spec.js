const findInstallMethod = require("../src/find-install-method.js");

describe("find-install-method main", async () => {

  const platform = process.platform;
  const arch = process.arch;

  it("Returns developer instance if applicable", async () => {
    // We can't mock the atom api return from a package,
    // So we will just know that if tests are running, it's in the Atom SpecMode

    let method = await findInstallMethod();

    expect(method.installMethod).toBe("Developer Instance");
    expect(method.platform).toBe(platform);
    expect(method.arch).toBe(arch);
  });
});
