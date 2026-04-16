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
    }),
    {
      name: 'people-filter-self',
      partialize: ({ setGender, setAge, setMaritalStatus, setEducation, setIncome, setHeight, setWeight, ...state }) => state,
    },
  ),
)
