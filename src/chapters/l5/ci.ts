/**
 * 5.2 Tests + CI in a ROS container, from TF-Transform-Explorer .github/workflows/ci.yml (c3c3cf2):
 * on push to main and on pull requests (:3-6), one job in the ros:humble container (:13), steps :18-41.
 * Times = run 45131404756 on c3c3cf2 (GitHub Actions jobs API, read 2026-11-24): step start/finish, whole seconds.
 * Real red runs: 44913660184 (2ed2bd9) colcon build failure, colcon test skipped; 44841612440 (5590e97) colcon test failure.
 */
export const STEPS = ['container', 'checkout', 'rosdep', 'build', 'test', 'figure'] as const
export type Step = (typeof STEPS)[number]
export const LINES: Record<Step, string> = {
  container: '.github/workflows/ci.yml#L12-L13', checkout: '.github/workflows/ci.yml#L18-L20', rosdep: '.github/workflows/ci.yml#L21-L27',
  build: '.github/workflows/ci.yml#L28-L31', test: '.github/workflows/ci.yml#L32-L36', figure: '.github/workflows/ci.yml#L37-L41',
}
/** Seconds per step in run 45131404756 (Initialize containers 07:29:04-16, checkout :16-17, rosdep :17-34, build :34-30:35, test 30:35-31:01, figure 31:01-01). */
export const SECONDS: Record<Step, number> = { container: 12, checkout: 1, rosdep: 17, build: 61, test: 26, figure: 0 }
export const RUN = { id: 45131404756, sha: 'c3c3cf2', wallS: 125 } // run_started_at 07:29:00, updated_at 07:31:05

/** What the pushed commit does wrong; each one makes exactly one step fail. */
export const PUSHES = ['clean', 'syntax', 'test', 'figure'] as const
export type Push = (typeof PUSHES)[number]
const FAILS: Record<Push, Step | null> = { clean: null, syntax: 'build', test: 'test', figure: 'figure' }
/** Real runs that show each case (null = no red run of this kind in the repo's history, read 2026-11-24). */
export const REAL: Record<Push, { id: number; sha: string } | null> = {
  clean: { id: 45131404756, sha: 'c3c3cf2' }, syntax: { id: 44913660184, sha: '2ed2bd9' }, test: { id: 44841612440, sha: '5590e97' }, figure: null,
}

export type Result = 'success' | 'failure' | 'skipped'
/** GitHub Actions default: after a failed step, the later steps are skipped and the run is red. */
export function run(push: Push): Record<Step, Result> {
  let dead = false
  return Object.fromEntries(STEPS.map((s) => {
    if (dead) return [s, 'skipped']
    if (FAILS[push] === s) { dead = true; return [s, 'failure'] }
    return [s, 'success']
  })) as Record<Step, Result>
}
export const green = (push: Push) => Object.values(run(push)).every((r) => r === 'success')
/** Seconds until the run turns red or green: every step up to and including the failing one. */
export const secondsToVerdict = (push: Push) => STEPS.filter((s) => run(push)[s] !== 'skipped').reduce((a, s) => a + SECONDS[s], 0)
