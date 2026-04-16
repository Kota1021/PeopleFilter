import { create } from 'zustand'
import type { FilterStore, MaritalStatus } from './types'

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

const defaultState = {
  targetGender: 'male' as const,
  maritalStatuses: ['unmarried'] as MaritalStatus[],
  ageRange: [20, 39] as [number, number],
  incomeRange: [0, 2000] as [number, number],
  educationLevels: [] as string[],
  heightRange: [140, 200] as [number, number],
  weightRange: [30, 120] as [number, number],
  occupations: [] as string[],
  prefectures: [] as string[],
}

export const useFilterStore = create<FilterStore>((set) => ({
  ...defaultState,

  setTargetGender: (g) => set({ targetGender: g }),
  toggleMaritalStatus: (s) => set((state) => {
    const next = toggleItem(state.maritalStatuses, s)
    // Ensure at least one is selected
    return next.length > 0 ? { maritalStatuses: next } : state
  }),
  setAgeRange: (r) => set({ ageRange: r }),
  setIncomeRange: (r) => set({ incomeRange: r }),
  toggleEducation: (level) => set((s) => ({ educationLevels: toggleItem(s.educationLevels, level) })),
  setHeightRange: (r) => set({ heightRange: r }),
  setWeightRange: (r) => set({ weightRange: r }),
  toggleOccupation: (occ) => set((s) => ({ occupations: toggleItem(s.occupations, occ) })),
  togglePrefecture: (code) => set((s) => ({ prefectures: toggleItem(s.prefectures, code) })),
  resetAll: () => set(defaultState),
}))
