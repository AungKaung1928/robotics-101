// "From a real project" boxes for Level 2 (spec APP_R101_ONRAMP.md): one place in the public TF-Transform-Explorer
// where the chapter's idea is used. realproject.test reads each cited line at origin/main (TFE_REPO) and checks `needle`.

export interface RealCite { file: string; line: number; needle: string }
export interface RealBox { cites: RealCite[]; en: string; ja: string }

export const REAL: Record<string, RealBox> = {
  nodes: {
    cites: [{ file: 'launch/tf_explorer.launch.py', line: 111, needle: "for exe in ('tf_monitor_node', 'frame_broadcaster_node'" }],
    en: 'Four of the project\'s own nodes, each a separate program, are started by one launch file, 9 s after launch.',
    ja: 'プロジェクト自身の 4 つのノード（それぞれ別のプログラム）を、1つの launch ファイルが起動の 9 秒後に立ち上げる。',
  },
  topics: {
    cites: [{ file: 'config/gz_bridge.yaml', line: 28, needle: 'ros_topic_name: "/scan"' }],
    en: 'The simulator\'s LiDAR reaches ROS 2 as the topic /scan through a bridge config.',
    ja: 'シミュレーターの LiDAR は、ブリッジの設定を通って ROS 2 のトピック /scan になる。',
  },
  msgtypes: {
    cites: [{ file: 'CMakeLists.txt', line: 35, needle: '"msg/TFDiagnostics.msg"' }],
    en: 'When no standard type fits, the project defines its own message type, TFDiagnostics, for the health of one transform.',
    ja: '合う標準の型がないとき、プロジェクトは自分のメッセージ型 TFDiagnostics を定義し、1つの変換の健康状態を送る。',
  },
  actions: {
    cites: [{ file: 'include/tf_explorer/patrol_node.hpp', line: 26, needle: 'create_client<NavigateToPose>(this, "navigate_to_pose")' }],
    en: 'The patrol node is an action client of Nav2\'s navigate_to_pose: it sends a goal, waits for the result, then sends the next.',
    ja: 'パトロールノードは Nav2 の navigate_to_pose のアクションクライアント：ゴールを送り、結果を待ち、次を送る。',
  },
  params: {
    cites: [{ file: 'src/tf_anomaly_detector.cpp', line: 11, needle: 'declare_parameter("max_position_jump", 0.5)' }],
    en: 'The anomaly detector reads its jump limit, 0.5 m, as a parameter, so it can change without rebuilding.',
    ja: '異常検知ノードは、ジャンプの上限 0.5 m をパラメーターとして読むので、ビルドし直さずに変えられる。',
  },
  ws: {
    cites: [{ file: 'CMakeLists.txt', line: 69, needle: 'add_executable(tf_anomaly_detector src/tf_anomaly_detector.cpp)' }],
    en: 'One package, five programs: each C++ node is one add_executable line in the same CMakeLists.txt.',
    ja: '1つのパッケージに 5 つのプログラム：C++ のノードは、同じ CMakeLists.txt の add_executable 1行ずつ。',
  },
  drive: {
    cites: [
      { file: 'src/simple_wiggle_recovery.cpp', line: 19, needle: 'create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10)' },
      { file: 'src/simple_wiggle_recovery.cpp', line: 64, needle: 'cmd.angular.z = wiggle_left_ ? wiggle_speed_ : -wiggle_speed_;' },
    ],
    en: 'The wiggle recovery node publishes Twist on /cmd_vel and only sets angular.z: left, then right, to shake the robot free.',
    ja: 'wiggle リカバリーノードは /cmd_vel に Twist を publish し、angular.z だけを左右に切り替えてロボットを抜け出させる。',
  },
}
