/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

describe("NativeCompileCache", function() {
  const nativeCompileCache = require('../src/native-compile-cache');
  let [fakeCacheStore, cachedFiles] = Array.from([]);

  beforeEach(function() {
    cachedFiles = [];
    fakeCacheStore = jasmine.createSpyObj("cache store", ["set", "get", "has", "delete"]);

    fakeCacheStore.has.andCallFake(cacheKey => fakeCacheStore.get(cacheKey) != null);

    fakeCacheStore.get.andCallFake(function(cacheKey) {
      for (let i = cachedFiles.length - 1; i >= 0; i--) {
        const entry = cachedFiles[i];
        if (entry.cacheKey !== cacheKey) { continue; }
        return entry.cacheBuffer;
      }
    });

    fakeCacheStore.set.andCallFake((cacheKey, cacheBuffer) => cachedFiles.push({cacheKey, cacheBuffer}));

    nativeCompileCache.setCacheStore(fakeCacheStore);
    nativeCompileCache.setV8Version("a-v8-version");
    return nativeCompileCache.install();
  });

  it("writes and reads from the cache storage when requiring files", function() {
    let fn1 = require('./fixtures/native-cache/file-1');
    const fn2 = require('./fixtures/native-cache/file-2');

    expect(cachedFiles.length).toBe(2);
    expect(cachedFiles[0].cacheBuffer).toBeInstanceOf(Uint8Array);
    expect(cachedFiles[0].cacheBuffer.length).toBeGreaterThan(0);
    expect(fn1()).toBe(1);

    expect(cachedFiles[1].cacheBuffer).toBeInstanceOf(Uint8Array);
    expect(cachedFiles[1].cacheBuffer.length).toBeGreaterThan(0);
    expect(fn2()).toBe(2);

    delete Module._cache[require.resolve('./fixtures/native-cache/file-1')];
    fn1 = require('./fixtures/native-cache/file-1');
    expect(cachedFiles.length).toBe(2);
    return expect(fn1()).toBe(1);
  });

  describe("when v8 version changes", () => it("updates the cache of previously required files", function() {
    nativeCompileCache.setV8Version("version-1");
    let fn4 = require('./fixtures/native-cache/file-4');

    expect(cachedFiles.length).toBe(1);
    expect(cachedFiles[0].cacheBuffer).toBeInstanceOf(Uint8Array);
    expect(cachedFiles[0].cacheBuffer.length).toBeGreaterThan(0);
    expect(fn4()).toBe("file-4");

    nativeCompileCache.setV8Version("version-2");
    delete Module._cache[require.resolve('./fixtures/native-cache/file-4')];
    fn4 = require('./fixtures/native-cache/file-4');

    expect(cachedFiles.length).toBe(2);
    expect(cachedFiles[1].cacheBuffer).toBeInstanceOf(Uint8Array);
    return expect(cachedFiles[1].cacheBuffer.length).toBeGreaterThan(0);
  }));

  describe("when a previously required and cached file changes", function() {
    beforeEach(() => fs.writeFileSync(path.resolve(__dirname + '/fixtures/native-cache/file-5'), `\
module.exports = function () { return "file-5" }\
`
    ));

    afterEach(() => fs.unlinkSync(path.resolve(__dirname + '/fixtures/native-cache/file-5')));

    return it("removes it from the store and re-inserts it with the new cache", function() {
      let fn5 = require('./fixtures/native-cache/file-5');

      expect(cachedFiles.length).toBe(1);
      expect(cachedFiles[0].cacheBuffer).toBeInstanceOf(Uint8Array);
      expect(cachedFiles[0].cacheBuffer.length).toBeGreaterThan(0);
      expect(fn5()).toBe("file-5");

      delete Module._cache[require.resolve('./fixtures/native-cache/file-5')];
      fs.appendFileSync(require.resolve('./fixtures/native-cache/file-5'), "\n\n");
      fn5 = require('./fixtures/native-cache/file-5');

      expect(cachedFiles.length).toBe(2);
      expect(cachedFiles[1].cacheBuffer).toBeInstanceOf(Uint8Array);
      return expect(cachedFiles[1].cacheBuffer.length).toBeGreaterThan(0);
    });
  });

  return it("deletes previously cached code when the cache is an invalid file", function() {
    fakeCacheStore.has.andReturn(true);
    fakeCacheStore.get.andCallFake(() => Buffer.from("an invalid cache"));

    const fn3 = require('./fixtures/native-cache/file-3');

    expect(fakeCacheStore.delete).toHaveBeenCalled();
    return expect(fn3()).toBe(3);
  });
});
