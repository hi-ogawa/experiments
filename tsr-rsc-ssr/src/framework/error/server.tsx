import { SERVER_ERROR_DIGEST_TAG, type ServerErrorMeta } from "./shared";

export class ServerError extends Error {
  constructor(public digest: string) {
    super("ServerError");
  }
}

export function createError(ctx: ServerErrorMeta) {
  const digest = `${SERVER_ERROR_DIGEST_TAG}${JSON.stringify(ctx)}`;
  return new ServerError(digest);
}
