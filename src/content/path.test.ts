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
    expect(findChapter('tf')).toMatchObject({ num: '3.2', href: '#/3/tf' })
    expect(findChapter('nope')).toBeNull()
  })
})
