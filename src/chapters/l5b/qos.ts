/**
 * Chapter 5.4 model: ROS 2 QoS compatibility (docs.ros.org Jazzy "Quality of Service settings", tables
 * "Compatibility of reliability / durability QoS policies"). A connection needs every policy compatible.
 * The lossy link is illustrative: every 4th scan (k % 4 === 3) is dropped on the wire, 25 % loss. Not a measured link.
 */
export type Rel = 'reliable' | 'best_effort'
export type Dur = 'volatile' | 'transient_local'
export interface Qos { rel: Rel; dur: Dur }

/** ROS 2 default for publishers and subscriptions: keep last 10, reliable, volatile (same docs page). */
export const DEFAULT_QOS: Qos = { rel: 'reliable', dur: 'volatile' }
export const DEFAULT_DEPTH = 10
export const N = 20 // scans sent at 10 Hz = 2 s
export const lostOnWire = (k: number) => k % 4 === 3

/** Docs table: only best-effort publisher + reliable subscription fails. */
export const relOk = (pub: Rel, sub: Rel) => !(pub === 'best_effort' && sub === 'reliable')
/** Docs table: only volatile publisher + transient-local subscription fails. */
export const durOk = (pub: Dur, sub: Dur) => !(pub === 'volatile' && sub === 'transient_local')
export const connected = (pub: Qos, sub: Qos) => relOk(pub.rel, sub.rel) && durOk(pub.dur, sub.dur)

export type Fate = 'ok' | 'resent' | 'lost' | 'none'
/** What happens to each of the N scans at the subscriber. A matched reliable pair resends a dropped sample. */
export function fates(pub: Qos, sub: Qos): Fate[] {
  if (!connected(pub, sub)) return Array<Fate>(N).fill('none')
  const reliable = pub.rel === 'reliable' && sub.rel === 'reliable'
  return Array.from({ length: N }, (_, k) => (!lostOnWire(k) ? 'ok' : reliable ? 'resent' : 'lost'))
}
export const received = (pub: Qos, sub: Qos) => fates(pub, sub).filter((f) => f === 'ok' || f === 'resent').length

/**
 * Late joiner: the map publisher sends MAPS updates, then RViz starts. Transient local on both ends hands it the
 * last `depth` of them (keep last depth); any other matched pair gives it none until the next update.
 */
export const MAPS = 3
export const lateJoinerGets = (pub: Qos, sub: Qos, depth: number) =>
  connected(pub, sub) && pub.dur === 'transient_local' && sub.dur === 'transient_local' ? Math.min(depth, MAPS) : 0
/** Challenge: the late RViz gets the newest map and only that one (Nav2 map_server: KeepLast(1), transient local). */
export const challengeOk = (pub: Qos, sub: Qos, depth: number) => lateJoinerGets(pub, sub, depth) === 1
