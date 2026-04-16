import type { FilterState, Gender } from '../store/types'
import type { AgeGroup } from './types'
import { AGE_GROUPS, ageGroupStart, ageGroupEnd } from './types'
import { normalCDF } from './normalDistribution'
import populationData from '../data/population.json'
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
  if (p >= 95) return { tier: 'S', label: '超ハイスペ' }
  if (p >= 80) return { tier: 'A', label: 'ハイスペ' }
  if (p >= 60) return { tier: 'B', label: 'やや上' }
  if (p >= 40) return { tier: 'C', label: '平均的' }
  if (p >= 20) return { tier: 'D', label: 'やや下' }
  return { tier: 'E', label: '厳しめ' }
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
 * Education score: 院卒=大卒 > 専門 > 高卒 > 中卒
 * Returns percentile based on what fraction of the population has a lower education.
 */
function scoreEducation(levels: string[]): number {
  if (levels.length === 0) return -1 // not filtered

  // Tier mapping: higher = better
  const tierMap: Record<string, number> = {
    junior_high: 10,
    high_school: 35,
    vocational: 55,
    junior_college: 60,
    university: 82,
    graduate: 82,
  }

  // Take the highest level selected
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
 * Calculate attractiveness score based on the midpoint of active filters.
 */
export function calculateScore(filters: FilterState): ScoreResult | null {
  const { genders, ageRange, educationLevels, heightRange, weightRange } = filters
  const criteria: ScoreCriterion[] = []

  // Age: use the midpoint of the selected range (clamped to 18+)
  const ageMid = Math.max(18, Math.round((ageRange[0] + ageRange[1]) / 2))
  const agePercentile = scoreAge(ageMid, genders)
  criteria.push({
    id: 'age',
    label: '年齢',
    value: `${ageMid}歳`,
    percentile: agePercentile,
    tier: percentileToTier(agePercentile).tier,
  })

  // Education
  if (educationLevels.length > 0) {
    const eduPercentile = scoreEducation(educationLevels)
    if (eduPercentile >= 0) {
      const bestLabel: Record<string, string> = {
        junior_high: '中学卒', high_school: '高校卒', vocational: '専門学校卒',
        junior_college: '短大・高専卒', university: '大学卒', graduate: '大学院卒',
      }
      // Show the highest selected
      const sorted = [...educationLevels].sort((a, b) =>
        (scoreEducation([b])) - (scoreEducation([a])))
      criteria.push({
        id: 'education',
        label: '学歴',
        value: bestLabel[sorted[0]] ?? sorted[0],
        percentile: eduPercentile,
        tier: percentileToTier(eduPercentile).tier,
      })
    }
  }

  // Height: midpoint
  const isHeightFiltered = heightRange[0] > 140 || heightRange[1] < 200
  if (isHeightFiltered) {
    const heightMid = Math.round((heightRange[0] + heightRange[1]) / 2)
    const heightPercentile = scoreHeight(heightMid, genders)
    criteria.push({
      id: 'height',
      label: '身長',
      value: `${heightMid}cm`,
      percentile: heightPercentile,
      tier: percentileToTier(heightPercentile).tier,
    })
  }

  // Weight/BMI: use midpoints of height and weight
  const isWeightFiltered = weightRange[0] > 30 || weightRange[1] < 120
  if (isWeightFiltered && isHeightFiltered) {
    const heightMid = Math.round((heightRange[0] + heightRange[1]) / 2)
    const weightMid = Math.round((weightRange[0] + weightRange[1]) / 2)
    const bmiPercentile = scoreBMI(weightMid, heightMid)
    const bmi = weightMid / ((heightMid / 100) ** 2)
    criteria.push({
      id: 'bmi',
      label: 'BMI',
      value: `${bmi.toFixed(1)}`,
      percentile: bmiPercentile,
      tier: percentileToTier(bmiPercentile).tier,
    })
  } else if (isWeightFiltered) {
    // No height filter, use average height for BMI calc
    const avgHeight = genders.includes('male') && genders.includes('female') ? 165
      : genders.includes('male') ? 171 : 158
    const weightMid = Math.round((weightRange[0] + weightRange[1]) / 2)
    const bmiPercentile = scoreBMI(weightMid, avgHeight)
    const bmi = weightMid / ((avgHeight / 100) ** 2)
    criteria.push({
      id: 'bmi',
      label: 'BMI',
      value: `${bmi.toFixed(1)}`,
      percentile: bmiPercentile,
      tier: percentileToTier(bmiPercentile).tier,
    })
  }

  if (criteria.length === 0) return null

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
