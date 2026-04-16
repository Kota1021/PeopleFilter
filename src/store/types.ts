export type Gender = 'male' | 'female'

export interface FilterState {
  targetGender: Gender
  ageRange: [number, number]
  incomeRanges: string[]
  educationLevels: string[]
  heightRange: [number, number]
  weightRange: [number, number]
  occupations: string[]
  prefectures: string[]
}

export interface FilterActions {
  setTargetGender: (g: Gender) => void
  setAgeRange: (r: [number, number]) => void
  toggleIncome: (range: string) => void
  toggleEducation: (level: string) => void
  setHeightRange: (r: [number, number]) => void
  setWeightRange: (r: [number, number]) => void
  toggleOccupation: (occ: string) => void
  togglePrefecture: (code: string) => void
  resetAll: () => void
}

export type FilterStore = FilterState & FilterActions
