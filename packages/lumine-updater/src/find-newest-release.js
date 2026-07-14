module.exports = async function findNewestRelease() {
  let res;
  try {
    res = await fetch("https://api.github.com/repos/lumine-code/lumine/releases", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Lumine.Lumine-Updater",
      },
    });
  } catch {
    // fetch rejects on network errors and timeouts.
    return "0.0.0";
  }

  if (!res.ok) {
    // Lie and say it's something that will never update
    return "0.0.0";
  }

  let body;
  try {
    body = await res.json();
  } catch {
    return "0.0.0";
  }

  if (!Array.isArray(body) || body.length === 0) {
    // Lie and say it's something that will never update
    return "0.0.0";
  }

  // We can be fast and simply check if the top of the array is newer than our
  // current version. Since the return is ordered.
  return body[0].tag_name;
};
