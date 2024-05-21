import { createFileRoute } from "@tanstack/react-router";
import type { PostType } from "../posts";

export const Route = createFileRoute("/posts/$postId")({
	loader: ({ params }) => loader(params.postId),
	component: Component,
});

async function loader(postId: string) {
	"use server";

	const res = await fetch(
		`https://jsonplaceholder.typicode.com/posts/${postId}`,
	);
	const post: PostType = await res.json();

	return (
		<div className="space-y-2">
			<h4 className="text-xl font-bold underline">{post.title}</h4>
			<div className="text-sm">{post.body}</div>
		</div>
	);
}

function Component() {
	return Route.useLoaderData();
}
