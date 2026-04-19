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

  it('uses 2015→2020 cohort tracking for male 25-29 (≈28.7%)', () => {
    // (2015 u[25-29] 0.727 − 2020 u[30-34] 0.518) / 0.727 = 28.75%
    const p = data.find((d) => d.ageLabel === '25-29')!
    expect(p.male!).toBeCloseTo(28.75, 1)
  })

  it('cohort tracking deflates male 40-44 from ~10% (断面) to ~0% (実態整合)', () => {
    // (2015 u[40-44] 0.300 − 2020 u[45-49] 0.300) / 0.300 = 0%
    // 中高年の結婚確率は実測でほぼゼロ。世代効果が結婚シグナルを偽装していた。
    const p = data.find((d) => d.ageLabel === '40-44')!
    expect(p.male!).toBeLessThan(3)
  })

  it('women in 20s have higher 5-year marriage probability than men', () => {
    const m20s = data.find((d) => d.ageLabel === '20-24')!
    const m25s = data.find((d) => d.ageLabel === '25-29')!
    expect(m20s.female!).toBeGreaterThan(m20s.male!)
    expect(m25s.female!).toBeGreaterThan(m25s.male!)
  })
})
