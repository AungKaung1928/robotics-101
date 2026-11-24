/**
 * Chapter 5.5 model, part 1: managed (lifecycle) node states and transitions, design.ros2.org "Managed nodes".
 * 4 primary states; an external supervisor triggers each transition. Inactive = no execution time, managed topics not processed.
 */
export type State = 'unconfigured' | 'inactive' | 'active' | 'finalized'
export type Transition = 'configure' | 'activate' | 'deactivate' | 'cleanup' | 'shutdown'
export const TRANSITIONS: Transition[] = ['configure', 'activate', 'deactivate', 'cleanup', 'shutdown']

const NEXT: Record<Transition, [State[], State]> = {
  configure: [['unconfigured'], 'inactive'],
  activate: [['inactive'], 'active'],
  deactivate: [['active'], 'inactive'],
  cleanup: [['inactive'], 'unconfigured'],
  shutdown: [['unconfigured', 'inactive', 'active'], 'finalized'],
}
/** null = the transition is not valid from this state (the node rejects it and stays put). */
export const step = (s: State, tr: Transition): State | null => (NEXT[tr][0].includes(s) ? NEXT[tr][1] : null)
/** Only an active node processes incoming data (design doc, "Primary State: Inactive"). */
export const processes = (s: State) => s === 'active'

/**
 * Part 2: executors. One node, a 100 ms control timer (10 ms of work) and a slow map-save callback that starts at
 * SLOW_AT and runs SLOW_MS. Illustrative timings, not measured. Docs (Jazzy "Executors"): callbacks without a group go to
 * the node's default group, which is mutually exclusive; a multi-threaded executor runs callbacks of different groups in parallel.
 */
export type Exec = 'single' | 'multi_default' | 'multi_groups'
export const PERIOD = 100, SLOW_AT = 250, SLOW_MS = 350, HORIZON = 1000
export const ticks = () => Array.from({ length: HORIZON / PERIOD }, (_, k) => (k + 1) * PERIOD) // due at 100..1000 ms

/** Start time of each control tick: blocked ticks wait until the slow callback ends. */
export function starts(ex: Exec): number[] {
  const blocks = ex !== 'multi_groups'
  return ticks().map((due) => (blocks && due >= SLOW_AT && due < SLOW_AT + SLOW_MS ? SLOW_AT + SLOW_MS : due))
}
export const late = (ex: Exec) => starts(ex).filter((st, k) => st > ticks()[k]).length
export const worstDelay = (ex: Exec) => Math.max(...starts(ex).map((st, k) => st - ticks()[k]))
