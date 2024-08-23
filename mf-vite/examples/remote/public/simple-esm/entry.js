// RemoteEntryExports
// https://github.com/module-federation/core/blob/b90fa7ded8786022d900081dd7c871f317c5e4b9/packages/runtime/src/type/config.ts#L138-L144
// https://github.com/module-federation/core/blob/b90fa7ded8786022d900081dd7c871f317c5e4b9/packages/runtime/src/module/index.ts#L85-L91

export async function init(shareScope, initScope, remoteEntryInitOptions) {}

export function get(id) {
	return async () => ({ add });
}

function add(x, y) {
	return x + y;
}
