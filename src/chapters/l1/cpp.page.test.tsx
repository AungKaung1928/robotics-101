import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { DECLS, compile, line } from './cpp'
import CppChapter from './CppChapter'

const hasGpp = spawnSync('g++', ['--version']).status === 0
const dir = hasGpp ? mkdtempSync(join(tmpdir(), 'r101-cpppage-')) : ''
afterAll(() => { if (dir) rmSync(dir, { recursive: true, force: true }) })

/** The C++ block of page 1.4 as rendered (error line excluded); its first line is the declaration the stepper picks. */
const shown = () => {
  const pre = renderToStaticMarkup(<CppChapter t={STRINGS.en} />).match(/<pre class="code" aria-label="C\+\+">([\s\S]*?)<\/pre>/)![1]
  return [...pre.matchAll(/<span class="ln( on)?">([\s\S]*?)<\/span>(?=<span class="ln|$)/g)].map((m) => m[2].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&amp;/g, '&'))
}

describe.skipIf(!hasGpp)('1.4 C++ as shown on the page compiles and decides like the model', () => {
  it('rendered block = declaration + the 1.1 if/else', () => {
    const lines = shown()
    expect(lines[0]).toBe(line('double'))
    expect(lines.join('\n')).toContain('if (distance < stop_at) {')
  })
  it.each(DECLS)('%s: compiles exactly when the model says; at distance 0.4 it stops only if stop_at kept 0.5', (d) => {
    const body = [line(d), ...shown().slice(1)].join('\n')
    const src = join(dir, `${d.replace(/\W/g, '_')}.cpp`)
    writeFileSync(src, `#include <iostream>\nint main() {\n  double distance = 0.4, speed = -1;\n${body}\n  std::cout << speed << std::endl;\n}\n`)
    const cc = spawnSync('g++', ['-std=c++17', '-Wall', '-o', src + '.bin', src], { encoding: 'utf8' })
    const want = compile(d)
    expect(cc.status === 0, cc.stderr).toBe(want.ok)
    if (!want.ok) return
    const out = Number(spawnSync(src + '.bin', { encoding: 'utf8' }).stdout.trim())
    expect(out).toBe(0.4 < want.value! ? 0 : 0.26)
  })
})
