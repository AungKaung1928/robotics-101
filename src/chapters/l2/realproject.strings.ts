/** "From a real project" box text, EN + JA, one sentence per Level 2 chapter id (cites: realproject.ts). */
export const REALPROJECT_STRINGS = {
  en: {
    head: 'From a real project',
    nodes: 'Four of the project\'s own nodes, each a separate program, are started by one launch file, 9 s after launch.',
    topics: 'The simulator\'s LiDAR reaches ROS 2 as the topic /scan through a bridge config.',
    msgtypes: 'When no standard type fits, the project defines its own message type, TFDiagnostics, for the health of one transform.',
    actions: 'The patrol node is an action client of Nav2\'s navigate_to_pose: it sends a goal, waits for the result, then sends the next.',
    params: 'The anomaly detector reads its jump limit, 0.5 m, as a parameter, so it can change without rebuilding.',
    ws: 'One package, five programs: each C++ node is one add_executable line in the same CMakeLists.txt.',
    drive: 'The wiggle recovery node publishes Twist on /cmd_vel and only sets angular.z: left, then right, to shake the robot free.',
  },
  ja: {
    head: '実際のプロジェクトから',
    nodes: 'プロジェクト自身の 4 つのノード（それぞれ別のプログラム）を、1つの launch ファイルが起動の 9 秒後に立ち上げる。',
    topics: 'シミュレーターの LiDAR は、ブリッジの設定を通って ROS 2 のトピック /scan になる。',
    msgtypes: '合う標準の型がないとき、プロジェクトは自分のメッセージ型 TFDiagnostics を定義し、1つの変換の健康状態を送る。',
    actions: 'パトロールノードは Nav2 の navigate_to_pose のアクションクライアント：ゴールを送り、結果を待ち、次を送る。',
    params: '異常検知ノードは、ジャンプの上限 0.5 m をパラメーターとして読むので、ビルドし直さずに変えられる。',
    ws: '1つのパッケージに 5 つのプログラム：C++ のノードは、同じ CMakeLists.txt の add_executable 1行ずつ。',
    drive: 'wiggle リカバリーノードは /cmd_vel に Twist を publish し、angular.z だけを左右に切り替えてロボットを抜け出させる。',
  },
}
