"""The Python shown on pages 1.1 (decide) and 1.2 (closest), run for real.
Inputs come from the TypeScript models as one JSON argument; snippets.test.ts compares the output."""
import json
import sys

cfg = json.loads(sys.argv[1])
START, STEP = cfg['start'], cfg['speed'] / cfg['hz']


def drive(stop_at, op):  # 1.1: one reading per scan, one if per reading
    k = 0
    while True:
        distance = max(0.0, START - k * STEP)
        if distance <= 1e-9:
            return {'final': 0, 'crashed': True, 'scans': k}
        if (distance < stop_at) if op == '<' else (distance > stop_at):  # the page's `if distance < stop_at:`
            return {'final': distance, 'crashed': False, 'scans': k + 1}
        k += 1


def closest(readings, start=float('inf')):  # 1.2, as shown; start=0 is the break-it
    closest = start
    updates = 0
    for d in readings:
        if d < closest:
            closest = d
            updates += 1
    return closest, updates


out = {
    'drive': [drive(s, op) for s in cfg['stop_ats'] for op in ('<', '>')],
    'closest': [closest(rs) for rs in cfg['readings']] + [closest(rs, 0) for rs in cfg['readings']],
}
print(json.dumps(out))
