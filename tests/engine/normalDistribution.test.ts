import { describe, it, expect } from 'vitest'
import { normalCDF, normalRangeProbability } from '../../src/engine/normalDistribution'

describe('normalCDF', () => {
  it('returns 0.5 for z=0', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 5)
  })

  it('returns ~0.8413 for z=1', () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3)
  })

  it('returns ~0.1587 for z=-1', () => {
    expect(normalCDF(-1)).toBeCloseTo(0.1587, 3)
  })

  it('returns ~0.9772 for z=2', () => {
    expect(normalCDF(2)).toBeCloseTo(0.9772, 3)
  })

  it('returns near 1 for large positive z', () => {
    expect(normalCDF(5)).toBeGreaterThan(0.999)
  })

  it('returns near 0 for large negative z', () => {
    expect(normalCDF(-5)).toBeLessThan(0.001)
  })
})

describe('normalRangeProbability', () => {
  it('returns ~0.6827 for mean ± 1 SD', () => {
    const prob = normalRangeProbability(90, 110, 100, 10)
    expect(prob).toBeCloseTo(0.6827, 3)
  })

  it('returns ~0.9545 for mean ± 2 SD', () => {
    const prob = normalRangeProbability(80, 120, 100, 10)
    expect(prob).toBeCloseTo(0.9545, 3)
  })

  it('returns 0 for inverted range', () => {
    const prob = normalRangeProbability(120, 80, 100, 10)
    expect(prob).toBe(0)
  })

  it('returns 0 for sd <= 0', () => {
    expect(normalRangeProbability(90, 110, 100, 0)).toBe(0)
    expect(normalRangeProbability(90, 110, 100, -5)).toBe(0)
  })

  it('height example: P(170<=H<=180) for male 25-29 (mean=171.5, sd=5.8)', () => {
    const prob = normalRangeProbability(170, 180, 171.5, 5.8)
    // Should be roughly 50-55%
    expect(prob).toBeGreaterThan(0.4)
    expect(prob).toBeLessThan(0.65)
  })
})
