import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilterStore } from './types'

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

function toggleAtLeastOne<T>(arr: T[], item: T): T[] {
  const next = toggleItem(arr, item)
  return next.length > 0 ? next : arr
}

const defaultState = {
  genders: ['male', 'female'] as ('male' | 'female')[],
  maritalStatuses: ['unmarried'] as ('unmarried' | 'married' | 'divorced' | 'widowed')[],
  ageRange: [20, 39] as [number, number],
  incomeRange: [0, 2000] as [number, number],
  educationLevels: [] as string[],
  heightRange: [140, 200] as [number, number],
  weightRange: [30, 120] as [number, number],
  occupations: [] as string[],
  prefectures: [] as string[],
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
      partialize: ({ toggleGender, toggleMaritalStatus, setAgeRange, setIncomeRange, toggleEducation, setHeightRange, setWeightRange, toggleOccupation, togglePrefecture, resetAll, ...state }) => state,
    },
  ),
)
