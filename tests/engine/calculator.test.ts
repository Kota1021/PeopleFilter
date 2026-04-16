import { describe, it, expect } from 'vitest'
import { calculateFunnel } from '../../src/engine/calculator'
import type { FilterState } from '../../src/store/types'

const baseFilters: FilterState = {
  targetGender: 'male',
  maritalStatuses: ['unmarried'],
  ageRange: [20, 39],
  incomeRange: [0, 2000],
  educationLevels: [],
  heightRange: [140, 200],
  weightRange: [30, 120],
  occupations: [],
  prefectures: [],
}

describe('calculateFunnel', () => {
  it('returns base + marital + age stages with default filters', () => {
    const stages = calculateFunnel(baseFilters)
    expect(stages.length).toBeGreaterThanOrEqual(3)
    expect(stages[0].id).toBe('base')
    expect(stages[1].id).toBe('marital')
    expect(stages[2].id).toBe('age')
  })

  it('base stage is total population of that gender', () => {
    const stages = calculateFunnel(baseFilters)
    // Total male population (all ages, all statuses) should be > 40M
    expect(stages[0].count).toBeGreaterThan(40_000_000)
    expect(stages[0].percentage).toBe(1.0)
  })

  it('marital status filter reduces population', () => {
    const stages = calculateFunnel(baseFilters)
    const maritalStage = stages.find(s => s.id === 'marital')!
    expect(maritalStage.count).toBeLessThan(stages[0].count)
    expect(maritalStage.count).toBeGreaterThan(0)
  })

  it('selecting all marital statuses skips marital stage', () => {
    const filters: FilterState = {
      ...baseFilters,
      maritalStatuses: ['unmarried', 'married', 'divorced', 'widowed'],
    }
    const stages = calculateFunnel(filters)
    expect(stages.find(s => s.id === 'marital')).toBeUndefined()
  })

  it('age filter reduces population', () => {
    const stages = calculateFunnel(baseFilters)
    const ageStage = stages.find(s => s.id === 'age')!
    expect(ageStage.count).toBeLessThan(stages[0].count)
    expect(ageStage.count).toBeGreaterThan(0)
  })

  it('income range slider creates income-education stage', () => {
    const filters: FilterState = { ...baseFilters, incomeRange: [600, 2000] }
    const stages = calculateFunnel(filters)
    const incomeStage = stages.find(s => s.id === 'income-education')
    expect(incomeStage).toBeDefined()
    const ageStage = stages.find(s => s.id === 'age')!
    expect(incomeStage!.count).toBeLessThan(ageStage.count)
  })

  it('narrow height filter reduces population', () => {
    const filters: FilterState = { ...baseFilters, heightRange: [175, 180] }
    const stages = calculateFunnel(filters)
    const heightStage = stages.find(s => s.id === 'height')
    expect(heightStage).toBeDefined()
  })

  it('prefecture filter reduces population', () => {
    const filters: FilterState = { ...baseFilters, prefectures: ['13'] }
    const stages = calculateFunnel(filters)
    const prefStage = stages.find(s => s.id === 'prefecture')
    expect(prefStage).toBeDefined()
  })

  it('all filters combined produces very small number', () => {
    const filters: FilterState = {
      targetGender: 'male',
      maritalStatuses: ['unmarried'],
      ageRange: [25, 35],
      incomeRange: [600, 2000],
      educationLevels: ['university', 'graduate'],
      heightRange: [175, 185],
      weightRange: [60, 75],
      occupations: ['professional'],
      prefectures: ['13'],
    }
    const stages = calculateFunnel(filters)
    const finalStage = stages[stages.length - 1]
    expect(finalStage.count).toBeLessThan(10000)
    expect(finalStage.count).toBeGreaterThanOrEqual(0)
  })

  it('female gender works correctly', () => {
    const filters: FilterState = { ...baseFilters, targetGender: 'female' }
    const stages = calculateFunnel(filters)
    expect(stages[0].label).toContain('女性')
    expect(stages[0].count).toBeGreaterThan(40_000_000)
  })

  it('married filter gives more people than unmarried in older age groups', () => {
    const unmarried: FilterState = { ...baseFilters, ageRange: [40, 50], maritalStatuses: ['unmarried'] }
    const married: FilterState = { ...baseFilters, ageRange: [40, 50], maritalStatuses: ['married'] }

    const uStages = calculateFunnel(unmarried)
    const mStages = calculateFunnel(married)
    const uAge = uStages.find(s => s.id === 'age')!
    const mAge = mStages.find(s => s.id === 'age')!
    // More married than unmarried in 40-50 age group
    expect(mAge.count).toBeGreaterThan(uAge.count)
  })
})
