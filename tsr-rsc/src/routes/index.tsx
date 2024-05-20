import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { useFlightLoader } from "../integrations/server-component/client";

export const Route = createFileRoute("/")({
	// TODO: whole loader should be extracted and executed on react server environment.
	loader: async () => {
		if (import.meta.env.SSR) {
			const { $$flight } = await import("../entry-ssr");
			const f = await $$flight(
				<div>server random: {Math.random().toString(36).slice(2)}</div>,
			);
			console.log("[loader]", f);
			return { f };
		} else {
			// TODO: browser needs to fetch it via proxy
			throw new Error("browser");
		}
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
