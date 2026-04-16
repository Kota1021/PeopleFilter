import { useMemo } from 'react'
import { useFilterStore } from '../store/filterStore'
import { calculateFunnel } from '../engine/calculator'
import type { FilterState } from '../store/types'

const selectState = (s: FilterState) => s

export function useCalculation() {
  const filters = useFilterStore(selectState)

  const stages = useMemo(
    () => calculateFunnel(filters),
    [filters],
  )

  const finalStage = stages[stages.length - 1]

  return { stages, finalStage }
}
