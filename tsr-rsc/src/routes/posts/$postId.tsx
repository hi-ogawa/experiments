import { createFileRoute } from "@tanstack/react-router";
import { LoaderDataComponent } from "../../helper";
import type { PostType } from "../posts";

export const Route = createFileRoute("/posts/$postId")({
	component: LoaderDataComponent,
	loader: ({ params }) => loader(params.postId),
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
