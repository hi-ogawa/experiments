# Vite bundled dev with rolldown

Integrating [Rolldown HMR](https://github.com/rolldown/rolldown/tree/hmr-poc) as Vite plugin.

```sh
# rolldown-0.13.2.tgz needs to be replaced depending on platform
pnpm dev
pnpm -C examples/react dev
```

## links

- https://github.com/users/hi-ogawa/projects/4/views/1?pane=issue&itemId=84997064
- https://github.com/hi-ogawa/rolldown/tree/feat-vite-like

## todo

- [x] serve Rolldown build output via middleware
- [x] reuse Vite dev server for file watcher and websocket server/client
- [x] tweak runtime to initiate full build from client
- [x] basic index.html support
- [x] react spa example
- [ ] css
- [ ] assets
- [ ] ssr
