import { create } from 'zustand'
import type { FilterStore } from './types'

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

const defaultState = {
  targetGender: 'male' as const,
  ageRange: [20, 39] as [number, number],
  incomeRanges: [] as string[],
  educationLevels: [] as string[],
  heightRange: [140, 200] as [number, number],
  weightRange: [30, 120] as [number, number],
  occupations: [] as string[],
  prefectures: [] as string[],
}

export const useFilterStore = create<FilterStore>((set) => ({
  ...defaultState,

  setTargetGender: (g) => set({ targetGender: g }),
  setAgeRange: (r) => set({ ageRange: r }),
  toggleIncome: (range) => set((s) => ({ incomeRanges: toggleItem(s.incomeRanges, range) })),
  toggleEducation: (level) => set((s) => ({ educationLevels: toggleItem(s.educationLevels, level) })),
  setHeightRange: (r) => set({ heightRange: r }),
  setWeightRange: (r) => set({ weightRange: r }),
  toggleOccupation: (occ) => set((s) => ({ occupations: toggleItem(s.occupations, occ) })),
  togglePrefecture: (code) => set((s) => ({ prefectures: toggleItem(s.prefectures, code) })),
  resetAll: () => set(defaultState),
}))
