# TanStack Router + `@vitejs/plugin-rsc`

RSC port of the original [basic-ssr-file-based](https://github.com/TanStack/router/tree/main/examples/react/basic-ssr-file-based) example based on [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc).

## Concepts

See [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc) documentation for environment concepts and APIs.

### Defining "RSC route"

For example, `posts/$postId.tsx` route uses `tsrRscRoute` helper to define "RSC route" and corresponding server component is implemented in `posts/$postId.rsc.tsx`.

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

`tsrRscRoute` helper provides different `loader/component` implementations depending on SSR and CSR. 

- `loader` fetches RSC streams and return directly as loader data:
  - CSR (client environment): requests to a server `fetch("/__rsc?meta=...")`
  - SSR (ssr environment): communicates with `rsc` environment via `import.meta.viteRsc.loadModule` API to call `handleRscRequest` directly in the same Node process.

- `component` uses `useLoaderData` to access RSC stream, then `createFromReadableStream` to deserialize into React nodes.

### `handleRscRequest` (rsc environment)

`rsc` environment handles RSC stream request via `handleRscRequest`, which imports server component module corresponding to a requested route and serialize React nodes into a RSC stream via `renderToReadableStream`.

## How to run

```sh
pnpm dev
pnpm build
pnpm preview
```
