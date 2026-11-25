import { FAILS, correct, type FailId } from '../chapters/l5b/fieldfail'

/**
 * Chapter 5.6 scene: the case track. A marker slides to the current case; a case tile pops when its first-try result
 * is set; the mascot cheers a right cause and wobbles at a wrong one (fieldfail.correct()). Tile geometry = the chapter's svg.
 */
export const TILE_X0 = 10, TILE_PITCH = 105, TILE_W = 95
export const markerX = (i: number) => TILE_X0 + i * TILE_PITCH
export const reaction = (i: number, pick: FailId): 'cheer' | 'oops' => (correct(i, pick) ? 'cheer' : 'oops')
export const tileLook = (first: Record<string, boolean>, id: string) => (first[id] === true ? 'body' : first[id] === false ? 'qfull' : 'qslot')
export const N_CASES = FAILS.length
