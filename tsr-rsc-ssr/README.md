# TanStack Router + `@vitejs/plugin-rsc`

RSC port of the original [basic-ssr-file-based](https://github.com/TanStack/router/tree/main/examples/react/basic-ssr-file-based) example based on [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc).

## Concepts

See [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc) documentation for environment concepts and APIs.

### Defining "RSC routes"

For example, the `posts/$postId.tsx` route uses the `tsrRscRoute` helper to define an "RSC route", and the corresponding server component is implemented in `posts/$postId.rsc.tsx`.

- `src/routes/posts/$postId.tsx` 

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { tsrRscRoute } from "../../framework/client";

export const Route = createFileRoute("/posts/$postId")(tsrRscRoute());
```

- `src/routes/posts/$postId.rsc.tsx` 

```tsx
export default async function PostComponent({ params: { postId } }) {
  const post = await fetchPost(postId);
  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{post.title}</h4>
      <div className="text-sm">{post.body}</div>
    </div>
  );
}
```

### `tsrRscRoute` (client and ssr environment)

The `tsrRscRoute` helper provides different `loader/component` implementations depending on SSR and CSR. 

- `loader` fetches RSC streams and returns them directly as loader data:
  - CSR (client environment): requests to server via `fetch("/__rsc")`
  - SSR (ssr environment): communicates with the `rsc` environment via `import.meta.viteRsc.loadModule` API to call `handleRscRequest` directly in the same Node process.

- `component` uses `useLoaderData` to access the RSC stream, then `createFromReadableStream` to deserialize into React nodes.

### `handleRscRequest` (rsc environment)

The `rsc` environment handles RSC stream requests via `handleRscRequest`, which imports the server component module corresponding to the requested route and serializes React nodes into an RSC stream via `renderToReadableStream`.

## How to run

```sh
pnpm dev
pnpm build
pnpm preview
```

## "No SSR" example

As understood from the above concepts, SSR part is entirely optional. See [tsr-rsc-spa](../tsr-rsc-spa/) for "No SSR" version of this example.
