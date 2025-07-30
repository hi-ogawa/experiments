import * as ReactServer from "@vitejs/plugin-rsc/rsc";
// import type { ReactFormState } from 'react-dom/client'
// import { Root } from '../root.tsx'

export type RscPayload = {
  root: React.ReactNode;
  // returnValue?: unknown
  // formState?: ReactFormState
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
  let root: React.ReactNode;
  switch (url.pathname) {
    case "/test": {
      const mod = await import("../routes/test");
      root = <mod.default />;
      break;
    }
    default: {
      root = <div>Unknown RSC request</div>;
      break;
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

if (import.meta.hot) {
  import.meta.hot.accept();
}
