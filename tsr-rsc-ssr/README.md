# TanStack Router + React Server Components (RSC) PoC

Integration of TanStack Router with React Server Components using `@vitejs/plugin-rsc`.

## Core Implementation: Environment-Based Module Forking

The main technique is environment-specific module resolution via `virtual:client-internal`. Same import, different implementations:

- **Browser**: Fetches RSC streams from `/__rsc` endpoint 
- **SSR**: Direct RSC handler calls in-process

This allows identical TanStack Router code across environments.

## Implementation Details

- Module forking: Same code, different behavior per environment
- Dual route files: Client (`.tsx`) and server (`.rsc.tsx`) components  
- Server components stream to client
- Client-side routing with server-rendered content

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

1. Routes use `tsrRscRoute()` importing from `virtual:client-internal`:
   - `__fetchRsc` (environment-specific implementation)
   - `__useRsc` hook (environment-specific implementation)

2. Environment execution:
   - Browser: `__fetchRsc` HTTP request to `/__rsc`
   - SSR: `__fetchRsc` direct RSC handler call, stream tee

3. RSC handler (`entry.rsc.tsx`) maps route IDs to `.rsc.tsx` modules

4. Stream handling:
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
