import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import DistroTimeline from './DistroTimeline'
import EventLog from './EventLog'
import InflationRipple from './InflationRipple'
import SenseThinkAct from './SenseThinkAct'
import SpeedProfile from './SpeedProfile'
import ToolStack from './ToolStack'
import { year } from './distros'
import { driveProfile } from './drive'
import { senseThinkAct } from './loop'
import { STACK_END, stackEvents } from './stack'

// Each figure rendered at its start, middle and end: no crash, and the frame shows what the model says.
const count = (html: string, re: RegExp) => html.match(re)?.length ?? 0

describe('scenario figures render from their models', () => {
  it('SenseThinkAct: ring step follows the phase; end frame stopped, happy, no ray', () => {
    const ticks = senseThinkAct(2, 0, 0.26, 5, 0.5), w = { sense: 'S', think: 'T', act: 'A', go: 'go', stop: 'stop' }
    const at = (t: number) => renderToStaticMarkup(<SenseThinkAct ticks={ticks} hz={5} t={t} wall={2} stopAt={0.5} words={w} label="" />)
    expect(at(0.02)).toContain('stl-ray')
    expect(at(0.1)).toContain('2.00 &gt; 0.5 → go')
    const end = at(1e3)
    expect(end).not.toContain('stl-ray')
    expect(end).toContain('data-mood="happy"')
    expect(end).toContain('stop · 0.49 m')
  })
  it('ToolStack: nothing before the first drop, all five layers and the robot at the end', () => {
    const w = Object.fromEntries(['linux', 'ros2', 'python', 'cpp', 'app'].map((k) => [k, { name: k, role: '' }])) as never
    expect(count(renderToStaticMarkup(<ToolStack t={-1} words={w} label="" />), /ts-layer/g)).toBe(0)
    expect(count(renderToStaticMarkup(<ToolStack t={stackEvents()[1]} words={w} label="" />), /class="ts-layer"/g)).toBe(2)
    const end = renderToStaticMarkup(<ToolStack t={STACK_END} words={w} label="" />)
    expect(count(end, /class="ts-layer"/g)).toBe(5)
    expect(end).toContain('class="mascot"')
  })
  it('DistroTimeline: tonight 4 rows live, Humble marked as mine', () => {
    const t = year('2026-11-23'), html = renderToStaticMarkup(<DistroTimeline at={t} today={t} label="" words={{ today: 'today', lts: 'LTS', mine: 'this app', first: 'v1' }} />)
    expect(count(html, /data-live="true"/g)).toBe(4)
    expect(html).toContain('this app')
  })
  it('EventLog, InflationRipple, SpeedProfile render', () => {
    expect(count(renderToStaticMarkup(<EventLog rows={[{ t: 0, cells: ['a'] }, { t: 1, cells: ['b'] }]} t={0.5} seek={() => {}} head={['x']} label="" />), /data-state="now"/g)).toBe(1)
    const cells = [{ x: 0, y: 0, d: 0 }, { x: 0.05, y: 0, d: 0.1 }, { x: 0.1, y: 0, d: 0.4 }]
    expect(count(renderToStaticMarkup(<InflationRipple cells={cells} res={0.05} x0={0} span={1} front={0.2} cost={(d) => (d === 0 ? 254 : 100)} label="" />), /<rect/g)).toBe(2)
    expect(renderToStaticMarkup(<SpeedProfile p={driveProfile(4, 0.25, 0.26, 2.5)} t={6} label="" />)).toContain('1.55 / 3.75 m')
  })
})
