"""Page 1.1's `if distance < stop_at` inside the drive loop the page animates, run for real.
Inputs come from the TypeScript model as one JSON argument; snippets.test.ts compares the output.
(1.2's def closest is run from the rendered page text in pysyntax.test.tsx.)"""
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


out = {
    'drive': [drive(s, op) for s in cfg['stop_ats'] for op in ('<', '>')],
}
print(json.dumps(out))
