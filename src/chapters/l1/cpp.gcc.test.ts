import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { DECLS, GCC_ERROR, compile, line } from './cpp'

const gpp = spawnSync('g++', ['--version'], { encoding: 'utf8' })
const hasGpp = gpp.status === 0
const dir = hasGpp ? mkdtempSync(join(tmpdir(), 'r101-cpp-')) : ''
afterAll(() => { if (dir) rmSync(dir, { recursive: true, force: true }) })

/** Compile each declaration the page shows with real g++ (-std=c++17 -Wall) and run it: the page's model must agree. */
describe.skipIf(!hasGpp)('1.4 page C++ == real g++', () => {
  it.each(DECLS)('%s', (d) => {
    const src = join(dir, `${d.replace(/\W/g, '_')}.cpp`), bin = src.replace(/\.cpp$/, '')
    writeFileSync(src, `#include <iostream>\nint main() {\n  ${line(d)}\n  std::cout << stop_at << std::endl;\n}\n`)
    const cc = spawnSync('g++', ['-std=c++17', '-Wall', '-o', bin, src], { encoding: 'utf8' })
    const want = compile(d)
    expect(cc.status === 0).toBe(want.ok)
    if (!want.ok) {
      // exact text is g++ 11's (the version the page quotes); other versions word it differently
      expect(cc.stderr).toContain(/\s11\.\d/.test(gpp.stdout.split('\n')[0]) ? GCC_ERROR : 'narrowing conversion')
      return
    }
    expect(cc.stderr).toBe('') // int = 0.5 compiles with no warning even under -Wall
    expect(Number(spawnSync(bin, { encoding: 'utf8' }).stdout.trim())).toBe(want.value)
  })
})
