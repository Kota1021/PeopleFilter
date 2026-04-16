import { describe, it, expect } from 'vitest'
import { calculateFunnel } from '../../src/engine/calculator'
import type { FilterState } from '../../src/store/types'

const baseFilters: FilterState = {
  targetGender: 'male',
  ageRange: [20, 39],
  incomeRanges: [],
  educationLevels: [],
  heightRange: [140, 200],
  weightRange: [30, 120],
  occupations: [],
  prefectures: [],
}

describe('calculateFunnel', () => {
  it('returns at least 2 stages (base + age) with default filters', () => {
    const stages = calculateFunnel(baseFilters)
    expect(stages.length).toBeGreaterThanOrEqual(2)
    expect(stages[0].id).toBe('base')
    expect(stages[1].id).toBe('age')
  })

  it('base stage is total unmarried population', () => {
    const stages = calculateFunnel(baseFilters)
    expect(stages[0].count).toBeGreaterThan(10_000_000) // > 10 million unmarried males
    expect(stages[0].percentage).toBe(1.0)
  })

  it('age filter reduces population', () => {
    const stages = calculateFunnel(baseFilters)
    expect(stages[1].count).toBeLessThan(stages[0].count)
    expect(stages[1].count).toBeGreaterThan(0)
  })

  it('adding income filter creates income-education stage', () => {
    const filters: FilterState = { ...baseFilters, incomeRanges: ['600-700', '700-800', '800-900', '900-1000', '1000-1500', '1500+'] }
    const stages = calculateFunnel(filters)
    const incomeStage = stages.find(s => s.id === 'income-education')
    expect(incomeStage).toBeDefined()
    expect(incomeStage!.count).toBeLessThan(stages[1].count)
  })

  it('adding education filter creates income-education stage', () => {
    const filters: FilterState = { ...baseFilters, educationLevels: ['university', 'graduate'] }
    const stages = calculateFunnel(filters)
    const eduStage = stages.find(s => s.id === 'income-education')
    expect(eduStage).toBeDefined()
  })

  it('narrow height filter reduces population', () => {
    const filters: FilterState = { ...baseFilters, heightRange: [175, 180] }
    const stages = calculateFunnel(filters)
    const heightStage = stages.find(s => s.id === 'height')
    expect(heightStage).toBeDefined()
    expect(heightStage!.count).toBeLessThan(stages[1].count)
  })

  it('prefecture filter reduces population', () => {
    const filters: FilterState = { ...baseFilters, prefectures: ['13'] } // Tokyo
    const stages = calculateFunnel(filters)
    const prefStage = stages.find(s => s.id === 'prefecture')
    expect(prefStage).toBeDefined()
    expect(prefStage!.count).toBeLessThan(stages[1].count)
  })

  it('all filters combined produces very small number', () => {
    const filters: FilterState = {
      targetGender: 'male',
      ageRange: [25, 35],
      incomeRanges: ['600-700', '700-800', '800-900', '900-1000', '1000-1500', '1500+'],
      educationLevels: ['university', 'graduate'],
      heightRange: [175, 185],
      weightRange: [60, 75],
      occupations: ['professional'],
      prefectures: ['13'],
    }
    const stages = calculateFunnel(filters)
    const finalStage = stages[stages.length - 1]
    // With all these strict filters, the result should be very small
    expect(finalStage.count).toBeLessThan(10000)
    expect(finalStage.count).toBeGreaterThanOrEqual(0)
  })

  it('female gender works correctly', () => {
    const filters: FilterState = { ...baseFilters, targetGender: 'female' }
    const stages = calculateFunnel(filters)
    expect(stages[0].label).toContain('女性')
    expect(stages[0].count).toBeGreaterThan(5_000_000) // > 5 million unmarried females
  })

  it('percentages are always between 0 and 1', () => {
    const filters: FilterState = {
      ...baseFilters,
      incomeRanges: ['400-500', '500-600'],
      heightRange: [165, 180],
    }
    const stages = calculateFunnel(filters)
    for (const stage of stages) {
      expect(stage.percentage).toBeGreaterThanOrEqual(0)
      expect(stage.percentage).toBeLessThanOrEqual(1)
    }
  })
})
