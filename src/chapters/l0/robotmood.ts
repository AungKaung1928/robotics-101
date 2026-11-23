// The round robot's face in the Level 0 figures (spec APP_R101_ONRAMP.md "cute"): curious while sensing, dizzy when
// something is broken, proud when the check question is right. Broken wins over proud. Pure, no DOM.
export type Mood = 'idle' | 'curious' | 'dizzy' | 'proud'

export const mood = (p: { broken: boolean; solved: boolean; sensing?: boolean }): Mood =>
  p.broken ? 'dizzy' : p.solved ? 'proud' : p.sensing ? 'curious' : 'idle'
