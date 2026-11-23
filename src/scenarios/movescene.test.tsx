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
