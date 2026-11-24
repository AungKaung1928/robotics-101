// Level 0 "meet": what makes a machine a robot, and the parts of ours. Pure, no DOM.

export interface Machine { moves: boolean; senses: boolean; decidesItself: boolean }

/** A robot senses, decides by itself and moves; missing one of the three, it is not (spec APP_R101_ONRAMP.md). */
export const isRobot = (m: Machine) => m.moves && m.senses && m.decidesItself

/** What the reader adds to the remote-control car: a distance sensor, a turn rule, or both. */
export interface Upgrade { sensor: boolean; rule: boolean }

/** Who decides when the car turns: the rule only when it has sensor data to read; otherwise the person with the remote. */
export const decider = (u: Upgrade): 'person' | 'rule' => (u.sensor && u.rule ? 'rule' : 'person')

/** A remote-control car moves; it senses with a sensor, and decides by itself only once a rule reads that sensor. */
export const rcCar = (u: Upgrade): Machine => ({ moves: true, senses: u.sensor, decidesItself: decider(u) === 'rule' })

export type PartId = 'wheels' | 'battery' | 'computer' | 'sensor'
/**
 * Side view of the Burger's stacked plates (bottom to top: wheels + battery, the small computers, the spinning
 * distance sensor on top), svg units; each part names the Level 0 chapter that teaches it. Hit boxes: one or more rects.
 */
export const PARTS: { id: PartId; rects: [number, number, number, number][]; next: string }[] = [
  { id: 'wheels', rects: [[50, 228, 56, 56], [194, 228, 56, 56]], next: 'move' },
  { id: 'battery', rects: [[70, 186, 160, 34]], next: 'act' },
  { id: 'computer', rects: [[70, 136, 160, 40]], next: 'think' },
  { id: 'sensor', rects: [[112, 80, 76, 46]], next: 'sense' },
]
export const FIG = { w: 300, h: 300 }
