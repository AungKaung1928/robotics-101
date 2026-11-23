import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { DEPTH } from './callback'

/** 1.3's repo panel cites python-ros2-reference 13_classes/classes.py:120-121. With PYREF_REPO=<a clone>, read those
 * lines at origin/main: the subscription the page shows, with the queue depth the page's model uses. */
const REPO = process.env.PYREF_REPO
describe.skipIf(!REPO)('1.3 repo panel == python-ros2-reference (origin/main)', () => {
  it('classes.py:120-121 is create_subscription(LaserScan, \'scan\', self.scan_callback, DEPTH)', () => {
    const py = spawnSync('git', ['-C', REPO!, 'show', 'origin/main:13_classes/classes.py'], { encoding: 'utf8' }).stdout.split('\n')
    expect(py[119]).toMatch(/self\.scan_sub_ = self\.create_subscription\($/)
    expect(py[120].trim()).toBe(`LaserScan, 'scan', self.scan_callback, ${DEPTH})`)
  })
})
