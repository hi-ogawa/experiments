// writing manually for starter

// remap clientBrowserManifest for ssr
export const clientSsrManifest = {
	moduleMap: {
		"./src/routes/_client.tsx": {
			Hydrated: {
				id: "(ssr)/./src/routes/_client.tsx",
				name: "Hydrated",
				chunks: ["_ssr_src_routes__client_tsx"],
			},
			Counter: {
				id: "(ssr)/./src/routes/_client.tsx",
				name: "Counter",
				chunks: ["_ssr_src_routes__client_tsx"],
			},
		},
	},
};
