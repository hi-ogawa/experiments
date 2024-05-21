import { sleep, tinyassert } from "@hiogawa/utils";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { reviveFlightClient } from "../integrations/server-component/client";

// TODO: whole loader should be extracted and executed on react server environment.
// TODO: also auto proxy on browser
export async function flightLoader() {
	if (import.meta.env.SSR) {
		const { flightSsr } = await import("../integrations/server-component/ssr");
		const data = await flightSsr(
			<div>server random: {Math.random().toString(36).slice(2)}</div>,
		);
		return data;
	} else {
		const res = await fetch("/__flight");
		tinyassert(res.ok);
		return await res.json();
	}
}

export const Route = createFileRoute("/")({
	loader: async () => {
		// TODO: helper
		const data = await flightLoader();
		const revived = (await reviveFlightClient(data)) as React.ReactNode;
		await sleep(300);
		return { ...data, revived };
	},
	component: IndexComponent,
});

function IndexComponent() {
	const node = Route.useLoaderData().revived;

	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>
			{node}
		</div>
	);
}
