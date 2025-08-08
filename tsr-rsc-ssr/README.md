# TanStack Router + React Server Components (RSC) PoC

Integration of TanStack Router with React Server Components using `@vitejs/plugin-rsc`.

Contrasts with the original [basic-ssr-file-based](https://github.com/TanStack/router/tree/main/examples/react/basic-ssr-file-based) example which uses traditional SSR.

## Core Implementation: Forking `{ loader, component }` Pair

The fundamental technique is **forking the `{ loader, component }` pair**:

- **Helper function**: `tsrRscRoute()` returns a `{ loader, component }` pair
- **Same route definition**: `createFileRoute("/posts")(tsrRscRoute())`
- **Environment-specific behavior**: The loader and component implementations fork based on execution context
  - **Browser**: Loader fetches RSC stream via HTTP, component deserializes
  - **SSR**: Loader calls RSC handler directly, component deserializes in-process

This allows identical TanStack Router route definitions to work across environments while the actual implementation forks behind the scenes.

## Contrast with Traditional SSR

**Traditional SSR** (basic-ssr-file-based):
- Loaders return serializable data (JSON, promises)
- Components consume via `useLoaderData()`
- Server renders client components to HTML
- Data serialized for client hydration

**RSC Integration** (this PoC):
- Loaders return RSC stream objects
- Server components render via `renderToReadableStream()` to RSC streams  
- Client components consume streams via `createFromReadableStream()` + `React.use()`
- Same consuming code works in both SSR and browser environments

## Architecture

### Core Files

**`{ loader, component }` Forking**:
- `src/framework/client.tsx`: `tsrRscRoute()` helper returns `{ loader, component }` pair
- `vite.config.ts`: Custom plugin enables forking via `virtual:client-internal`
- Same route definition works across environments, implementation forks behind the scenes

**RSC Setup**:
- `vite.config.ts`: RSC plugin with three entry points (client/ssr/rsc)
- `src/framework/entry.rsc.tsx`: RSC request handler, uses `renderToReadableStream()` to serialize server components
- `src/framework/client.tsx`: TanStack Router integration (`tsrRscRoute()`)
- `src/framework/client-internal/*`: Use `createFromReadableStream()` to deserialize RSC streams

### Route Structure

Routes follow a dual-file pattern:
- `route.tsx`: Client-side route configuration using `tsrRscRoute()`
- `route.rsc.tsx`: Server component that renders on the server

Example:
```
src/routes/posts/
├── route.tsx      # Client route: createFileRoute("/posts")(tsrRscRoute())
└── route.rsc.tsx  # Server component: async function with data fetching
```

### How It Works

1. **Helper Usage**: Routes call `tsrRscRoute()` to get a `{ loader, component }` pair
2. **Forking**: The loader and component implementations fork per environment
3. **Stream Flow**: 
   - Loader returns RSC stream objects
   - Component deserializes streams with `createFromReadableStream()` + `React.use()`
4. **Environment Transparency**: Same route definition works everywhere, forking happens transparently

## Usage

```sh
pnpm dev     # Development with HMR
pnpm build   # Production build
pnpm preview # Preview production build
```

## Notes

- Server components reduce client bundle size
- Server-side data fetching
- React 18+ streaming
- Standard TanStack Router API
