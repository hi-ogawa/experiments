import MagicString from "magic-string";
import { parseAstAsync } from "vite";
import { describe, expect, it } from "vitest";
import {
	transformDeadCodeElimination2,
	transformDirectiveExpose,
	transformDirectiveProxy,
} from "./plugin";

describe(transformDirectiveProxy, () => {
	async function testTransformProxy(input: string) {
		const result = await transformDirectiveProxy(input, "<id>");
		return result.output.toString();
	}

	async function testTransformExpose(input: string) {
		const result = await transformDirectiveExpose(input);
		return result.output.toString();
	}

	it("basic", async () => {
		const input = `\
import { createFileRoute } from "@tanstack/react-router";
import { dep } from "./dep";

async function Page() {
  "use server";
  return dep;
}

export const Route = createFileRoute("/")({
  loader: () => Page(),
  component: () => "foo",
});
`;

		expect(await testTransformProxy(input)).toMatchInlineSnapshot(`
			"import { createFlightLoader as $$flight } from "/src/integrations/flight/client";
			import { createFileRoute } from "@tanstack/react-router";


			const Page = $$flight("<id>#Page")

			export const Route = createFileRoute("/")({
			  loader: () => Page(),
			  component: () => "foo",
			});
			"
		`);

		expect(await testTransformExpose(input)).toMatchInlineSnapshot(`
			"
			import { dep } from "./dep";

			export async function Page() {
			  ;
			  return dep;
			}


			"
		`);
	});

	it("repro", async () => {
		const input = `\
import { createFileRoute } from "@tanstack/react-router";
import { dep } from "./dep";
import { nonDep } from "./non-dep";

async function loader() {
  "use server";
  return dep;
}

function f() {
	nonDep;
}

export const Route = createFileRoute("/")({
  loader: () => loader(),
  component: () => f(),
});
`;

		expect(await testTransformProxy(input)).toMatchInlineSnapshot(`
			"import { createFlightLoader as $$flight } from "/src/integrations/flight/client";
			import { createFileRoute } from "@tanstack/react-router";

			import { nonDep } from "./non-dep";

			const loader = $$flight("<id>#loader")

			function f() {
				nonDep;
			}

			export const Route = createFileRoute("/")({
			  loader: () => loader(),
			  component: () => f(),
			});
			"
		`);

		expect(await testTransformExpose(input)).toMatchInlineSnapshot(`
			"
			import { dep } from "./dep";
			import { nonDep } from "./non-dep";

			export async function loader() {
			  ;
			  return dep;
			}

			function f() {
				nonDep;
			}


			"
		`);
	});
});

describe(transformDeadCodeElimination2, () => {
	async function testDeadCode(input: string) {
		const ast = await parseAstAsync(input);
		const output = new MagicString(input);
		transformDeadCodeElimination2(ast, output);
		return output.toString();
	}

	it.only("basic", async () => {
		const input = `\
import { createFileRoute } from "@tanstack/react-router";
import { dep } from "./dep";
import { nonDep } from "./non-dep";

export async function loader() {
  "use server";
  return dep;
}
`;
		expect(await testDeadCode(input)).toMatchInlineSnapshot(`
			"
			import { dep } from "./dep";


			export async function loader() {
			  "use server";
			  return dep;
			}
			"
		`);
	});
});
