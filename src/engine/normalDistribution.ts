/**
 * Standard normal cumulative distribution function (CDF).
 * Uses the Abramowitz and Stegun erfc approximation (7.1.26, error < 1.5e-7).
 */
export function normalCDF(z: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  // Convert normal CDF argument to erfc argument: x = |z| / sqrt(2)
  const x = Math.abs(z) / Math.SQRT2
  const t = 1.0 / (1.0 + p * x)
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t
  const erfcX = poly * Math.exp(-x * x)

  // Phi(z) = 1 - 0.5*erfc(z/sqrt(2)) for z >= 0
  // Phi(z) = 0.5*erfc(|z|/sqrt(2)) for z < 0
  return z >= 0 ? 1.0 - 0.5 * erfcX : 0.5 * erfcX
}

/**
 * Probability that a normally distributed variable falls within [min, max].
 * Returns value between 0 and 1.
 */
export function normalRangeProbability(
  min: number,
  max: number,
  mean: number,
  sd: number,
): number {
  if (sd < 0) return 0
  if (sd === 0) return (mean >= min && mean <= max) ? 1 : 0
  const zMin = (min - mean) / sd
  const zMax = (max - mean) / sd
  return Math.max(0, normalCDF(zMax) - normalCDF(zMin))
}
