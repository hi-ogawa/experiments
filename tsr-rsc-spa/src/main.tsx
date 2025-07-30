import ReactDOM from "react-dom/client";
import {
  ErrorComponent,
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { NotFoundError, fetchPost, fetchPosts } from "./posts";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { fetchRsc } from "./framework/browser";

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    );
  },
});

function RootComponent() {
  return (
    <>
      <div className="p-2 flex gap-2 text-lg border-b">
        <Link
          to="/"
          activeProps={{
            className: "font-bold",
          }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>{" "}
        <Link
          to="/rsc"
          activeProps={{
            className: "font-bold",
          }}
          activeOptions={{ exact: true }}
        >
          RSC
        </Link>{" "}
        <Link
          to="/posts"
          activeProps={{
            className: "font-bold",
          }}
        >
          Posts
        </Link>{" "}
      </div>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}

const postsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "posts",
  loader: () => fetchPosts(),
}).lazy(() => import("./posts.lazy").then((d) => d.Route));

const postsIndexRoute = createRoute({
  getParentRoute: () => postsLayoutRoute,
  path: "/",
  component: PostsIndexComponent,
});

function PostsIndexComponent() {
  return <div>Select a post.</div>;
}

const postRoute = createRoute({
  getParentRoute: () => postsLayoutRoute,
  path: "$postId",
  errorComponent: PostErrorComponent,
  loader: ({ params }) => fetchPost(params.postId),
  component: PostComponent,
});

function PostErrorComponent({ error }: ErrorComponentProps) {
  if (error instanceof NotFoundError) {
    return <div>{error.message}</div>;
  }

  return <ErrorComponent error={error} />;
}

function PostComponent() {
  const post = postRoute.useLoaderData();

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold">{post.title}</h4>
      <hr className="opacity-20" />
      <div className="text-sm">{post.body}</div>
    </div>
  );
}

const rscRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rsc",
  loader: async () => {
    const rsc = await fetchRsc();
    return {
      tsrLoader: <span>TSR Loader</span>,
      rsc,
    };
  },
  component: () => {
    const loaderData = rscRoute.useLoaderData();
    return (
      <div>
        <div>tsr-component</div>
        <div>tsr-loader-data: {loaderData.tsrLoader}</div>
        <div>tsr-loader-data: {loaderData.rsc}</div>
      </div>
    );
  },
});

const routeTree = rootRoute.addChildren([
  postsLayoutRoute.addChildren([postRoute, postsIndexRoute]),
  rscRoute,
  indexRoute,
]);

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultStaleTime: 5000,
  scrollRestoration: true,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(<RouterProvider router={router} />);
}
