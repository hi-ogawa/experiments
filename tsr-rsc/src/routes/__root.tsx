import {
	Link,
	Outlet,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRouteWithContext()({
	component: RootComponent,
});

function RootComponent() {
	return (
		<div>
			<div className="p-2 flex gap-2 text-lg">
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
			</div>
			<hr />
			<Outlet />
			<TanStackRouterDevtools />
		</div>
	);
}
