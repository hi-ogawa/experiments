import { expect, test } from "vitest";
import { defineComponent, h } from "vue";
import { serialize } from "./serialize";

test("basic", async () => {
	const Setup1 = defineComponent({
		props: {},
		setup: async (_props, { slots }) => {
			return () =>
				h("div", { id: "setup1" }, [h("input"), slots["default"]?.()]);
		},
	});
	const Setup2 = defineComponent(
		async (_props, { slots }) => {
			return () =>
				h("div", { id: "setup2" }, [h("input"), slots["default"]?.()]);
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
		h(Setup2, () => h("a")),
		h(NoSetup),
	]);

	expect(vnode).toMatchInlineSnapshot(`
		{
		  "__v_isVNode": true,
		  "__v_skip": true,
		  "anchor": null,
		  "appContext": null,
		  "children": [
		    "text",
		    null,
		    {
		      "__v_isVNode": true,
		      "__v_skip": true,
		      "anchor": null,
		      "appContext": null,
		      "children": {
		        "_ctx": null,
		        "default": [Function],
		      },
		      "component": null,
		      "ctx": null,
		      "dirs": null,
		      "dynamicChildren": null,
		      "dynamicProps": null,
		      "el": null,
		      "key": null,
		      "patchFlag": 0,
		      "props": null,
		      "ref": null,
		      "scopeId": null,
		      "shapeFlag": 36,
		      "slotScopeIds": null,
		      "ssContent": null,
		      "ssFallback": null,
		      "staticCount": 0,
		      "suspense": null,
		      "target": null,
		      "targetAnchor": null,
		      "transition": null,
		      "type": {
		        "props": {},
		        "setup": [Function],
		      },
		    },
		    {
		      "__v_isVNode": true,
		      "__v_skip": true,
		      "anchor": null,
		      "appContext": null,
		      "children": {
		        "_ctx": null,
		        "default": [Function],
		      },
		      "component": null,
		      "ctx": null,
		      "dirs": null,
		      "dynamicChildren": null,
		      "dynamicProps": null,
		      "el": null,
		      "key": null,
		      "patchFlag": 0,
		      "props": null,
		      "ref": null,
		      "scopeId": null,
		      "shapeFlag": 36,
		      "slotScopeIds": null,
		      "ssContent": null,
		      "ssFallback": null,
		      "staticCount": 0,
		      "suspense": null,
		      "target": null,
		      "targetAnchor": null,
		      "transition": null,
		      "type": {
		        "name": "",
		        "props": {},
		        "setup": [Function],
		      },
		    },
		    {
		      "__v_isVNode": true,
		      "__v_skip": true,
		      "anchor": null,
		      "appContext": null,
		      "children": null,
		      "component": null,
		      "ctx": null,
		      "dirs": null,
		      "dynamicChildren": null,
		      "dynamicProps": null,
		      "el": null,
		      "key": null,
		      "patchFlag": 0,
		      "props": null,
		      "ref": null,
		      "scopeId": null,
		      "shapeFlag": 2,
		      "slotScopeIds": null,
		      "ssContent": null,
		      "ssFallback": null,
		      "staticCount": 0,
		      "suspense": null,
		      "target": null,
		      "targetAnchor": null,
		      "transition": null,
		      "type": [Function],
		    },
		  ],
		  "component": null,
		  "ctx": null,
		  "dirs": null,
		  "dynamicChildren": null,
		  "dynamicProps": null,
		  "el": null,
		  "key": null,
		  "patchFlag": 0,
		  "props": {
		    "id": "hi",
		  },
		  "ref": null,
		  "scopeId": null,
		  "shapeFlag": 17,
		  "slotScopeIds": null,
		  "ssContent": null,
		  "ssFallback": null,
		  "staticCount": 0,
		  "suspense": null,
		  "target": null,
		  "targetAnchor": null,
		  "transition": null,
		  "type": "main",
		}
	`);

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
              "type": "input",
            },
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
              "type": "input",
            },
            {
              "children": null,
              "key": null,
              "props": null,
              "type": "a",
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
