import { useMemo } from 'react'
import { useFilterStore } from '../store/filterStore'
import { calculateFunnel } from '../engine/calculator'

export function useCalculation() {
  const filters = useFilterStore()

  const stages = useMemo(
    () => calculateFunnel(filters),
    [
      filters.targetGender,
      filters.maritalStatuses,
      filters.ageRange,
      filters.incomeRange,
      filters.educationLevels,
      filters.heightRange,
      filters.weightRange,
      filters.occupations,
      filters.prefectures,
    ],
  )

  const finalStage = stages[stages.length - 1]

  return { stages, finalStage }
}
