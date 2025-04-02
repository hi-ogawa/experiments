This is one idea of `@vitejs/plugin-rsc` (maybe as `@vitejs/plugin-rsc/core`).

The reason why this plugin + runtime code shouldn't live in `react-server-dom-vite` package is that
the semantics of `import(...)` and virtual modules only works when they are transformed by Vite,
however package (especially cjs) should be ideally used as external on Vite SSR without going through
Vite transform pipepline.
