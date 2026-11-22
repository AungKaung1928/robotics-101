import { describe, expect, it } from 'vitest'
import { castRay } from '../lib/scan'
import { OBSTACLES, WAYPOINTS } from './world'

describe('overview patrol path', () => {
  it('no path segment runs through an obstacle', () => {
    WAYPOINTS.forEach((a, i) => {
      const b = WAYPOINTS[(i + 1) % WAYPOINTS.length]
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const yaw = Math.atan2(b.y - a.y, b.x - a.x)
      // A ray from a towards b that hits an obstacle before reaching b means the segment crosses it.
      expect(castRay({ x: a.x, y: a.y, yaw }, 0, OBSTACLES, 0, len), `segment ${i + 1}→${((i + 1) % 7) + 1}`).toBe(Infinity)
    })
  })
})
