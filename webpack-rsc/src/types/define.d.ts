interface ImportMeta {
	readonly env: {
		DEV: boolean;
		SSR: boolean;
	};
}

declare let __define: {
	DEV: boolean;
	SSR: boolean;
};
