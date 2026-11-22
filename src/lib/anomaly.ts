export type Verdict = 'healthy' | 'stale' | 'jump'

/**
 * The TF anomaly detector's rule (TF-Transform-Explorer src/tf_anomaly_detector.cpp:63-97): stale when the
 * transform is older than maxAge, else a jump when the position moved more than maxJump since the last check.
 * Both comparisons are strict, and staleness is reported first.
 */
export function verdict(age: number, jump: number, maxAge: number, maxJump: number): Verdict {
  if (age > maxAge) return 'stale'
  if (jump > maxJump) return 'jump'
  return 'healthy'
}

/** Farthest the robot can drive between two detector checks at its speed limit. */
export function maxDrivePerCheck(speed: number, period: number): number {
  return speed * period
}
