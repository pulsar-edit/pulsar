const cache = require("../src/cache.js");

describe("pulsar-updater cache", () => {
  beforeEach(() => {
    jasmine.useRealClock();
  });

  it("returns key for path", () => {
    let key = cache.cacheKeyForPath("test");
    expect(key).toBe("pulsar-updater:test");
  });

  it("returns not expired properly according to date", () => {
    let expiry = cache.isItemExpired({ createdOn: Date.now() }, 'some-key');
    expect(expiry).toBe(false);
  });

  it("returns expired properly according to date", () => {
    let expiry = cache.isItemExpired({ createdOn: 0 }, 'some-key');
    expect(expiry).toBe(true);
  });

  it("returns not expired properly for last-update-check", () => {
    let expiry = cache.isItemExpired({ createdOn: 0 }, 'last-update-check');
    expect(expiry).toBe(false);
  });

  if(jasmine.version_.major > 1) {
    // TODO: The current version right now is 1.3.1 of jasmine-node
    // https://github.com/kevinsawicki/jasmine-node
    //
    // This is an unmaintained package that tried to implement jasmine for node,
    // however we have an official jasmine implementation since then
    it("returns not expired if offline", () => {
      spyOnProperty(window.navigator, 'onLine').and.returnValue(false);

      let expiry = cache.isItemExpired({ createdOn: 0 }, 'some-key');
      expect(expiry).toBe(false);
    });
  }
});
