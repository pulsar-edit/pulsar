
const AtomIoClient = require('../lib/atom-io-client');

describe("AtomIoClient", function() {

  beforeEach(function() {
    return this.client = new AtomIoClient;
  });

  it("fetches avatar from cache if the network is unavailable", function() {
    spyOn(this.client, 'online').andReturn(false);
    spyOn(this.client, 'fetchAndCacheAvatar');
    expect(this.client.fetchAndCacheAvatar).not.toHaveBeenCalled();
    return this.client.avatar('test-user', function() {});
  });

  describe("request", function() {
    it("fetches api json from cache if the network is unavailable", function() {
      spyOn(this.client, 'online').andReturn(false);
      spyOn(this.client, 'fetchFromCache').andReturn({});
      spyOn(this.client, 'request');
      this.client.package('test-package', function() {});

      expect(this.client.fetchFromCache).toHaveBeenCalled();
      expect(this.client.request).not.toHaveBeenCalled();
    });

    it("returns an error if the API response is not JSON", function() {
      const jsonParse = JSON.parse;

      waitsFor(function(done) {
        spyOn(this.client, 'parseJSON').andThrow();
        return this.client.request('path', function(error, data) {
          expect(error).not.toBeNull();
          return done();
        });
      });

      return runs(() => // Tests will throw without this as cleanup requires JSON.parse to work
      JSON.parse = jsonParse);
    });
  });

  it("handles glob errors", function() {
    spyOn(this.client, 'avatarGlob').andReturn(`${__dirname}/**`);
    spyOn(require('fs'), 'readdir').andCallFake((dirPath, callback) => process.nextTick(() => callback(new Error('readdir error'))));

    const callback = jasmine.createSpy('cacheAvatar callback');
    this.client.cachedAvatar('fakeperson', callback);

    waitsFor(() => callback.callCount === 1);

    return runs(() => expect(callback.argsForCall[0][0].message).toBe('readdir error'));
  });

  return xit("purges old items from cache correctly");
});
    // "correctly" in this case means "remove all old items but one" so that we
    // always have stale data to return if the network is gone.
