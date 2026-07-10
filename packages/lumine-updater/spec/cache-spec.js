const cache = require("../src/cache.js");

describe("lumine-updater cache", () => {
  beforeEach(() => {
    jasmine.useRealClock();
  });

  it("returns key for path", () => {
    let key = cache.cacheKeyForPath("test");
    expect(key).toBe("lumine-updater:test");
  });

  it("returns not expired properly according to date", () => {
    let expiry = cache.isItemExpired({ createdOn: Date.now() }, "some-key");
    expect(expiry).toBe(false);
  });

  it("returns expired properly according to date", () => {
    let expiry = cache.isItemExpired({ createdOn: 0 }, "some-key");
    expect(expiry).toBe(true);
  });

  it("returns not expired properly for last-update-check", () => {
    let expiry = cache.isItemExpired({ createdOn: 0 }, "last-update-check");
    expect(expiry).toBe(false);
  });

  it("returns not expired if offline", () => {
    spyOnProperty(window.navigator, "onLine").and.returnValue(false);

    let expiry = cache.isItemExpired({ createdOn: 0 }, "some-key");
    expect(expiry).toBe(false);
  });
});
