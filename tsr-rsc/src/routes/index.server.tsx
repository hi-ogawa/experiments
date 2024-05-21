"use server";

// TODO: support inline "use server" function;
// https://github.com/hi-ogawa/vite-environment-examples/pull/80

import { sleep } from "@hiogawa/utils";

export async function Page() {
	await sleep(300);
	return <div>server random: {Math.random().toString(36).slice(2)}</div>;
}
