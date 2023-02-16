const { notarize } = require("@electron/notarize");

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

	if (!appleId || !appleIdPassword) {
		console.error("environment variables APPLEID and APPLEID_PASSWORD are not both present, skipping notarisation");
		return;
	}

	/** @type {Parameters<typeof notarize>[0]} */
	let notarise_args = {
		appBundleId: "dev.pulsar-edit.pulsar",
		appPath: `${ctx.appOutDir}/${appname}.app`,
		appleId,
		appleIdPassword
	};

	if (!teamId) {
		console.log("no TEAM_ID, using (legacy) altool");
		notarise_args = {
			...notarise_args,
			tool: "legacy"
		}
	} else {
		console.log("using notarytool");

		notarise_args = {
			...notarise_args,
			tool: "notarytool",
			teamId
		};
	}

	require("debug").enable("electron-notarize");

	return await notarize(notarise_args);
}
