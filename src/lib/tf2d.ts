/** A planar transform: child frame pose in its parent frame (m, rad). */
export type TF = { x: number; y: number; yaw: number }

/** parent_T_child ∘ child_T_grandchild = parent_T_grandchild. */
export function compose(a: TF, b: TF): TF {
  const c = Math.cos(a.yaw), s = Math.sin(a.yaw)
  return { x: a.x + c * b.x - s * b.y, y: a.y + s * b.x + c * b.y, yaw: a.yaw + b.yaw }
}

export function invert(t: TF): TF {
  const c = Math.cos(t.yaw), s = Math.sin(t.yaw)
  return { x: -c * t.x - s * t.y, y: s * t.x - c * t.y, yaw: -t.yaw }
}

/** A point given in the child frame, expressed in the parent frame. */
export function apply(t: TF, p: [number, number]): [number, number] {
  const c = Math.cos(t.yaw), s = Math.sin(t.yaw)
  return [t.x + c * p[0] - s * p[1], t.y + s * p[0] + c * p[1]]
}
