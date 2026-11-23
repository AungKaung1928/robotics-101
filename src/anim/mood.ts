import { useCallback, useState } from 'react'

/** What a chapter tells the robot; the hook turns it into the Mascot's trigger props. */
export type MoodEvent = 'solved' | 'broke' | 'go' | 'stop'
const KEY = { solved: 'cheer', broke: 'oops', go: 'start', stop: 'brake' } as const

/**
 * One mood API for any chapter: `const m = useMood(); <Mascot {...m.props} label=... />`, then `m.emit('solved')`
 * (happy bounce + sparks), 'broke' (wobble + dizzy stars), 'go' / 'stop' (the inertia jolts), `m.think(true)` for the
 * thought dots. Idle variety comes with it: the robot falls asleep after `sleepAfter` s without input (default 20).
 */
export function useMood(sleepAfter = 20) {
  const [n, setN] = useState({ cheer: 0, oops: 0, start: 0, brake: 0 })
  const [thinking, think] = useState(false)
  const emit = useCallback((e: MoodEvent) => setN((c) => ({ ...c, [KEY[e]]: c[KEY[e]] + 1 })), [])
  return { props: { ...n, thinking, sleepAfter }, emit, think }
}
