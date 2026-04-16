export function formatPopulation(count: number): string {
  if (count >= 10000) {
    const man = count / 10000
    if (man >= 100) {
      return `約${Math.round(man).toLocaleString()}万人`
    }
    return `約${man.toFixed(1)}万人`
  }
  if (count >= 1) {
    return `約${Math.round(count).toLocaleString()}人`
  }
  return '1人未満'
}

export function formatPercentage(ratio: number): string {
  if (ratio >= 0.01) {
    return `${(ratio * 100).toFixed(1)}%`
  }
  if (ratio >= 0.0001) {
    return `${(ratio * 100).toFixed(3)}%`
  }
  if (ratio >= 0.000001) {
    return `${(ratio * 100).toFixed(5)}%`
  }
  return '0.00001%未満'
}
