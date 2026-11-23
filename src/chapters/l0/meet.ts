// Level 0 "meet": what makes a machine a robot, and the parts of ours. Pure, no DOM.

export interface Machine { moves: boolean; senses: boolean; decidesItself: boolean }

/** A robot senses, decides by itself and moves; missing one of the three, it is not (spec APP_R101_ONRAMP.md). */
export const isRobot = (m: Machine) => m.moves && m.senses && m.decidesItself

/** A remote-control car moves, but a person sees and decides. Upgraded = a distance sensor and a stop rule added. */
export const rcCar = (upgraded: boolean): Machine => ({ moves: true, senses: upgraded, decidesItself: upgraded })

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
