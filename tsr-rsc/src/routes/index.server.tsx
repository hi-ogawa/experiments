"use server";

import { sleep } from "@hiogawa/utils";

export async function loader() {
	await sleep(300);
	return <div>server random: {Math.random().toString(36).slice(2)}</div>;
}
