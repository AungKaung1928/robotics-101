import { describe, expect, it } from 'vitest'
import { LEVELS, LEVEL_BODY } from './levels'
import { DOTS, GROWS_FROM, findChapter } from './path'

const order = LEVELS.flat().map((c) => c.id)

describe('path data', () => {
  it('every numbered chapter with its own page has dots 1-5', () => {
    for (const id of order.filter((id) => LEVEL_BODY[id])) expect(DOTS[id], id).toBeGreaterThanOrEqual(1)
    for (const v of Object.values(DOTS)) expect(v).toBeLessThanOrEqual(5)
  })
  it('dots never go down along the reading order', () => {
    const ids = order.filter((id) => id in DOTS)
    ids.forEach((id, i) => expect(DOTS[id], id).toBeGreaterThanOrEqual(DOTS[ids[i - 1]] ?? 1))
  })
  it('"you already know" points to an earlier chapter', () => {
    for (const [id, from] of Object.entries(GROWS_FROM)) expect(order.indexOf(from), `${id} <- ${from}`).toBeGreaterThanOrEqual(0)
    for (const [id, from] of Object.entries(GROWS_FROM)) expect(order.indexOf(from), `${id} <- ${from}`).toBeLessThan(order.indexOf(id))
  })
  it('findChapter gives number and route', () => {
    expect(findChapter('tf')).toMatchObject({ num: '3.3', href: '#/3/tf' })
    expect(findChapter('nope')).toBeNull()
  })
})

describe('older Level 3-4 chapters grow from Level 0', () => {
  it.each(['scan', 'tf', 'detect', 'grid', 'costmap', 'goal', 'bringup'])('%s: dots, a Level 0 "you already know" link, an intro line in EN and JA', async (id) => {
    const { STRINGS } = await import('../i18n')
    expect(DOTS[id]).toBeGreaterThanOrEqual(4)
    expect(findChapter(GROWS_FROM[id])?.num).toMatch(/^0\./)
    for (const l of ['en', 'ja'] as const) expect(STRINGS[l].levels.grows[id]?.length).toBeGreaterThan(20)
  })
})
