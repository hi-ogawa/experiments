import { describe, expect, test } from "vitest";
import {
	transformClientReference,
	transformEmptyExports,
} from "./plugin-utils";

async function testTransform(input: string) {
	const output = await transformClientReference(input, "<file>");
	return output.toString();
}

describe(transformClientReference, () => {
	test("basic", async () => {
		const input = `
export const Arrow = () => {};
export default "hi";
export function Fn() {};
export async function AsyncFn() {};
export class Cls {};
`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { registerClientReference as $$wrap } from "/src/serialize";

			 const Arrow = () => {};
			export default $$wrap(("hi"), "<file>#default");
			 function Fn() {};
			 async function AsyncFn() {};
			 class Cls {};
			;
			const $$tmp_Arrow = $$wrap((Arrow), "<file>#Arrow");
			export { $$tmp_Arrow as Arrow };
			const $$tmp_Fn = $$wrap((Fn), "<file>#Fn");
			export { $$tmp_Fn as Fn };
			const $$tmp_AsyncFn = $$wrap((AsyncFn), "<file>#AsyncFn");
			export { $$tmp_AsyncFn as AsyncFn };
			const $$tmp_Cls = $$wrap((Cls), "<file>#Cls");
			export { $$tmp_Cls as Cls };
			"
		`);
	});

	test("default function", async () => {
		const input = `export default function Fn() {}`;
		expect(await testTransform(input)).toMatchInlineSnapshot(
			`
			"import { registerClientReference as $$wrap } from "/src/serialize";
			export default $$wrap((function Fn() {}), "<file>#default");
			"
		`,
		);
	});

	test("default class", async () => {
		const input = `export default class Cls {}`;
		expect(await testTransform(input)).toMatchInlineSnapshot(
			`
			"import { registerClientReference as $$wrap } from "/src/serialize";
			export default $$wrap((class Cls {}), "<file>#default");
			"
		`,
		);
	});

	test("export simple", async () => {
		const input = `
const x = 0;
export { x }
`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { registerClientReference as $$wrap } from "/src/serialize";

			const x = 0;

			;
			const $$tmp_x = $$wrap((x), "<file>#x");
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
			"import { registerClientReference as $$wrap } from "/src/serialize";

			const x = 0;

			;
			const $$tmp_x = $$wrap((x), "<file>#y");
			export { $$tmp_x as y };
			"
		`);
	});

	test("re-export simple", async () => {
		const input = `export { x } from "./dep"`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { registerClientReference as $$wrap } from "/src/serialize";
			;
			import { x as $$import_x } from "./dep";
			const $$tmp_$$import_x = $$wrap(($$import_x), "<file>#x");
			export { $$tmp_$$import_x as x };
			"
		`);
	});

	test("re-export rename", async () => {
		const input = `export { x as y } from "./dep"`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { registerClientReference as $$wrap } from "/src/serialize";
			;
			import { x as $$import_x } from "./dep";
			const $$tmp_$$import_x = $$wrap(($$import_x), "<file>#y");
			export { $$tmp_$$import_x as y };
			"
		`);
	});

	test("re-export all simple", async () => {
		const input = `export * from "./dep"`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { registerClientReference as $$wrap } from "/src/serialize";
			export * from "./dep";
			"
		`);
	});

	test("re-export all rename", async () => {
		const input = `export * as all from "./dep"`;
		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { registerClientReference as $$wrap } from "/src/serialize";
			export * as all from "./dep";
			"
		`);
	});
});

test(transformEmptyExports, async () => {
	const input = `
export const Arrow = () => {};
export default "hi";
export function Fn() {};
export async function AsyncFn() {};
export class Cls {};
`;
	expect(await transformEmptyExports(input)).toMatchInlineSnapshot(`
		"export const Arrow = undefined;
		export default undefined;
		export const Fn = undefined;
		export const AsyncFn = undefined;
		export const Cls = undefined;
		"
	`);
});
