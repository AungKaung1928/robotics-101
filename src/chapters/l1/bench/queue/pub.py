# 30 messages at 5 Hz on 'scan' (std_msgs/Header: frame_id = index, stamp = send time), then exit.
import rclpy
from rclpy.node import Node
from std_msgs.msg import Header
rclpy.init(); n = Node('pub'); p = n.create_publisher(Header, 'scan', 10); k = [0]
def tick():
    if k[0] >= 30: raise SystemExit
    h = Header(); h.frame_id = str(k[0]); h.stamp = n.get_clock().now().to_msg(); p.publish(h); k[0] += 1
n.create_timer(0.2, tick)
try: rclpy.spin(n)
except SystemExit: pass
