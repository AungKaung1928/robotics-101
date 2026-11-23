import type { Scenario } from '../../anim/contract'
import { scenario as driveScenario, run, type DecideScene } from './decide'

/** Chapter 1.4 model: the 1.1 robot in C++. The type you declare decides what stop_at really holds. */
export type Decl = 'double' | 'int' | 'int{}'
export const DECLS: Decl[] = ['double', 'int', 'int{}']
export const COMPILE_MS = 1200 // drawn length of the compile step (not a measured time)

export const line = (d: Decl) => (d === 'double' ? 'double stop_at = 0.5;' : d === 'int' ? 'int stop_at = 0.5;' : 'int stop_at{0.5};')

/** g++ 11.4 -Wall output for `int stop_at{0.5};`, reproduced on the bench laptop (int = 0.5 compiles with no warning, value 0). */
export const GCC_ERROR = 'error: narrowing conversion of ‘5.0e-1’ from ‘double’ to ‘int’ [-Wnarrowing]'

export interface Compiled { ok: boolean; value: number | null }

/** What the compiler does with each declaration: double keeps 0.5, int drops the fraction, braces refuse to. */
export function compile(d: Decl): Compiled {
  if (d === 'int{}') return { ok: false, value: null }
  return { ok: true, value: d === 'int' ? Math.trunc(0.5) : 0.5 }
}

export const outcome = (d: Decl) => {
  const c = compile(d)
  return c.ok ? run(c.value!) : null
}

export interface CppScene extends Record<string, unknown> {
  phase: 'compile' | 'error' | 'drive'; compiled: number; drive: DecideScene | null
}

/** Scenario: compile bar first; then the 1.1 drive with the value the compiler kept, or stop at the error. */
export function scenario(d: Decl): Scenario<CppScene> {
  const c = compile(d)
  const drive = c.ok ? driveScenario(c.value!) : null
  const durationMs = COMPILE_MS + (drive ? drive.durationMs : 600)
  return {
    id: 'l1-cpp',
    durationMs,
    eventsMs: [0, COMPILE_MS, durationMs],
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), durationMs)
      if (t < COMPILE_MS) return { phase: 'compile', compiled: t / COMPILE_MS, drive: null }
      if (!drive) return { phase: 'error', compiled: 1, drive: null }
      return { phase: 'drive', compiled: 1, drive: drive.frame(t - COMPILE_MS) }
    },
  }
}
