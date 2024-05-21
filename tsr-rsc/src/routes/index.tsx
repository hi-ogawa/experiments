import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	loader: () => loader(),
	component: IndexComponent,
});

async function loader() {
	"use server";
	new Promise((resolve) => setTimeout(resolve, 300));
	return <div>server random: {Math.random().toString(36).slice(2)}</div>;
}

function IndexComponent() {
	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>
			{Route.useLoaderData()}
		</div>
	);
}
