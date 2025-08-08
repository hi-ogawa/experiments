# TanStack Router + React Server Components (RSC) PoC

This project demonstrates integrating **TanStack Router** with **React Server Components** using the `@vitejs/plugin-rsc` Vite plugin. It showcases server-side rendering (SSR) with RSC capabilities.

## Main Concept

The integration enables TanStack Router routes to render React Server Components on the server while maintaining client-side navigation. Key features:

- **Dual Route Architecture**: Each route can have both client (`.tsx`) and server (`.rsc.tsx`) components
- **Server Components**: RSC components run on the server, can access databases/APIs directly, and stream to the client
- **Seamless Navigation**: Client-side routing with server-rendered content via RSC streaming
- **Type Safety**: Full TypeScript support across client and server boundaries

## Architecture

### Core Files

- `vite.config.ts`: Configures the RSC plugin with three entry points:
  - `client`: Browser hydration (`entry.browser.tsx`)  
  - `ssr`: Server-side rendering (`entry.ssr.tsx`)
  - `rsc`: React Server Components handler (`entry.rsc.tsx`)

- `src/framework/entry.rsc.tsx`: RSC request handler that routes to appropriate `.rsc.tsx` components
- `src/framework/client.tsx`: Client-side RSC integration utilities (`tsrRscRoute()`)

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

### RSC Integration

1. **Client Route Setup**: Routes use `tsrRscRoute()` helper that:
   - Sets up RSC loader via `__fetchRsc`
   - Renders RSC content via `__useRsc` hook

2. **Server Component Rendering**: RSC handler (`entry.rsc.tsx`) maps route IDs to RSC modules and streams components to client

3. **Data Flow**: Server components fetch data server-side, render to stream, client receives and displays without hydration

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
