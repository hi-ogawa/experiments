import { expect, test } from "vitest";
import { defineComponent } from "vue";
import AsyncVue from "./fixtures/async.vue";
import BasicVue from "./fixtures/basic.vue";
import ImportVue from "./fixtures/import.vue";
import PropsVue from "./fixtures/props.vue";
import SetupVue from "./fixtures/setup.vue";
import SlotVue from "./fixtures/slot.vue";
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

test("sfc slot fallback", async () => {
	const vnode = <SlotVue />;
	expect(vnode).toMatchSnapshot();
	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "children": [
		    {
		      "children": [
		        {
		          "children": [
		            {
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
		      "children": [
		        {
		          "children": [
		            {
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
		  "children": [
		    {
		      "children": [
		        {
		          "children": [
		            {
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
		      "children": [
		        {
		          "children": [
		            {
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
		  "children": "prop!",
		  "key": null,
		  "props": {
		    "id": "props",
		  },
		  "type": "div",
		}
	`);
});

test.skip("provide/inject", async () => {});

test.skip("client references");
