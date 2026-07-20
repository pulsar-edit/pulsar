/** @babel */

import URIHandlerRegistry from "../src/uri-handler-registry";

// The object shape handlers receive is public API: it must stay compatible
// with the output of Node's legacy `url.parse(uri, true)`.
function parsedUri(host, pathname, href) {
  return {
    protocol: "atom:",
    slashes: true,
    auth: null,
    host,
    port: null,
    hostname: host,
    hash: null,
    search: null,
    // Like legacy `url.parse(uri, true)`, `query` has a null prototype.
    query: Object.create(null),
    pathname,
    path: pathname,
    href,
  };
}

describe("URIHandlerRegistry", () => {
  let registry;

  beforeEach(() => {
    registry = new URIHandlerRegistry(5);
  });

  it("handles URIs on a per-host basis", async () => {
    const testPackageSpy = jasmine.createSpy();
    const otherPackageSpy = jasmine.createSpy();
    registry.registerHostHandler("test-package", testPackageSpy);
    registry.registerHostHandler("other-package", otherPackageSpy);

    await registry.handleURI("atom://yet-another-package/path");
    expect(testPackageSpy).not.toHaveBeenCalled();
    expect(otherPackageSpy).not.toHaveBeenCalled();

    await registry.handleURI("atom://test-package/path");
    expect(testPackageSpy).toHaveBeenCalledWith(
      parsedUri("test-package", "/path", "atom://test-package/path"),
      "atom://test-package/path",
    );
    expect(otherPackageSpy).not.toHaveBeenCalled();

    await registry.handleURI("atom://other-package/path");
    expect(otherPackageSpy).toHaveBeenCalledWith(
      parsedUri("other-package", "/path", "atom://other-package/path"),
      "atom://other-package/path",
    );
  });

  it("keeps track of the most recent URIs", async () => {
    const spy1 = jasmine.createSpy();
    const spy2 = jasmine.createSpy();
    const changeSpy = jasmine.createSpy();
    registry.registerHostHandler("one", spy1);
    registry.registerHostHandler("two", spy2);
    registry.onHistoryChange(changeSpy);

    const uris = [
      "atom://one/something?asdf=1",
      "atom://fake/nothing",
      "atom://two/other/stuff",
      "atom://one/more/thing",
      "atom://two/more/stuff",
    ];

    for (const u of uris) {
      await registry.handleURI(u);
    }

    expect(changeSpy.calls.count()).toBe(5);
    expect(registry.getRecentlyHandledURIs()).toEqual(
      uris
        .map((u, idx) => {
          return {
            id: idx + 1,
            uri: u,
            handled: !u.match(/fake/),
            host: new URL(u).host,
          };
        })
        .reverse(),
    );

    await registry.handleURI("atom://another/url");
    expect(changeSpy.calls.count()).toBe(6);
    const history = registry.getRecentlyHandledURIs();
    expect(history.length).toBe(5);
    expect(history[0].uri).toBe("atom://another/url");
    expect(history[4].uri).toBe(uris[1]);
  });

  it("refuses to handle bad URLs", async () => {
    const invalidUris = [
      "atom:package/path",
      "atom:8080://package/path",
      "user:pass@atom://package/path",
      "smth://package/path",
    ];

    let numErrors = 0;
    for (const uri of invalidUris) {
      try {
        await registry.handleURI(uri);
        expect(uri).toBe("throwing an error");
      } catch {
        numErrors++;
      }
    }

    expect(numErrors).toBe(invalidUris.length);
  });
});
