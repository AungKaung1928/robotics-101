/** Level 2 intro text, EN + JA. */
export const INTRO2_STRINGS = {
  en: {
    title: 'Level 2: ROS 2 basics',
    lead: 'The same robot, now as a team of small programs that start one by one and pass messages. Seven steps: from what a node is to driving the robot yourself.',
    start: 'Start with 2.1 →',
    caption: (k: number, n: number) => `step ${k} of 7 · ${n} of 7 nodes working`,
  },
  ja: {
    title: 'Level 2：ROS 2 の基本',
    lead: '同じロボットを、順に起動してメッセージを渡し合う小さなプログラムのチームとして見る。7つのステップ：ノードとは何かから、自分でロボットを走らせるまで。',
    start: '2.1 から始める →',
    caption: (k: number, n: number) => `ステップ ${k} / 7 · 7ノード中 ${n} 個が動作中`,
  },
}
