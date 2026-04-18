import type { AgeGroup } from './types'
import { AGE_GROUPS, ageGroupStart } from './types'
import { normalCDF } from './normalDistribution'
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
  '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54',
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

export interface IncomeBandPoint {
  band: string
  label: string
  lower: number
  upper: number
  male: number
  female: number
}

const INCOME_BANDS: Array<{ key: string; label: string; lower: number; upper: number }> = [
  { key: '~100', label: '〜100', lower: 0, upper: 100 },
  { key: '100-200', label: '100-200', lower: 100, upper: 200 },
  { key: '200-300', label: '200-300', lower: 200, upper: 300 },
  { key: '300-400', label: '300-400', lower: 300, upper: 400 },
  { key: '400-500', label: '400-500', lower: 400, upper: 500 },
  { key: '500-600', label: '500-600', lower: 500, upper: 600 },
  { key: '600-700', label: '600-700', lower: 600, upper: 700 },
  { key: '700-800', label: '700-800', lower: 700, upper: 800 },
  { key: '800-900', label: '800-900', lower: 800, upper: 900 },
  { key: '900-1000', label: '900-1000', lower: 900, upper: 1000 },
  { key: '1000-1500', label: '1000-1500', lower: 1000, upper: 1500 },
  { key: '1500+', label: '1500+', lower: 1500, upper: 2000 },
]

function groupInRange(group: AgeGroup, range: [number, number]): boolean {
  const start = ageGroupStart(group)
  const end = group === '80+' ? 89 : start + 4
  return end >= range[0] && start <= range[1]
}

export const INCOME_AGE_RANGE = { min: 20, max: 54 }

export function incomeDistributionByAge(ageRange: [number, number]): IncomeBandPoint[] {
  const groups = WORK_AGE_GROUPS.filter((g) => groupInRange(g, ageRange))

  const computeByGender = (gender: Gender) => {
    const counts: Record<string, number> = {}
    let total = 0
    for (const group of groups) {
      const totalPop = get(populationData, 'total', gender, group) as number | undefined
      const marital = get(populationData, 'maritalStatus', gender, group)
      const eduDist = get(incomeEducationData, 'educationDistribution', gender, group)
      if (!totalPop || !marital || !eduDist) continue

      const branches: Array<[string, number]> = [
        ['unmarried', marital.unmarried ?? 0],
        ['married', (marital.married ?? 0) + (marital.divorced ?? 0) + (marital.widowed ?? 0)],
      ]

      for (const [msKey, msRatio] of branches) {
        if (msRatio === 0) continue
        const distKey = msKey === 'unmarried' ? 'distribution' : 'distributionMarried'
        const dist = get(incomeEducationData, distKey, gender, group)
        const empRate = get(incomeEducationData, 'employmentRate', msKey, gender, group) as number | undefined
        if (!dist || empRate == null) continue

        for (const [edu, eduWeightRaw] of Object.entries(eduDist)) {
          const eduWeight = eduWeightRaw as number
          const incomeDist = dist[edu]
          if (!incomeDist) continue
          for (const [band, probRaw] of Object.entries(incomeDist)) {
            const count = totalPop * msRatio * empRate * eduWeight * (probRaw as number)
            counts[band] = (counts[band] ?? 0) + count
            total += count
          }
        }
      }
    }
    return { counts, total }
  }

  const male = computeByGender('male')
  const female = computeByGender('female')

  return INCOME_BANDS.map(({ key, label, lower, upper }) => ({
    band: key,
    label,
    lower,
    upper,
    male: male.total > 0 ? (male.counts[key] ?? 0) / male.total : 0,
    female: female.total > 0 ? (female.counts[key] ?? 0) / female.total : 0,
  }))
}

export interface CDFPoint {
  x: number
  male: number
  female: number
}

const INCOME_CDF_THRESHOLDS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000]

export function incomeCDFByAge(ageRange: [number, number]): CDFPoint[] {
  const bands = incomeDistributionByAge(ageRange)
  return INCOME_CDF_THRESHOLDS.map((t) => {
    let male = 0
    let female = 0
    for (const b of bands) {
      if (b.lower >= t) {
        male += b.male
        female += b.female
      }
    }
    return { x: t, male: male * 100, female: female * 100 }
  })
}

export const HEIGHT_AGE_RANGE = { min: 15, max: 89 }
const HEIGHT_CDF_THRESHOLDS = [140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200]

const ALL_ADULT_GROUPS: AgeGroup[] = [
  '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49',
  '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80+',
]

export function heightCDFByAge(ageRange: [number, number]): CDFPoint[] {
  const groups = ALL_ADULT_GROUPS.filter((g) => groupInRange(g, ageRange))

  const tailProbForGender = (gender: Gender, threshold: number): number => {
    let weightedSum = 0
    let totalPop = 0
    for (const group of groups) {
      const pop = get(populationData, 'total', gender, group) as number | undefined
      const mean = get(heightWeightData, gender, group, 'height', 'mean') as number | undefined
      const sd = get(heightWeightData, gender, group, 'height', 'sd') as number | undefined
      if (!pop || mean == null || sd == null || sd <= 0) continue
      const z = (threshold - mean) / sd
      const tailProb = 1 - normalCDF(z)
      weightedSum += pop * tailProb
      totalPop += pop
    }
    return totalPop > 0 ? weightedSum / totalPop : 0
  }

  return HEIGHT_CDF_THRESHOLDS.map((t) => ({
    x: t,
    male: tailProbForGender('male', t) * 100,
    female: tailProbForGender('female', t) * 100,
  }))
}

// 現在未婚の人が「50-54歳までに一度でも結婚する」確率を年齢階級別に算出。
// 分母は current 未婚率、分子は「50-54歳より上回っている部分」。
// 50歳時点の未婚率は生涯未婚率の代理指標として社会統計で用いられる。
const MARRIAGE_AGE_GROUPS: AgeGroup[] = [
  '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54',
]
const MARRIAGE_TERMINAL_GROUP: AgeGroup = '50-54'

export function marriageProbabilityByAge(): AgePoint[] {
  const maleTerminal = get(populationData, 'maritalStatus', 'male', MARRIAGE_TERMINAL_GROUP, 'unmarried') as number
  const femaleTerminal = get(populationData, 'maritalStatus', 'female', MARRIAGE_TERMINAL_GROUP, 'unmarried') as number

  const probFor = (gender: Gender, group: AgeGroup, terminal: number): number | null => {
    const unmarried = get(populationData, 'maritalStatus', gender, group, 'unmarried') as number | undefined
    if (unmarried == null || unmarried <= 0) return null
    return Math.max(0, (unmarried - terminal) / unmarried) * 100
  }

  return MARRIAGE_AGE_GROUPS.map((group) => ({
    ageStart: ageGroupStart(group),
    ageEnd: ageGroupStart(group) + 4,
    ageLabel: group,
    male: probFor('male', group, maleTerminal),
    female: probFor('female', group, femaleTerminal),
  }))
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
