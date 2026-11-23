import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// A motion rule written after the reduced-motion block (same specificity) wins over it and moves anyway.
const files = ['src/anim', 'src/scenarios'].flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.css')).map((f) => join(d, f)))

describe('reduced motion comes last', () => {
  it.each(files)('%s: nothing that animates follows the prefers-reduced-motion block', (f) => {
    const css = readFileSync(f, 'utf8')
    const at = css.lastIndexOf('@media (prefers-reduced-motion: reduce)')
    const after = at < 0 ? '' : css.slice(css.indexOf('\n', at) < 0 ? css.length : css.indexOf('\n', at))
    expect(after).not.toMatch(/animation|transition|transform/)
  })
  it('every file that animates has the block', () => {
    for (const f of files) {
      const css = readFileSync(f, 'utf8')
      if (/animation:|transition:/.test(css)) expect(css, f).toContain('prefers-reduced-motion: reduce')
    }
  })
})
