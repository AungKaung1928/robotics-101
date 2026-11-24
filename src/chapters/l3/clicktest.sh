#!/usr/bin/env bash
# Click test of Level 3 chapter 3.4 tflab in headless Chrome (reduced motion: every change shows its end frame).
# Exits 0 only when the page prints CLICKS PASS. CHROME=/path overrides the browser.
set -u
cd "$(dirname "$0")/../../.."
PORT=5204
CHROME=${CHROME:-$(command -v google-chrome || command -v chromium || echo "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe")}
setsid npx vite --port $PORT --strictPort >/tmp/clicktest-l3-vite.log 2>&1 &
VITE=$!
trap 'kill -- -$VITE 2>/dev/null' EXIT  # whole group: npx leaves vite running otherwise
for _ in $(seq 50); do curl -sf -o /dev/null "http://localhost:$PORT/" && break; sleep 0.2; done
dump() { timeout 120 "$CHROME" --headless=new --disable-gpu --force-prefers-reduced-motion --virtual-time-budget=40000 \
  --dump-dom "http://localhost:$PORT/src/chapters/l3/clicktest.html" 2>/dev/null | sed -n '/<pre id="out">/,/<\/pre>/p' | sed 's/<[^>]*>//g'; }
OUT=$(dump)
# A blank dump happens under load on this laptop (Chrome returns before the page runs): retry once, say so.
[ -z "$OUT" ] && { echo "blank dump, retrying once" >&2; OUT=$(dump); }
echo "$OUT"
grep -q '^CLICKS PASS' <<<"$OUT"
