#!/bin/bash
set -eu -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf dist
mkdir -p dist/server dist/client

# static
cp -r ../../dist/client/. dist/client
rm -rf dist/client/index.html

# server (bundle by ourselve instead of relying on wrangler)
npx esbuild ../../dist/server/index.js \
  --outfile=dist/server/index.js \
  --metafile=dist/esbuild-metafile.json \
  --alias:shiki/wasm=../../../../node_modules/shiki/dist/onig.wasm \
  --external:../../../../node_modules/shiki/dist/onig.wasm \
  --define:process.env.NODE_ENV='"production"' \
  --define:__VUE_OPTIONS_API__='false' \
  --define:__VUE_PROD_DEVTOOLS__='false' \
  --define:__VUE_PROD_HYDRATION_MISMATCH_DETAILS__='false' \
  --log-override:ignored-bare-import=silent \
  --bundle \
  --format=esm \
  --platform=browser
