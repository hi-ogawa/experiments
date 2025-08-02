import { createFileRoute } from "@tanstack/react-router";
import { ErrorComponent } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { getErrorMeta } from "../framework/error/shared";
import { tsrRscRoute } from "tsr-rsc:client";

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
