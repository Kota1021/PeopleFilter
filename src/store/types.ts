export type Gender = 'male' | 'female'
export type MaritalStatus = 'unmarried' | 'married' | 'divorced' | 'widowed'
export type ChildrenDesire = 'any' | 'want' | 'no'
export type SmokingPref = 'any' | 'nonsmoker'
export type DrinkingPref = 'any' | 'none' | 'light'

export type CompatibilityAxis = 'looks' | 'money' | 'personality' | 'food' | 'lifestyle'

export type Compatibility = Record<CompatibilityAxis, number>

export interface FilterState {
  genders: Gender[]
  maritalStatuses: MaritalStatus[]
  ageRange: [number, number]
  incomeRange: [number, number]
  educationLevels: string[]
  heightRange: [number, number]
  weightRange: [number, number]
  occupations: string[]
  prefectures: string[]
  childrenDesire: ChildrenDesire
  smokingPref: SmokingPref
  drinkingPref: DrinkingPref
  compatibility: Compatibility
}

export interface FilterActions {
  toggleGender: (g: Gender) => void
  toggleMaritalStatus: (s: MaritalStatus) => void
  setAgeRange: (r: [number, number]) => void
  setIncomeRange: (r: [number, number]) => void
  toggleEducation: (level: string) => void
  setHeightRange: (r: [number, number]) => void
  setWeightRange: (r: [number, number]) => void
  toggleOccupation: (occ: string) => void
  togglePrefecture: (code: string) => void
  setChildrenDesire: (v: ChildrenDesire) => void
  setSmokingPref: (v: SmokingPref) => void
  setDrinkingPref: (v: DrinkingPref) => void
  setCompatibility: (axis: CompatibilityAxis, value: number) => void
  resetAll: () => void
}

export type FilterStore = FilterState & FilterActions
