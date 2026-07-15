const gitHubUrlInfo = require("../lib/github-url-info");

describe("github-url-info", () => {
  describe("fromUrl", () => {
    it("parses ssh URLs", () => {
      const info = gitHubUrlInfo.fromUrl("git@github.com:user/repo.git");
      expect(info.type).toBe("github");
      expect(info.user).toBe("user");
      expect(info.project).toBe("repo");
      expect(info.default).toBe("ssh");
      expect(info.https()).toBe("https://github.com/user/repo");
    });

    it("parses https URLs", () => {
      const info = gitHubUrlInfo.fromUrl("https://github.com/user/repo.git");
      expect(info.type).toBe("github");
      expect(info.project).toBe("repo");
      expect(info.default).toBe("https");
      expect(info.toString()).toBe("https://github.com/user/repo");
    });

    it("parses git+https URLs", () => {
      const info = gitHubUrlInfo.fromUrl("git+https://github.com/user/repo");
      expect(info.type).toBe("github");
      expect(info.project).toBe("repo");
    });

    it("parses shorthand user/repo", () => {
      const info = gitHubUrlInfo.fromUrl("user/repo");
      expect(info.type).toBe("github");
      expect(info.user).toBe("user");
      expect(info.project).toBe("repo");
      expect(info.default).toBe("shortcut");
      expect(info.https()).toBe("https://github.com/user/repo");
    });

    it("parses github: shorthand", () => {
      const info = gitHubUrlInfo.fromUrl("github:user/repo");
      expect(info.default).toBe("shortcut");
      expect(info.project).toBe("repo");
    });

    it("returns null for unparseable or non-GitHub input", () => {
      expect(gitHubUrlInfo.fromUrl("")).toBe(null);
      expect(gitHubUrlInfo.fromUrl(null)).toBe(null);
      expect(gitHubUrlInfo.fromUrl("https://example.com/a/b/c/d")).toBe(null);
    });
  });
});
