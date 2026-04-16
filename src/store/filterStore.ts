import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilterState, FilterStore } from './types'

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

function toggleAtLeastOne<T>(arr: T[], item: T): T[] {
  const next = toggleItem(arr, item)
  return next.length > 0 ? next : arr
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
}

function isValidRange(v: unknown): v is [number, number] {
  return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number'
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
      resetAll: () => set(defaultState),
    }),
    {
      name: 'people-filter-search',
      version: 1,
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
      }),
      merge: (persisted, current) => ({ ...current, ...safeMerge(persisted) }),
    },
  ),
)
