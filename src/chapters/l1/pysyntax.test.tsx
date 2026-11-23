import { spawnSync } from 'node:child_process'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import BfsChapter from '../ep/BfsChapter'
import LateChapter from '../ep/LateChapter'
import { BODIES } from '../l2/bodies'
import { BASE, closestOf, readings } from './closest'

const hasPython = spawnSync('python3', ['--version']).status === 0
const ALL = { ...BODIES, bfs: BfsChapter, late: LateChapter }
/** Python blocks of a page, as the reader sees them (one line per span.ln, tags and entities removed). */
const pythonOf = (html: string) => [...html.matchAll(/<pre class="code"[^>]*aria-label="Python"[^>]*>([\s\S]*?)<\/pre>/g)].map(([, pre]) =>
  pre.replace(/<\/span><span class="ln[^"]*">/g, '\n').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
const py = (src: string, input = '') => spawnSync('python3', ['-I', '-c', src], { input, encoding: 'utf8' })

describe.skipIf(!hasPython)('Python shown on Level 1-2 + EP pages', () => {
  it('finds the Python blocks (6 pages show Python)', () => {
    const withPy = Object.entries(ALL).filter(([, Body]) => pythonOf(renderToStaticMarkup(<Body t={STRINGS.en} />)).length).map(([id]) => id).sort()
    expect(withPy).toEqual(['actions', 'bfs', 'callback', 'closest', 'decide', 'late'])
  })

  it.each(Object.entries(ALL))('%s: every Python block compiles', (_, Body) => {
    for (const code of pythonOf(renderToStaticMarkup(<Body t={STRINGS.en} />))) {
      const r = py('import sys; compile(sys.stdin.read(), "page", "exec")', code)
      expect(r.stderr, code).toBe('')
    }
  })

  it('1.2 def closest as shown returns the model value for the box at each beam', () => {
    const [code] = pythonOf(renderToStaticMarkup(<BODIES.closest t={STRINGS.en} />))
    const rs = BASE.map((_, i) => readings(i))
    const r = py(`import sys, json\nexec(sys.stdin.read())\nprint(json.dumps([closest(r) for r in ${JSON.stringify(rs)}]))`, code)
    expect(r.stderr, code).toBe('')
    expect(JSON.parse(r.stdout)).toEqual(rs.map((x) => closestOf(x)))
  })
  it('1.2 real-scan note, run on the shown Python: inf (nothing in range) never wins, -inf (too close) does', () => {
    const [code] = pythonOf(renderToStaticMarkup(<BODIES.closest t={STRINGS.en} />))
    const scans = [[1.2, Infinity, 0.8, Infinity], [Infinity, Infinity], [1.2, -Infinity, 0.8]]
    const lit = (x: number) => (x === Infinity ? 'float("inf")' : x === -Infinity ? 'float("-inf")' : String(x))
    const r = py(`exec(${JSON.stringify(code)})\nfor s in [${scans.map((sc) => `[${sc.map(lit).join(', ')}]`).join(', ')}]: print(repr(closest(s)))`)
    expect(r.stderr, code).toBe('')
    expect(r.stdout.trim().split('\n')).toEqual(['0.8', 'inf', '-inf'])
    expect(scans.map((sc) => closestOf(sc))).toEqual([0.8, Infinity, -Infinity])
  })
})
