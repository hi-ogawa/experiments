import { tinyassert } from "@hiogawa/utils";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { useFlightLoader } from "../integrations/server-component/client";

// TODO: whole loader should be extracted and executed on react server environment.
// TODO: "use server" to auto proxy on browser
export async function flightLoader() {
	if (import.meta.env.SSR) {
		const { flightSsr } = await import("../integrations/server-component/ssr");
		return flightSsr(
			<div>server random: {Math.random().toString(36).slice(2)}</div>,
		);
	} else {
		const res = await fetch("/__flight");
		tinyassert(res.ok);
		return await res.json();
	}
}

export const Route = createFileRoute("/")({
	loader: async () => {
		return flightLoader();
	},
	component: IndexComponent,
});

function IndexComponent() {
	// TODO: Route.loader type infererence?
	const node = useFlightLoader() as React.ReactNode;
	console.log("[useFlightLoader]", node);

	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>
			{node}
		</div>
	);
}
