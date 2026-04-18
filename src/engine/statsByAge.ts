import type { AgeGroup } from './types'
import { AGE_GROUPS, ageGroupStart } from './types'
import populationData from '../data/population.json'
import incomeEducationData from '../data/income-education.json'
import heightWeightData from '../data/height-weight.json'
import smokingData from '../data/smoking.json'

type Gender = 'male' | 'female'

export interface AgePoint {
  ageStart: number
  ageEnd: number
  ageLabel: string
  male: number | null
  female: number | null
}

const INCOME_MIDPOINTS: Record<string, number> = {
  '~100': 50,
  '100-200': 150,
  '200-300': 250,
  '300-400': 350,
  '400-500': 450,
  '500-600': 550,
  '600-700': 650,
  '700-800': 750,
  '800-900': 850,
  '900-1000': 950,
  '1000-1500': 1250,
  '1500+': 1750,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(obj: any, ...keys: string[]): any {
  let current = obj
  for (const key of keys) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

function computeGroupAvgIncome(gender: Gender, group: AgeGroup): number | null {
  const marital = get(populationData, 'maritalStatus', gender, group)
  if (!marital) return null
  const unmarriedRatio: number = marital.unmarried ?? 0
  const marriedLikeRatio: number = (marital.married ?? 0) + (marital.divorced ?? 0) + (marital.widowed ?? 0)
  const totalRatio = unmarriedRatio + marriedLikeRatio
  if (totalRatio === 0) return null

  const eduDist = get(incomeEducationData, 'educationDistribution', gender, group)
  if (!eduDist) return null

  const unmarriedDist = get(incomeEducationData, 'distribution', gender, group)
  const marriedDist = get(incomeEducationData, 'distributionMarried', gender, group)

  let numerator = 0
  let denominator = 0

  const branches: Array<[Record<string, Record<string, number>> | undefined, number]> = [
    [unmarriedDist, unmarriedRatio / totalRatio],
    [marriedDist, marriedLikeRatio / totalRatio],
  ]

  for (const [dist, msWeight] of branches) {
    if (!dist || msWeight === 0) continue
    for (const [edu, eduWeightRaw] of Object.entries(eduDist)) {
      const eduWeight = eduWeightRaw as number
      const incomeDist = dist[edu]
      if (!incomeDist) continue
      for (const [incomeKey, probRaw] of Object.entries(incomeDist)) {
        const midpoint = INCOME_MIDPOINTS[incomeKey]
        if (midpoint == null) continue
        const weight = msWeight * eduWeight * (probRaw as number)
        numerator += weight * midpoint
        denominator += weight
      }
    }
  }

  if (denominator === 0) return null
  return numerator / denominator
}

const WORK_AGE_GROUPS: AgeGroup[] = [
  '20-24', '25-29', '30-34', '35-39', '40-44', '45-49',
  '50-54', '55-59', '60-64', '65-69',
]

export function averageIncomeByAge(): AgePoint[] {
  return WORK_AGE_GROUPS.map((group) => ({
    ageStart: ageGroupStart(group),
    ageEnd: ageGroupStart(group) + 4,
    ageLabel: group,
    male: computeGroupAvgIncome('male', group),
    female: computeGroupAvgIncome('female', group),
  }))
}

export function averageHeightByAge(): AgePoint[] {
  const result: AgePoint[] = []
  for (const group of AGE_GROUPS) {
    if (group === '0-4' || group === '5-9' || group === '10-14') continue
    const male = get(heightWeightData, 'male', group, 'height', 'mean') as number | undefined
    const female = get(heightWeightData, 'female', group, 'height', 'mean') as number | undefined
    result.push({
      ageStart: ageGroupStart(group),
      ageEnd: group === '80+' ? 89 : ageGroupStart(group) + 4,
      ageLabel: group,
      male: male ?? null,
      female: female ?? null,
    })
  }
  return result
}

export function smokingRateByAge(): AgePoint[] {
  const groups = smokingData.ageGroups as Record<string, { male: number; female: number }>
  return Object.entries(groups).map(([key, val]) => {
    const isOpenEnd = key === '70+'
    const start = isOpenEnd ? 70 : parseInt(key.split('-')[0])
    const end = isOpenEnd ? 79 : parseInt(key.split('-')[1])
    return {
      ageStart: start,
      ageEnd: end,
      ageLabel: isOpenEnd ? '70+' : `${start}-${end}`,
      male: val.male,
      female: val.female,
    }
  })
}
