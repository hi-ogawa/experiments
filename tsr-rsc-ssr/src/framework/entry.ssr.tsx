import {
  RouterServer,
  createRequestHandler,
  transformReadableStreamWithRouter,
} from "@tanstack/react-router/ssr/server";
import { createRouter } from "../router";
import ReactDOMServer from "react-dom/server.edge";

export async function renderHtml({ request }: { request: Request }) {
  const handler = createRequestHandler({
    request,
    createRouter,
  });

  const bootstrapScriptContent =
    await import.meta.viteRsc.loadBootstrapScriptContent("index");

  const response = await handler(async ({ responseHeaders, router }) => {
    const ssrRoot = <RouterServer router={router} />;
    const stream = await ReactDOMServer.renderToReadableStream(ssrRoot, {
      bootstrapScriptContent,
    });
    const responseStream = transformReadableStreamWithRouter(
      router,
      stream as any,
    );
    return new Response(responseStream as any, {
      status: router.state.statusCode,
      headers: responseHeaders,
    });
  });

  return response;
}
