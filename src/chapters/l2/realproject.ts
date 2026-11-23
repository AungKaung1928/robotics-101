// "From a real project" boxes for Level 2 (spec APP_R101_ONRAMP.md): one place in the public TF-Transform-Explorer
// where the chapter's idea is used. realproject.test reads each cited line at origin/main (TFE_REPO) and checks `needle`.

export interface RealCite { file: string; line: number; needle: string }
export interface RealBox { cites: RealCite[] } // the sentence: REALPROJECT_STRINGS[lang][id] in realproject.strings.ts

export const REAL: Record<string, RealBox> = {
  nodes: {
    cites: [{ file: 'launch/tf_explorer.launch.py', line: 111, needle: "for exe in ('tf_monitor_node', 'frame_broadcaster_node'" }],
  },
  topics: {
    cites: [{ file: 'config/gz_bridge.yaml', line: 28, needle: 'ros_topic_name: "/scan"' }],
  },
  msgtypes: {
    cites: [{ file: 'CMakeLists.txt', line: 35, needle: '"msg/TFDiagnostics.msg"' }],
  },
  actions: {
    cites: [{ file: 'include/tf_explorer/patrol_node.hpp', line: 26, needle: 'create_client<NavigateToPose>(this, "navigate_to_pose")' }],
  },
  params: {
    cites: [{ file: 'src/tf_anomaly_detector.cpp', line: 11, needle: 'declare_parameter("max_position_jump", 0.5)' }],
  },
  ws: {
    cites: [{ file: 'CMakeLists.txt', line: 69, needle: 'add_executable(tf_anomaly_detector src/tf_anomaly_detector.cpp)' }],
  },
  drive: {
    cites: [
      { file: 'src/simple_wiggle_recovery.cpp', line: 19, needle: 'create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10)' },
      { file: 'src/simple_wiggle_recovery.cpp', line: 64, needle: 'cmd.angular.z = wiggle_left_ ? wiggle_speed_ : -wiggle_speed_;' },
    ],
  },
}
