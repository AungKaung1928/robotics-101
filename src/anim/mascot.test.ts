import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BOOP_S, HAPPY_S, HEAD_LAG, JOLT_S, WHEEL_R, headLag, brakePose, startPose, eyeShift, wheelAngle, OOPS_S, REST, SPARK_AT, boopPose, happyPose, oopsPose, sparks, dizzyStars, faceSwap, SWAP_S, STILL_DIZZY, STILL_SPARK, blinkDelay, BLINK_MS } from './mascot'

const ts = (end: number) => Array.from({ length: 601 }, (_, i) => (i / 600) * end)

describe('happyPose', () => {
  it('starts and ends at rest, lasts under 1.2 s', () => {
    expect(happyPose(0)).toEqual(REST)
    const e = happyPose(HAPPY_S)
    expect(e.y).toBe(0)
    expect(Math.abs(e.sy - 1)).toBeLessThan(0.005)
    expect(HAPPY_S).toBeLessThan(1.2)
  })
  it('keeps the area (sx · sy = 1) and lifts 10 px at the top', () => {
    for (const t of ts(HAPPY_S)) {
      const p = happyPose(t)
      expect(p.sx * p.sy).toBeCloseTo(1, 12)
      expect(p.y).toBeGreaterThanOrEqual(0)
    }
    expect(Math.max(...ts(HAPPY_S).map((t) => happyPose(t).y))).toBeCloseTo(10, 1)
  })
  it('squashes before take-off, stretches in the air, squashes on landing and overshoots back up', () => {
    expect(happyPose(0.07).sy).toBeLessThan(0.9)
    expect(happyPose(0.1).sy).toBeGreaterThan(1.05)
    const after = ts(HAPPY_S).filter((t) => t > 0.38).map((t) => happyPose(t).sy)
    expect(Math.min(...after)).toBeLessThan(0.93)
    expect(Math.max(...after)).toBeGreaterThan(1.01)
  })
})

describe('oopsPose', () => {
  it('rocks both ways, dies out, under 1.5 s', () => {
    const r = ts(OOPS_S).map((t) => oopsPose(t).rot)
    expect(Math.max(...r)).toBeGreaterThan(5)
    expect(Math.min(...r)).toBeLessThan(-2)
    expect(Math.abs(oopsPose(OOPS_S).rot)).toBeLessThan(0.3)
    expect(OOPS_S).toBeLessThan(1.5)
  })
})

describe('sparks', () => {
  it('pop at the top of the jump (head highest), over before the bounce settles', () => {
    expect(happyPose(SPARK_AT).y).toBeCloseTo(10, 9)
    expect(sparks(HAPPY_S)).toEqual([]) // the reaction runs until the last spark is gone
  })
  it('none before or after, six in between, fanning out symmetrically', () => {
    expect(sparks(SPARK_AT)).toEqual([])
    expect(sparks(SPARK_AT + 0.7)).toEqual([])
    const s = sparks(SPARK_AT + 0.1)
    expect(s).toHaveLength(6)
    const xs = s.map((p) => p.x - 32)
    expect(xs[0]).toBeCloseTo(-xs[5], 9)
  })
  it('rise first, then fall under gravity, fading', () => {
    const mid = (t: number) => sparks(SPARK_AT + t)[2]
    expect(mid(0.1).y).toBeLessThan(2) // above the head top at the apex (12 − 10)
    expect(mid(0.65).y).toBeGreaterThan(mid(0.3).y)
    expect(mid(0.6).o).toBeLessThan(mid(0.1).o)
  })
})

describe('boopPose', () => {
  it('a small, quick nudge: under a third of the oops swing, rest again within 0.6 s', () => {
    const ts = Array.from({ length: 301 }, (_, i) => (i / 300) * BOOP_S)
    const maxBoop = Math.max(...ts.map((t) => Math.abs(boopPose(t).rot)))
    const maxOops = Math.max(...Array.from({ length: 301 }, (_, i) => Math.abs(oopsPose((i / 300) * OOPS_S).rot)))
    expect(maxBoop).toBeGreaterThan(1)
    expect(maxBoop).toBeLessThan(maxOops / 3)
    expect(BOOP_S).toBeLessThan(0.6)
    expect(Math.abs(boopPose(BOOP_S).rot)).toBeLessThan(0.2)
    expect(boopPose(BOOP_S).y).toBe(0)
  })
})

describe('eyeShift', () => {
  it('maps −1 … 1 to −2.5 … 2.5 px, clamps, ignores NaN', () => {
    expect(eyeShift(0)).toBe(0)
    expect(eyeShift(1)).toBe(2.5)
    expect(eyeShift(-0.4)).toBeCloseTo(-1, 12)
    expect(eyeShift(7)).toBe(2.5)
    expect(eyeShift(NaN)).toBe(0)
  })
})

describe('wheelAngle', () => {
  it('one wheel circumference rolled = one full turn; backwards turns back', () => {
    expect(wheelAngle(2 * Math.PI * WHEEL_R)).toBeCloseTo(360, 9)
    expect(wheelAngle(-Math.PI * WHEEL_R)).toBeCloseTo(-180, 9)
    expect(wheelAngle(0)).toBe(0)
  })
})

describe('brakePose / startPose', () => {
  it('brake tips forward first (+), start back (−), mirror images, both settle within 0.6 s', () => {
    expect(brakePose(0.05).rot).toBeGreaterThan(1)
    expect(startPose(0.05).rot).toBeLessThan(-1)
    for (const t of [0.03, 0.1, 0.2]) expect(brakePose(t).rot).toBeCloseTo(-startPose(t).rot, 12)
    expect(JOLT_S).toBeLessThan(0.6)
    expect(Math.abs(brakePose(JOLT_S).rot)).toBeLessThan(0.2)
  })
})

describe('headLag (follow-through)', () => {
  it('still body = still head; during a wobble the head trails; after the reaction it is back', () => {
    expect(headLag(() => REST, 0.3)).toEqual({ rot: 0, dy: 0 })
    const r = Array.from({ length: 200 }, (_, i) => Math.abs(headLag(oopsPose, (i / 200) * OOPS_S).rot))
    expect(Math.max(...r)).toBeGreaterThan(1)
    expect(Math.abs(headLag(oopsPose, OOPS_S + HEAD_LAG).rot)).toBeLessThan(0.3)
  })
  it('on the happy hop the head lags upward motion (dy > 0 while rising) and stays small', () => {
    expect(headLag(happyPose, 0.12).dy).toBeGreaterThan(0)
    const d = Array.from({ length: 200 }, (_, i) => Math.abs(headLag(happyPose, (i / 200) * HAPPY_S).dy))
    expect(Math.max(...d)).toBeLessThan(5)
  })
})

describe('dizzy stars', () => {
  it('only during the wobble, three of them, on the ellipse above the head', () => {
    expect(dizzyStars(0)).toEqual([])
    expect(dizzyStars(OOPS_S)).toEqual([])
    const s = dizzyStars(0.1)
    expect(s).toHaveLength(3)
    for (const p of s) expect(((p.x - 32) / 13) ** 2 + ((p.y - 7) / 3.5) ** 2).toBeCloseTo(1, 9)
  })
  it('far side smaller and fainter; all fade out toward the end', () => {
    const s = dizzyStars(0.1), front = s.reduce((a, b) => (b.y > a.y ? b : a)), back = s.reduce((a, b) => (b.y < a.y ? b : a))
    expect(front.s).toBeGreaterThan(back.s)
    expect(front.o).toBeGreaterThan(back.o)
    expect(front.front).toBe(true)
    expect(back.front).toBe(false)
    const late = dizzyStars(OOPS_S * 0.99)
    expect(Math.max(...late.map((p) => p.o))).toBeLessThan(0.05)
  })
})

describe('face swap blink-through', () => {
  it('open, closes to 0.1 at the swap from both sides, reopens on the new face', () => {
    expect(faceSwap(0)).toEqual({ sy: 1, showNew: false })
    expect(faceSwap(SWAP_S * 0.5 - 1e-9).sy).toBeCloseTo(0.1, 6)
    expect(faceSwap(SWAP_S * 0.5 - 1e-9).showNew).toBe(false)
    expect(faceSwap(SWAP_S * 0.5).sy).toBeCloseTo(0.1, 12)
    expect(faceSwap(SWAP_S * 0.5).showNew).toBe(true)
    expect(faceSwap(SWAP_S)).toEqual({ sy: 1, showNew: true })
  })
  it('eyes never invert or overshoot', () => {
    for (let i = 0; i <= 100; i++) {
      const { sy } = faceSwap((i / 100) * SWAP_S)
      expect(sy).toBeGreaterThanOrEqual(0.1 - 1e-12)
      expect(sy).toBeLessThanOrEqual(1)
    }
  })
})

describe('reduced-motion still frames', () => {
  it('stars and sparks are visible at the still times (the cue survives without motion)', () => {
    const st = dizzyStars(STILL_DIZZY)
    expect(st).toHaveLength(3)
    expect(Math.min(...st.map((p) => p.o))).toBeGreaterThan(0.4)
    const sp = sparks(STILL_SPARK)
    expect(sp.length).toBeGreaterThan(0)
    expect(Math.min(...sp.map((p) => p.o))).toBeGreaterThan(0.5)
  })
})

describe('blink phase', () => {
  it('stable per id, inside one cycle, different for different ids', () => {
    expect(blinkDelay(':r1:')).toBe(blinkDelay(':r1:'))
    const ds = [':r0:', ':r1:', ':r2:', ':r3:', ':r4:'].map(blinkDelay)
    for (const d of ds) { expect(d).toBeLessThanOrEqual(0); expect(d).toBeGreaterThan(-BLINK_MS) }
    expect(new Set(ds).size).toBe(ds.length)
  })
  it('the CSS cycle is the same length and has a double blink with uneven gaps', () => {
    const css = readFileSync('src/anim/mascot.css', 'utf8')
    expect(css).toContain(`m-blink ${BLINK_MS / 1000}s`)
    const closed = /@keyframes m-blink[^}]*}[^}]*?([\d.%, ]+)\s*{\s*transform: scaleY\(0\.12\)/.exec(css)![1].split(',').map((x) => parseFloat(x))
    expect(closed.length).toBe(3)
    const gaps = closed.map((c, i) => ((closed[(i + 1) % 3] - c + 100) % 100) * BLINK_MS / 100)
    expect(Math.min(...gaps)).toBeLessThan(500) // the double blink
    expect(Math.max(...gaps)).toBeGreaterThan(4000)
  })
})

describe('entrance', () => {
  it('rolls in from the left, never backwards, speed falling to 0 at the stop, then settles at rest', async () => {
    const { enterPose, ENTER_D, ENTER_ROLL, ENTER_S } = await import('./mascot')
    expect(enterPose(0).x).toBe(-ENTER_D)
    let last = -Infinity
    for (let t = 0; t <= ENTER_ROLL; t += 0.01) { const x = enterPose(t).x!; expect(x).toBeGreaterThanOrEqual(last); last = x }
    const dt = 1e-4, v = (enterPose(ENTER_ROLL - dt).x! - enterPose(ENTER_ROLL - 2 * dt).x!) / dt
    expect(Math.abs(v)).toBeLessThan(0.05 * (2 * ENTER_D / ENTER_ROLL)) // < 5 % of the starting speed
    expect(Math.abs(enterPose(ENTER_ROLL + 0.05).rot)).toBeGreaterThan(1) // the brake jolt is visible
    expect(Math.abs(enterPose(ENTER_S).rot)).toBeLessThan(0.25)
    expect(enterPose(ENTER_S).x).toBe(0)
  })
})
