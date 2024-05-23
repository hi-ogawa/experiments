import {
	Link,
	Outlet,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Hydrated } from "./-client";

export const Route = createRootRouteWithContext()({
	component: RootComponent,
});

function RootComponent() {
	return (
		<div>
			<div className="p-2 flex items-center gap-2 text-lg">
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
					to="/posts"
					activeProps={{
						className: "font-bold",
					}}
				>
					Posts
				</Link>{" "}
				<Link
					to="/error"
					activeProps={{
						className: "font-bold",
					}}
				>
					Error
				</Link>
				<a
					href="https://github.com/hi-ogawa/experiments/tree/main/tsr-rsc"
					target="_blank"
				>
					GitHub
				</a>
				<span className="ml-2 text-sm flex items-center gap-2">
					<Hydrated />
					<input className="px-1 w-24 border" placeholder="(test-input)" />
				</span>
			</div>
			<hr />
			<Outlet />
			<TanStackRouterDevtools />
		</div>
	);
}
