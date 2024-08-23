// RemoteEntryExports
// https://github.com/module-federation/core/blob/b90fa7ded8786022d900081dd7c871f317c5e4b9/packages/runtime/src/type/config.ts#L138-L144
// https://github.com/module-federation/core/blob/b90fa7ded8786022d900081dd7c871f317c5e4b9/packages/runtime/src/module/index.ts#L85-L91

/** @type {import("react")} */
let React;

/** @type {import("@module-federation/runtime/types").RemoteEntryExports['init']} */
export async function init(shareScope, initScope, remoteEntryInitOptions) {
	React = (await shareScope.react[0].get())();
}

/** @type {import("@module-federation/runtime/types").RemoteEntryExports['get']} */
export function get(id) {
	return () => ({ Component });
}

function Component(props) {
	return React.createElement(
		React.Fragment,
		null,
		`\n  props = ${JSON.stringify(props)}`,
		`\n  import.meta.url = ${import.meta.url}`,
	);
}
