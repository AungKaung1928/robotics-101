# Robotics 101

**Live: https://robotics-101.vercel.app** (work in progress: new chapters land here as they are built)

A free course for people with no robotics experience: from "what does a robot do" to the work of a robotics software engineer, in small steps. Every chapter is one idea with one figure you can drive; most add a "break it" button that causes the real failure and a hands-on challenge. One simulated TurtleBot3 runs through the whole course; its values come from a real ROS 2 setup ([TF-Transform-Explorer](https://github.com/AungKaung1928/TF-Transform-Explorer)). English and Japanese.

| Level | Chapters |
|---|---|
| 0 Start here | sense-think-act, the software around a robot, the tools, which ROS version |
| 1 Programming for robots | decisions, closest reading, callbacks, Python to C++, the terminal |
| 2 ROS 2 basics | nodes, topics, message types, actions, parameters, workspaces, driving |
| 3 A robot that moves by itself | LiDAR scan, TF tree, TF debugging lab, a simple detector |
| 4 Mapping and navigation | occupancy grid, costmap, reaching a goal, bring-up order |
| Engineering Practice (optional) | BFS on a grid, telemetry when messages arrive late |

![The level map, then one chapter per level: 0.1 sense-think-act, 1.1 decisions, 2.1 nodes, 3.3 TF debugging lab, the occupancy grid, reaching a goal, and EP1 BFS](docs/media/demo.gif)

The seven patrol chapters (Levels 3-4) and the numbers they show:

| Waypoint | What you change | What you read |
|---|---|---|
| 1. Bring-up order | SLAM and Nav2 start times; step through the launch (Back / Play / Next) | patrol start (24 s with the launch file's delays); which stage starts before what it needs |
| 2. The TF tree | drift of odom in map, robot pose in odom; odom jump and transform age | one LiDAR hit written in map, odom, base_footprint, base_link, base_scan; the anomaly detector's verdict (stale over 1.0 s, jump over 0.5 m) |
| 3. One LiDAR scan | robot pose, range, scan rate; hover a return | beams with a return; gap between beams (6.1 cm at 3.5 m); distance moved per scan; measured /scan 4.5–4.8 Hz against 5 Hz configured |
| 4. A simple detector | robot position, break threshold | objects found vs objects in view: 0.1 m gives 5 pieces, 0.5 m the 3 objects (start pose) |
| 5. Occupancy grid | resolution; Add scan from each waypoint | cells in the map (40,000 at his 0.05 m); share of cells no longer unknown |
| 6. Costmap inflation | Nav2 `cost_scaling_factor`, distance to obstacle | cost of the cell (253 inside the 0.22 m radius, 93 at the 0.55 m edge, then 0) |
| 7. Reaching a goal | goal distance | 1.3 cm per 20 Hz control tick at 0.26 m/s; distance left after the 0.25 m tolerance; minimum time and ticks |

## How it is checked

`npm test` pins every number on the pages and in this README to the code. `scripts/verify.sh` opens every page and state (`#/bringup/3`, `#/tf?jump=0.6`, ...) in English and Japanese, plus a 390 px phone frame; commands in `package.json` (feature map: [docs/FEATURES.md](docs/FEATURES.md)). CI also runs `scripts/keys.mjs`, which uses real keys, clicks and hover.

## Sources

- Robot, sensor, Nav2 values and the arena: [TF-Transform-Explorer](https://github.com/AungKaung1928/TF-Transform-Explorer) (`description/turtlebot3_burger.urdf.xacro`, `config/nav2_params.yaml`, `worlds/explorer_world.sdf`).
- Inflation cost: [Nav2 InflationLayer](https://docs.nav2.org/configuration/packages/costmap-plugins/inflation.html).
- Units and axes: [REP 103](https://www.ros.org/reps/rep-0103.html).

## License

MIT
