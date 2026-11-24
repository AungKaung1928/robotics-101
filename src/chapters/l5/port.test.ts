import { describe, expect, it } from 'vitest'
import { HALF, LDS, citeParts, cppIndex, pyIndex, validRange } from './port'
import { PORT_STRINGS } from './port.strings'

const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k]))

describe('5.1 port model (wall_follower_controller.py:142-143 vs wall_detector.cpp:24-29)', () => {
  it('LDS-01 layout: front = ray 0, left = 90, right (−90°) = 270, back = 180', () => {
    expect([0, 90, -90, 180].map((d) => pyIndex(LDS, d))).toEqual([0, 90, 270, 180])
  })
  it('−π layout: front = ray 180, right (−90°) = 90', () => {
    expect([0, -90].map((d) => pyIndex(HALF, d))).toEqual([180, 90])
  })
  it('with the wrap lines the C++ index equals Python for every whole degree, both layouts', () => {
    for (const s of [LDS, HALF]) for (let d = -180; d <= 180; d++) expect(cppIndex(s, d).idx).toBe(pyIndex(s, d))
  })
  it('without them, −90° on LDS-01: offset −π/2, index wraps to 2^64 − 90, which is ray 286, not 270 (g++ 17, x86-64: same 18446744073709551526 and 286)', () => {
    const c = cppIndex(LDS, -90, false)
    expect(c.offset).toBeCloseTo(-Math.PI / 2, 12)
    expect(c.raw).toBe((1n << 64n) - 90n)
    expect(c.idx).toBe(Number(((1n << 64n) - 90n) % 360n))
    expect(c.idx).toBe(286)
  })
  it('the bug hides: every bearing ≥ 0 on LDS-01 and every bearing on the −π layout still agree', () => {
    for (let d = 0; d <= 180; d++) expect(cppIndex(LDS, d, false).idx).toBe(pyIndex(LDS, d))
    for (let d = -180; d <= 180; d++) expect(cppIndex(HALF, d, false).idx).toBe(pyIndex(HALF, d))
  })
  it('validRange: NaN, ±inf, ≤ 0.12 and ≥ 3.5 → inf; 1.0 stays', () => {
    expect([NaN, Infinity, -Infinity, 0.12, 0.05, 3.5, 1.0].map((r) => validRange(r))).toEqual([Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, 1.0])
  })
  it('EN and JA have the same keys and the same glossary terms', () => {
    expect(keys(PORT_STRINGS.ja)).toEqual(keys(PORT_STRINGS.en))
    expect(PORT_STRINGS.ja.glossary.map((g) => g[0])).toEqual(PORT_STRINGS.en.glossary.map((g) => g[0]))
  })
})

describe('citeParts (the line range must not wrap away from its colon)', () => {
  it('splits path and line range', () => {
    expect(citeParts('wall_following_project/wall_follower_controller.py#L141-L143')).toEqual(['wall_following_project/wall_follower_controller.py', ':141-143'])
    expect(citeParts('.github/workflows/ci.yml#L12-L13')).toEqual(['.github/workflows/ci.yml', ':12-13'])
    expect(citeParts('src/a.cpp#L7')).toEqual(['src/a.cpp', ':7'])
    expect(citeParts('README.md')).toEqual(['README.md', ''])
  })
})
