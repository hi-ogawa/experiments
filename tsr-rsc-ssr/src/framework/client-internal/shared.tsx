// directly using `stream` as `WeakMap` is somehow broken.
// for now, we wrap with `RscLoaderReturn` object.
export type RscLoaderReturn = {
  stream: ReadableStream;
};
