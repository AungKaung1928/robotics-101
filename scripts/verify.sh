#!/usr/bin/env bash
# Build the site, then load every route in headless Chrome (docs/FEATURES.md). Non-zero = a route is broken.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
node scripts/verify.mjs
