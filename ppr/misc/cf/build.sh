#!/bin/bash
set -eu -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf dist
mkdir -p dist/server dist/client

# static
cp -r ../../public/. dist/client

# server (bundle by ourselve instead of relying on wrangler)
npx esbuild ../../dist/server/index.js \
  --outfile=dist/server/index.js \
  --metafile=dist/esbuild-metafile.json \
  --define:process.env.NODE_ENV='"production"' \
  --log-override:ignored-bare-import=silent \
  --external:node:async_hooks \
  --bundle \
  --format=esm \
  --platform=browser
