import { describe, expect, it } from 'vitest'
import { keyTarget, parseRoute, routeParam, routeStep } from './route'

describe('parseRoute', () => {
  it('opens built chapters, with or without a step suffix', () => {
    expect(parseRoute('#/scan')).toEqual({ page: 'chapter', id: 'scan' })
    expect(parseRoute('#/costmap/2')).toEqual({ page: 'chapter', id: 'costmap' })
    expect(parseRoute('#/4/grid')).toEqual({ page: 'chapter', id: 'grid' })
    expect(parseRoute('#/3/scan?t=0.1')).toEqual({ page: 'chapter', id: 'scan' })
    expect(parseRoute('#/7')).toEqual({ page: 'overview' })
  })
  it('falls back to the overview', () => {
    for (const h of ['', '#/', '#/nope']) expect(parseRoute(h)).toEqual({ page: 'overview' })
  })
})
describe('routeStep', () => {
  it('reads a 1-based step, clamps it, defaults to the last', () => {
    expect(routeStep('#/bringup/3', 7)).toBe(2)
    expect(routeStep('#/4/bringup/3', 7)).toBe(2)
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
describe('keyTarget', () => {
  it('number keys jump to that waypoint; other keys do nothing', () => {
    expect(keyTarget('5')).toBe('grid')
    expect(keyTarget('1')).toBe('bringup')
    expect(keyTarget('8')).toBeNull()
    expect(keyTarget('0')).toBeNull()
    expect(keyTarget('ArrowRight')).toBeNull()
  })
})
