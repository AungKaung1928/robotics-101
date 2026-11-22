/** Cells in a square map of side `size` m at `res` m per cell. */
export function cellCount(size: number, res: number): number {
  const n = Math.round(size / res)
  return n * n
}

/** Log-odds of a probability, and back (Thrun, Burgard, Fox, Probabilistic Robotics, ch 9). */
export const logOdds = (p: number) => Math.log(p / (1 - p))
export const prob = (l: number) => 1 / (1 + Math.exp(-l))

/**
 * One occupancy update of a cell from an unknown (0.5) prior: add the inverse sensor model's log-odds
 * (above 0.5 for the hit cell, below for cells the beam passed through). The model probabilities are a choice,
 * not a sensor spec.
 */
export function update(l: number, pModel: number): number {
  return l + logOdds(pModel)
}
