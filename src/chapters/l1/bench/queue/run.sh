#!/usr/bin/env bash
# Chapter 1.3 on real ROS 2 Humble: pub.py sends 30 messages at 5 Hz, sub.py handles them in a depth-10 subscription
# whose callback takes WORK ms; one run per WORK. Writes result.ts (TS: the app's tsconfig has no resolveJsonModule).
# Needs /opt/ros/humble. Light: two Python processes, about 10 s per run.
set -euo pipefail
cd "$(dirname "$0")"
set +u; source /opt/ros/humble/setup.bash; set -u  # setup.bash reads unset variables
export ROS_DOMAIN_ID=77 ROS_LOCALHOST_ONLY=1
rows=()
for work in 210 400 600; do
  python3 sub.py "$(python3 -c "print($work / 1000)")" > /tmp/r101-queue-sub.json & sub=$!
  sleep 2; python3 pub.py; wait "$sub"
  rows+=("$(python3 -c "import json; d = json.load(open('/tmp/r101-queue-sub.json')); print('{ workMs: %d, dropped: %d, maxAgeMs: %d }' % ($work, d['dropped'], d['max_age_ms']))")")
done
printf '// Written by run.sh; do not edit by hand.\nexport const QUEUE_RUNS = [%s]\nexport const QUEUE_ENV = "ROS 2 %s, rclpy, Python %s"\n' \
  "$(IFS=,; echo "${rows[*]}")" "$ROS_DISTRO" "$(python3 -c 'import platform; print(platform.python_version())')" > result.ts
cat result.ts
