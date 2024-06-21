import { tinyassert } from "@hiogawa/utils";
import type { StatsCompilation } from "webpack";

export async function getClientAssets() {
	const stats: StatsCompilation = require(
		/* webpackIgnore: true */ "./__client_stats.cjs" as string,
	);
	tinyassert(stats.assetsByChunkName);

	const entry = stats.assetsByChunkName["index"][0];
	tinyassert(entry);

	const css: string[] = [];
	for (const asset of stats.assets ?? []) {
		const url = new URL(asset.name, "https://-.local/assets/");
		if (url.pathname.endsWith(".css")) {
			css.push(url.pathname);
		}
	}

	return {
		bootstrapScripts: [`/assets/${entry}`],
		css,
	};
}
