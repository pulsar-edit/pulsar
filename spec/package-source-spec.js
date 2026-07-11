const {
  cloneUrlForRepository,
  parsePackageSource,
  parseRemoteTags,
  resolvePackageSource,
  selectLatestTag,
} = require("../src/package-source");

describe("package source", function () {
  it("defaults to the latest release selector", function () {
    expect(parsePackageSource("owner/repo")).toEqual({
      repository: "owner/repo",
      selector: { type: "latest", value: null },
      source: "owner/repo",
    });
  });

  it("parses explicit branches, tags, and commits", function () {
    expect(parsePackageSource("owner/repo#branch:next").selector).toEqual({
      type: "branch",
      value: "next",
    });
    expect(parsePackageSource("owner/repo#tag:v2.0.0").selector).toEqual({
      type: "tag",
      value: "v2.0.0",
    });
    expect(parsePackageSource("owner/repo#commit:abcdef1").selector).toEqual({
      type: "commit",
      value: "abcdef1",
    });
  });

  it("parses compact tag, commit, and branch selectors", function () {
    expect(parsePackageSource("owner/repo@2.1.1").selector).toEqual({
      type: "tag",
      value: "2.1.1",
    });
    expect(parsePackageSource("owner/repo#abcdef1").selector).toEqual({
      type: "commit",
      value: "abcdef1",
    });
    expect(parsePackageSource("owner/repo~feature/Next").selector).toEqual({
      type: "branch",
      value: "feature/Next",
    });
  });

  it("supports GitHub shorthand and generic Git URLs", function () {
    expect(cloneUrlForRepository("owner/repo")).toBe("https://github.com/owner/repo.git");
    expect(cloneUrlForRepository("https://example.com/owner/repo.git")).toBe(
      "https://example.com/owner/repo.git",
    );
  });

  it("selects the highest stable semver tag and uses peeled annotated tag SHAs", function () {
    const tags = parseRemoteTags(
      [
        "1111111111111111111111111111111111111111\trefs/tags/v1.0.0",
        "2222222222222222222222222222222222222222\trefs/tags/v2.0.0-beta.1",
        "3333333333333333333333333333333333333333\trefs/tags/v1.5.0",
        "4444444444444444444444444444444444444444\trefs/tags/v1.5.0^{}",
      ].join("\n"),
    );
    expect(selectLatestTag(tags)).toEqual({
      name: "v1.5.0",
      sha: "4444444444444444444444444444444444444444",
      version: "1.5.0",
    });
  });

  it("resolves the default selector to the latest stable tag", function () {
    waitsForPromise(() =>
      resolvePackageSource("owner/repo", async (_url, options) => {
        expect(options).toEqual(["--tags"]);
        return [
          "1111111111111111111111111111111111111111\trefs/tags/v1.0.0",
          "2222222222222222222222222222222222222222\trefs/tags/v2.0.0",
        ].join("\n");
      }).then((resolved) => {
        expect(resolved.fetchRef).toBe("refs/tags/v2.0.0");
        expect(resolved.sha).toBe("2222222222222222222222222222222222222222");
        expect(resolved.updatePolicy).toBe("latest-tag");
      }),
    );
  });

  it("resolves an unprefixed semantic version to a v-prefixed tag when necessary", function () {
    waitsForPromise(() =>
      resolvePackageSource(
        "owner/repo@2.1.1",
        async () => "1111111111111111111111111111111111111111\trefs/tags/v2.1.1",
      ).then((resolved) => {
        expect(resolved.selector).toEqual({ type: "tag", value: "v2.1.1" });
        expect(resolved.fetchRef).toBe("refs/tags/v2.1.1");
        expect(resolved.updatePolicy).toBe("pinned");
      }),
    );
  });
});
