import { tinyassert } from "@hiogawa/utils";
import { ShapeFlags } from "@vue/shared";
import { type VNode, isVNode } from "vue";

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

	async serializeNode(node: VNode) {
		if (node.shapeFlag & ShapeFlags.ELEMENT) {
			return {
				type: node.type,
				key: node.key,
				props: await this.serialize(node.props),
				children: await this.serialize(node.children),
			};
		}
		// TODO: does vue runtime exposes utility to evaluate component?
		// - createComponentInstance
		// - setupComponent
		if (node.shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT) {
			const render = node.type as unknown;
			tinyassert(typeof render === "function");
			const child = await render(node.props, { slots: node.children });
			return this.serialize(child);
		}
		if (node.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
			let { setup, render } = node.type as any;
			if (setup) {
				tinyassert(typeof setup === "function");
				const returned = await setup(node.props, {
					slots: node.children,
					expose: () => {},
				});
				console.log(returned);
				render ??= await setup(node.props, {
					slots: node.children,
					expose: () => {},
				});
			}
			tinyassert(typeof render === "function");
			const child = await render();
			return this.serialize(child);
		}
		throw new Error("unsupported node", { cause: node });
	}

	// TODO: client component's function slots passed from server need to be evaluated early
	async serializeSlots(slots: unknown) {
		slots;
	}
}

export function isClientReference(v: unknown) {
	throw "todo";
}

export function registerClientReference(v: Function, __client_id: string) {
	Object.assign(v, { __client_id });
}
