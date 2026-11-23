# create_subscription(Header, 'scan', cb, 10); cb sleeps WORK s. Prints JSON: handled indices and max age at call start (ms).
import json, sys, time
import rclpy
from rclpy.node import Node
from std_msgs.msg import Header
WORK = float(sys.argv[1]); rclpy.init(); n = Node('sub'); got = []; ages = []
def cb(m):
    now = n.get_clock().now().nanoseconds; st = m.stamp.sec * 10**9 + m.stamp.nanosec
    got.append(int(m.frame_id)); ages.append((now - st) / 1e6); time.sleep(WORK)
n.create_subscription(Header, 'scan', cb, 10)
t0 = time.time(); last = time.time()
while time.time() - t0 < 25:
    before = len(got); rclpy.spin_once(n, timeout_sec=0.5)
    if len(got) != before: last = time.time()
    if got and time.time() - last > 3: break
print(json.dumps({'work_ms': WORK * 1000, 'handled': got, 'dropped': 30 - len(got), 'max_age_ms': round(max(ages)) if ages else None}))
