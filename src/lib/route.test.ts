import { describe, expect, it } from 'vitest'
import { neighbour, parseRoute } from './route'

describe('parseRoute', () => {
  it('opens built chapters, with or without a step suffix', () => {
    expect(parseRoute('#/scan')).toEqual({ page: 'chapter', id: 'scan' })
    expect(parseRoute('#/costmap/2')).toEqual({ page: 'chapter', id: 'costmap' })
  })
  it('falls back to the overview', () => {
    for (const h of ['', '#/', '#/nope']) expect(parseRoute(h)).toEqual({ page: 'overview' })
  })
})
describe('neighbour', () => {
  it('walks built chapters only and stops at the ends', () => {
    expect(neighbour('scan', 1)).toBe('detect')
    expect(neighbour('detect', 1)).toBe('grid')
    expect(neighbour('grid', 1)).toBe('costmap')
    expect(neighbour('scan', -1)).toBe('tf')
    expect(neighbour('tf', -1)).toBe('bringup')
    expect(neighbour('bringup', -1)).toBeNull()
    expect(neighbour('costmap', 1)).toBe('goal')
    expect(neighbour('goal', 1)).toBeNull()
  })
})
