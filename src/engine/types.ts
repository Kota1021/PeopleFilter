export interface FunnelStage {
  id: string
  label: string
  count: number
  percentage: number
}

export type AgeGroup = '0-4' | '5-9' | '10-14' | '15-19' | '20-24' | '25-29' | '30-34' | '35-39' | '40-44' | '45-49' | '50-54' | '55-59' | '60-64' | '65-69' | '70-74' | '75-79' | '80+'

export const AGE_GROUPS: AgeGroup[] = [
  '0-4', '5-9', '10-14',
  '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54',
  '55-59', '60-64', '65-69', '70-74', '75-79', '80+',
]

export function ageGroupStart(group: AgeGroup): number {
  if (group === '80+') return 80
  return parseInt(group.split('-')[0])
}

export function ageGroupEnd(group: AgeGroup): number {
  if (group === '80+') return 99
  return parseInt(group.split('-')[1])
}
