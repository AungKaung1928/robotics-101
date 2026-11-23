#!/usr/bin/env bash
# Build the site, then load every route in headless Chrome (docs/FEATURES.md). Non-zero = a route is broken.
set -euo pipefail
cd "$(dirname "$0")/.."
# Own build folder per run: a build or preview of dist/ by anything else mid-run used to blank every page (2026-11-24).
out="dist-verify-$$"
trap 'rm -rf "$out"' EXIT
npx tsc -b
npx vite build --outDir "$out" --emptyOutDir
VERIFY_DIST="$out" node scripts/verify.mjs
