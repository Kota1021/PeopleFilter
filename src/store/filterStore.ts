import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Compatibility, CompatibilityAxis, FilterState, FilterStore } from './types'

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

function toggleAtLeastOne<T>(arr: T[], item: T): T[] {
  const next = toggleItem(arr, item)
  return next.length > 0 ? next : arr
}

const defaultCompatibility: Compatibility = {
  looks: 0,
  money: 0,
  personality: 0,
  food: 0,
  values: 0,
  lifestyle: 0,
}

const defaultState: FilterState = {
  genders: ['male', 'female'],
  maritalStatuses: ['unmarried'],
  ageRange: [20, 39],
  incomeRange: [0, 2000],
  educationLevels: [],
  heightRange: [140, 200],
  weightRange: [30, 120],
  occupations: [],
  prefectures: [],
  childrenDesire: 'any',
  smokingPref: 'any',
  drinkingPref: 'any',
  compatibility: defaultCompatibility,
}

function isValidRange(v: unknown): v is [number, number] {
  return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number'
}

function isValidCompatibility(v: unknown): v is Compatibility {
  if (v == null || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  const axes: CompatibilityAxis[] = ['looks', 'money', 'personality', 'food', 'values', 'lifestyle']
  return axes.every(a => typeof c[a] === 'number' && c[a] >= 0 && (c[a] as number) <= 5)
}

function safeMerge(persisted: unknown): Partial<FilterState> {
  if (persisted == null || typeof persisted !== 'object') return {}
  const p = persisted as Record<string, unknown>
  const merged: Partial<FilterState> = {}
  if (Array.isArray(p.genders) && p.genders.length > 0) merged.genders = p.genders
  if (Array.isArray(p.maritalStatuses) && p.maritalStatuses.length > 0) merged.maritalStatuses = p.maritalStatuses
  if (isValidRange(p.ageRange)) merged.ageRange = p.ageRange
  if (isValidRange(p.incomeRange)) merged.incomeRange = p.incomeRange
  if (Array.isArray(p.educationLevels)) merged.educationLevels = p.educationLevels
  if (isValidRange(p.heightRange)) merged.heightRange = p.heightRange
  if (isValidRange(p.weightRange)) merged.weightRange = p.weightRange
  if (Array.isArray(p.occupations)) merged.occupations = p.occupations
  if (Array.isArray(p.prefectures)) merged.prefectures = p.prefectures
  if (p.childrenDesire === 'any' || p.childrenDesire === 'want' || p.childrenDesire === 'no') {
    merged.childrenDesire = p.childrenDesire
  }
  if (p.smokingPref === 'any' || p.smokingPref === 'nonsmoker') {
    merged.smokingPref = p.smokingPref
  }
  if (p.drinkingPref === 'any' || p.drinkingPref === 'none' || p.drinkingPref === 'light') {
    merged.drinkingPref = p.drinkingPref
  }
  if (isValidCompatibility(p.compatibility)) merged.compatibility = p.compatibility
  return merged
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      ...defaultState,

      toggleGender: (g) => set((s) => ({ genders: toggleAtLeastOne(s.genders, g) })),
      toggleMaritalStatus: (s) => set((state) => ({ maritalStatuses: toggleAtLeastOne(state.maritalStatuses, s) })),
      setAgeRange: (r) => set({ ageRange: r }),
      setIncomeRange: (r) => set({ incomeRange: r }),
      toggleEducation: (level) => set((s) => ({ educationLevels: toggleItem(s.educationLevels, level) })),
      setHeightRange: (r) => set({ heightRange: r }),
      setWeightRange: (r) => set({ weightRange: r }),
      toggleOccupation: (occ) => set((s) => ({ occupations: toggleItem(s.occupations, occ) })),
      togglePrefecture: (code) => set((s) => ({ prefectures: toggleItem(s.prefectures, code) })),
      setChildrenDesire: (v) => set({ childrenDesire: v }),
      setSmokingPref: (v) => set({ smokingPref: v }),
      setDrinkingPref: (v) => set({ drinkingPref: v }),
      setCompatibility: (axis, value) => set((s) => ({
        compatibility: { ...s.compatibility, [axis]: Math.max(0, Math.min(5, Math.round(value))) },
      })),
      resetAll: () => set(defaultState),
    }),
    {
      name: 'people-filter-search',
      version: 2,
      migrate: () => defaultState,
      partialize: (state) => ({
        genders: state.genders,
        maritalStatuses: state.maritalStatuses,
        ageRange: state.ageRange,
        incomeRange: state.incomeRange,
        educationLevels: state.educationLevels,
        heightRange: state.heightRange,
        weightRange: state.weightRange,
        occupations: state.occupations,
        prefectures: state.prefectures,
        childrenDesire: state.childrenDesire,
        smokingPref: state.smokingPref,
        drinkingPref: state.drinkingPref,
        compatibility: state.compatibility,
      }),
      merge: (persisted, current) => ({ ...current, ...safeMerge(persisted) }),
    },
  ),
)
