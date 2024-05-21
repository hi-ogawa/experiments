import { describe, expect, it } from "vitest";
import { transformDirectiveProxy } from "./plugin";

describe(transformDirectiveProxy, () => {
	async function testTransform(input: string) {
		const result = await transformDirectiveProxy(input, "<id>");
		return result?.output.toString();
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

		expect(await testTransform(input)).toMatchInlineSnapshot(`
			"import { createFlightLoader as $$flight } from "/src/integrations/flight/client";
			import { createFileRoute } from "@tanstack/react-router";


			const Page = $$flight("<id>#Page")

			export const Route = createFileRoute("/")({
			  loader: () => Page(),
			  component: () => "foo",
			});
			"
		`);
	});
});
