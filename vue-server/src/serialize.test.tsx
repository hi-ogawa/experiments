import { Window } from "happy-dom";
import { expect, onTestFinished, test } from "vitest";
import { createApp, defineComponent, inject, resolveComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import AsyncVue from "./fixtures/async.vue";
import BasicVue from "./fixtures/basic.vue";
import ImportVue from "./fixtures/import.vue";
import PropsVue from "./fixtures/props.vue";
import SetupVue from "./fixtures/setup.vue";
import SlotClientVue from "./fixtures/slot-client.vue";
import SlotVue from "./fixtures/slot.vue";
import { deserialize, registerClientReference, serialize } from "./serialize";

function renderStringToDom(innerHTML: string) {
	const window = new Window({ url: "https://localhost:8080" });
	const el = window.document.createElement("div");
	el.innerHTML = innerHTML;
	onTestFinished(() => window.close());
	return el.firstChild;
}

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

	const vnode2 = deserialize(result.data, {});
	expect(vnode2).toMatchSnapshot();

	const rendered = await renderToString(vnode2 as any);
	expect(renderStringToDom(rendered)).toMatchInlineSnapshot(`
		<main
		  id="hi"
		>
		  text
		  <div
		    id="setup1"
		  >
		    <a />
		  </div>
		  <div
		    id="setup2"
		  >
		    <div>
		      <span />
		      <div
		        id="no-setup"
		      />
		    </div>
		  </div>
		  <div
		    id="setup3"
		    message="prop!"
		  />
		  <div
		    id="no-setup"
		  />
		</main>
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
		  "__snode": true,
		  "children": [
		    {
		      "__snode": true,
		      "children": "basic",
		      "props": {
		        "key": null,
		      },
		      "type": "div",
		    },
		  ],
		  "props": {
		    "id": "hi",
		    "key": null,
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
		  "__snode": true,
		  "children": [
		    {
		      "__snode": true,
		      "children": "x = 0",
		      "props": {
		        "key": null,
		      },
		      "type": "div",
		    },
		  ],
		  "props": {
		    "id": "hi",
		    "key": null,
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
		  "__snode": true,
		  "children": [
		    {
		      "__snode": true,
		      "children": "async: hi",
		      "props": {
		        "key": null,
		      },
		      "type": "div",
		    },
		  ],
		  "props": {
		    "id": "hi",
		    "key": null,
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
		  "__snode": true,
		  "children": [
		    {
		      "__snode": true,
		      "children": [
		        {
		          "__snode": true,
		          "children": [
		            {
		              "__snode": true,
		              "children": "header-fallback",
		              "props": {
		                "key": null,
		              },
		              "type": Symbol(v-txt),
		            },
		          ],
		          "props": {
		            "key": "_header",
		          },
		          "type": Symbol(v-fgt),
		        },
		      ],
		      "props": {
		        "key": null,
		      },
		      "type": "header",
		    },
		    {
		      "__snode": true,
		      "children": [
		        {
		          "__snode": true,
		          "children": [
		            {
		              "__snode": true,
		              "children": "default-fallback",
		              "props": {
		                "key": null,
		              },
		              "type": Symbol(v-txt),
		            },
		          ],
		          "props": {
		            "key": "_default",
		          },
		          "type": Symbol(v-fgt),
		        },
		      ],
		      "props": {
		        "key": null,
		      },
		      "type": "main",
		    },
		  ],
		  "props": {
		    "id": "container",
		    "key": null,
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
		  "__snode": true,
		  "children": [
		    {
		      "__snode": true,
		      "children": [
		        {
		          "__snode": true,
		          "children": [
		            {
		              "__snode": true,
		              "children": "header!!",
		              "props": {
		                "key": null,
		              },
		              "type": Symbol(v-txt),
		            },
		          ],
		          "props": {
		            "key": "_header",
		          },
		          "type": Symbol(v-fgt),
		        },
		      ],
		      "props": {
		        "key": null,
		      },
		      "type": "header",
		    },
		    {
		      "__snode": true,
		      "children": [
		        {
		          "__snode": true,
		          "children": [
		            {
		              "__snode": true,
		              "children": "default!!",
		              "props": {
		                "key": null,
		              },
		              "type": Symbol(v-txt),
		            },
		          ],
		          "props": {
		            "key": "_default",
		          },
		          "type": Symbol(v-fgt),
		        },
		      ],
		      "props": {
		        "key": null,
		      },
		      "type": "main",
		    },
		  ],
		  "props": {
		    "id": "container",
		    "key": null,
		  },
		  "type": "div",
		}
	`);
});

test("sfc import", async () => {
	const vnode = <ImportVue />;
	expect(vnode).toMatchSnapshot();
	const result = await serialize(vnode);
	expect(result.data).toMatchInlineSnapshot(`
		{
		  "__snode": true,
		  "children": [
		    {
		      "__snode": true,
		      "children": "basic",
		      "props": {
		        "key": null,
		      },
		      "type": "div",
		    },
		  ],
		  "props": {
		    "id": "import",
		    "key": null,
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
		  "__snode": true,
		  "children": "prop!",
		  "props": {
		    "id": "props",
		    "key": null,
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
		  "__snode": true,
		  "children": "hey",
		  "props": {
		    "id": "inject",
		    "key": null,
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
		  "__snode": true,
		  "children": [
		    {
		      "__snode": true,
		      "children": null,
		      "props": {
		        "id": "global",
		        "key": null,
		      },
		      "type": "div",
		    },
		  ],
		  "props": {
		    "id": "wrapper",
		    "key": null,
		  },
		  "type": "div",
		}
	`);
});

test("client reference basic", async () => {
	const Server = defineComponent(async (_props, { slots }) => {
		return () => <div id="server">{slots.default?.()}</div>;
	});

	const Client = defineComponent<{ message: string }>((props) => {
		return () => <div id="client">{props.message}</div>;
	});
	registerClientReference(Client, "#Client");

	const vnode = <Server>{() => <Client message="hi" />}</Server>;
	const result = await serialize(vnode);
	expect(result).toMatchInlineSnapshot(`
		{
		  "data": {
		    "__snode": true,
		    "children": [
		      {
		        "__reference_id": "#Client",
		        "__snode": true,
		        "children": null,
		        "props": {
		          "key": null,
		          "message": "hi",
		        },
		      },
		    ],
		    "props": {
		      "id": "server",
		      "key": null,
		    },
		    "type": "div",
		  },
		  "referenceIds": [
		    "#Client",
		  ],
		}
	`);

	const vnode2 = deserialize(result.data, { "#Client": Client });
	const rendered = await renderToString(vnode2 as any);
	expect(renderStringToDom(rendered)).toMatchInlineSnapshot(`
		<div
		  id="server"
		>
		  <div
		    id="client"
		    message="hi"
		  />
		</div>
	`);
});

test("client reference slots", async () => {
	const Server = defineComponent<{ id: string }>(async (props, { slots }) => {
		return () => <div id={props.id}>{slots.default?.()}</div>;
	});

	const Client = defineComponent<{ id: string }>((props, { slots }) => {
		return () => <span id={props.id}>{slots.default?.()}</span>;
	});
	registerClientReference(Client, "#Client");

	const vnode = (
		<Server id="server-1">
			{() => (
				<Client id="client-1">
					{() => (
						<Server id="server-2">{() => <Client id="client-2" />}</Server>
					)}
				</Client>
			)}
		</Server>
	);
	const result = await serialize(vnode);
	expect(result).toMatchInlineSnapshot(`
		{
		  "data": {
		    "__snode": true,
		    "children": [
		      {
		        "__reference_id": "#Client",
		        "__snode": true,
		        "children": {
		          "default": {
		            "__snode": true,
		            "children": [
		              {
		                "__reference_id": "#Client",
		                "__snode": true,
		                "children": null,
		                "props": {
		                  "id": "client-2",
		                  "key": null,
		                },
		              },
		            ],
		            "props": {
		              "id": "server-2",
		              "key": null,
		            },
		            "type": "div",
		          },
		        },
		        "props": {
		          "id": "client-1",
		          "key": null,
		        },
		      },
		    ],
		    "props": {
		      "id": "server-1",
		      "key": null,
		    },
		    "type": "div",
		  },
		  "referenceIds": [
		    "#Client",
		  ],
		}
	`);

	const vnode2 = deserialize(result.data, { "#Client": Client });
	expect(vnode2).matchSnapshot();

	const rendered = await renderToString(vnode2 as any);
	expect(renderStringToDom(rendered)).toMatchInlineSnapshot(`
		<div
		  id="server-1"
		>
		  <span
		    id="client-1"
		  >
		    <div
		      id="server-2"
		    >
		      <span
		        id="client-2"
		      />
		    </div>
		  </span>
		</div>
	`);
});

test("client reference sfc", async () => {
	const vnode = (
		<div id="server">
			<SlotClientVue>
				{{
					default: () => <div>server-default</div>,
					header: () => <div>server-header</div>,
				}}
			</SlotClientVue>
		</div>
	);
	registerClientReference(SlotClientVue, "#Client");

	const result = await serialize(vnode);
	expect(result).toMatchInlineSnapshot(`
		{
		  "data": {
		    "__snode": true,
		    "children": [
		      {
		        "__reference_id": "#Client",
		        "__snode": true,
		        "children": {
		          "default": {
		            "__snode": true,
		            "children": "server-default",
		            "props": {
		              "key": null,
		            },
		            "type": "div",
		          },
		          "header": {
		            "__snode": true,
		            "children": "server-header",
		            "props": {
		              "key": null,
		            },
		            "type": "div",
		          },
		        },
		        "props": {
		          "key": null,
		        },
		      },
		    ],
		    "props": {
		      "id": "server",
		      "key": null,
		    },
		    "type": "div",
		  },
		  "referenceIds": [
		    "#Client",
		  ],
		}
	`);

	const vnode2 = deserialize(result.data, { "#Client": SlotClientVue });
	const rendered = await renderToString(vnode2 as any);
	expect(renderStringToDom(rendered)).toMatchInlineSnapshot(`
		<div
		  id="server"
		>
		  <div
		    id="container"
		  >
		    <header>
		      <!--[-->
		      <div>
		        server-header
		      </div>
		      <!--]-->
		    </header>
		    <main>
		      <!--[-->
		      <div>
		        server-default
		      </div>
		      <!--]-->
		    </main>
		  </div>
		</div>
	`);
});
