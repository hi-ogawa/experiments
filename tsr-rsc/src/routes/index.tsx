import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { $$flight } from "../entry-ssr";
import { useFlightLoader } from "../integrations/server-component/client";

export const Route = createFileRoute("/")({
	loader: async () => {
		// TODO: whole function should be extracted and executed on react server environment.
		// TODO: browser needs to fetch it via proxy
		const f = await $$flight(<div>hello server component</div>);
		console.log("[loader]", f);
		return { f };
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
