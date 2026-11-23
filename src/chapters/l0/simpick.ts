// Level 0 "simpick": the simulator ladder + a 3-question helper. Every fact behind a row is in
// the R101_SIM_FACTS.md notes (checked 2026-11-23); the URLs here are the ones listed there.

export type RowId = 'site' | 'turtlesim' | 'fake' | 'mvsim' | 'gazebo' | 'isaac'
export interface Row { id: RowId; dim: '2D' | '2.5D' | '3D' | 'none'; url: string; mentionOnly?: true } // none = no world, only the robot shown in RViz

export const LADDER: Row[] = [
  { id: 'site', dim: '2D', url: '' },
  { id: 'turtlesim', dim: '2D', url: 'https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Introducing-Turtlesim/Introducing-Turtlesim.html' },
  { id: 'fake', dim: 'none', url: 'https://emanual.robotis.com/docs/en/platform/turtlebot3/fakenode_simulation/' },
  { id: 'mvsim', dim: '2.5D', url: 'https://index.ros.org/p/mvsim/' },
  { id: 'gazebo', dim: '3D', url: 'https://emanual.robotis.com/docs/en/platform/turtlebot3/simulation/' },
  { id: 'isaac', dim: '3D', url: 'https://docs.isaacsim.omniverse.nvidia.com/6.0.1/installation/requirements.html', mentionOnly: true },
]
/** Other sources the page cites (facts file rows). */
export const SOURCES = {
  gazeboHumble: 'https://github.com/ROBOTIS-GIT/turtlebot3_simulations/blob/humble/turtlebot3_gazebo/package.xml',
  gazeboJazzy: 'https://github.com/ROBOTIS-GIT/turtlebot3_simulations/blob/jazzy/turtlebot3_gazebo/package.xml',
  classicEol: 'https://classic.gazebosim.org/',
  webots: 'https://cyberbotics.com/doc/guide/turtlebot3-burger',
  stage: 'https://github.com/tuw-robotics/stage_ros2',
  flatland: 'https://index.ros.org/p/flatland_server/',
}

export interface Answers { gpu: boolean | null; sensor: boolean | null; physics: boolean | null }

/**
 * The one row to start with. Nothing answered yet: this site. No distance sensor and no physics: turtlesim.
 * A distance sensor without physics, or physics without a graphics card (the field note: the 3D window stayed black): mvsim.
 * Physics with a graphics card: Gazebo. Isaac Sim is never the pick (mention only). The fake node has no sensors
 * (e-Manual), so the helper never needs it; it stays on the ladder for driving + RViz practice.
 */
export function pick(a: Answers): RowId {
  if (a.gpu === null || a.sensor === null || a.physics === null) return 'site'
  if (a.physics) return a.gpu ? 'gazebo' : 'mvsim'
  return a.sensor ? 'mvsim' : 'turtlesim'
}
