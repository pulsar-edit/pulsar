let superagent;

module.exports =
async function findNewestRelease() {
  superagent ??= require("superagent");

  let res = await superagent
    .get("https://api.github.com/repos/pulsar-edit/pulsar/releases")
    .set("Accept", "application/vnd.github+json")
    .set("User-Agent", "Pulsar.Pulsar-Updater");

  if (res.status !== 200) {
    // Lie and say it's something that will never update
    return "0.0.0";
  }

  // We can be fast and simply check if the top of the array is newer than our
  // current version. Since the return is ordered.
  return res.body[0].tag_name;
}
