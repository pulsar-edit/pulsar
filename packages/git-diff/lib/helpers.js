"use babel";

export default async function (goalPath) {
  return goalPath ? atom.repositories.resolveForPath(goalPath) : null;
}
