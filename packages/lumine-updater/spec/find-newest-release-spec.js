const findNewestRelease = require("../src/find-newest-release.js");

function fetchReturning({ ok = true, status = 200, body }) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("lumine-updater findNewestRelease", () => {
  it("returns the newest release tag", async () => {
    spyOn(global, "fetch").andReturn(fetchReturning({ body: [{ tag_name: "1.2.3" }] }));

    expect(await findNewestRelease()).toBe("1.2.3");
  });

  it("returns the sentinel version when the repository has no releases", async () => {
    spyOn(global, "fetch").andReturn(fetchReturning({ body: [] }));

    expect(await findNewestRelease()).toBe("0.0.0");
  });

  it("returns the sentinel version for a malformed response", async () => {
    spyOn(global, "fetch").andReturn(fetchReturning({ body: null }));

    expect(await findNewestRelease()).toBe("0.0.0");
  });

  it("returns the sentinel version when the request fails", async () => {
    spyOn(global, "fetch").andCallFake(() => Promise.reject(new Error("network failure")));

    expect(await findNewestRelease()).toBe("0.0.0");
  });
});
