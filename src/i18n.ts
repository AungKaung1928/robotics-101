import type { ChapterId } from './lib/route'
import { MY_TEMPLATES } from './i18n/my/templates'

export type Lang = 'en' | 'ja' | 'my'

// Switch labels: English words in one style for every language (his choice 2026-11-23), not codes.
export const LANG_LABEL: Record<Lang, string> = { en: 'English', ja: 'Japanese', my: 'Burmese' }

const en = {
  title: 'Robotics 101',
  lede: 'One simulated TurtleBot3 in a 10 × 10 m Gazebo arena. Each waypoint is one idea of a mobile robot, with its value from that setup’s ROS 2 Nav2 config.',
  open: 'Open a waypoint',
  startR101: 'Start Robotics 101',
  drag: '← drag me →',
  // Words inside the headline values (content/waypoints.ts); the numbers come from the tracked constants.
  wv: { jump: (m: number) => `jump > ${m} m`, obstacles: (n: number) => `${n} obstacles`, cells: (m: number) => `${m} m cells` },
  keys: 'Keys: 1–7 jump to a waypoint, ← → step.',
  stackOf: 'Example project, its own setup:',
  pathNote: 'Patrol path drawn for this page; obstacles and walls from the Gazebo world file.',
  kind: { config: 'config', formula: 'formula', measured: 'measured' },
  back: 'Back',
  player: { label: 'Scenario', play: 'Play', pause: 'Pause', scrub: 'Scenario time' },
  next: 'Next',
  levels: {
    heading: 'Levels',
    one: 'Level',
    names: ['Start here', 'Programming for robots', 'ROS 2 basics', 'A robot that moves by itself', 'Mapping and navigation', 'Robotics software engineer'],
    soon: 'Coming next',
    ep: 'Engineering Practice',
    epNote: 'optional, outside the levels',
    completed: 'check solved',
    difficulty: 'Difficulty',
    knows: 'You already know',
    /** One beginner line per older Level 3-4 chapter: the Level 0 picture it grows from (path.ts GROWS_FROM links it). */
    grows: {
      scan: 'The sensing chapter ended on a ring of beams around the robot. A LiDAR scan is that ring sent as one message, again and again.',
      tf: "The simulator chapter showed the world and the robot's own view as two pictures. TF keeps track of where one sits inside the other.",
      detect: 'The sensing chapter showed a beam hitting something. Here neighbouring hits are grouped, and each group is a guess at one object.',
      grid: 'The thinking chapter decided from one reading and then forgot it. A grid remembers readings as cells: free, wall or not seen yet.',
      costmap: 'The thinking chapter stopped the robot at a safe distance from the wall. A costmap draws that distance around every wall on the map.',
      goal: 'The acting chapter sent the wheels two numbers. Here you send a place instead, and the planner decides if and how it gets there.',
      bringup: 'Level 0 showed robot software as many small programs passing data along. Bring-up starts all those programs, in the right order.',
    } as Record<string, string>,
    groups: ['Meet the robot', 'A practice world', 'The software around it'],
  },
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
    fired: 'beams fired (one scan, 15× slower)',
    lines: [
      '360 beams, one per degree, 5 times a second. Each beam returns the nearest wall or obstacle if it is closer than 3.5 m. A surface almost touching the sensor gives no reading either (minimum range in the URDF).',
      'Neighbouring beams spread apart with range: anything narrower than the gap can fall between them.',
      'Drag the robot on the map to move the scan.',
    ],
    x: 'Robot x (m)',
    y: 'Robot y (m)',
    yaw: 'Heading (deg)',
    range: 'Range to inspect (m)',
    rate: 'Scan rate',
    hits: 'beams with a return',
    gap: 'gap between beams',
    move: 'moved per scan at 0.26 m/s',
    moveMeasured: 'moved per scan at the measured rate',
    measured: '/scan rate (config 5 Hz)',
    beam: 'beam (hover a dot)',
    noiseRes: 'range noise σ / resolution (URDF)',
  },
  tf: {
    lines: [
      'Every position is relative to a frame: map → odom → base_footprint → base_link → base_scan. Composing the chain gives the robot in the map.',
      'One LiDAR hit on box1, written in each frame: same point, five sets of numbers (base_footprint and base_link differ only in height).',
      'The anomaly detector checks every 0.5 s: older than 1.0 s is stale, a move over 0.5 m is a jump.',
    ],
    drift: 'odom drift in map, x (m)',
    driftYaw: 'odom drift in map, yaw (deg)',
    x: 'base_footprint in odom at 0 s, x (m)',
    y: 'base_footprint in odom at 0 s, y (m)',
    yaw: 'base_footprint in odom at 0 s, yaw (deg)',
    frame: 'frame',
    point: 'hit at box1 corner',
    jump: 'odom move since last check (m)',
    age: 'transform age (s)',
    verdict: 'detector says',
    drive: 'most it can drive between checks (0.26 m/s)',
    mapOdom: 'SLAM publishes map → odom every',
    odom: '/odom rate (≈ updates per check)',
    driveNote: 'Under the 0.26 m/s Nav2 limit the robot moves at most 0.13 m between checks, so a jump over 0.5 m points to a map → odom correction, a late check or a fault.',
    gFrames: 'Frames',
    scene: 'drive: SLAM corrects map → odom every 0.5 m; detector saw',
    breakIt: 'Break it: 1 m drift, SLAM misses scans until 6 s',
    gDetector: 'Anomaly detector (every 0.5 s)',
    v: { healthy: 'healthy', stale: 'STALE', jump: 'JUMP' },
  },
  goal: {
    lines: [
      'The DWB controller runs at 20 Hz; at the 0.26 m/s speed limit each tick moves 1.3 cm.',
      'The goal counts as reached once the robot is within 0.25 m and its heading within 0.25 rad: patrol can stop up to 25 cm short.',
      'Minimum time first ignores acceleration. Nav2’s 2.5 m/s² limit reaches full speed in 0.1 s, the simulated drive’s 1.0 m/s² in 0.26 s: either way it barely matters here.',
      'Measured in the source repo: 12 patrol goals reached in two 50 s windows, 0 aborts.',
    ],
    d: 'Goal distance (m)',
    tick: 'per control tick',
    drive: 'distance to drive',
    time: 'minimum time (no acceleration)',
    timeAccel: 'with his 2.5 m/s² limit',
    yaw: 'heading tolerance',
    gDrive: 'Driving',
    gChecks: 'Nav2 checks',
    progress: 'progress checker: must move 0.5 m within 10 s; at full speed',
    planner: 'global planner',
    recover: 'recovery behaviours loaded (the behavior tree sets the order)',
    ticks: 'control ticks',
    measured: '/cmd_vel rate',
    every: 'dots: every 10th tick',
  },
  bringup: {
    lines: [
      'One launch file starts everything. Most stages wait on fixed timers chosen so their inputs should exist first. Only patrol checks: it waits up to 5 s for Nav2’s action server and retries.',
      'Drag SLAM or Nav2 earlier: a stage that starts no later than its input waits on a frame or topic that is not there yet.',
    ],
    slam: 'SLAM starts at (s)',
    nav2: 'Nav2 starts at (s)',
    patrol: 'patrol starts (its node at 9 s + 15 s wait)',
    early: 'stages started too early',
    waits: 'starts before',
    ok: 'none',
    breakIt: 'Break it: Nav2 before SLAM',
    logHead: ['stage', 'starts', 'gives'],
  },
  grid: {
    lines: [
      'This page keeps the textbook grid: each cell holds the log-odds that it is occupied; grey is unknown. slam_toolbox instead redraws its map from stored scan poses, so a loop closure can move walls.',
      'Each scan makes the cells along a beam a little more free and the hit cell more occupied.',
      'Press Add scan: the robot scans from each waypoint in turn and the map fills in.',
    ],
    res: 'Resolution (m per cell)',
    add: 'Add scan',
    reset: 'Reset',
    cells: 'cells in the page grid (10 × 10 m)',
    scans: 'scans added',
    known: 'cells no longer unknown',
    limit: (slam: number, sensor: number) => `SLAM may use beams up to ${slam} m (max_laser_range), but the LiDAR returns nothing past ${sensor} m: the sensor sets the limit.`,
    gSlam: 'How his SLAM uses scans',
    kept: 'one scan joins the map per 0.5 m (or 0.5 rad); at full speed every',
    between: 'LiDAR scans in that time (measured rate)',
    republish: 'map republished every',
    unknown: 'His NavFn planner may route through grey unknown cells (allow_unknown: true), so it can plan before the map is complete; the local costmap handles what the sensor sees on the way.',
    same: 'The SLAM map, the local and the global costmap all use this 0.05 m cell, so one map cell is one cost cell.',
    model: 'Model: hit p = 0.7, pass p = 0.4 (page choice); beams with no return change nothing.',
  },
  detect: {
    pass: 'points processed · clusters so far',
    lines: [
      'The simplest LiDAR detector: walk the scan and start a new object wherever two neighbouring hits are farther apart than a threshold.',
      'Too small: one object breaks into pieces, because beams spread with range and land far apart on a surface hit at a shallow angle. Too large: neighbours merge.',
      'Drag the robot on the map: the same object splits from one spot and not from another.',
    ],
    x: 'Robot x (m)',
    y: 'Robot y (m)',
    th: 'Break threshold (m)',
    found: 'objects found',
    noise: 'add his sensor noise (σ 1 cm, Gaussian, URDF)',
    truth: 'objects in view (ground truth)',
    next: 'Borges & Aldon (2004) propose a threshold that grows with range and sensor noise; this page keeps one fixed threshold.',
  },
  costmap: {
    lines: [
      'Nav2 inflates every obstacle: cost falls off with distance, so the planner prefers paths clear of walls.',
      'Inside the configured robot radius (0.22 m) the cost is 253: in the costmap’s circle model the centre there collides.',
    ],
    k: 'cost_scaling_factor k',
    d: 'Robot centre to obstacle (m)',
    cost: 'cost of this cell',
    zero: 'cost reaches 0 at',
    smooth: 'k that ends at cost 10 instead (no cliff)',
    window: 'local costmap: a window that moves with the robot',
    ladder: 'range: LiDAR → clears → marks → window edge',
    twoMaps: 'Both of his costmaps inflate the same way (k 3.0, 0.55 m): the global one over the whole map for the planner, the local one in a 3 × 3 m window for the controller.',
    lethal: 'lethal',
    inscribed: 'inscribed',
    obstacle: 'obstacle',
    radius: 'inflation radius',
    inflated: 'inflated',
  },
}

const ja: typeof en = {
  title: 'ロボティクス 101',
  lede: '10 × 10 m の Gazebo アリーナにシミュレーションの TurtleBot3 が 1 台。各ウェイポイントで移動ロボットの考え方を 1 つずつ扱い、値はその ROS 2 Nav2 設定から取る。',
  open: 'ウェイポイントを開く',
  startR101: 'Robotics 101 を始める',
  drag: '← ドラッグ →',
  wv: { jump: (m: number) => `ジャンプ > ${m} m`, obstacles: (n: number) => `障害物 ${n} 個`, cells: (m: number) => `${m} m のセル` },
  keys: 'キー: 1–7 でウェイポイントへ、← → で移動。',
  stackOf: '例のプロジェクト（その環境）：',
  pathNote: '巡回経路はこのページ用の図。障害物と壁は Gazebo のワールドファイルから。',
  kind: { config: '設定値', formula: '式', measured: '実測' },
  back: '戻る',
  player: { label: 'シナリオ', play: '再生', pause: '一時停止', scrub: 'シナリオの時刻' },
  next: '次へ',
  levels: {
    heading: 'レベル',
    one: 'レベル',
    names: ['はじめに', 'ロボットのためのプログラミング', 'ROS 2 の基本', '自分で動くロボット', '地図とナビゲーション', 'ロボットソフトウェアエンジニア'],
    soon: '準備中',
    ep: 'エンジニアリング実践',
    epNote: '任意、レベルの外',
    completed: 'チェック正解',
    difficulty: '難しさ',
    knows: 'もう知っていること',
    grows: {
      scan: '「感じ方」の章の最後は、ロボットの周りを1周するビームだった。LiDAR のスキャンはその1周を1つのメッセージにして、何度も送る。',
      tf: 'シミュレーターの章では、世界とロボット自身の見え方を2枚の絵で見た。TF は一方がもう一方のどこにあるかを記録し続ける。',
      detect: '「感じ方」の章では、1本のビームが何かに当たった。ここでは隣り合う当たりをまとめ、まとまり1つを物体1つの候補とみなす。',
      grid: '「考え方」の章では、1つの読み取りで決めてすぐ忘れた。グリッドは読み取りをセルとして覚える：空き、壁、まだ見ていない。',
      costmap: '「考え方」の章では、壁から安全な距離でロボットを止めた。コストマップはその距離を地図上のすべての壁の周りに描く。',
      goal: '「動かし方」の章では、車輪に2つの数字を送った。ここでは代わりに場所を送り、プランナーが行けるか、どう行くかを決める。',
      bringup: 'レベル 0 では、ロボットのソフトウェアを、データを次へ渡す小さなプログラムの集まりとして見た。ブリングアップはそれらのプログラムを正しい順に全部起動する。',
    },
    groups: ['ロボットに会う', '練習の世界', 'まわりのソフトウェア'],
  },
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
    fired: '発射済みのビーム (1 スキャン、15 倍スロー)',
    lines: [
      '1 度につき 1 本、計 360 本のビームを毎秒 5 回。各ビームは 3.5 m 以内にある一番近い壁か障害物までの距離を返す。センサにほぼ接する面も値を返さない（URDF の最小距離）。',
      '距離が遠いほど隣のビームとの間隔が広がる。間隔より細い物はビームの間をすり抜け、見えない。',
      '地図上のロボットをドラッグすると、スキャンも一緒に動く。',
    ],
    x: 'ロボット x (m)',
    y: 'ロボット y (m)',
    yaw: '向き (度)',
    range: '調べる距離 (m)',
    rate: 'スキャンレート',
    hits: '反射のあったビーム',
    gap: 'ビームの間隔',
    move: '0.26 m/s で 1 スキャン間に進む距離',
    moveMeasured: '実測レートでの 1 スキャン間の移動',
    measured: '/scan レート (設定 5 Hz)',
    beam: 'ビーム (点にカーソル)',
    noiseRes: '測距雑音 σ / 分解能 (URDF)',
  },
  tf: {
    lines: [
      'すべての位置はいずれかのフレームに対する相対値: map → odom → base_footprint → base_link → base_scan。連鎖を合成すると、map 上のロボット位置が得られる。',
      'box1 に当たった LiDAR の点 1 つを各フレームの座標で表すと、同じ点でも数値は 5 通り (base_footprint と base_link は高さだけが違う)。',
      '異常検出器は 0.5 秒ごとに確認: 1.0 秒より古いと stale、0.5 m を超える移動は jump。',
    ],
    drift: 'map から見た odom のずれ x (m)',
    driftYaw: 'map から見た odom のずれ yaw (度)',
    x: '0 秒の時点で odom から見た base_footprint の x (m)',
    y: '0 秒の時点で odom から見た base_footprint の y (m)',
    yaw: '0 秒の時点で odom から見た base_footprint の yaw (度)',
    frame: 'フレーム',
    point: 'box1 の角に当たった点',
    jump: '前回確認からの odom の移動 (m)',
    age: '変換の古さ (秒)',
    verdict: '検出器の判定',
    drive: '確認の間に走れる最大距離 (0.26 m/s)',
    mapOdom: 'SLAM が map → odom を配信する間隔',
    odom: '/odom レート (≈ 確認 1 回あたりの更新数)',
    driveNote: 'Nav2 の速度上限 0.26 m/s なら確認の間に最大 0.13 m。0.5 m を超える飛びは map → odom の補正、確認の遅れ、または故障を示す。',
    gFrames: 'フレーム',
    scene: '走行: SLAM は 0.5 m ごとに map → odom を補正; 検出器の値',
    breakIt: 'わざと壊す: ドリフト 1 m、6 秒まで SLAM がスキャンを処理しない',
    gDetector: '異常検出器 (0.5 秒ごと)',
    v: { healthy: '正常', stale: 'STALE', jump: 'JUMP' },
  },
  goal: {
    lines: [
      'DWB コントローラは 20 Hz。速度上限 0.26 m/s で 1 周期に 1.3 cm 進む。',
      '位置が 0.25 m 以内、向きが 0.25 rad 以内で到着扱い。巡回は最大 25 cm 手前で止まりうる。',
      '最短時間はまず加速度を無視。Nav2 の 2.5 m/s² なら 0.1 秒、シミュレーションの駆動 1.0 m/s² なら 0.26 秒で最高速。どちらでもほぼ影響しない。',
      '元リポジトリでの実測: 50 秒の区間 2 回で巡回ゴール 12 個に到着、アボート 0。',
    ],
    d: 'ゴールまでの距離 (m)',
    tick: '制御 1 周期あたり',
    drive: '走る距離',
    time: '最短時間 (加速度なし)',
    timeAccel: '加速度制限 2.5 m/s² あり',
    yaw: '向きの許容誤差',
    gDrive: '走行',
    gChecks: 'Nav2 の判定',
    progress: '進捗チェック: 10 秒以内に 0.5 m 動くこと。最高速なら',
    planner: 'グローバルプランナ',
    recover: '読み込まれた回復動作 (順番はビヘイビアツリーが決める)',
    ticks: '制御周期の数',
    measured: '/cmd_vel レート',
    every: '点: 10 周期ごと',
  },
  bringup: {
    lines: [
      '1 つの launch ファイルが全部を起動する。多くの段は固定タイマーで待ち、入力が先に揃っているはずの時刻に起動する。確認するのは巡回だけで、Nav2 のアクションサーバーを最大 5 秒待ち、なければ再試行する。',
      'SLAM や Nav2 を早めると、入力元と同時か、それより前に始まる段は、まだ存在しないフレームやトピックを待つことになる。',
    ],
    slam: 'SLAM の開始 (秒)',
    nav2: 'Nav2 の開始 (秒)',
    patrol: '巡回の開始 (ノード起動 9 秒 + 待機 15 秒)',
    early: '早すぎる段',
    waits: 'より先に開始',
    ok: 'なし',
    breakIt: 'わざと壊す: SLAM より先に Nav2',
    logHead: ['段', '開始', '出力'],
  },
  grid: {
    lines: [
      'このページは教科書どおりの格子: 各セルが占有の対数オッズを持ち、灰色は未知セル。一方 slam_toolbox は、保存したスキャン姿勢から地図を描き直すので、ループクロージャで壁が動くことがある。',
      'スキャンのたびに、ビームが通ったセルは少し空きに、当たったセルは占有に近づく。',
      '「スキャン追加」を押すと、ロボットが各ウェイポイントから順にスキャンし、地図が埋まる。',
    ],
    res: '解像度 (m/セル)',
    add: 'スキャン追加',
    reset: 'リセット',
    cells: 'ページの格子のセル数 (10 × 10 m)',
    scans: '追加したスキャン',
    known: '未知でなくなったセル',
    limit: (slam: number, sensor: number) => `SLAM は ${slam} m までのビームを使える設定 (max_laser_range) だが、LiDAR は ${sensor} m より先を返さない。限界はセンサの方。`,
    gSlam: 'SLAM のスキャンの使い方',
    kept: '0.5 m (または 0.5 rad) ごとに 1 スキャンを地図へ。最高速なら',
    between: 'その間に届く LiDAR スキャン (実測レート)',
    republish: '地図の再配信間隔',
    unknown: 'NavFn は灰色の未知セルも通る経路を引ける (allow_unknown: true)。地図が完成する前に計画でき、途中で見えたものはローカルコストマップが扱う。',
    same: 'SLAM 地図・ローカル/グローバルコストマップはすべて 0.05 m のセル。地図の 1 セルがコストの 1 セルに対応する。',
    model: 'モデル: 当たり p = 0.7、通過 p = 0.4 (このページの選択)。反射のないビームは何も変えない。',
  },
  detect: {
    pass: '処理済みの点 · ここまでのクラスタ数',
    lines: [
      '一番簡単な LiDAR 検出器: スキャンを順にたどり、隣り合う点がしきい値より離れたら新しい物体とする。',
      '小さすぎると 1 つの物体がばらばらになる。ビームは距離とともに広がり、浅い角度で当たる面では点が離れるため。大きすぎると隣の物体がつながる。',
      '地図上のロボットをドラッグすると、同じ物体でも場所によって分かれたり分かれなかったりする。',
    ],
    x: 'ロボット x (m)',
    y: 'ロボット y (m)',
    th: '区切りのしきい値 (m)',
    found: '見つかった物体',
    noise: 'センサ雑音を加える (σ 1 cm、ガウス、URDF)',
    truth: '視野内の物体 (真値)',
    next: 'Borges & Aldon (2004) は距離とセンサ雑音で大きくなるしきい値を提案している。このページでは固定のしきい値を 1 つだけ使う。',
  },
  costmap: {
    lines: [
      'Nav2 は障害物を膨張させる。距離とともにコストが下がり、プランナは壁から離れた経路を好む。',
      '設定上のロボット半径 (0.22 m) 以内はコスト 253。コストマップの円モデルでは中心がそこに入ると衝突。',
    ],
    k: 'cost_scaling_factor k',
    d: 'ロボット中心から障害物までの距離 (m)',
    cost: 'このセルのコスト',
    zero: 'コストが 0 になる距離',
    smooth: '膨張の端でもコストが 10 残る k (段差なし)',
    window: 'ローカルコストマップ: ロボットと一緒に動くウィンドウ',
    ladder: '距離: LiDAR → クリア → 障害物マーク → ウィンドウの端',
    twoMaps: '2 つのコストマップは同じ膨張 (k 3.0、0.55 m)。グローバルは地図全体でプランナ用、ローカルは 3 × 3 m のウィンドウでコントローラ用。',
    lethal: '致命',
    inscribed: '内接',
    obstacle: '障害物',
    radius: '膨張半径',
    inflated: '膨張',
  },
}

// Burmese: generated overlays in src/i18n/my/<id>.json (shape: src/i18n/my/README.md). Any string missing there shows English.
const MY = import.meta.glob('./i18n/my/*.json', { eager: true, import: 'default' }) as Record<string, unknown>
export const myOverlay = (id: string): unknown => MY[`./i18n/my/${id}.json`]

/** `base` with every string leaf replaced by the overlay's string at the same path; functions and missing keys stay as in `base`. */
export function overlay<T>(base: T, o: unknown): T {
  if (typeof base === 'string') return (typeof o === 'string' && o.trim() ? o : base) as T
  if (!o || typeof o !== 'object' || !base || typeof base !== 'object') return base
  if (Array.isArray(base)) return base.map((b, i) => overlay(b, (o as unknown[])[i])) as T
  return Object.fromEntries(Object.entries(base).map(([k, b]) => [k, overlay(b, (o as Record<string, unknown>)[k])])) as T
}

/** `obj` with `fn` at the dotted `path`, copying only along that path; kept only where English has a function with the same arity. */
function setTemplate<T>(obj: T, path: string[], fn: (...a: never[]) => string): T {
  const [k, ...rest] = path
  const cur = (obj as Record<string, unknown>)?.[k]
  if (rest.length === 0) return typeof cur === 'function' && cur.length === fn.length ? ({ ...obj, [k]: fn } as T) : obj
  if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return obj
  return { ...obj, [k]: setTemplate(cur, rest, fn) } as T
}
/** Burmese templates (src/i18n/my/templates.ts) for the function-valued strings of `id`; English stays where none fits. */
export function withTemplates<T>(base: T, id: string): T {
  return Object.entries(MY_TEMPLATES[id] ?? {}).reduce((acc, [path, fn]) => setTemplate(acc, path.split('.'), fn), base)
}

export const STRINGS = { en, ja, my: withTemplates(overlay(en, myOverlay('core')), 'core') }
export type Strings = typeof en

export const langOf = (t: Strings): Lang => (t === STRINGS.ja ? 'ja' : t === STRINGS.my ? 'my' : 'en')

const built = new WeakMap<object, unknown>()
/** A chapter's strings for the reader's language. `id` = '<level dir>.<file base>.<EXPORT>', e.g. 'l0.tools.TOOLS_STRINGS'. */
export function stringsFor<T>(table: { en: T; ja: T }, t: Strings, id: string): T {
  const l = langOf(t)
  if (l !== 'my') return table[l]
  if (!built.has(table)) built.set(table, withTemplates(overlay(table.en, myOverlay(id)), id))
  return built.get(table) as T
}

/** Chapter title for the reader's language; Burmese titles from src/i18n/my/titles.json ({ "<chapter id>": "..." }). */
export function titleOf(c: { id: string; titleEn: string; titleJa: string }, t: Strings): string {
  const l = langOf(t)
  if (l !== 'my') return l === 'ja' ? c.titleJa : c.titleEn
  // The 7 older chapters have no meta array, so titles.json cannot list them; their Burmese title is core chapters.<id>.
  const mine = (myOverlay('titles') as Record<string, unknown> | undefined)?.[c.id] ?? (t.chapters as Record<string, string>)[c.id]
  return overlay(c.titleEn, mine)
}

export function initialLang(): Lang {
  const saved = localStorage.getItem('r101-lang')
  if (saved === 'en' || saved === 'ja' || saved === 'my') return saved
  const n = navigator.language
  return n.startsWith('ja') ? 'ja' : n.startsWith('my') ? 'my' : 'en'
}
