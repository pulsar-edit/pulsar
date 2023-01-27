const { notarize } = require("@electron/notarize");

// https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/

/**
 * @param {import("electron-builder").AfterPackContext} ctx
 */
exports.default = async function notarizing(ctx) {
	if (ctx.electronPlatformName !== "darwin") return;

	let appleId = process.env.APPLEID;
	let appleIdPassword = process.env.APPLEID_PASSWORD;

	if (!appleId || !appleIdPassword) {
		console.error("environment variables APPLEID and APPLEID_PASSWORD are not both present, skipping notarisation");
		return;
	}

	const appname = ctx.packager.appInfo.productFilename;

	return await notarize({
		appBundleId: "dev.pulsar-edit.pulsar",
		appPath: `${ctx.appOutDir}/${appname}.app`,
		appleId,
		appleIdPassword
	});
}
