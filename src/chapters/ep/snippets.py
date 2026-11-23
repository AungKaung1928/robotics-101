"""The Python shown on the EP1/EP2 pages, run for real on the same map and delays.
snippets.test.ts compares its JSON with the TypeScript models (python3 -I src/chapters/ep/snippets.py)."""
import heapq
import json
from collections import deque

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


def bfs(start, goal, stack=False):  # EP1 page snippet; stack=True is the break-it (pop instead of popleft)
    queue = deque([start]); parent = {start: None}
    while queue:
        cell = queue.pop() if stack else queue.popleft()
        if cell == goal: break
        for n in neighbours(cell):
            if n not in parent:
                parent[n] = cell; queue.append(n)
    return walk(parent, goal) if goal in parent else None


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


DELAYS = [30, 25, 35, 30, 40, 30, 450, 380, 280, 180, 35, 30, 25, 40, 260, 30, 35, 30, 25, 30]


def late(max_age, keep_latest):  # EP2 snippet: on_msg per arrival, in arrival order
    msgs = sorted(((i * 100 + d, i * 100) for i, d in enumerate(DELAYS)))  # (arrive, stamp)
    newest, acted, back = -inf, 0, 0
    for now, stamp in msgs:
        if now - stamp > max_age: continue
        if keep_latest and stamp < newest: continue
        back += stamp < newest
        newest = max(newest, stamp)
        acted += 1
    return acted, back


q, s = bfs(START, GOAL), bfs(START, GOAL, stack=True)
dpath, dcost = dijkstra(START, GOAL)
print(json.dumps({
    'bfs_path': q, 'stack_path': s, 'dijkstra_path': dpath,
    'bfs_steps': len(q) - 1, 'stack_steps': len(s) - 1,
    'bfs_path_cost': sum(cost(c) for c in q[1:]),
    'dijkstra_steps': len(dpath) - 1, 'dijkstra_cost': dcost,
    'late_1000': late(1000, False), 'late_179': late(179, False), 'late_180': late(180, False), 'late_keep': late(1000, True),
}))
