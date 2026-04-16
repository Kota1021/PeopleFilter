import type { FilterState } from '../store/types'
import type { FunnelStage, AgeGroup } from './types'
import { AGE_GROUPS, ageGroupStart, ageGroupEnd } from './types'
import { normalRangeProbability } from './normalDistribution'
import populationData from '../data/population.json'
import incomeEducationData from '../data/income-education.json'
import heightWeightData from '../data/height-weight.json'
import occupationData from '../data/occupation.json'
import prefectureData from '../data/prefecture.json'

type GenderKey = 'male' | 'female'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(obj: any, ...keys: string[]): any {
  let current = obj
  for (const key of keys) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

/**
 * Calculate the overlap fraction between a user-selected age range and a 5-year age group.
 */
function ageOverlap(groupStart: number, groupEnd: number, filterMin: number, filterMax: number): number {
  const overlapStart = Math.max(groupStart, filterMin)
  const overlapEnd = Math.min(groupEnd, filterMax)
  if (overlapStart > overlapEnd) return 0
  const groupSpan = groupEnd - groupStart + 1
  return (overlapEnd - overlapStart + 1) / groupSpan
}

function getOverlappingAgeGroups(ageRange: [number, number]): Array<{ group: AgeGroup; fraction: number }> {
  const [filterMin, filterMax] = ageRange
  const result: Array<{ group: AgeGroup; fraction: number }> = []
  for (const group of AGE_GROUPS) {
    const start = ageGroupStart(group)
    const end = ageGroupEnd(group)
    const fraction = ageOverlap(start, end, filterMin, filterMax)
    if (fraction > 0) {
      result.push({ group, fraction })
    }
  }
  return result
}

function getPopulation(gender: GenderKey, group: AgeGroup): number {
  return get(populationData, gender, group) ?? 0
}

function getTotalUnmarried(gender: GenderKey): number {
  return gender === 'male' ? populationData.totalUnmarriedMale : populationData.totalUnmarriedFemale
}

function getIncomeEducationProbability(
  gender: GenderKey,
  group: AgeGroup,
  incomeRanges: string[],
  educationLevels: string[],
): number {
  const groupDist = get(incomeEducationData, 'distribution', gender, group)
  const groupEduDist = get(incomeEducationData, 'educationDistribution', gender, group)
  const groupEmpRate: number = get(incomeEducationData, 'employmentRate', gender, group) ?? 0.5

  if (!groupDist || !groupEduDist) {
    return groupEmpRate * (incomeRanges.length > 0 ? 0.3 : 1.0) * (educationLevels.length > 0 ? 0.4 : 1.0)
  }

  const hasIncomeFilter = incomeRanges.length > 0
  const hasEducationFilter = educationLevels.length > 0

  if (!hasIncomeFilter && !hasEducationFilter) return 1.0

  const eduLevels = hasEducationFilter ? educationLevels : Object.keys(groupDist)
  let totalProb = 0

  for (const edu of eduLevels) {
    const eduWeight: number = groupEduDist[edu] ?? 0
    if (eduWeight === 0) continue

    const incomeDist = groupDist[edu]
    if (!incomeDist) continue

    if (hasIncomeFilter) {
      let incomeProb = 0
      for (const range of incomeRanges) {
        incomeProb += (incomeDist[range] as number) ?? 0
      }
      totalProb += eduWeight * incomeProb * groupEmpRate
    } else {
      totalProb += eduWeight
    }
  }

  return totalProb
}

function getHeightProbability(gender: GenderKey, group: AgeGroup, heightRange: [number, number]): number {
  const mean: number | undefined = get(heightWeightData, gender, group, 'height', 'mean')
  const sd: number | undefined = get(heightWeightData, gender, group, 'height', 'sd')
  if (mean == null || sd == null) return 1.0
  return normalRangeProbability(heightRange[0], heightRange[1], mean, sd)
}

function getWeightProbability(gender: GenderKey, group: AgeGroup, weightRange: [number, number]): number {
  const mean: number | undefined = get(heightWeightData, gender, group, 'weight', 'mean')
  const sd: number | undefined = get(heightWeightData, gender, group, 'weight', 'sd')
  if (mean == null || sd == null) return 1.0
  return normalRangeProbability(weightRange[0], weightRange[1], mean, sd)
}

function getOccupationProbability(gender: GenderKey, group: AgeGroup, occupations: string[]): number {
  if (occupations.length === 0) return 1.0
  const groupDist = get(occupationData, 'distribution', gender, group)
    ?? get(occupationData, 'distribution', gender, 'default')
  if (!groupDist) return 1.0

  let prob = 0
  for (const occ of occupations) {
    prob += (groupDist[occ] as number) ?? 0
  }
  return prob
}

function getPrefectureRatio(prefectures: string[]): number {
  if (prefectures.length === 0) return 1.0
  let ratio = 0
  for (const code of prefectures) {
    ratio += (get(prefectureData, 'prefectures', code, 'ratio') as number) ?? 0
  }
  return ratio
}

export function calculateFunnel(filters: FilterState): FunnelStage[] {
  const { targetGender, ageRange, incomeRanges, educationLevels, heightRange, weightRange, occupations, prefectures } = filters
  const gender = targetGender

  const stages: FunnelStage[] = []
  const totalUnmarried = getTotalUnmarried(gender)

  // Stage 0: Total unmarried population
  stages.push({
    id: 'base',
    label: gender === 'male' ? '日本の未婚男性' : '日本の未婚女性',
    count: totalUnmarried,
    percentage: 1.0,
  })

  // Stage 1: Age filter
  const overlappingGroups = getOverlappingAgeGroups(ageRange)
  let afterAge = 0
  for (const { group, fraction } of overlappingGroups) {
    afterAge += getPopulation(gender, group) * fraction
  }
  afterAge = Math.round(afterAge)

  stages.push({
    id: 'age',
    label: `年齢: ${ageRange[0]}〜${ageRange[1]}歳`,
    count: afterAge,
    percentage: afterAge / totalUnmarried,
  })

  let currentCount = afterAge

  // Stage 2: Prefecture filter
  if (prefectures.length > 0) {
    const prefRatio = getPrefectureRatio(prefectures)
    currentCount = Math.round(currentCount * prefRatio)
    const prefNames = prefectures.map(code => {
      const name = get(prefectureData, 'prefectures', code, 'name')
      return name ?? code
    })
    const label = prefNames.length <= 3
      ? `居住地: ${prefNames.join('・')}`
      : `居住地: ${prefNames.length}都道府県`
    stages.push({
      id: 'prefecture',
      label,
      count: currentCount,
      percentage: currentCount / totalUnmarried,
    })
  }

  // Stage 3: Income + Education (joint distribution)
  if (incomeRanges.length > 0 || educationLevels.length > 0) {
    let weightedProb = 0
    let totalWeight = 0

    for (const { group, fraction } of overlappingGroups) {
      const pop = getPopulation(gender, group) * fraction
      const prob = getIncomeEducationProbability(gender, group, incomeRanges, educationLevels)
      weightedProb += pop * prob
      totalWeight += pop
    }

    const avgProb = totalWeight > 0 ? weightedProb / totalWeight : 0
    currentCount = Math.round(currentCount * avgProb)

    const parts: string[] = []
    if (incomeRanges.length > 0) parts.push('年収')
    if (educationLevels.length > 0) parts.push('学歴')

    stages.push({
      id: 'income-education',
      label: parts.join('・'),
      count: currentCount,
      percentage: currentCount / totalUnmarried,
    })
  }

  // Stage 4: Height filter
  const isHeightFiltered = heightRange[0] > 140 || heightRange[1] < 200
  if (isHeightFiltered) {
    let weightedProb = 0
    let totalWeight = 0

    for (const { group, fraction } of overlappingGroups) {
      const pop = getPopulation(gender, group) * fraction
      const prob = getHeightProbability(gender, group, heightRange)
      weightedProb += pop * prob
      totalWeight += pop
    }

    const avgProb = totalWeight > 0 ? weightedProb / totalWeight : 1
    currentCount = Math.round(currentCount * avgProb)
    stages.push({
      id: 'height',
      label: `身長: ${heightRange[0]}〜${heightRange[1]}cm`,
      count: currentCount,
      percentage: currentCount / totalUnmarried,
    })
  }

  // Stage 5: Weight filter
  const isWeightFiltered = weightRange[0] > 30 || weightRange[1] < 120
  if (isWeightFiltered) {
    let weightedProb = 0
    let totalWeight = 0

    for (const { group, fraction } of overlappingGroups) {
      const pop = getPopulation(gender, group) * fraction
      const prob = getWeightProbability(gender, group, weightRange)
      weightedProb += pop * prob
      totalWeight += pop
    }

    const avgProb = totalWeight > 0 ? weightedProb / totalWeight : 1
    currentCount = Math.round(currentCount * avgProb)
    stages.push({
      id: 'weight',
      label: `体重: ${weightRange[0]}〜${weightRange[1]}kg`,
      count: currentCount,
      percentage: currentCount / totalUnmarried,
    })
  }

  // Stage 6: Occupation filter
  if (occupations.length > 0) {
    let weightedProb = 0
    let totalWeight = 0

    for (const { group, fraction } of overlappingGroups) {
      const pop = getPopulation(gender, group) * fraction
      const prob = getOccupationProbability(gender, group, occupations)
      weightedProb += pop * prob
      totalWeight += pop
    }

    const avgProb = totalWeight > 0 ? weightedProb / totalWeight : 0

    let avgEmpRate = 0
    let empWeight = 0
    for (const { group, fraction } of overlappingGroups) {
      const pop = getPopulation(gender, group) * fraction
      const empRate: number = get(incomeEducationData, 'employmentRate', gender, group) ?? 0.5
      avgEmpRate += pop * empRate
      empWeight += pop
    }
    avgEmpRate = empWeight > 0 ? avgEmpRate / empWeight : 0.5

    const empMultiplier = (incomeRanges.length > 0 || educationLevels.length > 0) ? 1 : avgEmpRate
    currentCount = Math.round(currentCount * avgProb * empMultiplier)

    stages.push({
      id: 'occupation',
      label: '職業',
      count: currentCount,
      percentage: currentCount / totalUnmarried,
    })
  }

  return stages
}
