import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Vite bundles every imported stylesheet globally, so a class that leads a rule in two files styles both pages.
 * (Found twice: the anim figures' .late and .bfs rules hit the EP pages' own .late / .bfs.) Level 1-2 and EP
 * stylesheets must not lead with a class that any other stylesheet also leads with.
 */
const SRC = fileURLToPath(new URL('../../', import.meta.url))
const MINE = ['chapters/l1/l1.css', 'chapters/l2/l2.css', 'chapters/ep/ep.css']
const leading = (file: string) => {
  const css = readFileSync(join(SRC, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const out = new Set<string>()
  for (const [, sel] of css.matchAll(/([^{}@]+)\{/g)) for (const part of sel.split(',')) {
    const m = part.trim().match(/^\.([\w-]+)/)
    if (m) out.add(m[1])
  }
  return out
}
const all = (readdirSync(SRC, { recursive: true }) as string[]).map((f) => relative(SRC, join(SRC, f))).filter((f) => f.endsWith('.css'))

describe('Level 1-2 + EP stylesheets share no leading class with other stylesheets', () => {
  it.each(MINE)('%s', (file) => {
    const mine = leading(file)
    const clashes = all.filter((o) => !MINE.includes(o)).flatMap((o) => [...leading(o)].filter((c) => mine.has(c)).map((c) => `.${c} (${o})`))
    expect(clashes).toEqual([])
  })
})
