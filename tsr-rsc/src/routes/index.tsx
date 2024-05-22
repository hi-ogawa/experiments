import { createFileRoute } from "@tanstack/react-router";
import { Link } from "../client-export";

export const Route = createFileRoute("/")({
	loader: () => loader(),
	component: IndexComponent,
});

async function loader() {
	"use server";
	await new Promise((resolve) => setTimeout(resolve, 300));
	return (
		<div>
			<div>server random: {Math.random().toString(36).slice(2)}</div>
			<div>
				<Link
					to="/posts"
					className="block py-1 text-blue-800 hover:text-blue-600"
				>
					Client Link!
				</Link>
			</div>
		</div>
	);
}

function IndexComponent() {
	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>
			{Route.useLoaderData()}
		</div>
	);
}
