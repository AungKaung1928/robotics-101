/**
 * Chapter 5.6 model: failures written down in the author's own public repos (repo + file:line each), all found in
 * simulation (Gazebo / MoveIt), none on a real robot. Text per failure lives in fieldfail.strings.ts under the same id.
 */
export const FAILS = [
  { id: 'beam', repo: 'turtlebot3-wall-follower', path: 'docs/DETAILS.md', line: 108 },
  { id: 'params', repo: 'turtlebot3-wall-follower', path: 'docs/DETAILS.md', line: 121 },
  { id: 'index', repo: 'turtlebot3-wall-follower', path: 'docs/DETAILS.md', line: 126 },
  { id: 'wedge', repo: 'turtlebot3-wall-follower', path: 'docs/DETAILS.md', line: 136 },
  { id: 'chatter', repo: 'turtlebot3-wall-follower', path: 'docs/DETAILS.md', line: 139 },
  { id: 'attach', repo: 'moveit_pickplace_demo', path: 'README.md', line: 42 },
] as const
export type FailId = (typeof FAILS)[number]['id']

/** Three candidate causes for failure i: its own and the next two, rotated so the right one is not always first. */
export function options(i: number): FailId[] {
  const n = FAILS.length, ids = [0, 1, 2].map((d) => FAILS[(i + d) % n].id)
  const r = i % 3
  return [...ids.slice(3 - r), ...ids.slice(0, 3 - r)] as FailId[]
}
export const correct = (i: number, pick: FailId) => FAILS[i].id === pick
export const url = (f: (typeof FAILS)[number]) => `https://github.com/AungKaung1928/${f.repo}/blob/main/${f.path}#L${f.line}`
/** Challenge: every failure diagnosed right on the first try. */
export const challengeOk = (firstTry: Record<string, boolean>) => FAILS.every((f) => firstTry[f.id] === true)
