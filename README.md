# Robotics First Steps

A mobile robot's first ideas, seen top-down on the floor plan of a real ROS 2 setup: one TurtleBot3 in a 10 × 10 m Gazebo arena. Each waypoint is one idea with one interactive figure, and every value comes from the source repo's files ([TF-Transform-Explorer](https://github.com/AungKaung1928/TF-Transform-Explorer)), cited by file and line.

![LiDAR scan chapter: 360 beams ray-cast from the robot, returns on the obstacles within 3.5 m](docs/media/scan.png)

| Waypoint | What you change | What you read |
|---|---|---|
| 2. The TF tree | drift of odom in map, robot pose in odom; odom jump and transform age | one LiDAR hit written in map, odom, base_link, base_scan; the anomaly detector's verdict (stale over 1.0 s, jump over 0.5 m) |
| 3. One LiDAR scan | robot pose, range, scan rate | beams with a return; gap between beams (6.1 cm at 3.5 m); distance moved per scan |
| 6. Costmap inflation | Nav2 `cost_scaling_factor`, distance to obstacle | cost of the cell (253 inside the 0.22 m radius, 93 at the 0.55 m edge, then 0) |

Four more waypoints (bring-up order, a simple detector, occupancy grid, reaching a goal) are on the plan, marked planned.

## Run

Needs Node 22.12+ (vitest 5 requires it) and, for the page check, Chrome.

```bash
git clone https://github.com/AungKaung1928/robotics-first-steps
cd robotics-first-steps
npm ci
npm run dev          # open the printed localhost URL
npm test             # ray cast, transforms, detector rule, inflation cost, routes, patrol path
scripts/verify.sh    # builds, loads every page in headless Chrome (EN/JA, 390 px); ends with "PASS 8 pages"
```

## Sources

- Robot, sensor, Nav2 values and the arena: [TF-Transform-Explorer](https://github.com/AungKaung1928/TF-Transform-Explorer) (`description/turtlebot3_burger.urdf.xacro`, `config/nav2_params.yaml`, `worlds/explorer_world.sdf`).
- Inflation cost: [Nav2 InflationLayer](https://docs.nav2.org/configuration/packages/costmap-plugins/inflation.html).
- Units and axes: [REP 103](https://www.ros.org/reps/rep-0103.html).

## License

MIT
