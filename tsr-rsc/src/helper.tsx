import { useLoaderData } from "@tanstack/react-router";

export function LoaderDataComponent() {
	return useLoaderData({ strict: false });
}
