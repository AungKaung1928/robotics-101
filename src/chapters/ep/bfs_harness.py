"""Runs the BFS code exactly as the EP1 page shows it (argv[1], text) on the page's map; prints the path start..goal.
argv[2] = 1 swaps popleft() for pop() (the page's break-it button shows that line).
argv[3] (optional) = JSON list of [x, y] cells the user clicked: each toggles a wall. Prints null when G cannot be reached."""
import json
import sys

code = sys.argv[1] if sys.argv[2] == '0' else sys.argv[1].replace('popleft()', 'pop()')
MAP = ['..........', '...###....', '.....#....', '.....#....', '.....#....', '..........', '..........']
W, H = len(MAP[0]), len(MAP)
WALLS = {(x, y) for y, row in enumerate(MAP) for x, ch in enumerate(row) if ch == '#'}
WALLS ^= {tuple(c) for c in json.loads(sys.argv[3])} if len(sys.argv) > 3 else set()
start, goal = (0, 3), (9, 3)


def neighbours(cell):  # up, right, down, left; free cells only
    x, y = cell
    for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0)):
        n = (x + dx, y + dy)
        if 0 <= n[0] < W and 0 <= n[1] < H and n not in WALLS:
            yield n


ns = {'start': start, 'goal': goal, 'neighbours': neighbours}
exec(code, ns)
if goal not in ns['parent']:
    print('null')
    sys.exit()
path = [goal]
while ns['parent'][path[0]] is not None:
    path.insert(0, ns['parent'][path[0]])
print(json.dumps(path))
