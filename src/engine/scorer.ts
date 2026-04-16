import type { FilterState, Gender } from '../store/types'
import type { SelfState } from '../store/selfStore'
import type { AgeGroup } from './types'
import { AGE_GROUPS, ageGroupStart, ageGroupEnd } from './types'
import { normalCDF } from './normalDistribution'
import populationData from '../data/population.json'
import incomeEducationData from '../data/income-education.json'
import heightWeightData from '../data/height-weight.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(obj: any, ...keys: string[]): any {
  let current = obj
  for (const key of keys) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

export interface ScoreCriterion {
  id: string
  label: string
  value: string
  percentile: number // 0-100, higher = more "desirable"
  tier: string
}

export interface ScoreResult {
  criteria: ScoreCriterion[]
  compositePercentile: number
  tier: string
  tierLabel: string
}

function percentileToTier(p: number): { tier: string; label: string } {
  if (p >= 95) return { tier: 'S', label: '超激レア' }
  if (p >= 80) return { tier: 'A', label: '激レア' }
  if (p >= 60) return { tier: 'B', label: 'レア' }
  if (p >= 40) return { tier: 'C', label: 'ふつう' }
  if (p >= 20) return { tier: 'D', label: 'よくいる' }
  return { tier: 'E', label: 'ありふれた' }
}

/**
 * Age score: 18歳 = 100%, older = lower.
 * Based on cumulative population share — what % of the 18+ population is this age or older.
 * Being younger → higher percentile.
 */
function scoreAge(age: number, genders: Gender[]): number {
  if (age < 18) return 100

  let totalPop18Plus = 0
  let popOlderOrEqual = 0

  for (const gender of genders) {
    for (const group of AGE_GROUPS) {
      const start = ageGroupStart(group)
      const end = ageGroupEnd(group)
      if (end < 18) continue
      const pop: number = get(populationData, 'total', gender, group) ?? 0
      // Adjust for partial overlap with 18+
      const effectiveStart = Math.max(start, 18)
      const span = end - effectiveStart + 1
      const groupSpan = end - start + 1
      const effectivePop = pop * (span / groupSpan)
      totalPop18Plus += effectivePop

      // Population at this age or older
      if (start >= age) {
        popOlderOrEqual += effectivePop
      } else if (end >= age) {
        const olderSpan = end - age + 1
        popOlderOrEqual += pop * (olderSpan / groupSpan)
      }
    }
  }

  return totalPop18Plus > 0 ? (popOlderOrEqual / totalPop18Plus) * 100 : 50
}

/**
 * Education score: 院卒 > 大卒 > 専門 > 短大・高専 > 高卒 > 中卒
 * Percentile = what fraction of 25-39歳 population has this level or lower.
 * Based on 国勢調査2020 educationDistribution (25-39歳平均):
 *   中学卒 ~4%, 高卒 ~24%, 専門 ~13%, 短大高専 ~7%, 大卒 ~42%, 院卒 ~8%
 * Cumulative from bottom: 中卒4 → 高卒28 → 専門41 → 短大48 → 大卒90 → 院卒98
 */
function scoreEducation(levels: string[]): number {
  if (levels.length === 0) return -1 // not filtered

  const tierMap: Record<string, number> = {
    junior_high: 4,
    high_school: 28,
    vocational: 48,
    junior_college: 55,
    university: 90,
    graduate: 97,
  }

  // Take the highest level selected (for partner search: lowest selected = worst case)
  let maxScore = 0
  for (const level of levels) {
    maxScore = Math.max(maxScore, tierMap[level] ?? 50)
  }
  return maxScore
}

/**
 * Height score: taller = higher percentile.
 * Uses normal CDF across selected genders.
 */
function scoreHeight(height: number, genders: Gender[]): number {
  // Weighted average CDF across typical age groups (25-44)
  const ageGroups: AgeGroup[] = ['25-29', '30-34', '35-39', '40-44']
  let totalWeight = 0
  let weightedCdf = 0

  for (const gender of genders) {
    for (const group of ageGroups) {
      const mean: number = get(heightWeightData, gender, group, 'height', 'mean') ?? 170
      const sd: number = get(heightWeightData, gender, group, 'height', 'sd') ?? 6
      const pop: number = get(populationData, 'total', gender, group) ?? 1
      const cdf = normalCDF((height - mean) / sd)
      weightedCdf += pop * cdf
      totalWeight += pop
    }
  }

  return totalWeight > 0 ? (weightedCdf / totalWeight) * 100 : 50
}

/**
 * BMI score: Normal weight (18.5-25) = best, then underweight, then obese.
 * Uses a bell-curve-like scoring centered on BMI 22 (ideal).
 */
function scoreBMI(weight: number, height: number): number {
  const heightM = height / 100
  const bmi = weight / (heightM * heightM)

  // Ideal BMI = 22, score drops as you move away
  // Normal range 18.5-25 → high score
  // Underweight < 18.5 → medium score
  // Overweight 25-30 → medium-low
  // Obese 30+ → low
  if (bmi >= 18.5 && bmi <= 25) {
    // Within normal: peak at 22, slight drop at edges
    const distFrom22 = Math.abs(bmi - 22)
    return 85 - distFrom22 * 3 // 85 at 22, ~75 at edges
  }
  if (bmi < 18.5) {
    // Underweight: score decreases as BMI drops
    return Math.max(20, 65 - (18.5 - bmi) * 10)
  }
  if (bmi <= 30) {
    // Overweight
    return Math.max(15, 55 - (bmi - 25) * 8)
  }
  // Obese
  return Math.max(5, 20 - (bmi - 30) * 3)
}

/**
 * Calculate attractiveness score based on the minimum acceptable bar of each filter.
 * Uses the "worst case you'd accept" for each criterion:
 *  - Age (younger=better): upper bound of range
 *  - Income (higher=better): lower bound of range
 *  - Education (higher=better): lowest selected level
 *  - Height (taller=better): lower bound of range
 *  - BMI (normal=better): worst combo from bounds (shortest + heaviest)
 */
export function calculateScore(filters: FilterState): ScoreResult | null {
  const { genders, ageRange, incomeRange, educationLevels, heightRange, weightRange } = filters
  const criteria: ScoreCriterion[] = []

  // Age: younger = better → upper bound = minimum acceptable
  const ageWorst = Math.max(18, ageRange[1])
  const agePercentile = scoreAge(ageWorst, genders)
  criteria.push({
    id: 'age',
    label: '年齢',
    value: `${ageWorst}歳以下`,
    percentile: agePercentile,
    tier: percentileToTier(agePercentile).tier,
  })

  // Income: higher = better → lower bound = minimum acceptable
  const isIncomeFiltered = incomeRange[0] > 0 || incomeRange[1] < 2000
  if (isIncomeFiltered && incomeRange[0] > 0) {
    const incomeWorst = incomeRange[0]
    // Use the age upper bound for age-specific income scoring
    const incomePercentile = scoreIncome(incomeWorst, genders[0] ?? 'male', ageWorst)
    criteria.push({
      id: 'income',
      label: '年収',
      value: `${incomeWorst}万円以上`,
      percentile: incomePercentile,
      tier: percentileToTier(incomePercentile).tier,
    })
  }

  // Education: higher = better → lowest selected level = minimum acceptable
  if (educationLevels.length > 0) {
    const eduLabels: Record<string, string> = {
      junior_high: '中学卒', high_school: '高校卒', vocational: '専門学校卒',
      junior_college: '短大・高専卒', university: '大学卒', graduate: '大学院卒',
    }
    // Find the lowest selected education level
    const sorted = [...educationLevels].sort((a, b) =>
      scoreEducation([a]) - scoreEducation([b]))
    const lowestLevel = sorted[0]
    const eduPercentile = scoreEducation([lowestLevel])
    criteria.push({
      id: 'education',
      label: '学歴',
      value: `${eduLabels[lowestLevel] ?? lowestLevel}以上`,
      percentile: eduPercentile,
      tier: percentileToTier(eduPercentile).tier,
    })
  }

  // Height: taller = better → lower bound = minimum acceptable
  const isHeightFiltered = heightRange[0] > 140 || heightRange[1] < 200
  if (isHeightFiltered && heightRange[0] > 140) {
    const heightWorst = heightRange[0]
    const heightPercentile = scoreHeight(heightWorst, genders)
    criteria.push({
      id: 'height',
      label: '身長',
      value: `${heightWorst}cm以上`,
      percentile: heightPercentile,
      tier: percentileToTier(heightPercentile).tier,
    })
  }

  // BMI: normal=best → worst case = shortest acceptable + heaviest acceptable
  const isWeightFiltered = weightRange[0] > 30 || weightRange[1] < 120
  if (isWeightFiltered) {
    const heightForBmi = isHeightFiltered && heightRange[0] > 140
      ? heightRange[0] // shortest acceptable
      : genders.includes('male') && genders.includes('female') ? 165
        : genders.includes('male') ? 171 : 158
    const weightWorst = weightRange[1] < 120 ? weightRange[1] : weightRange[0] // heaviest or lightest bound
    const bmiPercentile = scoreBMI(weightWorst, heightForBmi)
    const bmi = weightWorst / ((heightForBmi / 100) ** 2)
    criteria.push({
      id: 'bmi',
      label: 'BMI',
      value: `${bmi.toFixed(1)}`,
      percentile: bmiPercentile,
      tier: percentileToTier(bmiPercentile).tier,
    })
  }

  // Age alone is not meaningful enough for a score — require at least one other criterion
  if (criteria.length <= 1) return null

  // Composite: geometric mean of percentiles (penalizes low scores more than arithmetic mean)
  const product = criteria.reduce((acc, c) => acc * Math.max(c.percentile, 1), 1)
  const compositePercentile = Math.pow(product, 1 / criteria.length)
  const { tier, label } = percentileToTier(compositePercentile)

  return {
    criteria,
    compositePercentile,
    tier,
    tierLabel: label,
  }
}

/**
 * Income score: higher = better percentile.
 * Uses the age-group-specific income distribution from income-education.json.
 * Computes what % of the same gender+age group earns less than the given amount.
 */
function scoreIncome(income: number, gender: Gender, age: number): number {
  if (income <= 0) return 0

  // Map age to the closest available age group in the data
  const ageGroupKeys = ['20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54']
  function ageToGroup(a: number): string {
    if (a < 20) return '20-24'
    if (a >= 55) return '50-54'
    const idx = Math.floor((a - 20) / 5)
    return ageGroupKeys[Math.min(idx, ageGroupKeys.length - 1)]
  }
  const group = ageToGroup(age)

  // Income bracket boundaries in 万円
  const brackets: Array<{ key: string; lower: number; upper: number }> = [
    { key: '~100', lower: 0, upper: 100 },
    { key: '100-200', lower: 100, upper: 200 },
    { key: '200-300', lower: 200, upper: 300 },
    { key: '300-400', lower: 300, upper: 400 },
    { key: '400-500', lower: 400, upper: 500 },
    { key: '500-600', lower: 500, upper: 600 },
    { key: '600-700', lower: 600, upper: 700 },
    { key: '700-800', lower: 700, upper: 800 },
    { key: '800-900', lower: 800, upper: 900 },
    { key: '900-1000', lower: 900, upper: 1000 },
    { key: '1000-1500', lower: 1000, upper: 1500 },
    { key: '1500+', lower: 1500, upper: 2500 },
  ]

  // Get the income distribution for this gender+age, marginalized over all education levels
  const groupDist = get(incomeEducationData, 'distribution', gender, group)
  const eduDist = get(incomeEducationData, 'educationDistribution', gender, group)
  if (!groupDist || !eduDist) return 50

  // Build marginalized income distribution (weighted average over education levels)
  const marginal: Record<string, number> = {}
  for (const bracket of brackets) {
    marginal[bracket.key] = 0
  }

  let totalEduWeight = 0
  for (const edu of Object.keys(groupDist)) {
    const eduWeight: number = eduDist[edu] ?? 0
    if (eduWeight <= 0) continue
    totalEduWeight += eduWeight
    const incomeDist = groupDist[edu]
    if (!incomeDist) continue
    for (const bracket of brackets) {
      marginal[bracket.key] += eduWeight * ((incomeDist[bracket.key] as number) ?? 0)
    }
  }

  // Normalize
  if (totalEduWeight > 0) {
    for (const key of Object.keys(marginal)) {
      marginal[key] /= totalEduWeight
    }
  }

  // Compute CDF: cumulative probability up to the income value
  let cumulative = 0
  for (const bracket of brackets) {
    const prob = marginal[bracket.key] ?? 0
    if (income <= bracket.lower) {
      break
    }
    if (income >= bracket.upper) {
      cumulative += prob
    } else {
      // Interpolate within the bracket
      const fraction = (income - bracket.lower) / (bracket.upper - bracket.lower)
      cumulative += prob * fraction
      break
    }
  }

  return Math.min(cumulative * 100, 99.9)
}

/**
 * Calculate self-assessment score from exact personal attributes.
 */
export function calculateSelfScore(self: SelfState): ScoreResult {
  const criteria: ScoreCriterion[] = []
  const genders: Gender[] = [self.gender]

  // Age
  const agePercentile = scoreAge(self.age, genders)
  criteria.push({
    id: 'age',
    label: '年齢',
    value: `${self.age}歳`,
    percentile: agePercentile,
    tier: percentileToTier(agePercentile).tier,
  })

  // Income (age-group specific)
  const incomePercentile = scoreIncome(self.income, self.gender, self.age)
  criteria.push({
    id: 'income',
    label: '年収',
    value: `${self.income}万円`,
    percentile: incomePercentile,
    tier: percentileToTier(incomePercentile).tier,
  })

  // Education
  const eduLabels: Record<string, string> = {
    junior_high: '中学卒', high_school: '高校卒', vocational: '専門学校卒',
    junior_college: '短大・高専卒', university: '大学卒', graduate: '大学院卒',
  }
  const eduPercentile = scoreEducation([self.education])
  criteria.push({
    id: 'education',
    label: '学歴',
    value: eduLabels[self.education] ?? self.education,
    percentile: eduPercentile,
    tier: percentileToTier(eduPercentile).tier,
  })

  // Height
  const heightPercentile = scoreHeight(self.height, genders)
  criteria.push({
    id: 'height',
    label: '身長',
    value: `${self.height}cm`,
    percentile: heightPercentile,
    tier: percentileToTier(heightPercentile).tier,
  })

  // BMI
  const bmiPercentile = scoreBMI(self.weight, self.height)
  const bmi = self.weight / ((self.height / 100) ** 2)
  criteria.push({
    id: 'bmi',
    label: 'BMI',
    value: `${bmi.toFixed(1)}`,
    percentile: bmiPercentile,
    tier: percentileToTier(bmiPercentile).tier,
  })

  const product = criteria.reduce((acc, c) => acc * Math.max(c.percentile, 1), 1)
  const compositePercentile = Math.pow(product, 1 / criteria.length)
  const { tier, label } = percentileToTier(compositePercentile)

  return { criteria, compositePercentile, tier, tierLabel: label }
}
