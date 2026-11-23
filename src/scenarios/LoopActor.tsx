import Mascot from '../anim/Mascot'

export type LoopStage = 'sense' | 'think' | 'act'

/**
 * The 0.1 loop's robot as the character, driven by the loop model's frame (src/chapters/l0/loop.ts): sense = eyes on
 * the wall, think = thought dots, act = wheels turn by the distance really driven. When the run ends it cheers
 * (stopped in time) or wobbles with dizzy stars (crashed into the wall). `x` = the robot's front on the track, `y` =
 * the ground line, both in the chapter's svg units; `driven` = svg units travelled since the start; `run` bumps on
 * every replay so the end reaction plays again.
 */
export default function LoopActor({ x, y, size = 44, stage, driven, ended, crashed, run = 1, label = '' }: {
  x: number; y: number; size?: number; stage: LoopStage; driven: number; ended: boolean; crashed: boolean; run?: number; label?: string
}) {
  const k = size / 64 // mascot drawing is 64 units; its wheels touch the floor at y = 58, its body spans x 9..55
  return (
    <g className="loop-actor" data-stage={stage} transform={`translate(${x - 55 * k} ${y - 58 * k})`}>
      <Mascot inSvg size={size} label={label} thinking={stage === 'think' && !ended} look={stage === 'sense' ? 1 : 0}
        roll={driven / k} cheer={ended && !crashed ? run : 0} oops={ended && crashed ? run : 0} />
    </g>
  )
}
