const cache = require("../src/cache.js");

describe("pulsar-updater cache", () => {
  it("returns key for path", () => {
    let key = cache.cacheKeyForPath("test");
    expect(key).toBe("pulsar-updater:test");
  });

  it("returns expired properly according to date", () => {
    let expiry = cache.isItemExpired({ createdOn: Date.now() });
    expect(expiry).toBe(false);
  });

  it("returns not expired if offline", () => {
    spyOn(cache, "online").andReturn(true);

    let expiry = cache.isItemExpired({ createdOn: 0 });
    expect(expiry).toBe(false);
  })
});
