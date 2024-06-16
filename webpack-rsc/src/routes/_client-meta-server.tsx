// writing manually for starter

// register reference
import ReactServer from "react-server-dom-webpack/server.edge";

export const Hydrated = ReactServer.registerClientReference(
	{},
	"./src/routes/_client.tsx",
	"Hydrated",
) as React.ComponentType;

export const Counter = ReactServer.registerClientReference(
	{},
	"./src/routes/_client.tsx",
	"Counter",
) as React.ComponentType;

// mapping for browser
export const clientBrowserManifest = {
	"./src/routes/_client.tsx#Hydrated": {
		id: "./src/routes/_client.tsx",
		name: "Hydrated",
		chunks: [],
		// chunks: ["src_routes__client_tsx"],
	},
	"./src/routes/_client.tsx#Counter": {
		id: "./src/routes/_client.tsx",
		name: "Counter",
		chunks: [],
		// chunks: ["src_routes__client_tsx"],
	},
};
