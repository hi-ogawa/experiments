import { describe, expect, test } from "vitest";
import { transformClientReference } from "./plugin-utils";

describe(transformClientReference, () => {
	test("basic", async () => {
		const input = `\
import { defineComponent, h } from "vue";

export const Arrow = () => {};

export default "hi";

// TODO
export function Fn() {}
export class Cls {}
`;

		const output = await transformClientReference(input, "<id>");
		expect(output.toString()).toMatchInlineSnapshot(`
			"import { registerClientReference as $$register } from "/src/serialize";import { defineComponent, h } from "vue";

			export const Arrow = /* @__PURE__ */ $$register((() => {}), "<id>#Arrow");

			export default /* @__PURE__ */ $$register(("hi"), "<id>#default");

			// TODO
			export /* @__PURE__ */ $$register((function Fn() {}), "<id>#Fn")
			export /* @__PURE__ */ $$register((class Cls {}), "<id>#Cls")
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
		const input = `\
      const x = 0;
      export { x }
    `;

		expect(() =>
			transformClientReference(input, "<id>"),
		).rejects.toMatchInlineSnapshot(`[Error: unsupported]`);
	});
});
