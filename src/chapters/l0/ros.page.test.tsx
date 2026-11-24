import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import RosChapter from './RosChapter'
import { ROS_STRINGS } from './ros.strings'

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
    const tags = [...h.slice(0, h.indexOf('data-k="install"')).matchAll(/<text class="tag"[^>]*>([^<]*)</g)].map((m) => m[1])
    expect(tags).toEqual(['ROS 1 · 20.04', 'LTS · 22.04', '22.04', 'LTS · 24.04', '24.04', 'LTS · 26.04'])
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
  it('JA: the same install rows with JA end months; fix-it names Jazzy in both languages', () => {
    const ja = html(STRINGS.ja)
    const table = ja.slice(ja.indexOf('data-k="install"'))
    expect(table).toMatch(/Jazzy<\/td><td>24\.04<\/td><td>Harmonic<\/td><td>2029年5月/)
    expect(table).toMatch(/Lyrical<\/td><td>26\.04<\/td><td>Jetty<\/td><td>2031年5月/)
    expect(table).toMatch(/Humble<\/td><td>22\.04<\/td><td>Fortress<\/td><td>2027年5月/)
    expect(ROS_STRINGS.en.fixIt).toContain('Jazzy')
    expect(ROS_STRINGS.ja.fixIt).toContain('Jazzy')
  })
})
