import type React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";

// https://webpack.js.org/api/module-variables/#__webpack_require__-webpack-specific

export const Hydrated = ReactServer.registerClientReference(
	{},
	// TODO: how to map same id on ssr and browser?
	// (is it necessary to modify ssrManifest.moduleMap just for SSR?)
	// "(ssr)/./src/routes/_client.tsx",
	"./src/routes/_client.tsx",
	"Hydrated",
) as React.ComponentType;
