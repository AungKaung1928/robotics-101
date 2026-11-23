import type { Scenario } from '../../anim/contract'

/** Months since Jan 2020 (0 = Jan 2020). */
export const month = (y: number, m: number) => (y - 2020) * 12 + (m - 1)
export const label = (i: number) => ({ y: 2020 + Math.floor(i / 12), m: (i % 12) + 1 })

/**
 * ROS distributions: first supported month, last supported month (inclusive).
 * ROS 2 rows: docs.ros.org Releases table (ros2_documentation source/Releases.rst, read 2026-11-23);
 * Noetic: REP 3 "May 2020 - May 2025". Iron ended Dec 4, 2024: counted as its last month.
 */
export const DISTROS = [
  { id: 'noetic', name: 'Noetic', ros: 1, from: month(2020, 5), last: month(2025, 5), lts: true },
  { id: 'humble', name: 'Humble', ros: 2, from: month(2022, 5), last: month(2027, 5), lts: true },
  { id: 'iron', name: 'Iron', ros: 2, from: month(2023, 5), last: month(2024, 12), lts: false },
  { id: 'jazzy', name: 'Jazzy', ros: 2, from: month(2024, 5), last: month(2029, 5), lts: true },
  { id: 'kilted', name: 'Kilted', ros: 2, from: month(2025, 5), last: month(2026, 12), lts: false },
  { id: 'lyrical', name: 'Lyrical', ros: 2, from: month(2026, 5), last: month(2031, 5), lts: true },
] as const
export type DistroId = (typeof DISTROS)[number]['id']
export const TODAY = month(2026, 11) // the day this chapter was written; the page says so
export const END = month(2032, 1)

/** Distributions that still get fixes in month `i`. */
export const supported = (i: number) => DISTROS.filter((d) => d.from <= i && i <= d.last).map((d) => d.id)

/** Months a project started on `id` has run without fixes by month `i` (0 while supported). */
export const unsupportedFor = (id: DistroId, i: number) => Math.max(0, i - DISTROS.find((d) => d.id === id)!.last)

/** Challenge: put the date on the last month Humble gets fixes. */
export const humbleLast = (i: number) => i === DISTROS[1].last

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
export const SWEEP_S = 6

export interface RosScene extends Record<string, unknown> { at: number }

/** The date sweeps eased from Jan 2020 to today; distros light up while supported. */
export function scenario(): Scenario<RosScene> {
  return {
    id: 'l0-ros',
    durationMs: SWEEP_S * 1000,
    eventsMs: [0, SWEEP_S * 1000],
    frame(tMs) {
      const x = Math.min(1, Math.max(0, tMs / 1000 / SWEEP_S))
      return { at: Math.round(ease(x) * TODAY) }
    },
  }
}
