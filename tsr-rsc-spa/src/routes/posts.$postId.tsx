import { createFileRoute } from "@tanstack/react-router";
import { ErrorComponent } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { tsrRscRoute } from "../framework/client";

export const Route = createFileRoute("/posts/$postId")({
  ...tsrRscRoute(),
  errorComponent: PostErrorComponent,
  notFoundComponent: () => {
    return <p>Post not found</p>;
  },
});

function PostErrorComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />;
}
