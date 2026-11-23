#!/usr/bin/env bash
# Usage: TFE_REPO=<clone of TF-Transform-Explorer> ./check.sh   (needs /opt/ros/humble)
# Builds tf_anomaly_detector from TFE_REPO origin/main in /tmp (1 core, about 20 s) and checks page 2.5's claims:
# default 0.5 m flags the 0.8 m teleport; -p 1.0 at start does not; ros2 param set 1.0 at runtime still flags. Exit 0 = all hold.
set -euo pipefail
cd "$(dirname "$0")"
W=/tmp/r101-tfe; rm -rf $W; mkdir -p $W/src/tf_explorer
git -C "$TFE_REPO" archive origin/main | tar -x -C $W/src/tf_explorer
set +u; source /opt/ros/humble/setup.bash; set -u
(cd $W && MAKEFLAGS=-j1 nice -n 10 colcon build --packages-select tf_explorer --parallel-workers 1 --cmake-target tf_anomaly_detector > build.log 2>&1)
for t in fastrtps_cpp introspection_cpp; do nice -n 10 cmake --build $W/build/tf_explorer --target tf_explorer__rosidl_typesupport_$t -j1 >> $W/build.log 2>&1; done
n() { bash run.sh "$1" 2>/dev/null | sed -n "s/^$1 jumps: //p"; }
d=$(n default); s=$(n start10); r=$(n set10)
echo "jump warnings: default=$d start10=$s set10=$r"
rm -rf $W
[ "$d" -gt 0 ] && [ "$s" -eq 0 ] && [ "$r" -gt 0 ]
