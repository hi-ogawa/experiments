import { expect, test } from "vitest";
import { defineComponent, h } from "vue";
import AsyncVue from "./fixtures/async.vue";
import BasicVue from "./fixtures/basic.vue";
import SetupVue from "./fixtures/setup.vue";
import { serialize } from "./serialize";

test("basic", async () => {
	const Setup1 = defineComponent({
		props: {},
		setup: async (_props, { slots }) => {
			return () => h("div", { id: "setup1" }, slots["default"]?.());
		},
	});

	const Setup2 = defineComponent(async (_props, { slots }) => {
		return () => h("div", { id: "setup2" }, slots["default"]?.());
	});

	// no async render
	const NoSetup = () => <div id="no-setup" />;

	const vnode = h("main", { id: "hi" }, [
		"text",
		null,
		h(Setup1, () => h("a")),
		<Setup2>
			{() => (
				<div>
					<span />
					<NoSetup />
				</div>
			)}
		</Setup2>,
		<NoSetup />,
	]);

	expect(vnode).toMatchSnapshot();

	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "children": [
		    "text",
		    null,
		    {
		      "children": [
		        {
		          "children": null,
		          "key": null,
		          "props": null,
		          "type": "a",
		        },
		      ],
		      "key": null,
		      "props": {
		        "id": "setup1",
		      },
		      "type": "div",
		    },
		    {
		      "children": [
		        {
		          "children": [
		            {
		              "children": null,
		              "key": null,
		              "props": {
		                "key": undefined,
		              },
		              "type": "span",
		            },
		            {
		              "children": null,
		              "key": null,
		              "props": {
		                "id": "no-setup",
		                "key": undefined,
		              },
		              "type": "div",
		            },
		          ],
		          "key": null,
		          "props": {
		            "key": undefined,
		          },
		          "type": "div",
		        },
		      ],
		      "key": null,
		      "props": {
		        "id": "setup2",
		      },
		      "type": "div",
		    },
		    {
		      "children": null,
		      "key": null,
		      "props": {
		        "id": "no-setup",
		        "key": undefined,
		      },
		      "type": "div",
		    },
		  ],
		  "key": null,
		  "props": {
		    "id": "hi",
		  },
		  "type": "main",
		}
	`);
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
