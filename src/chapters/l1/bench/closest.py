"""Chapter 1.4 bench: closest() over one 360-reading scan, pure Python. Prints ns per call."""
import random
import time

def closest(readings):
    best = float("inf")
    for d in readings:
        if d < best:
            best = d
    return best

random.seed(0)
scan = [random.uniform(0.12, 3.5) for _ in range(360)]
calls = 20000
t0 = time.perf_counter()
s = 0.0
for _ in range(calls):
    s += closest(scan)
ns = (time.perf_counter() - t0) / calls * 1e9
print(f"{ns:.0f} {s:.3f}")
