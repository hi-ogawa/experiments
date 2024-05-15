import { describe, expect, test } from "vitest";
import { transformClientReference, transformWrapExports } from "./plugin-utils";

async function testTransform(input: string) {
	const { output } = await transformWrapExports(input, "<file>");
	return output.toString();
}

describe(transformClientReference, () => {
	test("basic", async () => {
		const input = `
export const Arrow = () => {};
export default "hi";
export function Fn() {}
export async function AsyncFn() {}
export class Cls {}
`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"
			 const Arrow = () => {};
			export default $$register(("hi"), "<file>#default");
			 function Fn() {}
			 async function AsyncFn() {}
			 class Cls {}
			const $$tmp_Arrow = $$register(Arrow, "<file>#Arrow");
			export { $$tmp_Arrow as Arrow };
			const $$tmp_Fn = $$register(Fn, "<file>#Fn");
			export { $$tmp_Fn as Fn };
			const $$tmp_AsyncFn = $$register(AsyncFn, "<file>#AsyncFn");
			export { $$tmp_AsyncFn as AsyncFn };
			const $$tmp_Cls = $$register(Cls, "<file>#Cls");
			export { $$tmp_Cls as Cls };
			"
		`);
	});

	test("default function", async () => {
		const input = `export default function Fn() {}`;
		expect(await testTransform(input)).toMatchInlineSnapshot(
			`"export default $$register((function Fn() {}), "<file>#default")"`,
		);
	});

	test("default class", async () => {
		const input = `export default class Cls {}`;
		expect(await testTransform(input)).toMatchInlineSnapshot(
			`"export default $$register((class Cls {}), "<file>#default")"`,
		);
	});

	test("export simple", async () => {
		const input = `
const x = 0;
export { x }
`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"
			const x = 0;

			const $$tmp_x = $$register(x, "<file>#x");
			export { $$tmp_x as x };
			"
		`);
	});

	test("export rename", async () => {
		const input = `
const x = 0;
export { x as y }
`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"
			const x = 0;

			const $$tmp_x = $$register(x, "<file>#x");
			export { $$tmp_x as y };
			"
		`);
	});

	test("re-export simple", async () => {
		const input = `export { x } from "./dep"`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { x as $$import_x } from "./dep";
			const $$tmp_$$import_x = $$register($$import_x, "<file>#$$import_x");
			export { $$tmp_$$import_x as x };
			"
		`);
	});

	test("re-export rename", async () => {
		const input = `export { x as y } from "./dep"`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
  "import { x as $$import_x } from "./dep";
  const $$tmp_$$import_x = $$register($$import_x, "<file>#$$import_x");
  export { $$tmp_$$import_x as y };
  "
`);
	});

	test("re-export all simple", async () => {
		const input = `export * from "./dep"`;
		expect(() => testTransform(input)).rejects.toMatchInlineSnapshot(
			`[Error: unsupported]`,
		);
	});

	test("re-export all rename", async () => {
		const input = `export * as all from "./dep"`;
		expect(() => testTransform(input)).rejects.toMatchInlineSnapshot(
			`[Error: unsupported]`,
		);
	});
});
