// https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/

/**
 * @param {import("electron-builder").AfterPackContext} ctx
 */
exports.default = async function notarizing(ctx) {
  if (ctx.electronPlatformName !== "darwin") return;

  const appleId = process.env.APPLEID;
  const appleIdPassword = process.env.APPLEID_PASSWORD;
  const teamId = process.env.TEAM_ID;
  const appname = ctx.packager.appInfo.productFilename;

  if (!appleId || !appleIdPassword || !teamId) {
    console.error(
      "environment variables APPLEID, APPLEID_PASSWORD, and TEAM_ID are not all present, skipping notarisation",
    );
    return;
  }

  const { notarize } = await import("@electron/notarize");

  /** @type {Parameters<typeof notarize>[0]} */
  const notarise_args = {
    appPath: `${ctx.appOutDir}/${appname}.app`,
    appleId,
    appleIdPassword,
    teamId,
  };

  console.log("using notarytool");

  // eslint-disable-next-line n/no-extraneous-require -- build-only transitive dep
  require("debug").enable("electron-notarize");

  return await notarize(notarise_args);
};
