import { expect, test } from "vitest";
import { defineComponent, h } from "vue";
import { serialize } from "./serialize";

test("basic", async () => {
	const Setup1 = defineComponent({
		props: {},
		setup: async (_props, { slots }) => {
			return () => h("div", { id: "setup1" }, slots["default"]?.());
		},
	});
	const Setup2 = defineComponent(
		async (_props, { slots }) => {
			return () => h("div", { id: "setup2" }, slots["default"]?.());
		},
		{
			props: {},
		},
	);
	const NoSetup = async () => h("div", { id: "no-setup" });

	const vnode = h("main", { id: "hi" }, [
		"text",
		null,
		h(Setup1, () => h("a")),
		h(Setup2, () => h("br")),
		h(NoSetup),
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
		          "children": null,
		          "key": null,
		          "props": null,
		          "type": "br",
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
