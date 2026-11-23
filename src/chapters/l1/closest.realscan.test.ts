import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import ClosestChapter from './ClosestChapter'
import { LIDAR } from '../../content/world'
import { decide } from './decide'
import { closestOf } from './closest'
import { CLOSEST_STRINGS } from './closest.strings'

/** 1.2 "real scan" note. REP 117 (Final): out of range = +Inf, too close = -Inf; Gazebo Harmonic masks this way
 * (gz-sensors8 GpuLidarSensor.cc:201-202). Range limits: LIDAR (xacro:181-182). */
describe('1.2 on a real scan (inf and -inf)', () => {
  it('a beam that sees nothing (+inf) never replaces closest; a too-close beam (-inf) wins, and 1.1 reads it as stop', () => {
    expect(closestOf([1.2, Infinity, 0.8, Infinity])).toBe(0.8)
    expect(closestOf([Infinity, Infinity])).toBe(Infinity)
    expect(closestOf([1.2, -Infinity, 0.8])).toBe(-Infinity)
    expect(decide(-Infinity, 0.5)).toBe('stop')
  })
  it.each(['en', 'ja'] as const)('%s: names both limits and REP 117, rendered from the strings file', (l) => {
    const n = CLOSEST_STRINGS[l].realScan
    for (const w of [`${LIDAR.maxRange} m`, `${Math.round(LIDAR.minRange * 100)} cm`, 'REP 117', 'inf', '-inf', '1.1']) expect(n).toContain(w)
    const html = renderToStaticMarkup(createElement(ClosestChapter, { t: STRINGS[l] }))
    expect(html).toContain('data-k="real-scan"')
    expect(html).toContain('rep-0117.rst')
  })
})
