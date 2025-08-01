import * as ReactServer from "@vitejs/plugin-rsc/rsc";
// import type { ReactFormState } from 'react-dom/client'
// import { Root } from '../root.tsx'

export type RscPayload = {
  root: React.ReactNode;
  // returnValue?: unknown
  // formState?: ReactFormState
};

export type RscRequestMeta = {
  routeId: string;
  params: object;
};

export default async function handler(request: Request): Promise<Response> {
  // TODO: server action?
  // const isAction = request.method === 'POST'
  // let returnValue: unknown | undefined
  // let formState: ReactFormState | undefined
  // let temporaryReferences: unknown | undefined
  // if (isAction) {
  //   const actionId = request.headers.get('x-rsc-action')
  //   if (actionId) {
  //     const contentType = request.headers.get('content-type')
  //     const body = contentType?.startsWith('multipart/form-data')
  //       ? await request.formData()
  //       : await request.text()
  //     temporaryReferences = ReactServer.createTemporaryReferenceSet()
  //     const args = await ReactServer.decodeReply(body, { temporaryReferences })
  //     const action = await ReactServer.loadServerAction(actionId)
  //     returnValue = await action.apply(null, args)
  //   } else {
  //     const formData = await request.formData()
  //     const decodedAction = await ReactServer.decodeAction(formData)
  //     const result = await decodedAction()
  //     formState = await ReactServer.decodeFormState(result, formData)
  //   }
  // }

  const url = new URL(request.url);
  if (url.pathname !== "/__rsc") {
    return notFound();
  }
  const metaRaw = url.searchParams.get("meta");
  if (!metaRaw) {
    return notFound();
  }

  const meta = JSON.parse(metaRaw) as RscRequestMeta;
  let root: React.ReactNode;
  switch (meta.routeId) {
    case "/test": {
      const mod = await import("../routes/-test.server");
      root = <mod.default {...(meta as any)} />;
      break;
    }
    case "/posts": {
      const mod = await import("../routes/-posts.route.server");
      root = <mod.default {...(meta as any)} />;
      break;
    }
    case "/posts/$postId": {
      const mod = await import("../routes/-posts.$postId.server");
      root = <mod.default {...(meta as any)} />;
      break;
    }
    default: {
      return notFound();
    }
  }

  const rscPayload: RscPayload = {
    root,
    // root: <Root />,
    // formState,
    // returnValue
  };
  const rscOptions = {
    // temporaryReferences
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

function notFound() {
  return new Response("Not Found", { status: 404 });
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
