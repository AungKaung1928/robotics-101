import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MoveScene from './MoveScene'
import RobotTop from './RobotTop'
import { minPitch } from '../anim/TreadWheel'

const count = (h: string, re: RegExp) => h.match(re)?.length ?? 0

describe('MoveScene and RobotTop', () => {
  it('straight: robot ends right of start, no skid, calm face', () => {
    const h = renderToStaticMarkup(<MoveScene vl={0.2} vr={0.2} t={1} label="" />)
    expect(h).toContain('translate(110 200)') // 50 + 0.2 m · 300 px/m
    expect(count(h, /ms-skid/g)).toBe(0)
    expect(h).toContain('data-mood="idle"')
  })
  it('slip: skid marks and a worried face', () => {
    const h = renderToStaticMarkup(<MoveScene vl={0.2} vr={0.2} t={2} slip={0.3} label="" />)
    expect(count(h, /ms-skid/g)).toBeGreaterThan(3)
    expect(h).toContain('data-mood="worried"')
  })
  it('every mood draws, dizzy has 3 stars, proud a sparkle', () => {
    for (const m of ['idle', 'curious', 'worried', 'dizzy', 'proud'] as const) expect(renderToStaticMarkup(<svg><RobotTop x={0} y={0} deg={0} mood={m} /></svg>)).toContain(`data-mood="${m}"`)
    expect(count(renderToStaticMarkup(<svg><RobotTop x={0} y={0} deg={0} mood="dizzy" /></svg>), /<path d=/g)).toBe(3)
    expect(renderToStaticMarkup(<svg><RobotTop x={0} y={0} deg={0} mood="proud" /></svg>)).toContain('rtop-spark')
  })
  it('stripe pitch 6 is above the wagon-wheel limit at top speed', () => {
    expect(minPitch(0.22 * 300)).toBeLessThan(6)
  })
})

describe('SenseScene', () => {
  it('beam: the number on the beam is the model reading; covered: no number, worried', async () => {
    const { default: SenseScene } = await import('./SenseScene')
    const a = renderToStaticMarkup(<SenseScene wallX={1} mode="beam" label="" />)
    expect(a).toContain('data-reading="0.70"')
    expect(a).toContain('0.70 m')
    const b = renderToStaticMarkup(<SenseScene wallX={1} mode="beam" covered label="" />)
    expect(b).toContain('data-reading="none"')
    expect(b).toContain('data-mood="worried"')
    expect(b).toContain('ss-paw')
    const c = renderToStaticMarkup(<SenseScene wallX={1} mode="spin" t={2} label="" />)
    expect(count(c, /class="ss-hit"/g)).toBe(180)
  })
})

describe('ThinkScene', () => {
  it('driving -> fired + proud for 0.5 m; bumped + dizzy for 0.12 m', async () => {
    const { default: ThinkScene } = await import('./ThinkScene')
    expect(renderToStaticMarkup(<ThinkScene stopAt={0.5} t={0.5} label="" />)).toContain('data-state="driving"')
    const a = renderToStaticMarkup(<ThinkScene stopAt={0.5} t={20} label="" />)
    expect(a).toContain('data-state="fired"')
    expect(a).toContain('data-mood="proud"')
    expect(a).toContain('tk-bubble is-fired')
    const b = renderToStaticMarkup(<ThinkScene stopAt={0.12} t={20} label="" />)
    expect(b).toContain('data-state="bumped"')
    expect(b).toContain('data-mood="dizzy"')
  })
})

describe('ActScene', () => {
  it('driving -> rolling (dials at 0, ghost, roll-on label) -> stopped', async () => {
    const { default: ActScene } = await import('./ActScene')
    const p = (t: number) => renderToStaticMarkup(<ActScene v={0.2} w={0} tStop={1} decel={0.5} t={t} label="" />)
    expect(p(0.5)).toContain('data-phase="driving"')
    expect(p(0.5)).toContain('v 0.20')
    const r = p(1.2)
    expect(r).toContain('data-phase="rolling"')
    expect(r).toContain('v 0.00')
    expect(r).toContain('opacity="0.35"')
    const s = p(5)
    expect(s).toContain('data-phase="stopped"')
    expect(s).toContain('+0.04 m') // 0.2² / (2 · 0.5)
  })
})

describe('SimWhatScene', () => {
  it('scan points follow the wall; sensor off empties the view, the world keeps its wall', async () => {
    const { default: SimWhatScene } = await import('./SimWhatScene')
    const p = (x: number, on = true) => renderToStaticMarkup(<SimWhatScene wallX={x} sensorOn={on} worldWord="world" viewWord="view" label="" />)
    expect(p(1)).toContain('data-points="180"')
    expect(p(1)).not.toBe(p(0.8))
    const off = p(1, false)
    expect(off).toContain('data-points="0"')
    expect(off).toContain('ss-wall is-movable')
  })
})

describe('MeetScene', () => {
  it('no part: no outline; a part: outline, its label, happy face; four tappable parts with names', async () => {
    const { MeetFrame, default: MeetScene } = await import('./MeetScene')
    const words = { sensor: 'distance sensor', computer: 'small computer', battery: 'battery', wheels: 'two wheels' }
    expect(renderToStaticMarkup(<MeetFrame part={null} t={0} words={words} label="" />)).not.toContain('mt-outline')
    const h = renderToStaticMarkup(<MeetFrame part="sensor" t={2} words={words} label="" />)
    expect(h).toContain('data-part="sensor"')
    expect(h).toContain('distance sensor')
    expect(h).toContain('data-mood="happy"')
    const s = renderToStaticMarkup(<MeetScene words={words} label="" />)
    expect(count(s, /role="button"/g)).toBe(4)
    expect(s).toContain('aria-label="two wheels"')
  })
})

describe('SimPickScene', () => {
  it('robot hops to the picked step; picked step highlighted; notes shown', async () => {
    const { default: SimPickScene } = await import('./SimPickScene')
    const rungs = [{ name: 'this site', kind: '2D' as const }, { name: 'turtlesim', kind: '2D' as const }, { name: 'Gazebo', kind: '3D' as const }, { name: 'Isaac Sim', kind: '3D' as const, note: 'GPU' }]
    const h = renderToStaticMarkup(<SimPickScene rungs={rungs} pick={2} from={0} t={2} label="" />)
    expect(h).toContain('data-pick="2"')
    expect(count(h, /is-pick/g)).toBe(1)
    expect(count(h, /sp-side/g)).toBe(2)
    expect(h).toContain('GPU</tspan>')
    expect(h).toContain('data-mood="happy"')
    expect(renderToStaticMarkup(<SimPickScene rungs={rungs} pick={2} from={0} t={0.2} label="" />)).toContain('data-mood="idle"')
  })
})

describe('LoopActor', () => {
  it('stands on the ground with its front at x; think shows the thought dots; sense looks at the wall', async () => {
    const { default: LoopActor } = await import('./LoopActor')
    const think = renderToStaticMarkup(<svg><LoopActor x={300} y={244} stage="think" driven={0} ended={false} crashed={false} /></svg>)
    expect(think).toContain('translate(262.1') // 300 − 55·44/64 = 262.19
    expect(think).toContain('data-mood="think"')
    expect(think).toContain('m-think')
    const sense = renderToStaticMarkup(<svg><LoopActor x={300} y={244} stage="sense" driven={0} ended={false} crashed={false} /></svg>)
    expect(sense).toContain('data-mood="idle"')
    expect(sense).toContain('translate(2.5px') // eyes shifted fully toward the wall
  })
})

describe('ThinkScene ladder', () => {
  it('one mark per stopAt; values at or under the 0.12 m sensor floor are bumps', async () => {
    const { default: ThinkScene } = await import('./ThinkScene')
    const h = renderToStaticMarkup(<ThinkScene stopAt={0.5} t={0} ladder={[0.1, 0.12, 0.2, 0.3, 0.5, 0.7]} label="" />)
    expect(count(h, /class="tk-rung is-bump"/g)).toBe(2)
    expect(count(h, /class="tk-rung"/g)).toBe(3)
    expect(count(h, /class="tk-rung is-pick"/g)).toBe(1) // the current stopAt, bold
    expect(renderToStaticMarkup(<ThinkScene stopAt={0.5} t={0} label="" />)).not.toContain('tk-rung')
  })
})

describe('NodeFace and sinceLanding (Topics model)', () => {
  it('landings every 1/hz after the travel time; a typo topic never lands', async () => {
    const { sinceLanding } = await import('./NodeFace')
    const { TOPICS, TRAVEL_MS } = await import('../chapters/l2/topics')
    const hz = TOPICS.find((x) => x.name === '/scan')!.hz, tr = TRAVEL_MS / 1000
    expect(sinceLanding({ node: 'nav2', topic: '/scan' }, tr - 0.01)).toBeNull()
    expect(sinceLanding({ node: 'nav2', topic: '/scan' }, tr + 0.05)).toBeCloseTo(0.05)
    expect(sinceLanding({ node: 'nav2', topic: '/scan' }, tr + 1 / hz + 0.02)).toBeCloseTo(0.02)
    expect(sinceLanding({ node: 'my_node', topic: '/scna' }, 2)).toBeNull()
    expect(sinceLanding({ node: 'my_node', topic: 'scan' }, tr + 0.05)).toBeCloseTo(0.05) // 'scan' resolves to /scan
  })
  it('munch right after a landing, idle later, starved with no landing', async () => {
    const { default: NodeFace } = await import('./NodeFace')
    const m = (since: number | null, starved = false) => renderToStaticMarkup(<svg><NodeFace x={0} y={0} starved={starved} since={since} /></svg>)
    expect(m(0.05)).toContain('data-mood="munch"')
    expect(m(0.15 + 0.2)).toContain('data-mood="idle"')
    expect(m(null, true)).toContain('data-mood="starved"')
    expect(renderToStaticMarkup(<svg><NodeFace x={0} y={0} starved since={0.05} off /></svg>)).toContain('data-mood="off"') // off wins: asleep, not worried
  })
})

describe('actionCues from the Actions model', () => {
  it('reachable: start once, cheer at the end; unreachable: one wobble per attempt; cancel: brake', async () => {
    const { actionCues } = await import('./ActionActor')
    const { run } = await import('../chapters/l2/actions')
    const ok = run(1, true, null)
    expect(actionCues(ok.slice(0, 1)).thinking).toBe(true)
    expect(actionCues(ok)).toMatchObject({ start: 1, cheer: 1, oops: 0, brake: 0, thinking: false })
    const bad = run(1, false, null)
    expect(actionCues(bad).oops).toBe(4) // MAX_RETRIES + 1 attempts
    expect(actionCues(run(2, true, 1500))).toMatchObject({ brake: 1, cheer: 0 })
  })
})

describe('queueAt from the callback model', () => {
  it('fast callback: queue stays empty, no drops; slow callback: queue fills to DEPTH, then drops', async () => {
    const { queueAt } = await import('./CallbackActor')
    const { simulate, DEPTH, PERIOD_MS, N } = await import('../chapters/l1/callback')
    const fast = simulate(50)
    for (let t = 0; t < N * PERIOD_MS; t += 37) { const q = queueAt(fast, t); expect(q.waiting).toBe(0); expect(q.drops).toBe(0) }
    const slow = simulate(500), end = N * PERIOD_MS - 1
    expect(queueAt(slow, end).waiting).toBe(DEPTH)
    expect(queueAt(slow, end).drops).toBeGreaterThan(0)
    expect(queueAt(slow, end).busy).toBe(true)
  })
})

describe('closestCue from the Closest model', () => {
  it('eyes follow the pass left to right, rest on the closest beam, oops when the broken start never updates', async () => {
    const { closestCue } = await import('./ClosestActor')
    const { scenario, STEP_MS, BASE } = await import('../chapters/l1/closest')
    const sc = scenario(3), f = (k: number) => sc.frame(k * STEP_MS + 1)
    expect(closestCue(f(0)).look).toBeCloseTo(-1) // first beam is the leftmost (+45°)
    expect(closestCue(f(BASE.length - 1)).look).toBeCloseTo(1)
    const end = sc.frame(sc.durationMs)
    expect(closestCue(end)).toEqual({ look: expect.closeTo(-1 + (2 * 3) / (BASE.length - 1)), oops: 0 }) // box at beam 3
    expect(closestCue(scenario(3, 'zero').frame(1e9)).oops).toBe(1)
  })
})

describe('chapter cues (cpp, params)', () => {
  it('cpp: compile thinks, braces cheer at the error, int crashes, double drives calm', async () => {
    const { cppCue } = await import('./cues')
    const { scenario, COMPILE_MS } = await import('../chapters/l1/cpp')
    expect(cppCue(scenario('double').frame(COMPILE_MS / 2)).thinking).toBe(true)
    expect(cppCue(scenario('int{}').frame(1e9))).toMatchObject({ cheer: 1, oops: 0 })
    expect(cppCue(scenario('int').frame(1e9))).toMatchObject({ oops: 1, cheer: 0 })
    expect(cppCue(scenario('double').frame(1e9))).toMatchObject({ oops: 0, cheer: 0 })
  })
  it('params: threshold under one step = a wobble per check; right threshold = one cheer at the jump; too high = silence', async () => {
    const { paramsCue } = await import('./cues')
    const { STEP_M, JUMP_M, JUMP_AT, N } = await import('../chapters/l2/params')
    expect(paramsCue(STEP_M / 2, N - 1).oops).toBe(N - 1)
    expect(paramsCue((STEP_M + JUMP_M) / 2, JUMP_AT - 1).cheer).toBe(0)
    expect(paramsCue((STEP_M + JUMP_M) / 2, N - 1)).toEqual({ oops: 0, cheer: 1 })
    expect(paramsCue(JUMP_M + 0.1, N - 1)).toEqual({ oops: 0, cheer: 0 })
  })
})

describe('chapter cues (twist, workspace)', () => {
  it('twist: ignored fields wobble, left spin cheers, eyes follow the turn', async () => {
    const { twistCue } = await import('./cues')
    expect(twistCue({ linear: [0, 0, 0], angular: [0, 0, 0.5] })).toEqual({ oops: 0, look: -1, cheer: 1 })
    expect(twistCue({ linear: [0.2, 0.3, 0], angular: [0.1, 0, -0.5] })).toEqual({ oops: 2, look: 1, cheer: 0 })
  })
  it('workspace: the scripted session ends with the start line and a cheer; a bad command wobbles', async () => {
    const { wsCue } = await import('./cues')
    const { session, SCRIPT } = await import('../chapters/l2/ws')
    expect(wsCue(session([...SCRIPT]).lines).cheer).toBe(1)
    expect(wsCue(session(['colcon build']).lines).oops).toBeGreaterThan(0)
  })
})

describe('costCue + worried face', () => {
  it('calm beyond the inflation radius, worried inside it, oops at the inscribed radius and on the obstacle', async () => {
    const { costCue } = await import('./cues')
    const { inflationCost } = await import('../lib/inflation')
    const c = (d: number) => costCue(inflationCost(d, 3, 0.105, 0.55))
    expect(c(0.8)).toEqual({ worried: false, oops: 0 })
    expect(c(0.3)).toEqual({ worried: true, oops: 0 })
    expect(c(0.1)).toEqual({ worried: false, oops: 1 })
    expect(c(0)).toEqual({ worried: false, oops: 1 })
  })
  it('worried face draws brows with the inner ends up', async () => {
    const { MascotFigure } = await import('../anim/Mascot')
    const { REST } = await import('../anim/mascot')
    const h = renderToStaticMarkup(<MascotFigure pose={REST} mood="worried" label="" />)
    expect(h).toContain('m-brow')
    expect(renderToStaticMarkup(<MascotFigure pose={REST} mood="idle" label="" />)).not.toContain('m-brow')
  })
})

describe('detectCue', () => {
  it('thinks while grouping; cheers on a match, wobbles on a split or merge', async () => {
    const { detectCue } = await import('./cues')
    expect(detectCue(1, 3, false)).toEqual({ thinking: true, cheer: 0, oops: 0 })
    expect(detectCue(3, 3, true)).toEqual({ thinking: false, cheer: 1, oops: 0 })
    expect(detectCue(5, 3, true).oops).toBe(1)
    expect(detectCue(2, 3, true).oops).toBe(1)
  })
})
