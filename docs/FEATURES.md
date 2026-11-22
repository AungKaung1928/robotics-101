# Features checked by scripts/verify.sh

| Route | What the page must show (EN and JA) |
|---|---|
| `#/` | h1, the arena plan, links to the 2 built waypoints, 5 waypoints marked planned |
| `#/scan` | h1, arena figure, readouts: beams with a return, gap between beams, distance per scan |
| `#/costmap` | h1, cost chart, readouts: cost at the probe, cost at the inflation edge |

Every page: `<html lang>` matches the language, no sideways scroll in a 390 px frame.
