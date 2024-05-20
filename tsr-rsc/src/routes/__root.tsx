import {
	Link,
	Outlet,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { DehydrateRouter } from "@tanstack/start";
import type { RouterContext } from "../routerContext";

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
});

function RootComponent() {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Vite App</title>
				{/* TODO: hmr */}
				{/* <script
					type="module"
					suppressHydrationWarning
					dangerouslySetInnerHTML={{
						__html: `
              import RefreshRuntime from "/@react-refresh"
              RefreshRuntime.injectIntoGlobalHook(window)
              window.$RefreshReg$ = () => {}
              window.$RefreshSig$ = () => (type) => type
              window.__vite_plugin_react_preamble_installed__ = true
            `,
					}}
				/> */}
				<script type="module" src="/@vite/client" />
				<script type="module" src="/src/entry-browser" />
			</head>
			<body>
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
				<Outlet /> {/* Start rendering router matches */}
				{false && <TanStackRouterDevtools position="bottom-right" />}
				<DehydrateRouter />
			</body>
		</html>
	);
}
