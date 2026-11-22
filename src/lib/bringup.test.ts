import { describe, expect, it } from 'vitest'
import { STAGES, earlyStarts, type StageId } from './bringup'

const base = () => Object.fromEntries(STAGES.map((s) => [s.id, s.t])) as Record<StageId, number>
describe('bring-up order', () => {
  it("his launch file's delays start nothing early", () => {
    expect(earlyStarts(base())).toEqual([])
  })
  it('Nav2 before SLAM: no map frame yet', () => {
    expect(earlyStarts({ ...base(), nav2: 5 })).toEqual([['nav2', 'slam']])
  })
  it('the same start time is a race: flagged', () => {
    expect(earlyStarts({ ...base(), nav2: 8 })).toEqual([['nav2', 'slam']])
  })
  it('SLAM before the robot exists breaks SLAM, and not its dependents while they still start after it', () => {
    expect(earlyStarts({ ...base(), slam: 1 })).toEqual([['slam', 'spawn']])
  })
})

import { startOrder } from './bringup'
describe('startOrder', () => {
  it('his delays: gazebo, spawn, slam, detector, nav2, rviz, patrol', () => {
    expect(startOrder(base())).toEqual(['gazebo', 'spawn', 'slam', 'detector', 'nav2', 'rviz', 'patrol'])
  })
  it('Nav2 moved to 5 s comes before SLAM; a tie keeps file order', () => {
    expect(startOrder({ ...base(), nav2: 5 }).slice(2, 4)).toEqual(['nav2', 'slam'])
    expect(startOrder({ ...base(), nav2: 8 }).slice(2, 4)).toEqual(['slam', 'nav2'])
  })
})
