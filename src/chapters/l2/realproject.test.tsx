import { spawnSync } from 'node:child_process'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { LEVEL2_CHAPTERS } from '.'
import RealProject from './RealProject'
import { REAL } from './realproject'

const REPO = process.env.TFE_REPO
const show = (file: string) => spawnSync('git', ['-C', REPO!, 'show', `origin/main:${file}`], { encoding: 'utf8' }).stdout.split('\n')

describe('from a real project (Level 2)', () => {
  it('every Level 2 chapter has a box, and no box is orphaned', () => {
    expect(Object.keys(REAL).sort()).toEqual(LEVEL2_CHAPTERS.map((c) => c.id).sort())
  })
  it.each(Object.keys(REAL))('%s renders EN and JA with its file:line links', (id) => {
    for (const l of ['en', 'ja'] as const) {
      const html = renderToStaticMarkup(<RealProject id={id} t={STRINGS[l]} />)
      for (const c of REAL[id].cites) expect(html).toContain(`blob/main/${c.file}#L${c.line}`)
    }
  })
  describe.skipIf(!REPO)('cited lines at origin/main hold what the box says (TFE_REPO)', () => {
    it.each(Object.entries(REAL).flatMap(([id, b]) => b.cites.map((c) => [id, c.file, c.line, c.needle] as const)))('%s: %s:%i', (_, file, line, needle) => {
      expect(show(file)[line - 1]).toContain(needle)
    })
    it('nodes: 4 own nodes started 9 s after launch; ws: 5 add_executable lines', () => {
      const launch = show('launch/tf_explorer.launch.py').join('\n')
      expect(launch).toContain('period=9.0')
      expect(launch.match(/for exe in \(([^)]*)\)/)![1].match(/'[a-z_]+'/g)!.length).toBe(4)
      expect(show('CMakeLists.txt').filter((x) => x.startsWith('add_executable(')).length).toBe(5)
    })
  })
})
