import { P } from '../chapters/l3/wall'

/**
 * Chapter 3.2 scene: what the PD law looks at. With look-ahead the controller measures the wall distance la metres
 * ahead along the heading, d - la*sin(alpha); its error is that minus the desired 0.5 m (wall.ts run(), err line).
 * The figure draws the look-ahead point and the error bar from it to the 0.5 m line.
 */
export function wallErr(d: number, alpha: number, la: number) {
  const dAhead = d - la * Math.sin(alpha)
  return { dAhead, ahead: la * Math.cos(alpha), err: dAhead - P.desired }
}
