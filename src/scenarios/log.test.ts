import { describe, expect, it } from 'vitest'
import { STAGES, startOrder } from '../lib/bringup'
import { rowStates } from './log'

describe('rowStates', () => {
  it('marks done / now / later around the playhead', () => {
    expect(rowStates([0, 3, 8], -1)).toEqual(['later', 'later', 'later'])
    expect(rowStates([0, 3, 8], 0)).toEqual(['now', 'later', 'later'])
    expect(rowStates([0, 3, 8], 5)).toEqual(['done', 'now', 'later'])
    expect(rowStates([0, 3, 8], 8)).toEqual(['done', 'done', 'now'])
  })
  it('bring-up launch at 9 s: gazebo, spawn, slam done, detector now, nav2 / rviz / patrol later', () => {
    const times = Object.fromEntries(STAGES.map((s) => [s.id, s.t])) as Record<(typeof STAGES)[number]['id'], number>
    const order = startOrder(times)
    const st = rowStates(order.map((id) => times[id]), 9)
    expect(Object.fromEntries(order.map((id, i) => [id, st[i]]))).toEqual({
      gazebo: 'done', spawn: 'done', slam: 'done', detector: 'now', nav2: 'later', rviz: 'later', patrol: 'later',
    })
  })
})
