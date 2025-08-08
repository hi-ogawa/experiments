import * as ReactServer from "@vitejs/plugin-rsc/rsc";
import { ServerError } from "./error/server";

export type RscPayload = {
  root: React.ReactNode;
};

export type RscRequestMeta = {
  routeId: string;
  params: object;
};

export default async function handler(request: Request): Promise<Response> {
  const rscResponse = await handleRscRequest(request);
  if (rscResponse) {
    return rscResponse;
  }

  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");
  const htmlResponse = await ssr.renderHtml({ request });
  return htmlResponse;
}

export async function handleRscRequest(
  request: Request,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname !== "/__rsc") return;
  const metaRaw = url.searchParams.get("meta");
  if (!metaRaw) return;

  const meta = JSON.parse(metaRaw) as RscRequestMeta;
  let root: React.ReactNode;
  
  switch (meta.routeId) {
    case "/test": {
      const mod = await import("../routes/test.rsc");
      root = <mod.default {...(meta as any)} />;
      break;
    }
    case "/posts": {
      const mod = await import("../routes/posts/route.rsc");
      root = <mod.default {...(meta as any)} />;
      break;
    }
    case "/posts/$postId": {
      const mod = await import("../routes/posts/$postId.rsc");
      root = <mod.default {...(meta as any)} />;
      break;
    }
    default: {
      return;
    }
  }

  const rscPayload: RscPayload = {
    root,
  };
  const rscOptions = {
    onError(e: unknown) {
      if (e instanceof ServerError) {
        return e.digest;
      }
      console.error("[RSC renderToReadableStream error]", e);
    },
  };
  const rscStream = ReactServer.renderToReadableStream<RscPayload>(
    rscPayload,
    rscOptions,
  );

  return new Response(rscStream, {
    headers: {
      "content-type": "text/x-component;charset=utf-8",
      vary: "accept",
    },
  });
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
