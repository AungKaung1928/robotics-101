import { expect, it } from 'vitest'

/** Curriculum rule: every new term is explained the first time it appears. A glossary term may not show up in the
 * text (learn + lines) of a chapter that comes before the chapter whose glossary defines it. Reading order below. */
const ORDER = ['decide', 'closest', 'callback', 'cpp', 'shell', 'nodes', 'topics', 'msgtypes', 'actions', 'params', 'ws', 'drive']
const mods = import.meta.glob(['../l1/*.strings.ts', '../l2/*.strings.ts'], { eager: true }) as Record<string, Record<string, { en?: Record<string, unknown> }>>
const by: Record<string, Record<string, unknown>> = {}
for (const [f, m] of Object.entries(mods)) for (const S of Object.values(m)) if (S?.en) by[f.split('/').pop()!.replace('.strings.ts', '')] = S.en

it('Level 1-2: no glossary term is used before the chapter that defines it', () => {
  expect(ORDER.filter((c) => !by[c])).toEqual([])
  const text = (c: string) => [by[c].learn, ...((by[c].lines as string[]) ?? [])].join(' ')
  const defined = new Map<string, number>()
  ORDER.forEach((c, i) => ((by[c].glossary as [string, string][]) ?? []).forEach(([k]) => { if (!defined.has(k)) defined.set(k, i) }))
  const early = [...defined].flatMap(([k, d]) => {
    const re = new RegExp(`(^|[^\\w])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\w]|$)`, 'i')
    const first = ORDER.findIndex((c) => re.test(text(c)))
    return first >= 0 && first < d ? [`${k}: used in ${ORDER[first]}, defined in ${ORDER[d]}`] : []
  })
  expect(early).toEqual([])
})
