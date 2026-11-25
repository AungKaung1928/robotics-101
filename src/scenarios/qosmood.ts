/** 5.4 mascot reaction for a settings change, from the model's own verdicts: a newly solved challenge cheers,
 *  a newly broken link (incompatible QoS: nothing arrives, no error is thrown) wobbles. Cheer wins a tie. */
export type QosView = { ok: boolean; linked: boolean }
export const qosReaction = (prev: QosView, next: QosView): 'cheer' | 'oops' | null =>
  !prev.ok && next.ok ? 'cheer' : prev.linked && !next.linked ? 'oops' : null
