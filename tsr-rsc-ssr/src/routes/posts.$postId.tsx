import { createFileRoute } from "@tanstack/react-router";
import { ErrorComponent } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { tsrRscRoute } from "../framework/client";
import { getErrorMeta } from "../framework/error/shared";

export const Route = createFileRoute("/posts/$postId")({
  ...tsrRscRoute(),
  errorComponent: PostErrorComponent,
});

function PostErrorComponent({ error }: ErrorComponentProps) {
  const meta = getErrorMeta(error);
  if (meta?.type === "not-found") {
    return <div>Post not found.</div>;
  }
  return <ErrorComponent error={error} />;
}
