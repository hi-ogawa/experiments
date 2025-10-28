import { createServerFn } from "@tanstack/react-start";

export const fetchRsc = createServerFn().handler(async () => {
  // TODO: this scope needs to be evaluated in rsc environment
  // instead of ssr environment
  const node = (
    <div>
      <div>Hello RSC</div>
      <div>Rendered at {new Date().toISOString()}</div>
    </div>
  );
  return node;
});
