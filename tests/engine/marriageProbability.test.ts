import { describe, it, expect } from 'vitest'
import { marriageProbabilityByAge } from '../../src/engine/statsByAge'

describe('marriageProbabilityByAge', () => {
  const data = marriageProbabilityByAge()

  it('covers 15-19 through 50-54', () => {
    const labels = data.map((p) => p.ageLabel)
    expect(labels).toEqual([
      '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54',
    ])
  })

  it('is 0 at the terminal (50-54) group', () => {
    const terminal = data.find((p) => p.ageLabel === '50-54')!
    expect(terminal.male).toBeCloseTo(0, 5)
    expect(terminal.female).toBeCloseTo(0, 5)
  })

  it('declines monotonically with age for both genders', () => {
    for (let i = 1; i < data.length; i++) {
      expect(data[i].male!).toBeLessThanOrEqual(data[i - 1].male! + 1e-9)
      expect(data[i].female!).toBeLessThanOrEqual(data[i - 1].female! + 1e-9)
    }
  })

  it('stays within [0, 100]', () => {
    for (const p of data) {
      expect(p.male!).toBeGreaterThanOrEqual(0)
      expect(p.male!).toBeLessThanOrEqual(100)
      expect(p.female!).toBeGreaterThanOrEqual(0)
      expect(p.female!).toBeLessThanOrEqual(100)
    }
  })

  it('women at 20-24 are more likely to ever-marry than men at the same age', () => {
    // Because women's unmarried rate is already lower at 20-24 (118 pts married
    // vs. men's 24 pts), the conditional "future marriage" probability for women
    // currently unmarried ends up higher than for men at the same age.
    const p = data.find((d) => d.ageLabel === '20-24')!
    expect(p.female!).toBeGreaterThan(p.male!)
  })
})
