import { ShapeFlags } from "@vue/shared";
import {
	type ComponentInternalInstance,
	type SuspenseBoundary,
	type VNode,
	isVNode,
	// @ts-expect-error no type?
	ssrUtils,
} from "vue";

// https://github.com/hi-ogawa/js-utils/blob/5288c172b72699c769dc87e2f07e3ce6ec9b5199/packages/tiny-react/src/server/index.ts

type SerializeResult = {
	data: unknown;
};

export async function serialize(input: unknown): Promise<SerializeResult> {
	const serializer = new Serializer();
	const data = await serializer.serialize(input);
	return { data };
}

class Serializer {
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
			return Promise.all(v.map((v) => this.serialize(v)));
		}
		return Object.fromEntries(
			await Promise.all(
				Object.entries(v).map(async ([k, v]) => [k, await this.serialize(v)]),
			),
		);
	}

	// TODO: text, comment, fragment?
	// https://github.com/vuejs/core/blob/461946175df95932986cbd7b07bb9598ab3318cd/packages/server-renderer/src/render.ts#L220
	async serializeNode(node: VNode) {
		if (node.shapeFlag & ShapeFlags.ELEMENT) {
			return {
				type: node.type,
				key: node.key,
				props: await this.serialize(node.props),
				children: await this.serialize(node.children),
			};
		}
		// TODO: parent, context?
		// https://github.com/vuejs/core/blob/10d34a5624775f20437ccad074a97270ef74c3fb/packages/server-renderer/src/render.ts#L94-L95
		if (node.shapeFlag & ShapeFlags.COMPONENT) {
			const instance = createComponentInstance(node, null, null);
			await setupComponent(instance, true);
			const child = renderComponentRoot(instance);
			return this.serialize(child);
		}
		throw new Error("unsupported node", { cause: node });
	}

	// TODO: client component's function slots passed from server need to be evaluated early
	async serializeSlots(slots: unknown) {
		slots;
	}
}

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

export function isClientReference(_v: unknown) {
	throw "todo";
}

export function registerClientReference(v: Function, __client_id: string) {
	Object.assign(v, { __client_id });
}
