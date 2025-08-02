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
): Promise<RscLoaderReturn> {
  const url = new URL("/__rsc", window.location.href);
  const meta: RscRequestMeta = {
    routeId: ctx.route.id,
    params: ctx.params,
  };
  url.searchParams.set("meta", JSON.stringify(meta));
  const res = await fetch(url);
  // ReadableStream as loader data. SSR can also handoff it to CSR.
  // https://github.com/TanStack/router/blob/7f290adb41b0f392cedcf01f74f5e867f44dad7f/packages/router-core/src/ssr/ssr-server.ts#L112
  return { stream: res.body! };
}

// directly using `stream` as `WeakMap` is somehow broken.
// for now, we wrap with `RscLoaderReturn` object.
type RscLoaderReturn = {
  stream: ReadableStream;
};

export function tsrRscComponent() {
  const result = useLoaderData({ strict: false }) as any;
  return useRscStream(result);
}

export function tsrRscRoute() {
  return {
    loader: tsrRscLoader as any,
    component: tsrRscComponent,
  };
}

const streamMap = new WeakMap<RscLoaderReturn, Promise<RscPayload>>();

function useRscStream(result: RscLoaderReturn) {
  let payloadPromise = streamMap.get(result);
  if (!payloadPromise) {
    payloadPromise = ReactClient.createFromReadableStream<RscPayload>(
      result.stream,
    );
    streamMap.set(result, payloadPromise);
  }
  const payload = React.use(payloadPromise);
  return payload.root;
}
