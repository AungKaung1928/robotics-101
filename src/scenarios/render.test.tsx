import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import DistroTimeline from './DistroTimeline'
import EventLog from './EventLog'
import InflationRipple from './InflationRipple'
import SpeedProfile from './SpeedProfile'
import TfLab from './TfLab'
import BfsWave from './BfsWave'
import ToolStack from './ToolStack'
import { year } from './distros'
import { driveProfile } from './drive'
import { STACK_END, stackEvents } from './stack'
import { fixSettle } from './tflab'

// Each figure rendered at its start, middle and end: no crash, and the frame shows what the model says.
const count = (html: string, re: RegExp) => html.match(re)?.length ?? 0

describe('scenario figures render from their models', () => {
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
  it('EventLog linked highlight: only the hot row is marked', () => {
    const html = renderToStaticMarkup(<EventLog rows={[{ t: 0, cells: ['a'] }, { t: 1, cells: ['b'] }, { t: 2, cells: ['c'] }]} t={0} seek={() => {}} head={['x']} label="" hot={1} onHot={() => {}} />)
    expect(html.match(/data-hot="true"/g)).toHaveLength(1)
    expect(html.indexOf('data-hot')).toBeGreaterThan(html.indexOf('>a<'))
    expect(html.indexOf('data-hot')).toBeLessThan(html.indexOf('>b<'))
  })
  it('EventLog, InflationRipple, SpeedProfile render', () => {
    expect(count(renderToStaticMarkup(<EventLog rows={[{ t: 0, cells: ['a'] }, { t: 1, cells: ['b'] }]} t={0.5} seek={() => {}} head={['x']} label="" />), /data-state="now"/g)).toBe(1)
    const cells = [{ x: 0, y: 0, d: 0 }, { x: 0.05, y: 0, d: 0.1 }, { x: 0.1, y: 0, d: 0.4 }]
    expect(count(renderToStaticMarkup(<InflationRipple cells={cells} res={0.05} x0={0} span={1} front={0.2} cost={(d) => (d === 0 ? 254 : 100)} label="" />), /<rect/g)).toBe(2)
    expect(renderToStaticMarkup(<SpeedProfile p={driveProfile(4, 0.25, 0.26, 2.5)} t={6} label="" />)).toContain('1.55 / 3.75 m')
  })
  it('TfLab: dizzy with points off the wall before the fix, curious while they move, happy and on the wall after', () => {
    const hits: [number, number][] = [-0.6, -0.3, 0, 0.3, 0.6].map((y) => [1.9, y])
    const at = (since: number) => renderToStaticMarkup(<TfLab hits={hits} base={{ x: 0, y: 0, yaw: 0 }} mount={{ x: 0.1, y: 0, yaw: 0 }}
      wallX={2} err0={0.2} sinceFix={since} label="" residualText={(m) => `off ${(m * 100).toFixed(1)} cm`} />)
    const before = at(-1), mid = at(0.1), end = at(fixSettle(0.2))
    expect(before).toContain('data-mood="dizzy"')
    expect(count(before, /class="hit"/g)).toBe(5)
    expect(mid).toContain('data-mood="curious"')
    expect(end).toContain('data-mood="happy"')
    expect(end).toContain('off 0.0 cm')
    expect(end).toContain('class="mascot"')
  })
  it('BfsWave: front grows by layer, path appears once the goal is reached, unreachable goal never shows a path', () => {
    const rows = ['..#..', '..#..', '.....'], blocked = rows.join('').split('').map((c) => c === '#')
    const at = (t: number, goal = 4, b = blocked) => renderToStaticMarkup(<BfsWave w={5} h={3} blocked={b} start={0} goal={goal} t={t} label="" />)
    expect(at(0)).toContain('data-layer="0"')
    expect(count(at(0), /class="front"/g)).toBe(1)
    expect(at(1)).toContain('data-layer="4"')
    expect(at(1)).not.toContain('class="path"')
    expect(at(2)).not.toContain('class="path"') // goal at layer 8, 0.25 s per layer: trace starts with the goal alone
    expect(at(2.1)).toContain('class="path"')
    expect(count(at(9), /class="wall"/g)).toBe(2)
    const shut = blocked.map((b, i) => b || i === 3 || i === 8 || i === 13)
    expect(at(9, 4, shut)).not.toContain('class="path"')
  })
})
