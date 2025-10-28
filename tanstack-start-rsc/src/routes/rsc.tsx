import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import React from "react";
import { fetchRsc } from "~/utils/rsc";

export const Route = createFileRoute("/rsc")({
  loader: async () => fetchRsc(),
  component: PostsComponent,
});

function PostsComponent() {
  let posts = Route.useLoaderData();
  // TODO(tanstack): loader data is promise only browser
  posts = posts instanceof Promise ? React.use(posts) : posts;

  return (
    <div className="p-2 flex gap-2">
      {posts}
      <Outlet />
    </div>
  );
}
