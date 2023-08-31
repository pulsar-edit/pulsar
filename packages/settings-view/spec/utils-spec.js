/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const {ownerFromRepository} = require('../lib/utils');

describe("Utils", () => describe("ownerFromRepository", function() {
  it("handles a long github url", function() {
    const owner = ownerFromRepository("http://github.com/omgwow/some-package");
    return expect(owner).toBe("omgwow");
  });

  return it("handles a short github url", function() {
    const owner = ownerFromRepository("omgwow/some-package");
    return expect(owner).toBe("omgwow");
  });
}));
