// Level 0 "simpick": the simulator ladder + a 3-question helper. Every fact behind a row is in
// the R101_SIM_FACTS.md notes (checked 2026-11-23); the URLs here are the ones listed there.

export type RowId = 'site' | 'turtlesim' | 'mvsim' | 'gazebo' | 'webots'
export interface Row { id: RowId; dim: '2D' | '2.5D' | '3D'; url: string; alt?: true } // alt = same step as the row before it: pick one

/** Exactly 5, beginner -> mid (interactive-session plan 2026-11-24 "app-SIM"; URLs answered HTTP 200 on 2026-11-25). */
export const LADDER: Row[] = [
  { id: 'site', dim: '2D', url: '' },
  { id: 'turtlesim', dim: '2D', url: 'https://docs.ros.org/en/jazzy/Tutorials/Beginner-CLI-Tools/Introducing-Turtlesim/Introducing-Turtlesim.html' },
  { id: 'mvsim', dim: '2.5D', url: 'https://index.ros.org/p/mvsim/' },
  { id: 'gazebo', dim: '3D', url: 'https://emanual.robotis.com/docs/en/platform/turtlebot3/simulation/' },
  { id: 'webots', dim: '3D', url: 'https://docs.ros.org/en/jazzy/Tutorials/Advanced/Simulators/Webots/Installation-Windows.html', alt: true },
]
/** The ladder as drawn, top step first: an alt row shares the step of the row before it (Gazebo | Webots). */
export const STEPS: Row[][] = LADDER.reduce<Row[][]>((acc, r) => (r.alt ? (acc[acc.length - 1].push(r), acc) : [...acc, [r]]), []).reverse()

/** Other sources the page cites (facts file rows + the footnote). */
export const SOURCES = {
  gazeboHumble: 'https://github.com/ROBOTIS-GIT/turtlebot3_simulations/blob/humble/turtlebot3_gazebo/package.xml',
  gazeboJazzy: 'https://github.com/ROBOTIS-GIT/turtlebot3_simulations/blob/jazzy/turtlebot3_gazebo/package.xml',
  classicEol: 'https://classic.gazebosim.org/',
  webots: 'https://cyberbotics.com/doc/guide/turtlebot3-burger',
  isaac: 'https://docs.isaacsim.omniverse.nvidia.com/latest/installation/requirements.html',
  stage: 'https://github.com/tuw-robotics/stage_ros2',
  flatland: 'https://index.ros.org/p/flatland_server/',
}

export interface Answers { gpu: boolean | null; sensor: boolean | null; physics: boolean | null }

/**
 * The one row to start with. Nothing answered yet: this site. No distance sensor and no physics: turtlesim.
 * A distance sensor without physics, or physics without a graphics card (the field note: the 3D window stayed black): mvsim.
 * Physics with a graphics card: Gazebo. Webots shares Gazebo's step (alt) and is never lit: the page says pick one.
 */
export function pick(a: Answers): RowId {
  if (a.gpu === null || a.sensor === null || a.physics === null) return 'site'
  if (a.physics) return a.gpu ? 'gazebo' : 'mvsim'
  return a.sensor ? 'mvsim' : 'turtlesim'
}
