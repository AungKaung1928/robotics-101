/**
 * 5.3 Debugging tools: one robot that does not move, four tools, each shows one clue.
 * Commands as in the ROS 2 Jazzy docs (read 2026-11-24):
 * - ros2 topic echo / ros2 topic hz, rqt_graph: Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics
 * - ros2 bag record / play: Tutorials/Beginner-CLI-Tools/Recording-And-Playing-Back-Data
 * - ros2 run tf2_tools view_frames, ros2 run tf2_ros tf2_echo [source_frame] [target_frame]: Tutorials/Intermediate/Tf2/Introduction-To-Tf2
 * - rqt_graph defaults (rqt_graph jazzy ac25135 src/rqt_graph/ros_graph.py:141-146 'Nodes only', :243-246 Dead sinks + Leaf topics hidden on first start; states are saved between runs)
 * Tool outputs here are simplified pictures of what each tool shows, not captured terminal output.
 */
export const DOCS = 'https://docs.ros.org/en/jazzy/Tutorials'
export const TOOLS = ['hz', 'echo', 'graph', 'tf', 'bag'] as const
export type Tool = (typeof TOOLS)[number]
export const CMD: Record<Tool, string> = {
  hz: 'ros2 topic hz /scan',
  echo: 'ros2 topic echo /cmd_vel',
  graph: 'ros2 run rqt_graph rqt_graph',
  tf: 'ros2 run tf2_ros tf2_echo odom base_link',
  bag: 'ros2 bag record /scan  →  ros2 bag play <bag> (laptop, no robot)',
}
export const DOC: Record<Tool, string> = {
  hz: 'Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html',
  echo: 'Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html',
  graph: 'Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html',
  tf: 'Intermediate/Tf2/Introduction-To-Tf2.html',
  bag: 'Beginner-CLI-Tools/Recording-And-Playing-Back-Data/Recording-And-Playing-Back-Data.html',
}

/** What is broken. Every fault leaves the robot standing still, so the symptom alone does not tell them apart. */
export const FAULTS = ['sensor', 'remap', 'tf'] as const
export type Fault = (typeof FAULTS)[number]

/** One clue per tool per fault: 'bad' when the tool shows the fault, 'ok' when it shows that part is healthy. */
export type Clue = { ok: boolean; key: string }
export function look(fault: Fault, tool: Tool): Clue {
  switch (tool) {
    case 'hz': return fault === 'sensor' ? { ok: false, key: 'hzNone' } : { ok: true, key: 'hzRate' }
    case 'echo': return { ok: false, key: 'echoNone' } // the symptom: the node publishes nothing in every case
    case 'graph': return fault === 'sensor' ? { ok: false, key: 'graphNoDriver' } : fault === 'remap' ? { ok: false, key: 'graphSplit' } : { ok: true, key: 'graphOk' }
    case 'tf': return fault === 'tf' ? { ok: false, key: 'tfMissing' } : { ok: true, key: 'tfOk' }
    case 'bag': return fault === 'sensor' ? { ok: false, key: 'bagEmpty' } : { ok: false, key: 'bagStill' }
  }
}

/** Faults still possible after the clues seen so far (each clue rules out faults that would have shown something else). */
export function remaining(seen: { tool: Tool; clue: Clue }[]): Fault[] {
  return FAULTS.filter((f) => seen.every(({ tool, clue }) => look(f, tool).key === clue.key))
}

/** Fewest tools that always name the fault: the challenge's answer (searched, not hand-written). */
export function fewestTools(): number {
  for (let n = 1; n <= TOOLS.length; n++) {
    const combos = (k: number, from = 0): Tool[][] => (k === 0 ? [[]] : TOOLS.slice(from).flatMap((t, i) => combos(k - 1, from + i + 1).map((c) => [t, ...c])))
    if (combos(n).some((set) => FAULTS.every((f) => remaining(set.map((tool) => ({ tool, clue: look(f, tool) }))).length === 1))) return n
  }
  return TOOLS.length
}
