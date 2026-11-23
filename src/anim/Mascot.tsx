import { useEffect, useState } from 'react'
import { HAPPY_S, OOPS_S, REST, happyPose, oopsPose, sparks, type Pose } from './mascot'
import './mascot.css'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
export type Mood = 'idle' | 'happy' | 'oops'

/**
 * The guide robot (TurtleBot3 Burger shape: two wheels, stacked plates, LiDAR dome as the head). Idles with a slow
 * breath and a blink (CSS); bounces when `cheer` changes (a challenge solved) and wobbles when `oops` changes (the
 * reader broke something), both on springs. Reduced motion: no movement, only the face changes for a moment.
 */
export default function Mascot({ cheer = 0, oops = 0, size = 64, label }: { cheer?: number; oops?: number; size?: number; label: string }) {
  const [mood, setMood] = useState<Mood>('idle')
  const [pose, setPose] = useState<Pose>(REST)
  const [t, setT] = useState(0)
  useEffect(() => { if (cheer) return play('happy') }, [cheer])
  useEffect(() => { if (oops) return play('oops') }, [oops])
  function play(m: Exclude<Mood, 'idle'>) {
    setMood(m)
    const f = m === 'happy' ? happyPose : oopsPose, end = m === 'happy' ? HAPPY_S : OOPS_S
    if (reduced()) {
      const id = setTimeout(() => setMood('idle'), 900)
      return () => clearTimeout(id)
    }
    const t0 = performance.now()
    let id = 0
    const frame = (ms: number) => {
      const t = (ms - t0) / 1000
      if (t >= end) { setPose(REST); setMood('idle'); setT(0); return }
      setPose(f(t))
      setT(t)
      id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(id); setPose(REST); setT(0) }
  }
  return <MascotFigure pose={pose} mood={mood} size={size} label={label} spark={mood === 'happy' ? t : 0} />
}

/** One frame of the robot: pose and face in, SVG out (the filmstrip test draws frames with it). */
export function MascotFigure({ pose, mood, size = 64, label, spark = 0 }: { pose: Pose; mood: Mood; size?: number; label: string; spark?: number }) {
  const body = `translate(32 58) translate(0 ${-pose.y}) rotate(${pose.rot}) scale(${pose.sx} ${pose.sy}) translate(-32 -58)`
  const shadow = 1 - pose.y / 25
  return (
    <svg className="mascot" data-mood={mood} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label}>
      <ellipse className="m-shadow" cx="32" cy="60" rx={18 * shadow} ry={2.2 * shadow} />
      <g transform={body}>
        <g className="m-breath">
          <circle className="m-wheel" cx="14" cy="53" r="5" />
          <circle className="m-wheel" cx="50" cy="53" r="5" />
          <rect className="m-plate" x="11" y="40" width="42" height="16" rx="7" />
          <rect className="m-plate" x="14" y="31" width="36" height="11" rx="5" />
          <rect className="m-head" x="17" y="12" width="30" height="20" rx="10" />
          <path className="m-lidar" d="M20 18h24" />
          {mood === 'happy' ? (
            <g className="m-face"><path d="M24 25q3-4 6 0M34 25q3-4 6 0" /></g>
          ) : (
            <g className="m-face m-eyes"><circle cx="27" cy="24" r={mood === 'oops' ? 3 : 2.2} /><circle cx="37" cy="24" r={mood === 'oops' ? 3 : 2.2} />{mood === 'oops' && <circle className="m-mouth" cx="32" cy="29.5" r="1.4" />}</g>
          )}
        </g>
      </g>
      {sparks(spark).map((p, i) => <circle key={i} className="m-spark" data-i={i % 2} cx={p.x} cy={p.y} r="1.8" opacity={p.o} />)}
    </svg>
  )
}
