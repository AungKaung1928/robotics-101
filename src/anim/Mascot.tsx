import { useEffect, useState } from 'react'
import { BOOP_S, HAPPY_S, OOPS_S, REST, boopPose, eyeShift, happyPose, oopsPose, sparks, type Pose } from './mascot'
import { PRESS_STYLE } from './spring'
import './mascot.css'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
export type Mood = 'idle' | 'happy' | 'oops'
type Reaction = 'happy' | 'oops' | 'boop'
const REACTION: Record<Reaction, { pose: (t: number) => Pose; end: number }> = {
  happy: { pose: happyPose, end: HAPPY_S }, oops: { pose: oopsPose, end: OOPS_S }, boop: { pose: boopPose, end: BOOP_S },
}

/**
 * The guide robot (TurtleBot3 Burger shape: two wheels, stacked plates, LiDAR dome as the head). Idles with a slow
 * breath and a blink (CSS); bounces when `cheer` changes (a challenge solved) and wobbles when `oops` changes (the
 * reader broke something), both on springs; a pointer arriving (or a tap) gives it a small boop. Reduced motion: no
 * movement, only the face changes for a moment. `look` (−1 left … 1 right) turns the eyes toward what is changing,
 * e.g. the playhead's place on the scrubber.
 */
export default function Mascot({ cheer = 0, oops = 0, look = 0, size = 64, label, inSvg = false }: {
  cheer?: number; oops?: number; look?: number; size?: number; label: string; inSvg?: boolean
}) {
  const [act, setAct] = useState<{ kind: Reaction; n: number } | null>(null)
  const [pose, setPose] = useState<Pose>(REST)
  const [t, setT] = useState(0)
  useEffect(() => { if (cheer) setAct({ kind: 'happy', n: cheer }) }, [cheer])
  useEffect(() => { if (oops) setAct({ kind: 'oops', n: oops }) }, [oops])
  useEffect(() => {
    if (!act) return
    const { pose: f, end } = REACTION[act.kind]
    const done = () => { setPose(REST); setT(0); setAct(null) }
    if (reduced()) {
      const id = setTimeout(done, act.kind === 'boop' ? 0 : 900)
      return () => clearTimeout(id)
    }
    const t0 = performance.now()
    let id = 0
    const frame = (ms: number) => {
      const t = (ms - t0) / 1000
      if (t >= end) return done()
      setPose(f(t))
      setT(t)
      id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [act])
  // Boop on pointer arrival or tap, only when idle: it never cuts a cheer or an oops short, and runs to the end.
  const boop = () => { if (!act) setAct({ kind: 'boop', n: 0 }) }
  const mood: Mood = act && act.kind !== 'boop' ? act.kind : 'idle'
  const fig = <MascotFigure pose={pose} mood={mood} size={size} label={label} spark={mood === 'happy' ? t : 0} look={look} />
  // Inside a chapter's SVG figure (place it with a parent <g transform>) the hit area is a <g>, in HTML a <span>.
  return inSvg
    ? <g className="mascot-hit" onPointerEnter={boop} onClick={boop}>{fig}</g>
    : <span className="mascot-hit" onPointerEnter={boop} onClick={boop}>{fig}</span>
}

/** One frame of the robot: pose and face in, SVG out (the filmstrip test draws frames with it). */
export function MascotFigure({ pose, mood, size = 64, label, spark = 0, look = 0 }: {
  pose: Pose; mood: Mood; size?: number; label: string; spark?: number; look?: number
}) {
  const body = `translate(32 58) translate(0 ${-pose.y}) rotate(${pose.rot}) scale(${pose.sx} ${pose.sy}) translate(-32 -58)`
  const shadow = 1 - pose.y / 25
  return (
    <svg className="mascot" data-mood={mood} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label} style={PRESS_STYLE}>
      <ellipse className="m-shadow" cx="32" cy="60" rx={18 * shadow} ry={2.2 * shadow} />
      <g transform={body}>
        <g className="m-breath">
          <circle className="m-wheel" cx="14" cy="53" r="5" />
          <circle className="m-wheel" cx="50" cy="53" r="5" />
          <rect className="m-plate" x="11" y="40" width="42" height="16" rx="7" />
          <rect className="m-plate" x="14" y="31" width="36" height="11" rx="5" />
          <rect className="m-head" x="17" y="12" width="30" height="20" rx="10" />
          <path className="m-lidar" d="M20 18h24" />
          <g className="m-look" style={{ transform: `translateX(${eyeShift(look)}px)` }}>
            {mood === 'happy' ? (
              <g className="m-face"><path d="M24 25q3-4 6 0M34 25q3-4 6 0" /></g>
            ) : (
              <g className="m-face m-eyes"><circle cx="27" cy="24" r={mood === 'oops' ? 3 : 2.2} /><circle cx="37" cy="24" r={mood === 'oops' ? 3 : 2.2} />{mood === 'oops' && <circle className="m-mouth" cx="32" cy="29.5" r="1.4" />}</g>
            )}
          </g>
        </g>
      </g>
      {sparks(spark).map((p, i) => <circle key={i} className="m-spark" data-i={i % 2} cx={p.x} cy={p.y} r="1.8" opacity={p.o} />)}
    </svg>
  )
}
