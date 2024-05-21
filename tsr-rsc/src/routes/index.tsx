import { createFileRoute } from "@tanstack/react-router";

// TODO: support inline "use server"
import { loader } from "./index.server";

export const Route = createFileRoute("/")({
	loader,
	component: IndexComponent,
});

function IndexComponent() {
	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>
			{Route.useLoaderData()}
		</div>
	);
}
