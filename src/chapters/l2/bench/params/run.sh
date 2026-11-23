# Called by check.sh. $1 = mode: default | start10 (-p max_position_jump:=1.0) | set10 (ros2 param set to 1.0 at t=2 s)
set +u; source /opt/ros/humble/setup.bash; set -u
export ROS_DOMAIN_ID=78 ROS_LOCALHOST_ONLY=1 LD_LIBRARY_PATH=/tmp/r101-tfe/build/tf_explorer:$LD_LIBRARY_PATH
ARGS=(); [ "$1" = start10 ] && ARGS=(--ros-args -p max_position_jump:=1.0)
/tmp/r101-tfe/build/tf_explorer/tf_anomaly_detector "${ARGS[@]}" > /tmp/r101-tfe/det.log 2>&1 & D=$!
sleep 1; python3 bcast.py & B=$!
if [ "$1" = set10 ]; then sleep 2; ros2 param set /tf_anomaly_detector max_position_jump 1.0; ros2 param get /tf_anomaly_detector max_position_jump; fi
wait $B; sleep 1; kill $D; wait $D 2>/dev/null
grep -c "JUMP DETECTED" /tmp/r101-tfe/det.log | sed "s/^/$1 jumps: /"; grep -m2 "JUMP DETECTED\|started" /tmp/r101-tfe/det.log
