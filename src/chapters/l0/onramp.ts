// On-ramp path data for the chapters lane app2 owns (spec APP_R101_ONRAMP.md): reading order of the new Level 0
// chapters, difficulty dots (1-5) and the one "you already know" chapter each grows from. The lead renders it.

/** New Level 0 chapters in reading order: group A (meet the robot), then group B (a practice world). */
export const ONRAMP_A = ['meet', 'move', 'sense', 'think', 'act'] as const
export const ONRAMP_B = ['simwhat', 'simpick'] as const

/** Difficulty dots, 1 (no software at all) to 5. Level 1 adds code, Level 2 adds ROS 2 itself. */
export const DOTS: Record<string, number> = {
  meet: 1, move: 1, sense: 1, think: 1, act: 1, simwhat: 1, simpick: 1,
  decide: 2, closest: 2, callback: 2, cpp: 2, shell: 2,
  nodes: 3, topics: 3, msgtypes: 3, actions: 3, params: 3, ws: 3, drive: 3,
}

/** "You already know: <id>" for each chapter that grows from an earlier one (route ids; lead's 'loop' not listed). */
export const GROWS_FROM: Record<string, string> = {
  move: 'meet', sense: 'meet', think: 'sense', act: 'move', simwhat: 'sense', simpick: 'simwhat',
  decide: 'think', closest: 'sense', drive: 'act',
}
