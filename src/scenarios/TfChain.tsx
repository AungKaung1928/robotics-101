import { useEffect, useRef, useState } from 'react'
import { MascotFigure } from '../anim/Mascot'
import { REST, STILL_DIZZY, STILL_SPARK, happyPose, oopsPose } from '../anim/mascot'
import type { Edge } from '../chapters/l3/tflab'
import { CHAIN, chainAt, chainEnd } from './tfchain'
import './tfchain.css'

const STEP = 170, X = (s: number) => 56 + s * STEP, Y = 114, R = 46

/**
 * TF lab chain (3.3): frames as nodes, broadcasters as edges. The robot carries the map -> base_link lookup along the
 * chain: on the broken chain it bumps into the gap and goes dizzy; after the fix the missing edge springs in and the
 * robot rolls through to base_link and jumps. Everything comes from chainAt() (diagnose() underneath).
 * `still` = reduced motion: the end frame with the reaction held.
 */
export default function TfChain({ edges, before, t, label, still = false }: { edges: readonly Edge[]; before: readonly Edge[]; t: number; label: string; still?: boolean }) {
  const f = chainAt(edges, before, t), x = X(f.s)
  const pose = still ? REST : f.outcome === 'stuck' ? oopsPose(f.since) : f.outcome === 'arrived' ? happyPose(f.since) : REST
  const mood = f.outcome === 'stuck' ? 'oops' : f.outcome === 'arrived' ? 'happy' : 'idle'
  return (
    <svg className="tfc" viewBox="0 0 458 170" role="img" aria-label={label} data-outcome={f.outcome}>
      {f.links.map((l, i) => (
        <g key={i}>
          {!l.on || l.scale < 1 ? <line className="tfc-gap" x1={X(i) + R} x2={X(i + 1) - R} y1={Y} y2={Y} /> : null}
          {l.on && <line className="tfc-link" x1={X(i) + R} x2={X(i) + R + l.scale * (STEP - 2 * R)} y1={Y} y2={Y} />}
        </g>
      ))}
      {CHAIN.map((c, i) => (
        <g key={c} className={i <= f.s + 1e-6 ? 'tfc-node is-reached' : 'tfc-node'} transform={`translate(${X(i)} ${Y})`}>
          <circle r={R} /><text y="5" textAnchor="middle">{c}</text>
        </g>
      ))}
      <circle className="tfc-pulse" cx={x} cy={Y - R - 4} r="4" />
      <g transform={`translate(${x - 26} ${Y - R - 56})`}>
        <MascotFigure pose={pose} mood={mood} size={52} label="" spark={mood === 'happy' ? (still ? STILL_SPARK : f.since) : 0} dizzy={mood === 'oops' ? (still ? STILL_DIZZY : f.since) : 0} />
      </g>
    </svg>
  )
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Self-clocked TfChain: replays from t = 0 each time `edges` changes (the chapter's fix buttons); reduced motion: the end frame. */
export function TfChainLive({ edges, label }: { edges: readonly Edge[]; label: string }) {
  const prev = useRef(edges), [run, setRun] = useState({ edges, before: edges, t: 0 })
  useEffect(() => {
    const before = prev.current
    prev.current = edges
    const end = chainEnd(edges, before)
    if (reduced()) return setRun({ edges, before, t: end })
    const t0 = performance.now()
    let id = 0
    const frame = (ms: number) => {
      const t = Math.min((ms - t0) / 1000, end)
      setRun({ edges, before, t })
      if (t < end) id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [edges])
  return <TfChain edges={run.edges} before={run.before} t={run.t} label={label} still={reduced() && run.t > 0} />
}
