import { ShapeFlags } from "@vue/shared";
import {
	type AppContext,
	type ComponentInternalInstance,
	type SuspenseBoundary,
	type VNode,
	createVNode,
	isVNode,
	// @ts-expect-error no type?
	ssrUtils,
} from "vue";

// https://github.com/hi-ogawa/js-utils/blob/5288c172b72699c769dc87e2f07e3ce6ec9b5199/packages/tiny-react/src/server/index.ts

//
// serialize
//

type SerializeResult = {
	data: unknown;
	referenceIds: string[];
};

export async function serialize(
	input: unknown,
	context?: AppContext,
): Promise<SerializeResult> {
	const serializer = new Serializer(context);
	const data = await serializer.serialize(input);
	return { data, referenceIds: [...serializer.referenceIds] };
}

class Serializer {
	referenceIds = new Set<string>();

	constructor(private context?: AppContext) {}

	async serialize(v: unknown): Promise<unknown> {
		if (typeof v === "function") {
			throw new Error("cannot serialize function", { cause: v });
		}
		if (
			v === null ||
			typeof v === "undefined" ||
			typeof v === "string" ||
			typeof v === "boolean" ||
			typeof v === "number"
		) {
			return v;
		}
		if (isVNode(v)) {
			return this.serializeNode(v);
		}
		if (Array.isArray(v)) {
			return mapPromise(v, (v) => this.serialize(v));
		}
		return Object.fromEntries(
			await mapPromise(Object.entries(v), async ([k, v]) => [
				k,
				await this.serialize(v),
			]),
		);
	}

	// https://github.com/vuejs/core/blob/461946175df95932986cbd7b07bb9598ab3318cd/packages/server-renderer/src/render.ts#L220
	async serializeNode(node: VNode) {
		if (typeof node.type === "symbol" || node.shapeFlag & ShapeFlags.ELEMENT) {
			return {
				__snode: true,
				type: node.type,
				props: await this.serialize({ ...(node.props ?? {}), key: node.key }),
				children: await this.serialize(node.children),
			} satisfies SNode;
		}
		if (node.shapeFlag & ShapeFlags.COMPONENT) {
			// client reference
			const id = (node.type as any).__reference_id;
			if (id) {
				this.referenceIds.add(id);
				return {
					__snode: true,
					__reference_id: id,
					props: await this.serialize({ ...(node.props ?? {}), key: node.key }),
					// TODO: slots function
					children: await this.serialize(node.children),
				} satisfies SNode;
			}

			// setup app context for app.provide/component
			// https://github.com/vuejs/core/blob/461946175df95932986cbd7b07bb9598ab3318cd/packages/runtime-core/src/component.ts#L546-L548
			node.appContext = this.context ?? null;
			const instance = createComponentInstance(node, null, null);
			await setupComponent(instance, true);
			// TODO: wrap something?
			const child = renderComponentRoot(instance);
			return this.serialize(child);
		}
		console.error("[unexpected vnode]", [node.type, node.shapeFlag]);
		throw new Error("unexpected vnode", { cause: node });
	}
}

// sequential for easier debugging
async function mapPromise<T, U>(
	xs: T[],
	f: (x: T) => Promise<U>,
): Promise<U[]> {
	let ys: U[] = [];
	for (const x of xs) {
		ys.push(await f(x));
	}
	return ys;
}

type SNode = {
	__snode: true;
	__reference_id?: string;
	type?: any;
	props: any;
	children: any;
};

export function registerClientReference(v: any, __reference_id: string) {
	Object.assign(v, { __reference_id });
}

//
// deserialize
//

export type ReferenceMap = Record<string, unknown>;

export function deserialize(data: unknown, referenceMap: ReferenceMap) {
	const deserializer = new Deserializer(referenceMap);
	return deserializer.deserialize(data);
}

class Deserializer {
	constructor(private referenceMap: ReferenceMap) {}

	deserialize(v: unknown): unknown {
		if (typeof v === "function") {
			throw new Error("cannot serialize function", { cause: v });
		}
		if (
			v === null ||
			typeof v === "undefined" ||
			typeof v === "string" ||
			typeof v === "boolean" ||
			typeof v === "number"
		) {
			return v;
		}
		if (typeof v === "object" && "__snode" in v) {
			return this.deserializeNode(v as SNode);
		}
		if (Array.isArray(v)) {
			return v.map((v) => this.deserialize(v));
		}
		return Object.fromEntries(
			Object.entries(v).map(([k, v]) => [k, this.deserialize(v)]),
		);
	}

	deserializeNode(node: SNode) {
		let nodeType;
		if (node.__reference_id) {
			nodeType = this.referenceMap[node.__reference_id];
			if (!nodeType) {
				console.error(node);
				throw new Error("reference not found: " + node.__reference_id, {
					cause: node,
				});
			}
		} else {
			nodeType = node.type;
		}
		return createVNode(
			nodeType,
			this.deserialize(node.props) as any,
			this.deserialize(node.children),
		);
	}
}

//
// vue utils
//

// https://github.com/vuejs/core/blob/10d34a5624775f20437ccad074a97270ef74c3fb/packages/runtime-core/src/index.ts#L362-L383
const {
	createComponentInstance,
	setupComponent,
	renderComponentRoot,
}: {
	createComponentInstance: (
		vnode: VNode,
		parent: ComponentInternalInstance | null,
		suspense: SuspenseBoundary | null,
	) => ComponentInternalInstance;
	setupComponent: (
		instance: ComponentInternalInstance,
		isSSR?: boolean,
	) => Promise<void> | undefined;
	renderComponentRoot: (instance: ComponentInternalInstance) => VNode;
} = ssrUtils;
