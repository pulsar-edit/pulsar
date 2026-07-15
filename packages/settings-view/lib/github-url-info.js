// Minimal replacement for the single `hosted-git-info` call this package made:
// `fromUrl(input)`, used only to recognize a GitHub repository reference and to
// render it. Consumers read `.type`, `.user`, `.project`, `.default`, and call
// `.https()` / `.toString()` (see package-card.js).
//
// Recognized GitHub forms:
//   - shorthand:  user/repo            github:user/repo
//   - ssh:        git@github.com:user/repo.git
//   - url:        https://github.com/user/repo.git   git+https://…   ssh://git@github.com/…
// Anything else (including non-GitHub hosts) returns null, matching the old
// `gitUrlInfo && gitUrlInfo.type === "github" ? gitUrlInfo : null` filter.

function makeInfo(user, project, representation) {
  return {
    type: "github",
    user,
    project,
    default: representation,
    https() {
      return `https://github.com/${user}/${project}`;
    },
    shortcut() {
      return `github:${user}/${project}`;
    },
    toString() {
      return this.https();
    },
  };
}

function fromUrl(input) {
  if (!input || typeof input !== "string") return null;
  const url = input.trim();
  let match;

  // git@github.com:user/repo(.git)
  if ((match = url.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/))) {
    return makeInfo(match[1], match[2], "ssh");
  }

  // (https|http|git|ssh|git+https|git+ssh)://[user@]github.com/user/repo(.git)[#ref]
  if (
    (match = url.match(
      /^(https?|git|ssh|git\+https|git\+ssh):\/\/(?:[^@/]+@)?github\.com\/([^/]+)\/(.+?)(?:\.git)?(?:#.*)?$/,
    ))
  ) {
    const representation = /ssh/.test(match[1]) ? "ssh" : "https";
    return makeInfo(match[2], match[3], representation);
  }

  // github:user/repo  or bare  user/repo  shorthand
  if ((match = url.match(/^(?:github:)?([^/@:\s]+)\/([^/@:\s#]+?)(?:\.git)?$/))) {
    return makeInfo(match[1], match[2], "shortcut");
  }

  return null;
}

module.exports = { fromUrl };
