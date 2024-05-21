import { createFileRoute } from "@tanstack/react-router";
import { Link, Outlet } from "../client-export";

export type PostType = {
	id: string;
	title: string;
	body: string;
};

export const Route = createFileRoute("/posts")({
	loader: () => loader(),
	component: PostsComponent,
});

function PostsComponent() {
	return Route.useLoaderData();
}

async function loader() {
	"use server";

	const posts = await fetch("https://jsonplaceholder.typicode.com/posts")
		.then((d) => d.json() as Promise<PostType[]>)
		.then((d) => d.slice(0, 10));

	return (
		<div className="p-2 flex gap-2">
			<ul className="list-disc pl-4">
				{posts?.map((post) => (
					<li key={post.id} className="whitespace-nowrap">
						<Link
							to="/posts/$postId"
							params={{
								postId: post.id,
							}}
							className="block py-1 text-blue-800 hover:text-blue-600"
							activeProps={{ className: "text-black font-bold" }}
						>
							<div>{post.title.substring(0, 20)}</div>
						</Link>
					</li>
				))}
			</ul>
			<hr />
			<Outlet />
		</div>
	);
}
