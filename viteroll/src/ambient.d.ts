declare var module: {
	hot?: {
		accept(callback?: (...args: Record<string, unknown>[]) => void): void;
	};
};
