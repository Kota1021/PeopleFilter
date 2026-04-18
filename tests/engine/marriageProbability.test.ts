import { describe, it, expect } from 'vitest'
import { marriageProbabilityByAge } from '../../src/engine/statsByAge'

describe('marriageProbabilityByAge (5年先確率)', () => {
  const data = marriageProbabilityByAge()

  it('covers 15-19 through 45-49', () => {
    const labels = data.map((p) => p.ageLabel)
    expect(labels).toEqual([
      '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49',
    ])
  })

  it('stays within [0, 100]', () => {
    for (const p of data) {
      expect(p.male!).toBeGreaterThanOrEqual(0)
      expect(p.male!).toBeLessThanOrEqual(100)
      expect(p.female!).toBeGreaterThanOrEqual(0)
      expect(p.female!).toBeLessThanOrEqual(100)
    }
  })

  it('peaks at 25-29 for both genders (結婚ピーク世代)', () => {
    const peakMale = data.find((d) => d.ageLabel === '25-29')!.male!
    const peakFemale = data.find((d) => d.ageLabel === '25-29')!.female!
    for (const p of data) {
      if (p.ageLabel !== '25-29') {
        expect(p.male!).toBeLessThanOrEqual(peakMale + 1e-9)
        expect(p.female!).toBeLessThanOrEqual(peakFemale + 1e-9)
      }
    }
  })

  it('matches the reference article formula for male 25-29 (≈33.5%)', () => {
    // (0.761 - 0.506) / 0.761 = 33.51%
    // konkatsu-ane.com cites 35.41% for 25歳 male (2015→2020 cohort-tracked);
    // our 断面 approximation is expected to be within a few points.
    const p = data.find((d) => d.ageLabel === '25-29')!
    expect(p.male!).toBeCloseTo(33.51, 1)
  })

  it('matches the reference article formula for male 40-44 (≈16.6%)', () => {
    // (0.277 - 0.231) / 0.277 = 16.61%
    const p = data.find((d) => d.ageLabel === '40-44')!
    expect(p.male!).toBeCloseTo(16.61, 1)
  })

  it('women in 20s have higher 5-year marriage probability than men', () => {
    const m20s = data.find((d) => d.ageLabel === '20-24')!
    const m25s = data.find((d) => d.ageLabel === '25-29')!
    expect(m20s.female!).toBeGreaterThan(m20s.male!)
    expect(m25s.female!).toBeGreaterThan(m25s.male!)
  })
})
