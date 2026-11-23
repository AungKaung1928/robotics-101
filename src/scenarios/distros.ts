/**
 * ROS distributions for Level 0.4. ROS 2 dates: docs.ros.org/en/rolling/Releases.html (checked 2026-11-23);
 * ROS 1 Noetic: endoflife.date/ros (EOL May 2025). Where the docs give only a month, the last day of it is used.
 * Even-year ROS 2 releases are LTS (5 years), odd-year ones 1.5 years (docs.ros.org Release Schedule).
 */
export type Distro = { name: string; ros: 1 | 2; release: string; eol: string; lts: boolean }

export const DISTROS: Distro[] = [
  { name: 'Noetic', ros: 1, release: '2020-05-23', eol: '2025-05-31', lts: true },
  { name: 'Foxy', ros: 2, release: '2020-06-05', eol: '2023-06-20', lts: true },
  { name: 'Humble', ros: 2, release: '2022-05-23', eol: '2027-05-31', lts: true },
  { name: 'Iron', ros: 2, release: '2023-05-23', eol: '2024-12-04', lts: false },
  { name: 'Jazzy', ros: 2, release: '2024-05-23', eol: '2029-05-31', lts: true },
  { name: 'Kilted', ros: 2, release: '2025-05-23', eol: '2026-12-31', lts: false },
  { name: 'Lyrical', ros: 2, release: '2026-05-22', eol: '2031-05-31', lts: true },
]
/** ROS 2's first release, Ardent Apalone (same docs page). */
export const ROS2_FIRST = '2017-12-08'

/** Fractional year of an ISO date (2022-07-02 ≈ 2022.5), the timeline's x axis. */
export function year(iso: string): number {
  const d = new Date(iso + 'T00:00:00Z'), y = d.getUTCFullYear()
  return y + (d.getTime() - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1))
}

/** Distributions released and not yet past end of life at fractional year `y`. */
export function supportedAt(y: number, list = DISTROS): Distro[] {
  return list.filter((d) => year(d.release) <= y && y <= year(d.eol))
}

/** Timeline events: ROS 2's first release, every release and end of life, in time order (fractional years). */
export function distroEvents(list = DISTROS): number[] {
  return [...new Set([year(ROS2_FIRST), ...list.flatMap((d) => [year(d.release), year(d.eol)])])].sort((a, b) => a - b)
}
