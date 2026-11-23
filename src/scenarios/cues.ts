import type { CppScene } from '../chapters/l1/cpp'
import { JUMP_AT, flagged } from '../chapters/l2/params'

/**
 * Mascot trigger props from chapter models, for chapters that only need the robot's reaction (spread into <Mascot>).
 * Counters only grow, so each new event reacts once.
 */

/** C++ (1.x): thinks while compiling; a compile error is relief (the compiler caught `int stop_at{0.5}` before the robot
 * drove); `int stop_at = 0.5` silently becomes 0, the rule never fires and the crash wobbles. */
export function cppCue(f: CppScene) {
  return { thinking: f.phase === 'compile', cheer: f.phase === 'error' ? 1 : 0, oops: f.drive?.crashed ? 1 : 0 }
}

/** Params (2.x): after check `k` (0-based) with threshold `max`: one wobble per false alarm so far, a cheer once the real
 * jump (check JUMP_AT) is caught. A missed jump gets no reaction: the silence is the bug. */
export function paramsCue(max: number, k: number) {
  const f = flagged(max).slice(0, k + 1)
  return { oops: f.filter((x, i) => x && i !== JUMP_AT).length, cheer: f[JUMP_AT] ? 1 : 0 }
}
