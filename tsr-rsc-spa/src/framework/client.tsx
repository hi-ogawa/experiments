import * as ReactClient from "@vitejs/plugin-rsc/browser";
import { RscPayload, RscRequestMeta } from "./entry.rsc";
import React from "react";
import { LoaderFnContext } from "@tanstack/router-core";
import { useLoaderData } from "@tanstack/react-router";

// TODO:
// fork client utilities for browser and ssr.
// this is currently browser only.

export async function tsrRscLoader(
  ctx: LoaderFnContext,
): Promise<ReadableStream> {
  const url = new URL("/__rsc", window.location.href);
  const meta: RscRequestMeta = {
    routeId: ctx.route.id,
    params: ctx.params,
  };
  url.searchParams.set("meta", JSON.stringify(meta));
  const res = await fetch(url);
  // ReadableStream as loader data. SSR can also handoff it to CSR.
  // https://github.com/TanStack/router/blob/7f290adb41b0f392cedcf01f74f5e867f44dad7f/packages/router-core/src/ssr/ssr-server.ts#L112
  return res.body!;
}

export function tsrRscComponent() {
  const stream = useLoaderData({ strict: false }) as ReadableStream;
  return useRscStream(stream);
}

export function tsrRscRoute() {
  return {
    loader: tsrRscLoader as any,
    component: tsrRscComponent,
  };
}

// TODO: stream mixed up between server route navigation?

const streamMap = new WeakMap<ReadableStream, Promise<RscPayload>>();

function useRscStream(stream: ReadableStream) {
  let payloadPromise = streamMap.get(stream);
  if (!payloadPromise) {
    payloadPromise = ReactClient.createFromReadableStream<RscPayload>(stream);
    streamMap.set(stream, payloadPromise);
  }
  const payload = React.use(payloadPromise);
  return payload.root;
}
