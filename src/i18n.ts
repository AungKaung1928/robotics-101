import type { ChapterId } from './lib/route'

export type Lang = 'en' | 'ja'

const en = {
  title: 'Robotics First Steps',
  lede: 'One TurtleBot3 in a 10 × 10 m arena. Each waypoint is one idea of a mobile robot, with its value from a real ROS 2 Nav2 setup.',
  open: 'Open a waypoint',
  planned: 'planned',
  pathNote: 'Patrol path drawn for this page; obstacles and walls from the Gazebo world file.',
  kind: { config: 'config', formula: 'formula' },
  back: 'Back',
  next: 'Next',
  plan: 'Plan',
  source: 'Source',
  chapters: {
    bringup: 'Bring-up order',
    tf: 'The TF tree',
    scan: 'One LiDAR scan',
    detect: 'A simple detector',
    grid: 'Occupancy grid',
    costmap: 'Costmap inflation',
    goal: 'Reaching a goal',
  } satisfies Record<ChapterId, string>,
  scan: {
    lines: [
      '360 beams, one per degree, 5 times a second. Each beam returns the nearest wall or obstacle, if it is closer than 3.5 m.',
      'Neighbouring beams spread apart with range: anything narrower than the gap can fall between them.',
    ],
    x: 'Robot x (m)',
    y: 'Robot y (m)',
    yaw: 'Heading (deg)',
    range: 'Range to inspect (m)',
    rate: 'Scan rate',
    hits: 'beams with a return',
    gap: 'gap between beams',
    move: 'moved per scan at 0.26 m/s',
  },
  tf: {
    lines: [
      'Every position is relative to a frame: map → odom → base_link → base_scan. Composing the chain gives the robot in the map.',
      'One LiDAR hit on box1, written in each frame: same point, four sets of numbers.',
      'The anomaly detector checks every 0.5 s: older than 1.0 s is stale, a move over 0.5 m is a jump.',
    ],
    drift: 'odom drift in map, x (m)',
    driftYaw: 'odom drift in map, yaw (deg)',
    x: 'base_link in odom, x (m)',
    y: 'base_link in odom, y (m)',
    yaw: 'base_link in odom, yaw (deg)',
    frame: 'frame',
    point: 'hit at box1 corner',
    jump: 'odom move since last check (m)',
    age: 'transform age (s)',
    verdict: 'detector says',
    v: { healthy: 'healthy', stale: 'STALE', jump: 'JUMP' },
  },
  costmap: {
    lines: [
      'Nav2 inflates every obstacle: cost falls off with distance, so the planner keeps clear of walls.',
      'Inside the robot radius (0.22 m) the cost is 253: the centre there means a collision.',
    ],
    k: 'cost_scaling_factor k',
    d: 'Robot centre to obstacle (m)',
    cost: 'cost of this cell',
    zero: 'cost reaches 0 at',
    lethal: 'lethal',
    inscribed: 'inscribed',
  },
}

const ja: typeof en = {
  title: 'ロボティクス はじめの一歩',
  lede: '10 × 10 m のアリーナに TurtleBot3 が 1 台。各ウェイポイントが移動ロボットの考え方 1 つで、実際の ROS 2 Nav2 設定の値つき。',
  open: 'ウェイポイントを開く',
  planned: '準備中',
  pathNote: '巡回経路はこのページ用の図。障害物と壁は Gazebo のワールドファイルから。',
  kind: { config: '設定値', formula: '式' },
  back: '戻る',
  next: '次へ',
  plan: '全体図',
  source: '出典',
  chapters: {
    bringup: '起動の順番',
    tf: 'TF ツリー',
    scan: 'LiDAR スキャン 1 回',
    detect: '簡単な検出器',
    grid: '占有格子地図',
    costmap: 'コストマップの膨張',
    goal: 'ゴールに着く',
  },
  scan: {
    lines: [
      '1 度に 1 本、360 本のビームを毎秒 5 回。各ビームは 3.5 m 以内にある一番近い壁か障害物までの距離を返す。',
      '距離が遠いほど隣のビームとの間隔が広がる。間隔より細い物はビームの間に入って見えない。',
    ],
    x: 'ロボット x (m)',
    y: 'ロボット y (m)',
    yaw: '向き (度)',
    range: '調べる距離 (m)',
    rate: 'スキャン周期',
    hits: '反射のあったビーム',
    gap: 'ビームの間隔',
    move: '0.26 m/s で 1 スキャン間に進む距離',
  },
  tf: {
    lines: [
      '位置はすべてフレームからの相対値: map → odom → base_link → base_scan。連鎖を合成すると map の中のロボットになる。',
      'box1 に当たった LiDAR の点 1 つを各フレームで書く。同じ点で数字は 4 通り。',
      '異常検出器は 0.5 秒ごとに確認: 1.0 秒より古いと stale、0.5 m を超える移動は jump。',
    ],
    drift: 'map 内の odom のずれ x (m)',
    driftYaw: 'map 内の odom のずれ yaw (度)',
    x: 'odom 内の base_link x (m)',
    y: 'odom 内の base_link y (m)',
    yaw: 'odom 内の base_link yaw (度)',
    frame: 'フレーム',
    point: 'box1 の角に当たった点',
    jump: '前回確認からの odom の移動 (m)',
    age: '変換の古さ (秒)',
    verdict: '検出器の判定',
    v: { healthy: '正常', stale: 'STALE', jump: 'JUMP' },
  },
  costmap: {
    lines: [
      'Nav2 は障害物を膨張させる。距離とともにコストが下がり、プランナは壁から離れて走る。',
      'ロボット半径 (0.22 m) 以内はコスト 253。中心がそこに入れば衝突。',
    ],
    k: 'cost_scaling_factor k',
    d: 'ロボット中心から障害物 (m)',
    cost: 'このセルのコスト',
    zero: 'コストが 0 になる距離',
    lethal: '致命',
    inscribed: '内接',
  },
}

export const STRINGS = { en, ja }
export type Strings = typeof en

export function initialLang(): Lang {
  const saved = localStorage.getItem('rfs-lang')
  if (saved === 'en' || saved === 'ja') return saved
  return navigator.language.startsWith('ja') ? 'ja' : 'en'
}
