import * as rolldown from "rolldown";

async function main() {
	const build = await rolldown.rolldown({
		input: "./repro-entry.js",
	});
	const result = await build.write({
		dir: "dist/repro",
	});
	setInterval(() => {
		console.log(new Date().toISOString());
		console.log(result.output[0].moduleIds);
	}, 1000);
}

main();
