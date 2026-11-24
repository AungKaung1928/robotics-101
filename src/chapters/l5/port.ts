/**
 * 5.1 Python → C++ port, from his wall follower in both languages:
 * - Python: turtlebot3-wall-follower wall_following_project/wall_follower_controller.py:132-153 (_angle_to_index, _range_at_index)
 * - C++:    turtlebot3-wall-follower-cpp src/wall_detector.cpp:21-39 (indexFor, validRange)
 * Same idea: a bearing in degrees → which of the scan's rays to read. The one line that has to change is the wrap:
 * Python's % never returns a negative number, C++ std::fmod keeps the sign of the left side, so the C++ adds 2π back (:25-27).
 * JavaScript's % behaves like std::fmod, which is why this model can show both.
 */
export type Scan = { angleMin: number; inc: number; n: number }
/** The gtest's scan (test/test_wall_detector.cpp:19-21, 23): 360 rays, one per degree; angle_min 0 = LDS-01, -π = the other layout (:68). */
export const LDS: Scan = { angleMin: 0, inc: (2 * Math.PI) / 360, n: 360 }
export const HALF: Scan = { ...LDS, angleMin: -Math.PI }
const TWO_PI = 2 * Math.PI
const rad = (deg: number) => (deg * Math.PI) / 180

/** Python: offset = (radians(deg) - angle_min) % (2π); int(round(offset / inc)) % n (py:142-143). */
export function pyIndex(s: Scan, deg: number): number {
  const offset = (((rad(deg) - s.angleMin) % TWO_PI) + TWO_PI) % TWO_PI // Python % = floor modulo, never negative
  return Math.round(offset / s.inc) % s.n
}

/** std::lround: halves round away from zero. */
const lround = (x: number) => Math.sign(x) * Math.round(Math.abs(x))

/** C++ indexFor (cpp:21-30). `wrapFix` = the `if (offset < 0.0) offset += kTwoPi;` lines (:25-27). Returned as BigInt-safe number. */
export function cppIndex(s: Scan, deg: number, wrapFix = true): { offset: number; raw: bigint; idx: number } {
  let offset = (rad(deg) - s.angleMin) % TWO_PI // std::fmod: sign of the left side
  if (wrapFix && offset < 0) offset += TWO_PI
  const r = BigInt(lround(offset / s.inc))
  const raw = r < 0n ? (1n << 64n) + r : r // static_cast<std::size_t>(negative) wraps modulo 2^64
  return { offset, raw, idx: Number(raw % BigInt(s.n)) }
}

/** Both: NaN / inf / outside (range_min, range_max) → inf (py:145-153, cpp:32-39). */
export function validRange(r: number, min = 0.12, max = 3.5): number {
  return !Number.isFinite(r) || r <= min || r >= max ? Infinity : r
}

/** The side-by-side lines: what changes in the port. Line refs into each repo. */
export const DIFFS = ['types', 'wrap', 'owner', 'qos', 'build'] as const
export type Diff = (typeof DIFFS)[number]
/** 'dir/f.py#L141-L143' -> ['dir/f.py', ':141-143']: the line part is shown unbroken (a wrap inside it reads as another line). */
export function citeParts(p: string): [string, string] {
  const i = p.indexOf('#L')
  return i < 0 ? [p, ''] : [p.slice(0, i), ':' + p.slice(i + 2).replace('-L', '-')]
}
export const PY_REPO = 'https://github.com/AungKaung1928/turtlebot3-wall-follower/blob/f6fb44f'
export const CPP_REPO = 'https://github.com/AungKaung1928/turtlebot3-wall-follower-cpp/blob/c2961d6'
export const REFS: Record<Diff, { py: string; cpp: string }> = {
  types: { py: 'wall_following_project/wall_follower_controller.py#L141-L143', cpp: 'src/wall_detector.cpp#L23-L29' },
  wrap: { py: 'wall_following_project/wall_follower_controller.py#L142', cpp: 'src/wall_detector.cpp#L24-L27' },
  owner: { py: 'wall_following_project/wall_follower_controller.py#L127-L130', cpp: 'src/wall_follower_controller.cpp#L91-L95' },
  qos: { py: 'wall_following_project/wall_follower_controller.py#L50-L56', cpp: 'src/wall_follower_controller.cpp#L23-L26' },
  build: { py: 'setup.py#L38-L41', cpp: 'CMakeLists.txt#L27' },
}
