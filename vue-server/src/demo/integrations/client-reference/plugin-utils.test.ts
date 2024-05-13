import { describe, expect, test } from "vitest";
import { parseExports, transformClientReference } from "./plugin-utils";

describe(parseExports, () => {
	test("basic", async () => {
		const input = `\
import { defineComponent, h } from "vue";

export const Arrow = () => "hi";

export default "hi";

// TODO
export function Fn() { return "hi" }
export class Cls {}
`;

		const output = await transformClientReference(input, "<id>");
		expect(output.toString()).toMatchInlineSnapshot(`
			"import { registerClientReference as $$register } from "/src/serialize";import { defineComponent, h } from "vue";

			export const Arrow = /* @__PURE__ */ $$register((() => "hi"), "<id>#Arrow");

			export default /* @__PURE__ */ $$register(("hi"), "<id>#default");

			// TODO
			export /* @__PURE__ */ $$register((function Fn() { return "hi" }), "<id>#Fn")
			export /* @__PURE__ */ $$register((class Cls {}), "<id>#Cls")
			"
		`);
	});
});
