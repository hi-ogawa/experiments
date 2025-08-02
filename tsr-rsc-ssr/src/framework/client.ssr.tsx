import * as ReactClient from "@vitejs/plugin-rsc/ssr";
import type { RscPayload, RscRequestMeta } from "./entry.rsc";
import React from "react";
import type { LoaderFnContext } from "@tanstack/router-core";
import { useLoaderData } from "@tanstack/react-router";
import type { RscLoaderReturn } from "./client.shared";

async function tsrRscLoader(ctx: LoaderFnContext): Promise<RscLoaderReturn> {
  const url = new URL("/__rsc", "http://test.local");
  const meta: RscRequestMeta = {
    routeId: ctx.route.id,
    params: ctx.params,
  };
  url.searchParams.set("meta", JSON.stringify(meta));
  const rscEntry = await import.meta.viteRsc.loadModule<
    typeof import("./entry.rsc")
  >("rsc", "index");
  const res = await rscEntry.handleRscRequest(new Request(url));
  const stream = res!.body!;
  // one stream is injected to html for CSR handoff.
  // another stream is used for SSR via `useRscStream` below.
  const [stream1, stream2] = stream.tee();
  const result = { stream: stream1 };
  streamMap.set(
    result,
    ReactClient.createFromReadableStream<RscPayload>(stream2),
  );
  return result;
}

function tsrRscComponent() {
  const result = useLoaderData({ strict: false }) as any;
  const root = useRscStream(result);
  return root;
}

export function tsrRscRoute() {
  return {
    loader: tsrRscLoader as any,
    component: tsrRscComponent,
  };
}

const streamMap = new WeakMap<RscLoaderReturn, Promise<RscPayload>>();

function useRscStream(result: RscLoaderReturn) {
  let payloadPromise = streamMap.get(result)!;
  // if (!payloadPromise) {
  //   payloadPromise = ReactClient.createFromReadableStream<RscPayload>(
  //     result.stream,
  //   );
  //   streamMap.set(result, payloadPromise);
  // }
  const payload = React.use(payloadPromise);
  return payload.root;
}
