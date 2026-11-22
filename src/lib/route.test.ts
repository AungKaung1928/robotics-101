import { describe, expect, it } from 'vitest'
import { neighbour, parseRoute, routeParam, routeStep } from './route'

describe('parseRoute', () => {
  it('opens built chapters, with or without a step suffix', () => {
    expect(parseRoute('#/scan')).toEqual({ page: 'chapter', id: 'scan' })
    expect(parseRoute('#/costmap/2')).toEqual({ page: 'chapter', id: 'costmap' })
  })
  it('falls back to the overview', () => {
    for (const h of ['', '#/', '#/nope']) expect(parseRoute(h)).toEqual({ page: 'overview' })
  })
})
describe('routeStep', () => {
  it('reads a 1-based step, clamps it, defaults to the last', () => {
    expect(routeStep('#/bringup/3', 7)).toBe(2)
    expect(routeStep('#/bringup/99', 7)).toBe(6)
    expect(routeStep('#/bringup', 7)).toBe(6)
    expect(routeStep('#/bringup/0', 7)).toBe(6)
  })
})
describe('routeParam', () => {
  it('reads, clamps, falls back', () => {
    expect(parseRoute('#/tf?jump=0.6')).toEqual({ page: 'chapter', id: 'tf' })
    expect(routeParam('#/tf?jump=0.6', 'jump', 0.1, 0, 1)).toBe(0.6)
    expect(routeParam('#/tf?jump=9', 'jump', 0.1, 0, 1)).toBe(1)
    expect(routeParam('#/tf?jump=x', 'jump', 0.1, 0, 1)).toBe(0.1)
    expect(routeParam('#/tf', 'jump', 0.1, 0, 1)).toBe(0.1)
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
