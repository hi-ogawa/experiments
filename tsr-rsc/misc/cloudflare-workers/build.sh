#!/bin/bash
set -eu -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf dist
mkdir -p dist/server dist/client

# static
cp -r ../../dist/browser/. dist/browser
rm -rf dist/browser/index.html

# server
# TODO: tanstack has "stream" dependency somewhere and it will tree-shaken, but esbuild warns it without external
npx esbuild ../../dist/ssr/index.js \
  --outfile=dist/ssr/index.js \
  --metafile=dist/esbuild-metafile.json \
  --define:process.env.NODE_ENV='"production"' \
  --log-override:ignored-bare-import=silent \
  --external:stream \
  --bundle \
  --format=esm \
  --platform=browser
