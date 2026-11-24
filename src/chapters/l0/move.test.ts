import { describe, expect, it } from 'vitest'
import { LEFT, SLIP, TOP_SPEED, VIEW, WHEEL_GAP_M, body, kind, path, turnsPerS } from './move'
import { slipText } from './MoveChapter'
import { MOVE_STRINGS } from './move.strings'
import MY from '../../i18n/my/l0.move.MOVE_STRINGS.json'

describe('move model', () => {
  it('same speed = straight line, length = speed x time', () => {
    const p = path(LEFT, LEFT, 4)
    expect(kind(LEFT, LEFT)).toBe('straight')
    expect(p.at(-1)!.x).toBeCloseTo(0.6)
    expect(p.at(-1)!.y).toBeCloseTo(0)
  })
  it('right wheel faster = curve to the left (y grows), slower = to the right', () => {
    expect(kind(LEFT, 0.22)).toBe('curveLeft')
    expect(path(LEFT, 0.22).at(-1)!.y).toBeGreaterThan(0)
    expect(kind(LEFT, 0.05)).toBe('curveRight')
    expect(path(LEFT, 0.05).at(-1)!.y).toBeLessThan(0)
  })
  it('opposite speeds = spin on the spot: the centre never moves', () => {
    expect(kind(LEFT, -LEFT)).toBe('spin')
    for (const q of path(LEFT, -LEFT)) expect(Math.hypot(q.x, q.y)).toBeLessThan(1e-9)
    expect(body(LEFT, -LEFT).w).toBeCloseTo(-1.875) // 0.3 / 0.16 rad/s, clockwise
  })
  it('break it: the left wheel slips, so equal commands still curve left by themselves', () => {
    expect(kind(LEFT * SLIP, LEFT)).toBe('curveLeft')
    expect(path(LEFT, LEFT, 4, SLIP).at(-1)!.y).toBeGreaterThan(0.1)
  })
  it('a curve keeps a constant distance from its centre (exact arc)', () => {
    const { v, w } = body(LEFT, 0.22)
    const R = v / w
    for (const q of path(LEFT, 0.22)) expect(Math.hypot(q.x, q.y - R)).toBeCloseTo(Math.abs(R), 9)
  })
  it('top speed 0.22 m/s on a 3.3 cm wheel is about one turn per second', () => {
    expect(turnsPerS(TOP_SPEED)).toBeCloseTo(1.06, 2)
  })
  it('every slider value (with and without slip) keeps the robot inside the figure', () => {
    const margin = 30 // body radius + wheel
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (let r = -TOP_SPEED; r <= TOP_SPEED + 1e-9; r += 0.01) for (const sl of [1, SLIP]) for (const q of path(LEFT, r, 4, sl)) {
      const x = VIEW.ox + q.x * VIEW.px, y = VIEW.oy - q.y * VIEW.px
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
    expect(x0).toBeGreaterThan(margin); expect(x1).toBeLessThan(VIEW.w - margin)
    expect(y0).toBeGreaterThan(margin); expect(y1).toBeLessThan(VIEW.h - margin)
  })
  it('slip: effective left speed = commanded x SLIP; the signed turn rate rises by the same amount at every right-wheel speed', () => {
    expect(LEFT * SLIP).toBeCloseTo(0.075)
    for (let r = -TOP_SPEED; r <= TOP_SPEED + 1e-9; r += 0.01) {
      expect(body(LEFT * SLIP, r).w - body(LEFT, r).w).toBeCloseTo((LEFT * (1 - SLIP)) / WHEEL_GAP_M)
      expect(body(LEFT * SLIP, r).w).toBeGreaterThan(body(LEFT, r).w)
    }
  })
  it('spin needs opposite speeds of the SAME size: on the 0.01 slider grid only right = -0.15 spins', () => {
    const spins: number[] = []
    for (let i = -22; i <= 22; i++) if (kind(LEFT, i / 100) === 'spin') spins.push(i / 100)
    expect(spins).toEqual([-LEFT])
    expect(kind(LEFT, -0.1)).toBe('curveRight') // opposite but smaller: the middle moves forward
  })
  it('break-it sentence uses the actual values and direction (EN + JA), no slot left unfilled', () => {
    const en = MOVE_STRINGS.en
    expect(slipText(en, 0.15)).toBe('Both wheels are commanded to move at 0.15 m/s. On the wet floor, the left side advances at 0.075 m/s, so the robot turns left.')
    expect(slipText(en, 0.2)).toBe('The left wheel is commanded to move forward at 0.15 m/s, the right wheel forward at 0.20 m/s. On the wet floor, the left side advances at 0.075 m/s, so the robot turns left.')
    expect(slipText(en, 0.05)).toMatch(/right wheel forward at 0\.05 m\/s\..*so the robot turns right\.$/)
    expect(slipText(en, 0.075)).toMatch(/so the robot drives straight\.$/)
    expect(slipText(en, -0.15)).toBe('The left wheel is commanded to move forward at 0.15 m/s, the right wheel backward at 0.15 m/s. On the wet floor, the left side advances at 0.075 m/s, so the robot turns right.')
    expect(slipText(en, -0.075)).toMatch(/backward at 0\.08 m\/s|backward at 0\.07 m\/s/)
    expect(slipText(en, -0.075)).toMatch(/so the robot spins in place\.$/)
    for (let i = -22; i <= 22; i++) for (const l of ['en', 'ja'] as const) expect(slipText(MOVE_STRINGS[l], i / 100)).not.toMatch(/[{}]/)
  })
  it('right wheel at 0.00 m/s is "stopped" in EN/JA/MY, never "forward at 0.00"; the sign boundaries either side keep their direction', () => {
    const my = MY as unknown as typeof MOVE_STRINGS.en
    expect(slipText(MOVE_STRINGS.en, 0)).toBe('The left wheel is commanded to move forward at 0.15 m/s, the right wheel is stopped (0.00 m/s). On the wet floor, the left side advances at 0.075 m/s, so the robot turns right.')
    expect(slipText(MOVE_STRINGS.ja, 0)).toBe('左の車輪には前へ 0.15 m/s で進むよう命じ、右の車輪は止めている (0.00 m/s)。ぬれた床では、左側は 0.075 m/s しか進まないので、ロボットは右へ曲がる。')
    expect(slipText(my, 0)).toBe('ဘယ်ဘက်ဘီးကို ရှေ့သို့ 0.15 m/s နဲ့ ရွေ့ဖို့ ခိုင်းထားပြီး ညာဘက်ဘီးကို ရပ်ထားပါတယ် (0.00 m/s)။ စိုစွတ်နေတဲ့ ကြမ်းပြင်ပေါ်မှာ ဘယ်ဘက်က 0.075 m/s ပဲ ရွေ့တာမို့ စက်ရုပ်က ညာဘက်ကို ကွေ့ပါတယ်။')
    for (const v of [0, -0, 0.004, -0.004]) expect(slipText(MOVE_STRINGS.en, v)).toMatch(/right wheel is stopped \(0\.00 m\/s\)/)
    expect(slipText(MOVE_STRINGS.en, 0.01)).toMatch(/right wheel forward at 0\.01 m\/s/)
    expect(slipText(MOVE_STRINGS.en, -0.01)).toMatch(/right wheel backward at 0\.01 m\/s/)
    for (let i = -22; i <= 22; i++) expect(slipText(MOVE_STRINGS.en, i / 100)).not.toMatch(/(forward|backward) at 0\.00/)
    // JA/MY: the direction word never sits next to 0.00, and at 0.00 the stop template is used
    for (const [l, s] of [['ja', MOVE_STRINGS.ja], ['my', my]] as const) for (let i = -22; i <= 22; i++) {
      const t = slipText(s, i / 100)
      for (const d of Object.values(s.dir)) expect(t, l).not.toContain(`${d} 0.00`)
      if (i === 0) expect(t, l).toContain(s.slipStop.split('{told} m/s')[1].split(' ({right}')[0])
    }
  })
  it('Burmese break-it sentence, equal and unequal commands, rendered: verb ending and ။ join with no space, no slot left', () => {
    const my = MY as unknown as typeof MOVE_STRINGS.en
    expect(slipText(my, 0.15)).toBe('ဘီးနှစ်ခုလုံးကို 0.15 m/s နဲ့ ရွေ့ဖို့ ခိုင်းထားပါတယ်။ စိုစွတ်နေတဲ့ ကြမ်းပြင်ပေါ်မှာ ဘယ်ဘက်က 0.075 m/s ပဲ ရွေ့တာမို့ စက်ရုပ်က ဘယ်ဘက်ကို ကွေ့ပါတယ်။')
    expect(slipText(my, 0.05)).toMatch(/ညာဘက်ဘီးကို ရှေ့သို့ 0\.05 m\/s .*စက်ရုပ်က ညာဘက်ကို ကွေ့ပါတယ်။$/)
    for (let i = -22; i <= 22; i++) {
      const t = slipText(my, i / 100)
      expect(t).not.toMatch(/[{}]|\s[။၊]|\s+ပါတယ်/)
      expect(t).toMatch(/ပါတယ်။$/)
    }
  })
})
