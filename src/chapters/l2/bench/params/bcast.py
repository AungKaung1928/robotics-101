# map->odom identity; odom->base_link drives +x at 0.26 m/s, teleports +0.8 m once at t=4 s. Runs 8 s at 20 Hz.
import time, rclpy
from rclpy.node import Node
from geometry_msgs.msg import TransformStamped
from tf2_ros import TransformBroadcaster
rclpy.init(); n = Node('bcast'); b = TransformBroadcaster(n); t0 = time.time()
def tf(parent, child, x):
    m = TransformStamped(); m.header.stamp = n.get_clock().now().to_msg(); m.header.frame_id = parent; m.child_frame_id = child
    m.transform.translation.x = x; m.transform.rotation.w = 1.0; return m
def tick():
    t = time.time() - t0
    if t > 8: raise SystemExit
    b.sendTransform([tf('map', 'odom', 0.0), tf('odom', 'base_link', 0.26 * t + (0.8 if t >= 4 else 0.0))])
n.create_timer(0.05, tick)
try: rclpy.spin(n)
except SystemExit: pass
