"""EP1 costmap view: the heapq Dijkstra the page shows in that mode, run on the page's map.
The default-mode BFS (EP1) and on_msg (EP2) are run from the rendered page text instead (bfs_harness.py, on_msg_harness.py);
the costmap mode is behind a button, so its code is written out here. snippets.test.tsx compares the JSON with the model."""
import heapq
import json

MAP = [
    '..........',
    '...###....',
    '.....#....',
    '.....#....',
    '.....#....',
    '..........',
    '..........',
]
W, H = len(MAP[0]), len(MAP)
WALLS = {(x, y) for y, row in enumerate(MAP) for x, ch in enumerate(row) if ch == '#'}
START, GOAL = (0, 3), (9, 3)
inf = float('inf')


def neighbours(cell):  # up, right, down, left; free cells only
    x, y = cell
    for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0)):
        n = (x + dx, y + dy)
        if 0 <= n[0] < W and 0 <= n[1] < H and n not in WALLS:
            yield n


def walk(parent, goal):
    path = [goal]
    while parent[path[0]] is not None:
        path.insert(0, parent[path[0]])
    return path


def near_wall(c):
    return any((c[0] + dx, c[1] + dy) in WALLS for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)


def cost(n):  # 1, or 5 by a wall
    return 1 + (4 if near_wall(n) else 0)


def dijkstra(start, goal):  # EP1 costmap snippet
    frontier = [(0, start)]; best = {start: 0}; parent = {start: None}
    while frontier:
        c, cell = heapq.heappop(frontier)
        if cell == goal: break
        if c > best[cell]: continue
        for n in neighbours(cell):
            nc = c + cost(n)
            if nc < best.get(n, inf):
                best[n] = nc; parent[n] = cell
                heapq.heappush(frontier, (nc, n))
    return walk(parent, goal), best[goal]


dpath, dcost = dijkstra(START, GOAL)
print(json.dumps({'dijkstra_path': dpath, 'dijkstra_steps': len(dpath) - 1, 'dijkstra_cost': dcost}))
