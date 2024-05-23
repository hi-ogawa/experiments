import { createFileRoute } from "@tanstack/react-router";
import { LoaderDataComponent } from "../helper";

export const Route = createFileRoute("/error")({
	component: LoaderDataComponent,
	loader: () => loader(),
	errorComponent: ({ error }) => {
		return (
			<div className="p-2">
				<h3>Caught: {(error as Error).message}</h3>
				<p>(This page has a 50% chance of throwing an error)</p>
			</div>
		);
	},
});

async function loader() {
	"use server";

	async function Page() {
		if (Math.random() > 0.5) {
			throw new Error("Random error!");
		}
		return (
			<div className="p-2">
				<h3>The loader of this page has a 50% chance of throwing an error!</h3>
			</div>
		);
	}

	return <Page />;
}
