# Features checked by scripts/verify.sh

| Route | What the page must show (EN and JA) |
|---|---|
| `#/` | h1, the arena plan, links to all 7 waypoints |
| `#/bringup` | h1, launch timeline, readouts: patrol start (25 s), early starts "none" at his delays |
| `#/bringup/3` | step 3 of 7: time cursor at SLAM, the 4 later stages dimmed |
| `#/tf` | h1, arena with map/odom/base_link axes, the box1 hit in map and base_scan, detector verdict "healthy" at the start values |
| `#/scan` | h1, arena figure, readouts: beams with a return, gap between beams, distance per scan |
| `#/goal` | h1, arena with tolerance circle and tick dots, readouts: per tick, distance to drive, minimum time, ticks |
| `#/detect` | h1, arena with coloured clusters, readouts: objects found, objects in view |
| `#/grid` | h1, occupancy canvas, readouts: cells (40,000 at 0.05 m), scans added, known share |
| `#/grid/7` | 7 scans added (one per waypoint): known share above the 1-scan page |
| `#/costmap` | h1, cost chart, readouts: cost at the probe, cost at the inflation edge |

Every page: `<html lang>` matches the language, no sideways scroll in a 390 px frame.
