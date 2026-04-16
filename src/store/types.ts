export type Gender = 'male' | 'female'
export type MaritalStatus = 'unmarried' | 'married' | 'divorced' | 'widowed'

export interface FilterState {
  targetGender: Gender
  maritalStatuses: MaritalStatus[]
  ageRange: [number, number]
  incomeRange: [number, number]
  educationLevels: string[]
  heightRange: [number, number]
  weightRange: [number, number]
  occupations: string[]
  prefectures: string[]
}

export interface FilterActions {
  setTargetGender: (g: Gender) => void
  toggleMaritalStatus: (s: MaritalStatus) => void
  setAgeRange: (r: [number, number]) => void
  setIncomeRange: (r: [number, number]) => void
  toggleEducation: (level: string) => void
  setHeightRange: (r: [number, number]) => void
  setWeightRange: (r: [number, number]) => void
  toggleOccupation: (occ: string) => void
  togglePrefecture: (code: string) => void
  resetAll: () => void
}

export type FilterStore = FilterState & FilterActions
