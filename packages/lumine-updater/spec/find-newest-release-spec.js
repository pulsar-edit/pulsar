const superagent = require("superagent");
const findNewestRelease = require("../src/find-newest-release.js");

function requestReturning(response) {
  return {
    set() {
      return this;
    },
    then(resolve) {
      return Promise.resolve(response).then(resolve);
    },
  };
}

describe("lumine-updater findNewestRelease", () => {
  it("returns the newest release tag", async () => {
    spyOn(superagent, "get").andReturn(
      requestReturning({ status: 200, body: [{ tag_name: "1.2.3" }] }),
    );

    expect(await findNewestRelease()).toBe("1.2.3");
  });

  it("returns the sentinel version when the repository has no releases", async () => {
    spyOn(superagent, "get").andReturn(requestReturning({ status: 200, body: [] }));

    expect(await findNewestRelease()).toBe("0.0.0");
  });

  it("returns the sentinel version for a malformed response", async () => {
    spyOn(superagent, "get").andReturn(requestReturning({ status: 200, body: null }));

    expect(await findNewestRelease()).toBe("0.0.0");
  });

  it("returns the sentinel version when the request fails", async () => {
    spyOn(superagent, "get").and.throwError("network failure");

    expect(await findNewestRelease()).toBe("0.0.0");
  });
});
