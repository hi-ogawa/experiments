import { createFileRoute } from "@tanstack/react-router";
import { createFlightLoader } from "../integrations/server-component/client";

export const Route = createFileRoute("/")({
	// TODO: support inline "use server"
	loader: createFlightLoader("/src/routes/index.server#Page"),
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
