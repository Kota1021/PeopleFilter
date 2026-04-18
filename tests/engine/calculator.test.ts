import { describe, it, expect } from 'vitest'
import { calculateFunnel, compatibilityCoefficient } from '../../src/engine/calculator'
import type { Compatibility, FilterState } from '../../src/store/types'

const baseFilters: FilterState = {
  genders: ['male'],
  maritalStatuses: ['unmarried'],
  ageRange: [20, 39],
  incomeRange: [0, 2000],
  educationLevels: [],
  heightRange: [140, 200],
  weightRange: [30, 120],
  occupations: [],
  prefectures: [],
  childrenDesire: 'any',
  smokingPref: 'any',
  drinkingPref: 'any',
  compatibility: { looks: 0, money: 0, personality: 0, food: 0, values: 0, lifestyle: 0 },
}

describe('calculateFunnel', () => {
  it('returns base + marital + age stages with default filters', () => {
    const stages = calculateFunnel(baseFilters)
    expect(stages.length).toBeGreaterThanOrEqual(3)
    expect(stages[0].id).toBe('base')
    expect(stages[1].id).toBe('marital')
    expect(stages[2].id).toBe('age')
  })

  it('base stage is total population of selected gender', () => {
    const stages = calculateFunnel(baseFilters)
    expect(stages[0].count).toBeGreaterThan(40_000_000)
    expect(stages[0].percentage).toBe(1.0)
  })

  it('both genders selected gives larger base', () => {
    const both: FilterState = { ...baseFilters, genders: ['male', 'female'] }
    const maleOnly: FilterState = { ...baseFilters, genders: ['male'] }
    const bothStages = calculateFunnel(both)
    const maleStages = calculateFunnel(maleOnly)
    expect(bothStages[0].count).toBeGreaterThan(maleStages[0].count)
    expect(bothStages[0].label).toContain('総人口')
  })

  it('single gender shows gendered label', () => {
    const stages = calculateFunnel(baseFilters)
    expect(stages[0].label).toContain('男性')

    const femaleFilters: FilterState = { ...baseFilters, genders: ['female'] }
    const fStages = calculateFunnel(femaleFilters)
    expect(fStages[0].label).toContain('女性')
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

  it('income range slider creates income-education stage', () => {
    const filters: FilterState = { ...baseFilters, incomeRange: [600, 2000] }
    const stages = calculateFunnel(filters)
    const incomeStage = stages.find(s => s.id === 'income-education')
    expect(incomeStage).toBeDefined()
    const ageStage = stages.find(s => s.id === 'age')!
    expect(incomeStage!.count).toBeLessThan(ageStage.count)
  })

  it('all filters combined produces very small number', () => {
    const filters: FilterState = {
      ...baseFilters,
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

  it('married filter gives more people than unmarried in older age groups', () => {
    const unmarried: FilterState = { ...baseFilters, ageRange: [40, 50], maritalStatuses: ['unmarried'] }
    const married: FilterState = { ...baseFilters, ageRange: [40, 50], maritalStatuses: ['married'] }

    const uStages = calculateFunnel(unmarried)
    const mStages = calculateFunnel(married)
    const uAge = uStages.find(s => s.id === 'age')!
    const mAge = mStages.find(s => s.id === 'age')!
    expect(mAge.count).toBeGreaterThan(uAge.count)
  })

  it('married men with high income filter pass at higher rate than unmarried', () => {
    const base = { ...baseFilters, genders: ['male'] as ('male' | 'female')[], ageRange: [30, 44] as [number, number] }
    const unmarried: FilterState = { ...base, maritalStatuses: ['unmarried'], incomeRange: [600, 2000] }
    const married: FilterState = { ...base, maritalStatuses: ['married'], incomeRange: [600, 2000] }

    const uStages = calculateFunnel(unmarried)
    const mStages = calculateFunnel(married)
    const uIncome = uStages.find(s => s.id === 'income-education')!
    const mIncome = mStages.find(s => s.id === 'income-education')!
    // Married men should have a higher proportion passing 600万+ income filter
    const uAge = uStages.find(s => s.id === 'age')!
    const mAge = mStages.find(s => s.id === 'age')!
    const uRate = uIncome.count / uAge.count
    const mRate = mIncome.count / mAge.count
    expect(mRate).toBeGreaterThan(uRate)
  })

  it('non-smoker filter reduces count and is stronger for men (higher smoker rate)', () => {
    const menBase: FilterState = { ...baseFilters, genders: ['male'] }
    const womenBase: FilterState = { ...baseFilters, genders: ['female'] }
    const menWith: FilterState = { ...menBase, smokingPref: 'nonsmoker' }
    const womenWith: FilterState = { ...womenBase, smokingPref: 'nonsmoker' }

    const menWithStages = calculateFunnel(menWith)
    const menSmokingStage = menWithStages.find(s => s.id === 'smoking')!
    expect(menSmokingStage).toBeDefined()

    const menAge = calculateFunnel(menBase).find(s => s.id === 'age')!
    const womenAge = calculateFunnel(womenBase).find(s => s.id === 'age')!
    const menWithFinal = menSmokingStage.count / menAge.count
    const womenWithFinal = calculateFunnel(womenWith).find(s => s.id === 'smoking')!.count / womenAge.count
    // Male non-smoker share is lower than female → filter reduces men more
    expect(menWithFinal).toBeLessThan(womenWithFinal)
  })

  it('children-desire "no" is more selective than "want" for 20s', () => {
    const want: FilterState = { ...baseFilters, childrenDesire: 'want' }
    const no: FilterState = { ...baseFilters, childrenDesire: 'no' }
    const wantFinal = calculateFunnel(want).find(s => s.id === 'children-desire')!
    const noFinal = calculateFunnel(no).find(s => s.id === 'children-desire')!
    expect(noFinal.count).toBeLessThan(wantFinal.count)
  })

  it('drinking "none" is more selective than "light"', () => {
    const light: FilterState = { ...baseFilters, drinkingPref: 'light' }
    const none: FilterState = { ...baseFilters, drinkingPref: 'none' }
    const lightFinal = calculateFunnel(light).find(s => s.id === 'drinking')!
    const noneFinal = calculateFunnel(none).find(s => s.id === 'drinking')!
    expect(noneFinal.count).toBeLessThan(lightFinal.count)
  })

  it('lifestyle filters have no effect on under-20 age ranges (no data)', () => {
    const base: FilterState = { ...baseFilters, ageRange: [15, 19] }
    const withFilter: FilterState = {
      ...base,
      smokingPref: 'nonsmoker',
      drinkingPref: 'none',
      childrenDesire: 'want',
    }
    const baseAge = calculateFunnel(base).find(s => s.id === 'age')!
    const filteredStages = calculateFunnel(withFilter)
    const smoking = filteredStages.find(s => s.id === 'smoking')!
    const drinking = filteredStages.find(s => s.id === 'drinking')!
    const children = filteredStages.find(s => s.id === 'children-desire')!
    expect(smoking.count).toBe(baseAge.count)
    expect(drinking.count).toBe(baseAge.count)
    expect(children.count).toBe(baseAge.count)
  })

  it('compatibility coefficient stage only appears when at least one slider > 0', () => {
    const zeroCompat = calculateFunnel(baseFilters)
    expect(zeroCompat.find(s => s.id === 'compatibility')).toBeUndefined()

    const withCompat: FilterState = {
      ...baseFilters,
      compatibility: { ...baseFilters.compatibility, looks: 3 },
    }
    const stages = calculateFunnel(withCompat)
    const compat = stages.find(s => s.id === 'compatibility')!
    expect(compat).toBeDefined()
    const prev = stages[stages.length - 2]
    expect(compat.count).toBeLessThan(prev.count)
  })
})

describe('compatibilityCoefficient', () => {
  const zero: Compatibility = { looks: 0, money: 0, personality: 0, food: 0, values: 0, lifestyle: 0 }

  it('returns 1.0 when all axes are 0', () => {
    expect(compatibilityCoefficient(zero)).toBe(1)
  })

  it('is strictly decreasing as any axis rises', () => {
    const a = compatibilityCoefficient({ ...zero, looks: 1 })
    const b = compatibilityCoefficient({ ...zero, looks: 2 })
    const c = compatibilityCoefficient({ ...zero, looks: 5 })
    expect(a).toBeGreaterThan(b)
    expect(b).toBeGreaterThan(c)
    expect(c).toBeGreaterThan(0)
  })

  it('maps 0/1/2/3/4/5 to 1.0/0.7/0.5/0.3/0.15/0.05 on a single axis', () => {
    expect(compatibilityCoefficient({ ...zero, looks: 0 })).toBeCloseTo(1.0, 5)
    expect(compatibilityCoefficient({ ...zero, looks: 1 })).toBeCloseTo(0.7, 5)
    expect(compatibilityCoefficient({ ...zero, looks: 2 })).toBeCloseTo(0.5, 5)
    expect(compatibilityCoefficient({ ...zero, looks: 3 })).toBeCloseTo(0.3, 5)
    expect(compatibilityCoefficient({ ...zero, looks: 4 })).toBeCloseTo(0.15, 5)
    expect(compatibilityCoefficient({ ...zero, looks: 5 })).toBeCloseTo(0.05, 5)
  })

  it('multiplies across axes', () => {
    const both: Compatibility = { ...zero, looks: 2, money: 2 }
    expect(compatibilityCoefficient(both)).toBeCloseTo(0.25, 5)
  })
})
