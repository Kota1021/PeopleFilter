import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Gender, MaritalStatus } from './types'

export interface SelfState {
  gender: Gender
  age: number
  maritalStatus: MaritalStatus
  education: string
  income: number
  height: number
  weight: number
}

interface SelfActions {
  setGender: (g: Gender) => void
  setAge: (v: number) => void
  setMaritalStatus: (s: MaritalStatus) => void
  setEducation: (e: string) => void
  setIncome: (v: number) => void
  setHeight: (v: number) => void
  setWeight: (v: number) => void
  resetAll: () => void
}

export type SelfStore = SelfState & SelfActions

const defaultSelf: SelfState = {
  gender: 'male',
  age: 30,
  maritalStatus: 'unmarried',
  education: 'university',
  income: 400,
  height: 170,
  weight: 65,
}

const VALID_GENDERS = new Set<string>(['male', 'female'])
const VALID_MARITAL = new Set<string>(['unmarried', 'married', 'divorced', 'widowed'])

function safeMerge(persisted: unknown): Partial<SelfState> {
  if (persisted == null || typeof persisted !== 'object') return {}
  const p = persisted as Record<string, unknown>
  const merged: Partial<SelfState> = {}
  if (typeof p.gender === 'string' && VALID_GENDERS.has(p.gender)) merged.gender = p.gender as Gender
  if (typeof p.age === 'number' && p.age >= 0) merged.age = p.age
  if (typeof p.maritalStatus === 'string' && VALID_MARITAL.has(p.maritalStatus)) merged.maritalStatus = p.maritalStatus as MaritalStatus
  if (typeof p.education === 'string') merged.education = p.education
  if (typeof p.income === 'number' && p.income >= 0) merged.income = p.income
  if (typeof p.height === 'number' && p.height > 0) merged.height = p.height
  if (typeof p.weight === 'number' && p.weight > 0) merged.weight = p.weight
  return merged
}

export const useSelfStore = create<SelfStore>()(
  persist(
    (set) => ({
      ...defaultSelf,
      setGender: (g) => set({ gender: g }),
      setAge: (v) => set({ age: v }),
      setMaritalStatus: (s) => set({ maritalStatus: s }),
      setEducation: (e) => set({ education: e }),
      setIncome: (v) => set({ income: v }),
      setHeight: (v) => set({ height: v }),
      setWeight: (v) => set({ weight: v }),
      resetAll: () => set(defaultSelf),
    }),
    {
      name: 'people-filter-self',
      version: 1,
      partialize: (state) => ({
        gender: state.gender,
        age: state.age,
        maritalStatus: state.maritalStatus,
        education: state.education,
        income: state.income,
        height: state.height,
        weight: state.weight,
      }),
      merge: (persisted, current) => ({ ...current, ...safeMerge(persisted) }),
    },
  ),
)
