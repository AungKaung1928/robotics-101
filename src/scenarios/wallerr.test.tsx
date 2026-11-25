import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { P, run } from '../chapters/l3/wall'
import { STRINGS } from '../i18n'
import WallChapter from '../chapters/l3/WallChapter'
import { wallErr } from './wallerr'

describe('3.2 wall error bar', () => {
  it('no look-ahead: error = d - 0.5 m, the point sits on the robot', () => {
    expect(wallErr(1, 0.3, 0)).toEqual({ dAhead: 1, ahead: 0, err: 1 - P.desired })
  })
  it('heading into the wall shortens the look-ahead distance: the error turns early', () => {
    const e = wallErr(0.6, 0.4, P.lookahead)
    expect(e.dAhead).toBeLessThan(0.6); expect(e.err).toBeCloseTo(0.6 - P.lookahead * Math.sin(0.4) - 0.5, 12)
  })
  it('the run settles: |error| at the end of the default run is under 2 cm', () => {
    const k = run(P.kp).at(-1)!
    expect(Math.abs(wallErr(k.d, k.alpha, P.lookahead).err)).toBeLessThan(0.02)
  })
  it('chapter draws the error bar and look-ahead point', () => {
    const html = renderToStaticMarkup(<WallChapter t={STRINGS.en} />)
    expect(html).toContain('class="wall-err"'); expect(html).toContain('class="wall-ahead"')
  })
})
