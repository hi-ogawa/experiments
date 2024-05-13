import { describe, expect, test } from "vitest";
import { transformClientReference } from "./plugin-utils";

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

		const output = await transformClientReference(input, "<id>");
		expect(output.toString()).toMatchInlineSnapshot(`
			"import { registerClientReference as $$register } from "/src/serialize";import { defineComponent, h } from "vue";

			export const Arrow = /* @__PURE__ */ $$register((() => {}), "<id>#Arrow");

			export default /* @__PURE__ */ $$register(("hi"), "<id>#default");

			export const Fn = /* @__PURE__ */ $$register((function Fn() {}), "<id>#Fn")
			export const AsyncFn = /* @__PURE__ */ $$register((async function AsyncFn() {}), "<id>#AsyncFn")
			export const Cls = /* @__PURE__ */ $$register((class Cls {}), "<id>#Cls")
			"
		`);
	});

	test("default function", async () => {
		const input = `export default function Fn() {}`;

		const output = await transformClientReference(input, "<id>");
		expect(output.toString()).toMatchInlineSnapshot(
			`"import { registerClientReference as $$register } from "/src/serialize";export default /* @__PURE__ */ $$register((function Fn() {}), "<id>#default")"`,
		);
	});

	test("default class", async () => {
		const input = `export default class Cls {}`;

		const output = await transformClientReference(input, "<id>");
		expect(output.toString()).toMatchInlineSnapshot(
			`"import { registerClientReference as $$register } from "/src/serialize";export default /* @__PURE__ */ $$register((class Cls {}), "<id>#default")"`,
		);
	});

	test("unsupported", async () => {
		// TODO
		const input = `\
      const x = 0;
      export { x }
    `;

		expect(() =>
			transformClientReference(input, "<id>"),
		).rejects.toMatchInlineSnapshot(`[Error: unsupported]`);
	});
});
