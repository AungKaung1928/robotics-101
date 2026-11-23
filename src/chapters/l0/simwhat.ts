// Level 0 "simwhat": the world (simulator) beside the robot's view (RViz). Reuses the sense model; pure, no DOM.
import { BEAMS, FRONT_START, ROOM, turn, valid } from './sense'

export { FRONT_START, ROOM }
export const FRONT_MIN = 0.5
export const FRONT_MAX = 3.0 // stays inside the sensor's 3.5 m, so the view always shows the front wall while the sensor is on

export interface Dot { x: number; y: number }

/** What the view window can draw: one dot per valid reading, in the robot's own frame. Sensor off = nothing arrives. */
export function view(front: number, sensorOn: boolean): Dot[] {
  if (!sensorOn) return []
  return turn(front).flatMap((r, i) => {
    if (!valid(r)) return []
    const a = (2 * Math.PI * i) / BEAMS
    return [{ x: r * Math.cos(a), y: r * Math.sin(a) }]
  })
}

/** The world does not depend on the sensor: the walls are where they are. */
export const world = (front: number) => ({ back: ROOM.back, side: ROOM.side, front })

/** Figure: two panels of PANEL_W svg units, same scale; simwhat.test checks the room fits one panel. */
export const VIEW = { w: 600, h: 260, panelW: 290, gap: 20, px: 68, ox: 70, oy: 140 }
