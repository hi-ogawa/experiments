export type ServerErrorMeta = {
  type?: "not-found";
  data?: unknown;
};

export const SERVER_ERROR_DIGEST_TAG = "__SERVER_ERROR__:";

export function getErrorMeta(error: unknown): ServerErrorMeta | undefined {
  if (
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith(SERVER_ERROR_DIGEST_TAG)
  ) {
    const raw = error.digest.slice(SERVER_ERROR_DIGEST_TAG.length);
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
  }
  return;
}
