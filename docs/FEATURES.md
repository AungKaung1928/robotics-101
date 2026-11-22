# Features checked by scripts/verify.sh

| Route | What the page must show (EN and JA) |
|---|---|
| `#/` | h1, the arena plan, links to the 5 built waypoints, 2 waypoints marked planned |
| `#/bringup` | h1, launch timeline, readouts: patrol start (25 s), early starts "none" at his delays |
| `#/tf` | h1, arena with map/odom/base_link axes, the box1 hit in map and base_scan, detector verdict "healthy" at the start values |
| `#/scan` | h1, arena figure, readouts: beams with a return, gap between beams, distance per scan |
| `#/goal` | h1, arena with tolerance circle and tick dots, readouts: per tick, distance to drive, minimum time, ticks |
| `#/costmap` | h1, cost chart, readouts: cost at the probe, cost at the inflation edge |

Every page: `<html lang>` matches the language, no sideways scroll in a 390 px frame.
