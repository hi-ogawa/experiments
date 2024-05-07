import { expect, test } from "vitest";
import { defineComponent } from "vue";
import AsyncVue from "./fixtures/async.vue";
import BasicVue from "./fixtures/basic.vue";
import SetupVue from "./fixtures/setup.vue";
import { serialize } from "./serialize";

test("basic", async () => {
	const Setup1 = defineComponent({
		setup: async (_props, { slots }) => {
			return () => <div id="setup1">{slots.default?.()}</div>;
		},
	});

	const Setup2 = defineComponent(async (_props, { slots }) => {
		return () => <div id="setup2">{slots.default?.()}</div>;
	});

	// no async render
	const NoSetup = () => <div id="no-setup" />;

	const vnode = (
		<main id="hi">
			text
			<Setup1>{() => <a></a>}</Setup1>
			<Setup2>
				{() => (
					<div>
						<span />
						<NoSetup />
					</div>
				)}
			</Setup2>
			<NoSetup />
		</main>
	);
	expect(vnode).toMatchSnapshot();

	const result = await serialize(vnode);
	expect(result.data).toMatchSnapshot();
});

test("sfc template", async () => {
	const vnode = (
		<main id="hi">
			<BasicVue />
		</main>
	);
	expect(vnode).toMatchSnapshot();

	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "children": [
		    {
		      "children": "basic",
		      "key": null,
		      "props": null,
		      "type": "div",
		    },
		  ],
		  "key": null,
		  "props": {
		    "id": "hi",
		    "key": undefined,
		  },
		  "type": "main",
		}
	`);
});

test("sfc setup", async () => {
	const vnode = (
		<main id="hi">
			<SetupVue />
		</main>
	);
	expect(vnode).toMatchSnapshot();

	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "children": [
		    {
		      "children": "x = 0",
		      "key": null,
		      "props": null,
		      "type": "div",
		    },
		  ],
		  "key": null,
		  "props": {
		    "id": "hi",
		    "key": undefined,
		  },
		  "type": "main",
		}
	`);
});

test("sfc async", async () => {
	const vnode = (
		<main id="hi">
			<AsyncVue />
		</main>
	);
	expect(vnode).toMatchSnapshot();

	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "children": [
		    {
		      "children": "async: hi",
		      "key": null,
		      "props": null,
		      "type": "div",
		    },
		  ],
		  "key": null,
		  "props": {
		    "id": "hi",
		    "key": undefined,
		  },
		  "type": "main",
		}
	`);
});

test.skip("sfc slots");
test.skip("client references");
