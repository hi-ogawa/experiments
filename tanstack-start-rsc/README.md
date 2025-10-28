# Tanstack Start RSC

<!-- 
AsyncLocalStorage broken
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/hi-ogawa/experiments/tree/main/tanstack-start-rsc)
-->

## Concepts

This integration enables React Server Components (RSC) in TanStack Start through a custom serialization pipeline:

1. **Custom Serializer Registration** ([`src/start.tsx`](./src/start.tsx))
   Registers a custom serialization adapter with TanStack Start to handle React elements.

2. **Server Functions**
   Server functions can return React elements, which are then serialized. The serialization adapter automatically detects and handles React elements returned from server functions.

3. **RSC Serialization** ([`lib/runtime/ssr.tsx`](./lib/runtime/ssr.tsx))
   When React elements need to be serialized, the runtime proxies the RSC environment's `renderToReadableStream`, converting React components into an RSC stream.

4. **Deserialization** ([`lib/runtime/ssr.tsx`](./lib/runtime/ssr.tsx) and [`lib/runtime/browser.tsx`](./lib/runtime/browser.tsx))
   Both the SSR runtime and browser runtime deserialize using React's `createFromReadableStream`, which reconstructs the React element tree from the RSC stream.

## Example

Example usage:
- **Server Function**: [`src/utils/rsc.tsx`](./src/utils/rsc.tsx) - Defines a server function that returns React elements
- **Route Usage**: [`src/routes/rsc.tsx`](./src/routes/rsc.tsx) - Uses RSC-returning server functions in route loaders

## TODO

- RSC-returning serverFn should run in `rsc` environment (cf. `src/utils/rsc.tsx`).
- Not sure why `React.use` is needed when deserializing only on browser (cf. `src/routes/rsc.tsx`)
- Integrate with Tanstack start's own build pipeline.
