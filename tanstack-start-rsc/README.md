# Tanstack Start RSC

## How it works

This integration enables React Server Components (RSC) in TanStack Start through a custom serialization pipeline:

1. **Custom Serializer Registration** (`tanstack-start-rsc/src/start.tsx`)
   Registers a custom serialization adapter with TanStack Start to handle React elements.

2. **Server Functions**
   Server functions can return React elements, which are then serialized. The serialization adapter automatically detects and handles React elements returned from server functions.

3. **RSC Serialization** (`runtime/ssr`)
   When React elements need to be serialized, the runtime proxies the RSC environment's `renderToReadableStream`, converting React components into an RSC stream.

4. **Deserialization** (`runtime/ssr` and `runtime/browser`)
   Both the SSR runtime and browser runtime deserialize using React's `createFromReadableStream`, which reconstructs the React element tree from the RSC stream.

## TODO

- RSC-returning serverFn should run in `rsc` environment (cf. `src/utils/rsc.tsx`).
- Not sure why `React.use` is needed when deserializing only on browser (cf. `src/routes/rsc.tsx`)
- Integrate with Tanstack start's own build pipeline.
