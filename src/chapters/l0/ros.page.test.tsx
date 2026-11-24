import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import RosChapter from './RosChapter'

const html = (t = STRINGS.en) => renderToStaticMarkup(<RosChapter t={t} />)

describe('0.4 ros page (review: open at today, not at 2020 with "0 supported")', () => {
  it('first view = today: the 4 distros getting fixes, counted out of the ones drawn', () => {
    const h = html()
    expect(h).toMatch(/data-k="live">Humble · Jazzy · Kilted · Lyrical</)
    expect(h).toContain('2026-11: 4 of the 6 shown get fixes')
    expect(h).not.toContain('2020-01')
  })
  it('every bar shows its Ubuntu version; the install table lists Jazzy, Lyrical, Humble with Gazebo pair and end month', () => {
    const h = html()
    for (const u of ['ROS 1 · 20.04', 'LTS · 22.04', '>22.04<', 'LTS · 24.04', '>24.04<', 'LTS · 26.04']) expect(h).toContain(u)
    const table = h.slice(h.indexOf('data-k="install"'))
    expect(table).toMatch(/Jazzy<\/td><td>24\.04<\/td><td>Harmonic<\/td><td>2029-05/)
    expect(table).toMatch(/Lyrical<\/td><td>26\.04<\/td><td>Jetty<\/td><td>2031-05/)
    expect(table).toMatch(/Humble<\/td><td>22\.04<\/td><td>Fortress<\/td><td>2027-05/)
  })
  it('the old wording is gone: no "This app uses Humble", no "crash stops everything"', () => {
    const h = html()
    expect(h).not.toContain('This app uses Humble')
    expect(h).not.toContain('stops everything')
    expect(html(STRINGS.ja)).toContain('2026年11月')
  })
})
