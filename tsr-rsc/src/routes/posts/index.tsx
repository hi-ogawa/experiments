import { createFileRoute } from "@tanstack/react-router";
import { LoaderDataComponent } from "../../helper";

export const Route = createFileRoute("/posts/")({
	component: LoaderDataComponent,
	loader: () => loader(),
});

function loader() {
	"use server";
	return <div>Select a post.</div>;
}
