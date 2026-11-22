// The arena and robot of TF-Transform-Explorer, read from its files (file:line in `source`).
// Units: metres, radians, seconds (REP 103).

export type Box = { kind: 'box'; name: string; x: number; y: number; w: number; h: number; yaw: number }
export type Disc = { kind: 'disc'; name: string; x: number; y: number; r: number }
export type Shape = Box | Disc

const WALL = 0.2
// worlds/explorer_world.sdf:47-140 (pose x y z roll pitch yaw; box size x y z; cylinder radius)
export const WALLS: Box[] = [
  { kind: 'box', name: 'wall_north', x: 0, y: 5, w: 10, h: WALL, yaw: 0 },
  { kind: 'box', name: 'wall_south', x: 0, y: -5, w: 10, h: WALL, yaw: 0 },
  { kind: 'box', name: 'wall_east', x: 5, y: 0, w: 10, h: WALL, yaw: 1.5708 },
  { kind: 'box', name: 'wall_west', x: -5, y: 0, w: 10, h: WALL, yaw: 1.5708 },
]
export const OBSTACLES: Shape[] = [
  { kind: 'box', name: 'box1', x: 2, y: 2, w: 1, h: 1, yaw: 0 },
  { kind: 'disc', name: 'cylinder1', x: -2, y: -2, r: 0.5 },
  { kind: 'box', name: 'box2', x: -2, y: 3, w: 1.5, h: 0.5, yaw: 0.5 },
]
export const WORLD: Shape[] = [...WALLS, ...OBSTACLES]

export const SLAM_MAX_LASER_RANGE = 12.0 // config/slam_params.yaml:12

export const LIDAR = {
  hz: 5, // description/turtlebot3_burger.urdf.xacro:168
  samples: 360, // :174
  minAngle: -3.141592, // :176
  maxAngle: 3.141592, // :177
  minRange: 0.12, // :181
  maxRange: 3.5, // :182
}

export const NAV2 = {
  controllerHz: 20, // config/nav2_params.yaml:18
  maxVelX: 0.26, // :39
  goalTolerance: 0.25, // :31
  costmapResolution: 0.05, // :81
  robotRadius: 0.22, // :82
  costScaling: 3.0, // :86
  inflationRadius: 0.55, // :87
}

export const SOURCE_REPO = 'https://github.com/AungKaung1928/TF-Transform-Explorer'

export const LAUNCH_NAV2_S = 10 // CONTEXT.md "Stage delays": Nav2 starts 10 s after launch
export const PATROL_WAIT_S = 15 // README "Run": patrol waits 15 s after Nav2
export const TF_MAX_JUMP = 0.5 // src/tf_anomaly_detector.cpp:11
export const TF_MAX_AGE = 1.0 // src/tf_anomaly_detector.cpp:10
export const TF_CHECK_PERIOD = 0.5 // src/tf_anomaly_detector.cpp:26, 500 ms timer
export const BASE_TO_SCAN = { x: -0.032, y: 0, yaw: 0 } // description/turtlebot3_burger.urdf.xacro:118

/** Plan positions of the 7 waypoints (m) and the side their label sits on. Drawn for this page, not the robot's patrol code. */
export const WAYPOINTS: { x: number; y: number; side: 'left' | 'right' }[] = [
  { x: -3.5, y: -4, side: 'right' },
  { x: 0.3, y: -4, side: 'right' },
  { x: 3.6, y: -2.4, side: 'left' },
  { x: 3.8, y: 0.5, side: 'left' },
  { x: 3.6, y: 3.8, side: 'left' },
  { x: 0.4, y: 2, side: 'left' },
  { x: -3.8, y: -0.2, side: 'right' },
]
