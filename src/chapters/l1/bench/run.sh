#!/usr/bin/env bash
# Measures closest() on one 360-reading scan in Python and C++ (-O2), one core, and writes result.ts (TS, not JSON: the app's tsconfig has no resolveJsonModule).
set -euo pipefail
cd "$(dirname "$0")"
g++ -O2 -std=c++17 closest.cpp -o /tmp/r101-closest
best() { for _ in 1 2 3; do "$@" | cut -d' ' -f1; done | sort -n | head -1; }  # best of 3 runs
py=$(best python3 closest.py)
cpp=$(best /tmp/r101-closest)
printf '// Written by run.sh; do not edit by hand.\nexport const BENCH = { pyNs: %s, cppNs: %s, readings: 360, python: "%s", compiler: "%s -O2 -std=c++17" }\n' \
  "$py" "$cpp" "$(python3 -c 'import platform; print(platform.python_version())')" "$(g++ --version | head -1)" > result.ts
cat result.ts
