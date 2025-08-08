# TanStack Router + React Server Components (RSC) PoC

This project demonstrates integrating **TanStack Router** with **React Server Components** using the `@vitejs/plugin-rsc` Vite plugin. It showcases server-side rendering (SSR) with RSC capabilities.

## Core Innovation: Environment-Based Module Forking

The key breakthrough is **environment-specific module resolution** via `virtual:client-internal`. The same import resolves to different implementations:

- **Browser Environment**: Fetches RSC streams from `/__rsc` endpoint via HTTP
- **SSR Environment**: Directly calls RSC handler in-process, no network roundtrip

This enables identical TanStack Router code to work in both environments while optimizing each path.

## Main Concept

The integration enables TanStack Router routes to render React Server Components on the server while maintaining client-side navigation. Key features:

- **Smart Module Forking**: Same code, different behavior per environment
- **Dual Route Architecture**: Each route can have both client (`.tsx`) and server (`.rsc.tsx`) components  
- **Server Components**: RSC components run on the server, can access databases/APIs directly, and stream to the client
- **Seamless Navigation**: Client-side routing with server-rendered content via RSC streaming
- **Type Safety**: Full TypeScript support across client and server boundaries

## Architecture

### Core Files

**Environment Forking (The Innovation)**:
- `vite.config.ts`: Custom plugin resolves `virtual:client-internal` to different modules per environment
- `src/framework/client-internal/browser.tsx`: Browser implementation - HTTP fetch to `/__rsc`
- `src/framework/client-internal/ssr.tsx`: SSR implementation - direct in-process RSC calls with stream tee

**RSC Infrastructure**:
- `vite.config.ts`: Configures RSC plugin with three entry points (client/ssr/rsc)
- `src/framework/entry.rsc.tsx`: RSC request handler that routes to appropriate `.rsc.tsx` components
- `src/framework/client.tsx`: TanStack Router integration via `tsrRscRoute()`

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

### RSC Integration Flow

1. **Universal Route Setup**: Routes use `tsrRscRoute()` helper importing from `virtual:client-internal`:
   - Sets up RSC loader via `__fetchRsc` (environment-specific)
   - Renders RSC content via `__useRsc` hook (environment-specific)

2. **Environment-Specific Execution**:
   - **Browser**: `__fetchRsc` makes HTTP request to `/__rsc` endpoint
   - **SSR**: `__fetchRsc` directly calls RSC handler, tees stream for HTML injection + React.use()

3. **Server Component Rendering**: RSC handler (`entry.rsc.tsx`) maps route IDs to RSC modules and streams components

4. **Stream Handling**: 
   - Browser: Single stream consumed by `React.use()`
   - SSR: Dual streams - one for HTML serialization, one for React.use()

## Usage

```sh
pnpm dev     # Development with HMR
pnpm build   # Production build
pnpm preview # Preview production build
```

## Key Benefits

- **Performance**: Server components reduce client bundle size and enable server-side data fetching
- **Developer Experience**: Familiar TanStack Router API with RSC capabilities
- **Streaming**: Progressive loading with React 18+ streaming features
- **Flexibility**: Mix client and server components as needed per route
