import Mascot from '../anim/Mascot'
import { FAN_DEG, beamDeg } from '../chapters/l1/closest'

type Frame = { pass: number; done: boolean; best: number }

/**
 * Gaze and reaction from the Closest chapter's frame: while the loop runs, the eyes are on the beam being checked
 * (beamDeg: + = left, the mascot's look: − = left); when it returns they rest on the closest beam. With the broken start
 * value (closest = 0) no reading ever wins, best stays −1 and the robot ends with the oops wobble.
 */
export function closestCue(f: Frame) {
  const at = f.done ? f.best : f.pass
  return { look: at < 0 ? 0 : -beamDeg(at) / (FAN_DEG / 2), oops: f.done && f.best < 0 ? 1 : 0 }
}

/** The robot beside the Closest chapter's fan; `x, y` = its feet in the chapter's svg units. */
export default function ClosestActor({ f, x, y, size = 44, label = '' }: { f: Frame; x: number; y: number; size?: number; label?: string }) {
  const k = size / 64
  return (
    <g className="closest-actor" transform={`translate(${x - 32 * k} ${y - 58 * k})`}>
      <Mascot inSvg size={size} label={label} {...closestCue(f)} />
    </g>
  )
}
