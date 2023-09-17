
const {ownerFromRepository} = require('../lib/utils');

describe("Utils", () => describe("ownerFromRepository", () => {
  it("handles a long github url", () => {
    const owner = ownerFromRepository("http://github.com/omgwow/some-package");
    expect(owner).toBe("omgwow");
  });

  it("handles a short github url", () => {
    const owner = ownerFromRepository("omgwow/some-package");
    expect(owner).toBe("omgwow");
  });
}));
