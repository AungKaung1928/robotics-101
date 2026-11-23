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
