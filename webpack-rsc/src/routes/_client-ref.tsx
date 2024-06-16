import type React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";

// https://webpack.js.org/api/module-variables/#__webpack_require__-webpack-specific

export const Hydrated = ReactServer.registerClientReference(
	{},
	"(ssr)/./src/routes/_client.tsx",
	"Hydrated",
) as React.ComponentType;
