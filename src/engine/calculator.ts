import type { FilterState, Gender, MaritalStatus } from '../store/types'
import type { FunnelStage, AgeGroup } from './types'
import { AGE_GROUPS, ageGroupStart, ageGroupEnd } from './types'
import { normalRangeProbability } from './normalDistribution'
import { incomeRangeToCategories } from '../constants/filterOptions'
import populationData from '../data/population.json'
import incomeEducationData from '../data/income-education.json'
import heightWeightData from '../data/height-weight.json'
import occupationData from '../data/occupation.json'
import prefectureData from '../data/prefecture.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(obj: any, ...keys: string[]): any {
  let current = obj
  for (const key of keys) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

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

function getTotalPopulation(gender: Gender, group: AgeGroup): number {
  return get(populationData, 'total', gender, group) ?? 0
}

function getMaritalStatusRatio(gender: Gender, group: AgeGroup, statuses: MaritalStatus[]): number {
  let ratio = 0
  for (const s of statuses) {
    ratio += (get(populationData, 'maritalStatus', gender, group, s) as number) ?? 0
  }
  return ratio
}

function getIncomeEducationProbability(
  gender: Gender,
  group: AgeGroup,
  incomeCategories: string[],
  educationLevels: string[],
): number {
  const groupDist = get(incomeEducationData, 'distribution', gender, group)
  const groupEduDist = get(incomeEducationData, 'educationDistribution', gender, group)
  const groupEmpRate: number = get(incomeEducationData, 'employmentRate', gender, group) ?? 0.5

  if (!groupDist || !groupEduDist) {
    return groupEmpRate * (incomeCategories.length > 0 ? 0.3 : 1.0) * (educationLevels.length > 0 ? 0.4 : 1.0)
  }

  const hasIncomeFilter = incomeCategories.length > 0
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
      for (const range of incomeCategories) {
        incomeProb += (incomeDist[range] as number) ?? 0
      }
      totalProb += eduWeight * incomeProb * groupEmpRate
    } else {
      totalProb += eduWeight
    }
  }
  return totalProb
}

function getHeightProbability(gender: Gender, group: AgeGroup, heightRange: [number, number]): number {
  const mean: number | undefined = get(heightWeightData, gender, group, 'height', 'mean')
  const sd: number | undefined = get(heightWeightData, gender, group, 'height', 'sd')
  if (mean == null || sd == null) return 1.0
  return normalRangeProbability(heightRange[0], heightRange[1], mean, sd)
}

function getWeightProbability(gender: Gender, group: AgeGroup, weightRange: [number, number]): number {
  const mean: number | undefined = get(heightWeightData, gender, group, 'weight', 'mean')
  const sd: number | undefined = get(heightWeightData, gender, group, 'weight', 'sd')
  if (mean == null || sd == null) return 1.0
  return normalRangeProbability(weightRange[0], weightRange[1], mean, sd)
}

function getOccupationProbability(gender: Gender, group: AgeGroup, occupations: string[]): number {
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

const ALL_GENDERS: Gender[] = ['male', 'female']
const ALL_MARITAL_STATUSES: MaritalStatus[] = ['unmarried', 'married', 'divorced', 'widowed']
const GENDER_LABELS: Record<Gender, string> = { male: '男性', female: '女性' }
const MARITAL_LABELS: Record<MaritalStatus, string> = {
  unmarried: '未婚', married: '既婚', divorced: '離別', widowed: '死別',
}

/**
 * Helper: sum a per-gender-age value across selected genders and age groups.
 */
function sumAcrossGendersAndGroups(
  genders: Gender[],
  groups: Array<{ group: AgeGroup; fraction: number }>,
  maritalStatuses: MaritalStatus[],
  fn: (gender: Gender, group: AgeGroup) => number,
): number {
  let total = 0
  for (const gender of genders) {
    for (const { group, fraction } of groups) {
      const pop = getTotalPopulation(gender, group) * fraction
      const maritalRatio = getMaritalStatusRatio(gender, group, maritalStatuses)
      total += pop * maritalRatio * fn(gender, group)
    }
  }
  return total
}

function filteredPop(
  genders: Gender[],
  groups: Array<{ group: AgeGroup; fraction: number }>,
  maritalStatuses: MaritalStatus[],
): number {
  return sumAcrossGendersAndGroups(genders, groups, maritalStatuses, () => 1)
}

export function calculateFunnel(filters: FilterState): FunnelStage[] {
  const { genders, maritalStatuses, ageRange, incomeRange, educationLevels, heightRange, weightRange, occupations, prefectures } = filters

  const incomeCategories = incomeRangeToCategories(incomeRange[0], incomeRange[1])
  const isIncomeFiltered = incomeRange[0] > 0 || incomeRange[1] < 2000

  const stages: FunnelStage[] = []

  // Grand total: all ages, all statuses, for selected genders
  let grandTotal = 0
  for (const gender of genders) {
    for (const group of AGE_GROUPS) {
      grandTotal += getTotalPopulation(gender, group)
    }
  }

  // Stage 0: Base
  const baseLabel = genders.length === 2
    ? '日本の総人口'
    : `日本の${GENDER_LABELS[genders[0]]}`
  stages.push({ id: 'base', label: baseLabel, count: grandTotal, percentage: 1.0 })

  // Stage 1: Gender filter (only if one gender selected, show as explicit filter)
  const isGenderFiltered = genders.length < ALL_GENDERS.length
  if (isGenderFiltered) {
    // grandTotal already reflects selected genders, so this stage just labels it
    // (no reduction needed since base is already scoped)
  }

  // Stage 2: Marital status filter
  const isMaritalFiltered = maritalStatuses.length < ALL_MARITAL_STATUSES.length
  const overlappingGroups = getOverlappingAgeGroups(ageRange)

  if (isMaritalFiltered) {
    let afterMarital = 0
    for (const gender of genders) {
      for (const group of AGE_GROUPS) {
        const total = getTotalPopulation(gender, group)
        const ratio = getMaritalStatusRatio(gender, group, maritalStatuses)
        afterMarital += total * ratio
      }
    }
    afterMarital = Math.round(afterMarital)

    const statusLabel = maritalStatuses.map(s => MARITAL_LABELS[s]).join('・')
    stages.push({
      id: 'marital',
      label: `配偶関係: ${statusLabel}`,
      count: afterMarital,
      percentage: afterMarital / grandTotal,
    })
  }

  // Stage 3: Age filter
  const afterAgePop = filteredPop(genders, overlappingGroups, maritalStatuses)
  const afterAge = Math.round(afterAgePop)
  stages.push({
    id: 'age',
    label: `年齢: ${ageRange[0]}〜${ageRange[1]}歳`,
    count: afterAge,
    percentage: afterAge / grandTotal,
  })

  let currentCount = afterAge

  // Stage 4: Prefecture filter
  if (prefectures.length > 0) {
    const prefRatio = getPrefectureRatio(prefectures)
    currentCount = Math.round(currentCount * prefRatio)
    const prefNames = prefectures.map(code => get(prefectureData, 'prefectures', code, 'name') ?? code)
    const label = prefNames.length <= 3
      ? `居住地: ${prefNames.join('・')}`
      : `居住地: ${prefNames.length}都道府県`
    stages.push({ id: 'prefecture', label, count: currentCount, percentage: currentCount / grandTotal })
  }

  // Stage 5: Income + Education
  if (isIncomeFiltered || educationLevels.length > 0) {
    const cats = isIncomeFiltered ? incomeCategories : []
    const weighted = sumAcrossGendersAndGroups(genders, overlappingGroups, maritalStatuses,
      (g, grp) => getIncomeEducationProbability(g, grp, cats, educationLevels))
    const base = afterAgePop
    const avgProb = base > 0 ? weighted / base : 0
    currentCount = Math.round(currentCount * avgProb)

    const parts: string[] = []
    if (isIncomeFiltered) {
      const minLabel = incomeRange[0] === 0 ? '' : `${incomeRange[0]}万`
      const maxLabel = incomeRange[1] >= 2000 ? '' : `${incomeRange[1]}万`
      if (minLabel && maxLabel) parts.push(`年収${minLabel}〜${maxLabel}`)
      else if (minLabel) parts.push(`年収${minLabel}以上`)
      else if (maxLabel) parts.push(`年収${maxLabel}以下`)
    }
    if (educationLevels.length > 0) parts.push('学歴')
    stages.push({ id: 'income-education', label: parts.join('・'), count: currentCount, percentage: currentCount / grandTotal })
  }

  // Stage 6: Height
  const isHeightFiltered = heightRange[0] > 140 || heightRange[1] < 200
  if (isHeightFiltered) {
    const weighted = sumAcrossGendersAndGroups(genders, overlappingGroups, maritalStatuses,
      (g, grp) => getHeightProbability(g, grp, heightRange))
    const base = afterAgePop
    const avgProb = base > 0 ? weighted / base : 1
    currentCount = Math.round(currentCount * avgProb)
    stages.push({ id: 'height', label: `身長: ${heightRange[0]}〜${heightRange[1]}cm`, count: currentCount, percentage: currentCount / grandTotal })
  }

  // Stage 7: Weight
  const isWeightFiltered = weightRange[0] > 30 || weightRange[1] < 120
  if (isWeightFiltered) {
    const weighted = sumAcrossGendersAndGroups(genders, overlappingGroups, maritalStatuses,
      (g, grp) => getWeightProbability(g, grp, weightRange))
    const base = afterAgePop
    const avgProb = base > 0 ? weighted / base : 1
    currentCount = Math.round(currentCount * avgProb)
    stages.push({ id: 'weight', label: `体重: ${weightRange[0]}〜${weightRange[1]}kg`, count: currentCount, percentage: currentCount / grandTotal })
  }

  // Stage 8: Occupation
  if (occupations.length > 0) {
    const weighted = sumAcrossGendersAndGroups(genders, overlappingGroups, maritalStatuses,
      (g, grp) => getOccupationProbability(g, grp, occupations))
    const base = afterAgePop
    const avgProb = base > 0 ? weighted / base : 0

    // Employment rate
    const empWeighted = sumAcrossGendersAndGroups(genders, overlappingGroups, maritalStatuses,
      (g, grp) => (get(incomeEducationData, 'employmentRate', g, grp) as number) ?? 0.5)
    const avgEmpRate = base > 0 ? empWeighted / base : 0.5

    const empMultiplier = (isIncomeFiltered || educationLevels.length > 0) ? 1 : avgEmpRate
    currentCount = Math.round(currentCount * avgProb * empMultiplier)
    stages.push({ id: 'occupation', label: '職業', count: currentCount, percentage: currentCount / grandTotal })
  }

  return stages
}
