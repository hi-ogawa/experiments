# TanStack Router + React Server Components (RSC) PoC

Integration of TanStack Router with React Server Components using `@vitejs/plugin-rsc`.

## Core Implementation: RSC Streams as Loader Data

Two main techniques:

1. **RSC Stream as Loader Data**: TanStack Router loaders return RSC streams as loader data
2. **Environment-Based Module Forking**: `virtual:client-internal` resolves to different implementations:
   - **Browser**: Fetches RSC streams from `/__rsc` endpoint 
   - **SSR**: Direct RSC handler calls in-process

This allows identical TanStack Router code across environments while treating RSC streams as standard loader data.

## Implementation Details

- RSC streams as TanStack Router loader data
- Module forking: Same code, different behavior per environment
- Dual route files: Client (`.tsx`) and server (`.rsc.tsx`) components  
- Components consume streams via `React.use()` in route components

## Architecture

### Core Files

**Module Forking**:
- `vite.config.ts`: Custom plugin resolves `virtual:client-internal` per environment
- `src/framework/client-internal/browser.tsx`: HTTP fetch to `/__rsc`
- `src/framework/client-internal/ssr.tsx`: Direct RSC calls with stream tee

**RSC Setup**:
- `vite.config.ts`: RSC plugin with three entry points (client/ssr/rsc)
- `src/framework/entry.rsc.tsx`: RSC request handler, routes to `.rsc.tsx` files
- `src/framework/client.tsx`: TanStack Router integration (`tsrRscRoute()`)

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

1. **Loader Setup**: Routes use `tsrRscRoute()` which sets loader to `__fetchRsc`
   - Loader returns `{ stream: ReadableStream }`
   - Stream contains serialized RSC components

2. **Environment-Specific Stream Fetching**:
   - Browser: `__fetchRsc` HTTP request to `/__rsc` → RSC stream
   - SSR: `__fetchRsc` direct RSC handler call → stream tee

3. **Component Rendering**: `__useRsc` consumes loader data stream:
   - `React.use(createFromReadableStream(stream))` → rendered components
   - Same API across browser/SSR environments

4. **Stream Processing**:
   - Browser: Single stream → `React.use()`
   - SSR: Dual streams → HTML serialization + `React.use()`

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
