import type { StatsCompilation } from "webpack";

export async function getClientAssets() {
	let bootstrapScripts: string[] = [];
	if (__define.DEV) {
		bootstrapScripts = ["/assets/index.js"];
	} else {
		const clientStats: { default: StatsCompilation } = await import(
			/* webpackIgnore: true */ "./__client_stats.js" as string
		);
		bootstrapScripts = clientStats.default.assetsByChunkName!["index"].map(
			(file) => `/assets/${file}`,
		);
	}
	return bootstrapScripts;
}
