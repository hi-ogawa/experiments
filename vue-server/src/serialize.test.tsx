import { expect, test } from "vitest";
import { createApp, defineComponent, inject, resolveComponent } from "vue";
import AsyncVue from "./fixtures/async.vue";
import BasicVue from "./fixtures/basic.vue";
import ImportVue from "./fixtures/import.vue";
import PropsVue from "./fixtures/props.vue";
import SetupVue from "./fixtures/setup.vue";
import SlotVue from "./fixtures/slot.vue";
import { deserialize, serialize } from "./serialize";

test("basic", async () => {
	const Setup1 = defineComponent({
		setup: async (_props, { slots }) => {
			return () => <div id="setup1">{slots.default?.()}</div>;
		},
	});

	const Setup2 = defineComponent(async (_props, { slots }) => {
		return () => <div id="setup2">{slots.default?.()}</div>;
	});

	const Setup3 = defineComponent<{ message: string }>({
		setup: async (props) => {
			return () => <div id="setup3">{props.message}</div>;
		},
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
			<Setup3 message="prop!" />
			<NoSetup />
		</main>
	);
	expect(vnode).toMatchSnapshot();

	const result = await serialize(vnode);
	expect(result.data).toMatchSnapshot();

	const vnode2 = deserialize(result.data);
	expect(vnode2).toMatchSnapshot();
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
		  "__v_isVNode": true,
		  "children": [
		    {
		      "__v_isVNode": true,
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
		  "__v_isVNode": true,
		  "children": [
		    {
		      "__v_isVNode": true,
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
		  "__v_isVNode": true,
		  "children": [
		    {
		      "__v_isVNode": true,
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

test("sfc slot fallback", async () => {
	const vnode = <SlotVue />;
	expect(vnode).toMatchSnapshot();
	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "__v_isVNode": true,
		  "children": [
		    {
		      "__v_isVNode": true,
		      "children": [
		        {
		          "__v_isVNode": true,
		          "children": [
		            {
		              "__v_isVNode": true,
		              "children": "header-fallback",
		              "type": Symbol(v-txt),
		            },
		          ],
		          "type": Symbol(v-fgt),
		        },
		      ],
		      "key": null,
		      "props": null,
		      "type": "header",
		    },
		    {
		      "__v_isVNode": true,
		      "children": [
		        {
		          "__v_isVNode": true,
		          "children": [
		            {
		              "__v_isVNode": true,
		              "children": "default-fallback",
		              "type": Symbol(v-txt),
		            },
		          ],
		          "type": Symbol(v-fgt),
		        },
		      ],
		      "key": null,
		      "props": null,
		      "type": "main",
		    },
		  ],
		  "key": null,
		  "props": {
		    "id": "container",
		  },
		  "type": "div",
		}
	`);
});

test("sfc slot basic", async () => {
	const vnode = (
		<SlotVue>
			{{
				default: () => "default!!",
				header: () => "header!!",
			}}
		</SlotVue>
	);
	expect(vnode).toMatchSnapshot();
	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "__v_isVNode": true,
		  "children": [
		    {
		      "__v_isVNode": true,
		      "children": [
		        {
		          "__v_isVNode": true,
		          "children": [
		            {
		              "__v_isVNode": true,
		              "children": "header!!",
		              "type": Symbol(v-txt),
		            },
		          ],
		          "type": Symbol(v-fgt),
		        },
		      ],
		      "key": null,
		      "props": null,
		      "type": "header",
		    },
		    {
		      "__v_isVNode": true,
		      "children": [
		        {
		          "__v_isVNode": true,
		          "children": [
		            {
		              "__v_isVNode": true,
		              "children": "default!!",
		              "type": Symbol(v-txt),
		            },
		          ],
		          "type": Symbol(v-fgt),
		        },
		      ],
		      "key": null,
		      "props": null,
		      "type": "main",
		    },
		  ],
		  "key": null,
		  "props": {
		    "id": "container",
		  },
		  "type": "div",
		}
	`);
});

// can technically work unless client boundary?
test.skip("scoped slot");

test("sfc import", async () => {
	const vnode = <ImportVue />;
	expect(vnode).toMatchSnapshot();
	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "__v_isVNode": true,
		  "children": [
		    {
		      "__v_isVNode": true,
		      "children": "basic",
		      "key": null,
		      "props": null,
		      "type": "div",
		    },
		  ],
		  "key": null,
		  "props": {
		    "id": "import",
		  },
		  "type": "div",
		}
	`);
});

test("sfc props", async () => {
	const vnode = <PropsVue message="prop!" />;
	expect(vnode).toMatchSnapshot();
	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "__v_isVNode": true,
		  "children": "prop!",
		  "key": null,
		  "props": {
		    "id": "props",
		  },
		  "type": "div",
		}
	`);
});

test("context inject", async () => {
	const Injector = defineComponent(async () => {
		const message = inject("message");
		return () => <div id="inject">{message}</div>;
	});

	const app = createApp(<></>);
	app.provide("message", "hey");
	const result = await serialize(<Injector />, app._context);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "__v_isVNode": true,
		  "children": "hey",
		  "key": null,
		  "props": {
		    "id": "inject",
		    "key": undefined,
		  },
		  "type": "div",
		}
	`);
});

test("context global", async () => {
	const Wrapper = defineComponent(async () => {
		const Global = resolveComponent("Global") as any;
		return () => (
			<div id="wrapper">
				<Global />
			</div>
		);
	});

	const Global = defineComponent(async () => {
		return () => <div id="global" />;
	});

	const app = createApp(<></>);
	app.component("Global", Global);

	const result = await serialize(<Wrapper />, app._context);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "__v_isVNode": true,
		  "children": [
		    {
		      "__v_isVNode": true,
		      "children": null,
		      "key": null,
		      "props": {
		        "id": "global",
		        "key": undefined,
		      },
		      "type": "div",
		    },
		  ],
		  "key": null,
		  "props": {
		    "id": "wrapper",
		    "key": undefined,
		  },
		  "type": "div",
		}
	`);
});

test.skip("client references");
