import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { BOOP_S, HAPPY_S, JOLT_S, OOPS_S, REST, WHEEL_R, boopPose, headLag, brakePose, startPose, eyeShift, wheelAngle, happyPose, oopsPose, sparks, dizzyStars, faceSwap, SWAP_S, STILL_DIZZY, STILL_SPARK, blinkDelay, enterPose, ENTER_S, type Pose } from './mascot'
import { PRESS_STYLE } from './spring'
import './mascot.css'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
export type Mood = 'idle' | 'happy' | 'oops' | 'think' | 'sleep'
type Reaction = 'happy' | 'oops' | 'boop' | 'brake' | 'start' | 'enter'
const REACTION: Record<Reaction, { pose: (t: number) => Pose; end: number }> = {
  happy: { pose: happyPose, end: HAPPY_S }, oops: { pose: oopsPose, end: OOPS_S }, boop: { pose: boopPose, end: BOOP_S },
  brake: { pose: brakePose, end: JOLT_S }, start: { pose: startPose, end: JOLT_S }, enter: { pose: enterPose, end: ENTER_S },
}

/**
 * The guide robot (TurtleBot3 Burger shape: two wheels, stacked plates, LiDAR dome as the head). Idles with a slow
 * breath and a blink (CSS); bounces when `cheer` changes (a challenge solved) and wobbles when `oops` changes (the
 * reader broke something), both on springs; a pointer arriving (or a tap) gives it a small boop; `thinking` (a state, e.g. the think step of a loop) looks up
 * with a three-dot bubble; `brake` / `start` changes pitch it forward / back (inertia). Reduced motion: no
 * movement, only the face changes for a moment. `look` (−1 left … 1 right) turns the eyes toward what is changing,
 * e.g. the playhead's place on the scrubber. `roll` = distance driven in the drawing's own units (64-unit box): the
 * wheels turn by roll / radius, so they never skid against the floor.
 */
export default function Mascot({ cheer = 0, oops = 0, brake = 0, start = 0, look = 0, roll = 0, thinking = false, sleepAfter = 0, enter = false, watch = false, boop: boopN = 0, size = 64, label, inSvg = false }: {
  cheer?: number; oops?: number; brake?: number; start?: number; look?: number; roll?: number; thinking?: boolean; sleepAfter?: number; enter?: boolean; watch?: boolean; boop?: number
  size?: number; label: string; inSvg?: boolean
}) {
  const [act, setAct] = useState<{ kind: Reaction; n: number } | null>(null)
  const [pose, setPose] = useState<Pose>(() => (enter && !reduced() ? enterPose(0) : REST)) // entrance: first paint already off to the left, no jump
  const [t, setT] = useState(0)
  useEffect(() => { if (enter && !reduced()) setAct({ kind: 'enter', n: 1 }) }, []) // once, on mount; reduced motion: already in place
  useEffect(() => { if (cheer) setAct({ kind: 'happy', n: cheer }) }, [cheer])
  // boop from elsewhere (Comeau: the trigger can be a nearby control): never cuts a running reaction short
  useEffect(() => { if (boopN) setAct((a) => a ?? { kind: 'boop', n: boopN }) }, [boopN])
  useEffect(() => { if (oops) setAct({ kind: 'oops', n: oops }) }, [oops])
  useEffect(() => { if (brake) setAct({ kind: 'brake', n: brake }) }, [brake])
  useEffect(() => { if (start) setAct({ kind: 'start', n: start }) }, [start])
  useEffect(() => {
    if (!act) return
    const { pose: f, end } = REACTION[act.kind]
    const done = () => { setPose(REST); setT(0); setAct(null) }
    if (reduced()) {
      const id = setTimeout(done, act.kind === 'happy' || act.kind === 'oops' ? 900 : 0)
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
  const asleep = useIdle(sleepAfter)
  const hit = useRef<HTMLSpanElement & SVGGElement>(null), glance = useGlance(hit, watch)
  const mood: Mood = act && (act.kind === 'happy' || act.kind === 'oops') ? act.kind : thinking ? 'think' : asleep ? 'sleep' : 'idle'
  const head = act && !reduced() ? headLag(REACTION[act.kind].pose, t) : undefined
  // Face swaps blink through (closed at the swap); reduced motion: instant.
  const [face, setFace] = useState<{ from: Mood; to: Mood; t: number }>({ from: mood, to: mood, t: SWAP_S })
  useEffect(() => {
    if (mood === face.to) return
    const from = face.t >= SWAP_S / 2 ? face.to : face.from // mid-swap: whatever is on screen now
    if (reduced()) return setFace({ from: mood, to: mood, t: SWAP_S })
    const t0 = performance.now()
    let id = 0
    const frame = (ms: number) => {
      const s = Math.min((ms - t0) / 1000, SWAP_S)
      setFace({ from, to: mood, t: s })
      if (s < SWAP_S) id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [mood]) // face is read only at the moment the mood changes, on purpose
  const sw = faceSwap(face.t)
  const still = !!act && reduced() // reduced motion: the cue shows as a still frame for the 900 ms the face holds
  const fig = <MascotFigure pose={pose} mood={mood} size={size} label={label} spark={mood === 'happy' ? (still ? STILL_SPARK : t) : 0} dizzy={mood === 'oops' ? (still ? STILL_DIZZY : t) : 0} eyes={{ mood: sw.showNew ? face.to : face.from, sy: sw.sy }} look={look || glance} roll={roll} head={head} />
  // Inside a chapter's SVG figure (place it with a parent <g transform>) the hit area is a <g>, in HTML a <span>.
  return inSvg
    ? <g ref={hit} className="mascot-hit" data-react={act?.kind} onPointerEnter={boop} onClick={boop}>{fig}</g>
    : <span ref={hit} className="mascot-hit" data-react={act?.kind} onPointerEnter={boop} onClick={boop}>{fig}</span>
}

/** One frame of the robot: pose and face in, SVG out (the filmstrip test draws frames with it). label '' = decorative: hidden from screen readers. */
export function MascotFigure({ pose, mood, size = 64, label, spark = 0, dizzy = 0, eyes, look = 0, roll = 0, head = { rot: 0, dy: 0 } }: {
  pose: Pose; mood: Mood; size?: number; label: string; spark?: number; dizzy?: number; eyes?: { mood: Mood; sy: number }; look?: number; roll?: number; head?: { rot: number; dy: number }
}) {
  const blink = { ...PRESS_STYLE, '--blink-delay': `${blinkDelay(useId())}ms` } as CSSProperties
  const stars = dizzyStars(dizzy)
  const starPath = (p: (typeof stars)[number], i: number) => <path key={i} className="m-star" d="M0-3L.8-.8 3 0 .8.8 0 3-.8.8-3 0-.8-.8Z" transform={`translate(${p.x} ${p.y}) scale(${p.s})`} opacity={p.o} />
  const body = `translate(${pose.x ?? 0} 0) translate(32 58) translate(0 ${-pose.y}) rotate(${pose.rot}) scale(${pose.sx} ${pose.sy}) translate(-32 -58)`
  const shadow = 1 - pose.y / 25
  return (
    <svg className="mascot" data-mood={mood} width={size} height={size} viewBox="0 0 64 64" style={blink}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      <ellipse className="m-shadow" cx={32 + (pose.x ?? 0)} cy="60" rx={18 * shadow} ry={2.2 * shadow} />
      <g transform={body}>
        <g className="m-breath">
          <rect className="m-plate" x="11" y="40" width="42" height="16" rx="7" />
          <rect className="m-plate" x="14" y="31" width="36" height="11" rx="5" />
          {[14, 50].map((cx) => (
            <g key={cx} transform={`rotate(${wheelAngle(roll + (pose.x ?? 0))} ${cx} 53)`}>
              <circle className="m-wheel" cx={cx} cy="53" r={WHEEL_R} />
              <path className="m-spoke" d={`M${cx} ${53 - WHEEL_R + 1.5}V${53 + WHEEL_R - 1.5}`} />
            </g>
          ))}
          <g className="m-headgroup" transform={`translate(0 ${head.dy}) rotate(${head.rot} 32 31)`}>
            {stars.filter((p) => !p.front).map(starPath)}
            <g className="m-tilt"><g className="m-sway">
              <rect className="m-head" x="17" y="12" width="30" height="20" rx="10" />
              <path className="m-lidar" d="M20 18h24" />
              <g className="m-look" style={{ transform: `translate(${mood === 'think' ? 1.5 : eyeShift(look)}px, ${mood === 'think' ? -2 : 0}px)` }}>
                <g transform={`translate(32 24) scale(1 ${eyes?.sy ?? 1}) translate(-32 -24)`}>
                {(eyes?.mood ?? mood) === 'happy' ? (
                  <g className="m-face"><path d="M24 25q3-4 6 0M34 25q3-4 6 0" /></g>
                ) : (eyes?.mood ?? mood) === 'sleep' ? (
                  <g className="m-face"><path d="M24 24q3 3 6 0M34 24q3 3 6 0" /></g>
                ) : (
                  <g className="m-face m-eyes"><circle cx="27" cy="24" r={(eyes?.mood ?? mood) === 'oops' ? 3 : 2.2} /><circle cx="37" cy="24" r={(eyes?.mood ?? mood) === 'oops' ? 3 : 2.2} />{(eyes?.mood ?? mood) === 'oops' && <circle className="m-mouth" cx="32" cy="29.5" r="1.4" />}</g>
                )}
                </g>
              </g>
              <g className="m-blush"><ellipse cx="22.5" cy="27.5" rx="2.6" ry="1.4" /><ellipse cx="41.5" cy="27.5" rx="2.6" ry="1.4" /></g>
            </g></g>
            {stars.filter((p) => p.front).map(starPath)}
          </g>
        </g>
      </g>
      {mood === 'sleep' && <g className="m-zz"><path d="M48 9h4l-4 4h4" /><path d="M54 2h3l-3 3h3" /></g>}
      {mood === 'think' && (
        <g className="m-think">{[50, 55, 60].map((x, i) => <circle key={x} cx={x} cy={7 - i} r="1.8" style={{ animationDelay: `${i * 0.2}s` }} />)}</g>
      )}
      {sparks(spark).map((p, i) => <circle key={i} className="m-spark" data-i={i % 2} cx={p.x} cy={p.y} r="1.8" opacity={p.o} />)}
    </svg>
  )
}

/**
 * True once `after` s pass with no pointer, key or scroll input on the page (0 = never). Any input wakes it at once.
 * The face then swaps to sleep through the usual blink, so falling asleep and waking both read as a blink.
 */
export function useIdle(after: number): boolean {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    if (!after || typeof window === 'undefined') return
    let id = setTimeout(() => setIdle(true), after * 1000)
    const wake = () => { clearTimeout(id); setIdle(false); id = setTimeout(() => setIdle(true), after * 1000) }
    const evs = ['pointermove', 'pointerdown', 'keydown', 'scroll'] as const
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true }))
    return () => { clearTimeout(id); evs.forEach((e) => window.removeEventListener(e, wake)) }
  }, [after])
  return idle
}

/** Gaze toward the last tap or click on the page, −1 (far left) … 1 (far right) of the robot; 0 until the first tap. */
export function glanceAt(tapX: number, left: number, width: number, reach = 240): number {
  return Math.max(-1, Math.min(1, (tapX - (left + width / 2)) / reach))
}

/** `on`: listen for taps anywhere and return the gaze toward the last one (the eyes ease there on the look spring). */
export function useGlance(ref: { current: Element | null }, on: boolean): number {
  const [g, setG] = useState(0)
  useEffect(() => {
    if (!on) return
    const tap = (e: PointerEvent) => { const r = ref.current?.getBoundingClientRect(); if (r) setG(glanceAt(e.clientX, r.left, r.width)) }
    window.addEventListener('pointerdown', tap, { passive: true })
    return () => window.removeEventListener('pointerdown', tap)
  }, [ref, on])
  return g
}
