import { describe, expect, test } from "vitest";
import { transformClientReference } from "./plugin-utils";

async function testTransform(input: string) {
	const output = await transformClientReference(input, "<file>");
	return output.toString();
}

describe(transformClientReference, () => {
	test("basic", async () => {
		const input = `\
import { defineComponent, h } from "vue";

export const Arrow = () => {};

export default "hi";

export function Fn() {}
export async function AsyncFn() {}
export class Cls {}
`;

		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { registerClientReference as $$register } from "/src/serialize";
			import { defineComponent, h } from "vue";

			export const Arrow = /* @__PURE__ */ $$register((() => {}), "<file>#Arrow");

			export default /* @__PURE__ */ $$register(("hi"), "<file>#default");

			export const Fn = /* @__PURE__ */ $$register((function Fn() {}), "<file>#Fn")
			export const AsyncFn = /* @__PURE__ */ $$register((async function AsyncFn() {}), "<file>#AsyncFn")
			export const Cls = /* @__PURE__ */ $$register((class Cls {}), "<file>#Cls")
			"
		`);
	});

	test("default function", async () => {
		const input = `export default function Fn() {}`;

		expect(await testTransform(input)).toMatchInlineSnapshot(
			`
			"import { registerClientReference as $$register } from "/src/serialize";
			export default /* @__PURE__ */ $$register((function Fn() {}), "<file>#default")"
		`,
		);
	});

	test("default class", async () => {
		const input = `export default class Cls {}`;

		expect(await testTransform(input)).toMatchInlineSnapshot(
			`
			"import { registerClientReference as $$register } from "/src/serialize";
			export default /* @__PURE__ */ $$register((class Cls {}), "<file>#default")"
		`,
		);
	});

	test("unsupported", async () => {
		// TODO
		const input = `\
			const x = 0;
			export { x }
		`;

		expect(() => testTransform(input)).rejects.toMatchInlineSnapshot(
			`[Error: unsupported]`,
		);
	});

	test("export rename", async () => {
		// TODO
		const input = `\
			const x = 0;
			export { x as y }
		`;

		expect(() => testTransform(input)).rejects.toMatchInlineSnapshot(
			`[Error: unsupported]`,
		);
	});

	test("re-export basic", async () => {
		const input = `\
			export { x } from "./dep"
		`;

		expect(() => testTransform(input)).rejects.toMatchInlineSnapshot(
			`[Error: unsupported]`,
		);
	});

	test("re-export rename", async () => {
		const input = `\
			export { x as y } from "./dep"
		`;

		expect(() => testTransform(input)).rejects.toMatchInlineSnapshot(
			`[Error: unsupported]`,
		);
	});
});
