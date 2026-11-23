import { describe, expect, it } from 'vitest'
import { BROKEN, CHOICES, apply, diagnose, healthy } from './tflab'

describe('TF lab model (same setups as test_tf_lab_missing_link.cpp)', () => {
  it('BrokenChainReportsMapToBaseLinkMissing: map->odom OK, both pairs through base_link MISSING', () => {
    expect(diagnose(BROKEN)).toEqual({ 'map->odom': 'OK', 'odom->base_link': 'MISSING', 'map->base_link': 'MISSING' })
  })
  it('FixedChainReportsMapToBaseLinkHealthy: sending odom->base_link heals every pair', () => {
    expect(diagnose(apply(BROKEN, 'odom'))).toEqual({ 'map->odom': 'OK', 'odom->base_link': 'OK', 'map->base_link': 'OK' })
  })
  it('only the odom broadcaster fixes it; restarting the detector or resending map->odom does not', () => {
    expect(CHOICES.filter((c) => healthy(apply(BROKEN, c)))).toEqual(['odom'])
  })
  it('nothing broadcast: every pair MISSING', () => {
    expect(Object.values(diagnose([]))).toEqual(['MISSING', 'MISSING', 'MISSING'])
  })
})

describe('second failure: STALE (tf_anomaly_detector.cpp:10, :63)', async () => {
  const { MAX_AGE, TURN, HITS, MOUNT, WALL_X, ageStatus } = await import('./tflab')
  const { staleYaw, toMap, wallResidual } = await import('../../scenarios/tflab')
  it('STALE only above 1.0 s (strict >, as the C++)', () => {
    expect(MAX_AGE).toBe(1.0)
    expect([0, 0.5, 1.0, 1.1].map(ageStatus)).toEqual(['OK', 'OK', 'OK', 'STALE'])
  })
  it('a fresh transform puts every hit on the wall', () => {
    expect(wallResidual(toMap({ x: 0, y: 0, yaw: 0 }, MOUNT, HITS), WALL_X)).toBeLessThan(1e-12)
  })
  it('0.3 s old while turning: the detector still says OK, the hits are already > 1 cm off the wall', () => {
    const off = wallResidual(toMap({ x: 0, y: 0, yaw: 0 }, { ...MOUNT, yaw: staleYaw(TURN, 0.3) }, HITS), WALL_X)
    expect(ageStatus(0.3)).toBe('OK')
    expect(off).toBeGreaterThan(0.01)
  })
})
