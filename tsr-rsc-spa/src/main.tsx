import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import React from 'react';

const router = createRouter({
  routeTree,
  defaultPreload: false,
  defaultStaleTime: 5000,
  scrollRestoration: true,
  // by default let loader suspend to avoid flashing fallback.
  defaultPendingComponent: () => {
    React.use(pendingPromise);
    return null;
  },
})

const pendingPromise = new Promise(() => {})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<RouterProvider router={router} />)
}
