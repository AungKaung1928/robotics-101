// Dev-only: drives every Level 1-2, EP and app2 Level 0 chapter in a real browser (DOM clicks, typed input, slider input events)
// and prints CLICKS PASS/FAIL into #out. Run: bash src/chapters/l1/clicktest.sh (headless Chrome --dump-dom).
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import '../../index.css'
import { STRINGS, stringsFor, type Lang, type Strings } from '../../i18n'
import BfsChapter from '../ep/BfsChapter'
import LateChapter from '../ep/LateChapter'
import MoveChapter from '../l0/MoveChapter'
import SenseChapter from '../l0/SenseChapter'
import ThinkChapter from '../l0/ThinkChapter'
import ActChapter from '../l0/ActChapter'
import SimwhatChapter from '../l0/SimwhatChapter'
import SimpickChapter from '../l0/SimpickChapter'
import MeetChapter from '../l0/MeetChapter'
import { MEET_STRINGS } from '../l0/meet.strings'
import { SIMPICK_STRINGS } from '../l0/simpick.strings'
import { SIMWHAT_STRINGS } from '../l0/simwhat.strings'
import { ACT_STRINGS } from '../l0/act.strings'
import { THINK_STRINGS } from '../l0/think.strings'
import { SENSE_STRINGS } from '../l0/sense.strings'
import { MOVE_STRINGS } from '../l0/move.strings'
import { BODIES } from '../l2/bodies'
import { BFS_STRINGS } from '../ep/bfs.strings'
import { ACTIONS_STRINGS } from '../l2/actions.strings'
import { DRIVE_STRINGS } from '../l2/drive.strings'
import { NODES_STRINGS } from '../l2/nodes.strings'
import { SCRIPT } from '../l2/ws'
import { WS_STRINGS } from '../l2/ws.strings'
import { SHELL_STRINGS } from './shell.strings'
import { LIDAR } from '../../content/world'
import { run as decideRun } from './decide'
import { closestOf, readings as boxReadings, updates as boxUpdates } from './closest'
import { keepsUp } from './callback'
import { CALLBACK_STRINGS } from './callback.strings'
import { caught, falseAlarms } from '../l2/params'
import { PARAMS_STRINGS } from '../l2/params.strings'
import { wheels } from '../l2/drive'

type Step =
  | { click: string; text?: string }
  | { type: string; value: string; submit?: boolean }
  | { slide: number; in?: string }
  | { key: string; on: string }
  | { a11y: true }
  | { expect: string; has?: string; is?: string; ok?: true; re?: RegExp }
interface Case { name: string; Body: ComponentType<{ t: Strings }>; steps: Step[] }

const typeAll = (lines: string[]): Step[] => lines.map((value) => ({ type: 'input.code', value, submit: true }))
/** Expected text as the page gets it: stringsFor (Burmese overlay, English fallback per string), like the chapters. */
const S = <T,>(table: { en: T; ja: T }, l: Lang, id: string): T => stringsFor(table, STRINGS[l], id)
/** Readouts and buttons that carry words come from the chapter's own strings, so both languages run the same cases. */
const cell = (l: Lang, x: number, y: number) => `rect[aria-label="${S(BFS_STRINGS, l, 'ep.bfs.BFS_STRINGS').cellLabel(x, y, false)}"]`
const cases = (l: Lang): Case[] => [
  { name: 'decide break', Body: BODIES.decide, steps: [{ click: '.break' }, { expect: 'final', has: '2.00 m' }] },
  { name: 'closest break', Body: BODIES.closest, steps: [{ click: '.break' }, { expect: 'closest', has: '0.00 m' }] },
  { name: 'callback break', Body: BODIES.callback, steps: [{ click: '.break' }, { expect: 'dropped', re: /[1-9]/ }] },
  { name: 'cpp challenge', Body: BODIES.cpp, steps: [{ click: 'button', text: 'int stop_at{0.5};' }, { expect: 'challenge', ok: true }] },
  { name: 'shell challenge', Body: BODIES.shell, steps: [...typeAll(['source /opt/ros/humble/setup.bash', 'ros2 pkg list']), { expect: 'challenge', ok: true }] },
  { name: 'nodes stop bridge', Body: BODIES.nodes, steps: [{ click: 'g[aria-label^="ros_gz_bridge"]' }, { expect: 'patrols', is: S(NODES_STRINGS, l, 'l2.nodes.NODES_STRINGS').no }] },
  { name: 'topics challenge', Body: BODIES.topics, steps: [{ type: 'input.code', value: 'scan' }, { expect: 'challenge', ok: true }] },
  { name: 'msgtypes break', Body: BODIES.msgtypes, steps: [{ click: '.break' }, { expect: 'ignored', has: 'angular.x' }] },
  { name: 'actions unreachable', Body: BODIES.actions, steps: [{ click: '.break', text: S(ACTIONS_STRINGS, l, 'l2.actions.ACTIONS_STRINGS').breakIt }, { expect: 'status', has: 'ABORTED (6)' }] },
  { name: 'params break', Body: BODIES.params, steps: [{ click: '.break' }, { expect: 'false', has: '19' }] },
  // Sliders of Levels 1-2: the readout after one slide equals the chapter's own model for that value (DOM wiring check).
  { name: 'decide slide', Body: BODIES.decide, steps: [{ slide: 0.25 }, { expect: 'final', has: decideRun(0.25).final.toFixed(2) }, { expect: 'reads', is: String(decideRun(0.25).ticks.length) }] },
  { name: 'closest slide', Body: BODIES.closest, steps: [{ slide: 2 }, { expect: 'closest', has: closestOf(boxReadings(2)).toFixed(2) }, { expect: 'updates', is: String(boxUpdates(boxReadings(2))) }] },
  { name: 'callback slide', Body: BODIES.callback, steps: [{ slide: 600 }, { expect: 'challenge', has: S(CALLBACK_STRINGS, l, 'l1.callback.CALLBACK_STRINGS')[keepsUp(600) ? 'keeps' : 'lags'] }, { slide: 100 }, { expect: 'challenge', has: S(CALLBACK_STRINGS, l, 'l1.callback.CALLBACK_STRINGS')[keepsUp(100) ? 'keeps' : 'lags'] }] },
  { name: 'params slide', Body: BODIES.params, steps: [{ slide: 0.1 }, { expect: 'false', is: String(falseAlarms(0.1)) }, { expect: 'caught', is: S(PARAMS_STRINGS, l, 'l2.params.PARAMS_STRINGS')[caught(0.1) ? 'yes' : 'no'] }] },
  { name: 'drive slide', Body: BODIES.drive, steps: [{ slide: 0.1 }, { expect: 'wl', has: wheels(0.1, 0.5).left.toFixed(3) }, { expect: 'wr', has: wheels(0.1, 0.5).right.toFixed(3) }] },
  { name: 'msgtypes slide', Body: BODIES.msgtypes, steps: [{ slide: 0 }, { expect: 'angle', has: `${LIDAR.minAngle.toFixed(3)} rad` }] },
  { name: 'ws challenge', Body: BODIES.ws, steps: [...typeAll(SCRIPT), { expect: 'challenge', ok: true }] },
  { name: 'ws new terminal forgets', Body: BODIES.ws, steps: [...typeAll(SCRIPT), { expect: 'challenge', ok: true }, { click: '.break', text: S(WS_STRINGS, l, 'l2.ws.WS_STRINGS').newTerm }, { expect: 'challenge', is: S(WS_STRINGS, l, 'l2.ws.WS_STRINGS').notYet }] },
  { name: 'shell new terminal forgets', Body: BODIES.shell, steps: [...typeAll(['source /opt/ros/humble/setup.bash', 'ros2 pkg list']), { expect: 'challenge', ok: true }, { click: '.break' }, ...typeAll(['ros2 pkg list']), { expect: 'challenge', is: S(SHELL_STRINGS, l, 'l1.shell.SHELL_STRINGS').notYet }] },
  { name: 'topics break', Body: BODIES.topics, steps: [{ expect: 'got-slam_toolbox', re: /[1-9]/ }, { click: '.break' }, { expect: 'got-slam_toolbox', re: /^0\b/ }] },
  { name: 'drive break', Body: BODIES.drive, steps: [{ click: '.break' }, { expect: 'challenge', has: S(DRIVE_STRINGS, l, 'l2.drive.DRIVE_STRINGS').moving }] },
  { name: 'bfs stack', Body: BfsChapter, steps: [{ expect: 'len', has: '13' }, { click: '.break' }, { expect: 'len', has: '15' }] },
  { name: 'bfs wall click', Body: BfsChapter, steps: [{ click: cell(l, 3, 3) }, { expect: 'len', has: '13' }, { click: cell(l, 0, 2) }, { click: cell(l, 0, 4) }, { click: cell(l, 1, 3) }, { expect: 'len', is: S(BFS_STRINGS, l, 'ep.bfs.BFS_STRINGS').none }] },
  { name: 'bfs keyboard', Body: BfsChapter, steps: [{ expect: 'tabstops', is: '1' }, { key: 'ArrowDown', on: '.ep-bfs [tabindex="0"]' }, { key: 'ArrowDown', on: ':focus' }, { key: 'ArrowDown', on: ':focus' }, { key: 'ArrowDown', on: ':focus' }, { key: 'Enter', on: ':focus' }, { expect: 'len', has: '13' }, { key: 'ArrowRight', on: ':focus' }, { key: 'Enter', on: ':focus' }, { key: 'ArrowUp', on: ':focus' }, { key: 'ArrowUp', on: ':focus' }, { key: 'ArrowRight', on: ':focus' }, { key: 'Enter', on: ':focus' }, { expect: 'walls', is: '9' }, { expect: 'wallAt', is: S(BFS_STRINGS, l, 'ep.bfs.BFS_STRINGS').cellLabel(2, 4, true) }] },
  { name: 'bfs costmap', Body: BfsChapter, steps: [{ click: 'button.costmap' }, { expect: 'len', has: '15' }, { expect: 'cost', has: '15' }, { click: 'button.costmap' }, { expect: 'len', has: '13' }] },
  { name: 'late slider', Body: LateChapter, steps: [{ expect: 'backwards', has: '5' }, { slide: 0.17 }, { expect: 'challenge', ok: true }, { slide: 0.18 }, { expect: 'backwards', has: '1' }] },
  { name: 'late reorder', Body: LateChapter, steps: [{ expect: 'r-dropped', is: '4' }, { slide: 450, in: '.reorder input[type=range]' }, { expect: 'r-used', is: '20' }, { expect: 'r-delay', has: '0.45' }] },
  { name: 'late backpressure', Body: LateChapter, steps: [{ slide: 100, in: '.bp-work input[type=range]' }, { expect: 'b-dropped', is: '0' }, { slide: 150, in: '.bp-work input[type=range]' }, { slide: 1, in: '.bp-depth input[type=range]' }, { expect: 'b-dropped', re: /^[1-9]/ }] },
  { name: 'late keep-latest', Body: LateChapter, steps: [{ expect: 'count:svg.late rect.env', is: '0' }, { click: '.break' }, { expect: 'count:svg.late rect.env', is: '20' }, { expect: 'backwards', has: '0' }, { expect: 'acted', has: '15' }] },
  { name: 'move straight + spin', Body: MoveChapter, steps: [{ expect: 'kind', is: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').kind.straight }, { slide: 0.22 }, { expect: 'kind', is: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').kind.curveLeft }, { slide: -0.15 }, { expect: 'kind', is: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').kind.spin }, { expect: 'spin', is: '✓ ' + S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').spinOk }] },
  // Lesson 0.2 (review item 5): equal -> straight; break it -> told 0.150 / effective 0.075, left; fix it -> straight; -0.15 dry -> spin; -0.10 -> centre moves; 0.00 + break it -> 'stopped'.
  { name: 'move slip', Body: MoveChapter, steps: [{ expect: 'kind', is: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').kind.straight }, { expect: 'delivers', is: '0.150' }, { click: '.break' }, { expect: 'kind', is: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').kind.curveLeft }, { expect: 'told', is: '0.150' }, { expect: 'delivers', is: '0.075' }, { expect: 'slip', has: '0.075' },
    { click: '.break' }, { expect: 'kind', is: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').kind.straight }, { expect: 'delivers', is: '0.150' }, { slide: -0.15 }, { expect: 'kind', is: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').kind.spin }, { expect: 'spin', has: '✓' }, { slide: -0.1 }, { expect: 'kind', is: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').kind.curveRight },
    // ChatGPT review 2 item 1: right wheel 0.00 with slip on = 'stopped', never 'forward at 0.00'.
    { slide: 0 }, { click: '.break' }, { expect: 'slip', has: '(0.00 m/s)' }, { expect: 'slip', has: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').slipStop.split('{told} m/s')[1].split(' ({right}')[0] }] },
  { name: 'move check', Body: MoveChapter, steps: [{ click: 'button.pick', text: S(MOVE_STRINGS, l, 'l0.move.MOVE_STRINGS').answers.curveRight }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'sense wall', Body: SenseChapter, steps: [{ slide: 0.5 }, { expect: 'front', is: '0.50 m' }, { slide: 3.8 }, { expect: 'front', is: S(SENSE_STRINGS, l, 'l0.sense.SENSE_STRINGS').nothing }] },
  { name: 'sense cover', Body: SenseChapter, steps: [{ click: '.break' }, { expect: 'count', has: '0 /' }, { expect: 'front', is: S(SENSE_STRINGS, l, 'l0.sense.SENSE_STRINGS').tooClose }] },
  { name: 'sense check', Body: SenseChapter, steps: [{ click: 'button.pick', text: S(SENSE_STRINGS, l, 'l0.sense.SENSE_STRINGS').answers.nothing }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'think rule', Body: ThinkChapter, steps: [{ slide: 0.9 }, { expect: 'final', re: /^0\.8\d m$/ }, { slide: 0.02 }, { expect: 'final', is: S(THINK_STRINGS, l, 'l0.think.THINK_STRINGS').bumped }] },
  { name: 'think break', Body: ThinkChapter, steps: [{ click: '.break' }, { expect: 'final', is: S(THINK_STRINGS, l, 'l0.think.THINK_STRINGS').bumped }, { click: '.break' }, { expect: 'final', has: '0.4' }] },
  { name: 'think check', Body: ThinkChapter, steps: [{ click: 'button.pick', text: S(THINK_STRINGS, l, 'l0.think.THINK_STRINGS').answers.earlier }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'act wheels', Body: ActChapter, steps: [{ slide: 0, in: '.act-turn input[type=range]' }, { expect: 'left', is: '0.15 m/s' }, { expect: 'right', is: '0.15 m/s' }, { slide: 0.22 }, { slide: 1.5, in: '.act-turn input[type=range]' }, { expect: 'right', has: S(ACT_STRINGS, l, 'l0.act.ACT_STRINGS').tooFast }] },
  { name: 'act stop', Body: ActChapter, steps: [{ slide: 0.22 }, { click: '.break' }, { expect: 'rolled', is: '1.0 cm' }, { expect: 'note', has: '0.09' }] },
  { name: 'act check', Body: ActChapter, steps: [{ click: 'button.pick', text: S(ACT_STRINGS, l, 'l0.act.ACT_STRINGS').answers.later }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'simwhat wall', Body: SimwhatChapter, steps: [{ slide: 3 }, { expect: 'world', is: '3.0 m' }, { expect: 'dots', is: '360' }] },
  { name: 'simwhat sensor off', Body: SimwhatChapter, steps: [{ click: '.break' }, { expect: 'dots', is: '0' }, { expect: 'world', is: '1.5 m' }, { expect: 'count:svg.simwhat circle.sw-dot', is: '0' }] },
  { name: 'simwhat check', Body: SimwhatChapter, steps: [{ click: 'button.pick', text: S(SIMWHAT_STRINGS, l, 'l0.simwhat.SIMWHAT_STRINGS').answers.empty }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'simpick no gpu + sensor', Body: SimpickChapter, steps: [{ expect: 'start', has: S(SIMPICK_STRINGS, l, 'l0.simpick.SIMPICK_STRINGS').rows.site.name }, { click: '[data-q="gpu"] button', text: S(SIMPICK_STRINGS, l, 'l0.simpick.SIMPICK_STRINGS').no }, { click: '[data-q="sensor"] button', text: S(SIMPICK_STRINGS, l, 'l0.simpick.SIMPICK_STRINGS').yes }, { click: '[data-q="physics"] button', text: S(SIMPICK_STRINGS, l, 'l0.simpick.SIMPICK_STRINGS').no }, { expect: 'start', has: 'mvsim' }] },
  { name: 'simpick gpu + physics', Body: SimpickChapter, steps: [{ click: '[data-q="gpu"] button', text: S(SIMPICK_STRINGS, l, 'l0.simpick.SIMPICK_STRINGS').yes }, { click: '[data-q="sensor"] button', text: S(SIMPICK_STRINGS, l, 'l0.simpick.SIMPICK_STRINGS').no }, { click: '[data-q="physics"] button', text: S(SIMPICK_STRINGS, l, 'l0.simpick.SIMPICK_STRINGS').yes }, { expect: 'start', has: 'Gazebo' }, { expect: 'count:.sp-row.is-lit', is: '1' }] },
  { name: 'simpick check', Body: SimpickChapter, steps: [{ expect: 'count:.sp-tier.has-alt [data-row=webots].is-alt', is: '1' }, { expect: 'count:.sp-tier', is: '4' }, { click: '.sp-check button.pick', text: 'mvsim' }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'meet parts', Body: MeetChapter, steps: [{ click: 'g.meet-part.is-sensor' }, { expect: 'part', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').parts.sensor }, { click: 'g.meet-part.is-wheels' }, { expect: 'part', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').parts.wheels }] },
  { name: 'meet car', Body: MeetChapter, steps: [{ expect: 'robot', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').no }, { click: '.add.is-sensor' }, { expect: 'decides', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').person }, { expect: 'half', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').sensorOnly }, { click: '.add.is-rule' }, { expect: 'robot', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').yes }, { expect: 'decides', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').itself }] },
  { name: 'face move slip dizzy', Body: MoveChapter, steps: [{ click: '.break' }, { expect: 'count:svg.move [data-mood=dizzy]', is: '1' }] },
  { name: 'face sense proud', Body: SenseChapter, steps: [{ click: '.sense-check button.pick', text: S(SENSE_STRINGS, l, 'l0.sense.SENSE_STRINGS').answers.nothing }, { expect: 'count:svg.sense [data-mood=proud]', is: '1' }, { click: '.break' }, { expect: 'count:svg.sense [data-mood=dizzy]', is: '1' }] },
  { name: 'face simwhat off dizzy', Body: SimwhatChapter, steps: [{ click: '.break' }, { expect: 'count:svg.simwhat [data-mood=dizzy]', is: '1' }, { expect: 'count:svg.simwhat [data-mood=idle]', is: '1' }] },
  { name: 'face act too fast dizzy', Body: ActChapter, steps: [{ slide: 0.22 }, { slide: 1.5, in: '.act-turn input[type=range]' }, { expect: 'count:svg.move [data-mood=dizzy]', is: '1' }] },
  { name: 'meet keyboard', Body: MeetChapter, steps: [{ key: 'Enter', on: 'g.meet-part.is-battery' }, { expect: 'part', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').parts.battery }, { key: ' ', on: 'g.meet-part.is-computer' }, { expect: 'part', is: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').parts.computer }] },
  { name: 'meet check', Body: MeetChapter, steps: [{ click: '.meet-check button.pick', text: S(MEET_STRINGS, l, 'l0.meet.MEET_STRINGS').answers.notRobot }, { expect: 'check', ok: true }, { a11y: true }] },
]

const setValue = (el: HTMLInputElement, v: string) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}
/** Controls and pictures a screen reader would announce with no name (aria-label, own text, or a wrapping <label>). */
function unnamed(host: HTMLElement): string[] {
  const name = (el: Element) => (el.getAttribute('aria-label') ?? '').trim() || (el.tagName !== 'INPUT' && (el.textContent ?? '').trim())
    || (el.closest('label')?.textContent ?? '').trim() || (el.getAttribute('aria-labelledby') ? 'ref' : '')
  return [...host.querySelectorAll('button, input, select, textarea, [role=button], svg[role=img], svg[role=group]')]
    .filter((el) => !name(el)).map((el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`)
}
const tick = () => new Promise((r) => setTimeout(r, 30))

async function runCase(c: Case, host: HTMLElement, t: Strings): Promise<string | null> {
  const root = createRoot(host)
  flushSync(() => root.render(<main className="chapter"><c.Body t={t} /></main>))
  try {
    for (const st of c.steps) {
      await tick()
      if ('click' in st) {
        const el = [...host.querySelectorAll<HTMLElement | SVGElement>(st.click)].find((e) => !st.text || e.textContent?.includes(st.text))
        if (!el) return `no element ${st.click}${st.text ? ` "${st.text}"` : ''}`
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      } else if ('type' in st) {
        const el = host.querySelector<HTMLInputElement>(st.type)
        if (!el) return `no input ${st.type}`
        setValue(el, st.value)
        await tick()
        if (st.submit) el.form!.requestSubmit()
      } else if ('a11y' in st) {
        const bad = unnamed(host)
        if (bad.length) return `no accessible name: ${bad.join(', ')}`
      } else if ('key' in st) {
        const el = st.on === ':focus' ? (document.activeElement as HTMLElement | null) : host.querySelector<HTMLElement>(st.on)
        if (!el) return `no element ${st.on}`
        if (st.on !== ':focus') el.focus()
        el.dispatchEvent(new KeyboardEvent('keydown', { key: st.key, bubbles: true }))
      } else if ('slide' in st) {
        const el = host.querySelector<HTMLInputElement>(st.in ?? '.slider input[type=range]')
        if (!el) return 'no slider'
        setValue(el, String(st.slide))
      } else {
        const el = host.querySelector(`[data-k="${st.expect}"]`)
        // pseudo readouts of the grid itself: tab stops, wall count, label of the focused cell
        const txt = st.expect === 'tabstops' ? String(host.querySelectorAll('.ep-bfs [tabindex="0"]').length)
          : st.expect === 'walls' ? String(host.querySelectorAll('.ep-bfs [aria-pressed="true"]').length)
          : st.expect.startsWith('count:') ? String(host.querySelectorAll(st.expect.slice(6)).length)
          : st.expect === 'wallAt' ? document.activeElement?.getAttribute('aria-label') ?? '(no focus)'
          : el?.textContent ?? '(missing)'
        if (st.has && !txt.includes(st.has)) return `[data-k=${st.expect}] "${txt}" lacks "${st.has}"`
        if (st.is !== undefined && txt !== st.is) return `[data-k=${st.expect}] "${txt}" is not "${st.is}"`
        if (st.re && !st.re.test(txt)) return `[data-k=${st.expect}] "${txt}" !~ ${st.re}`
        if (st.ok && !el?.classList.contains('ok')) return `[data-k=${st.expect}] not ok: "${txt}"`
      }
    }
    return null
  } finally {
    root.unmount()
  }
}

async function main() {
  const out: string[] = []
  let pass = 0, total = 0
  const ALL = { ...BODIES, bfs: BfsChapter, late: LateChapter }
  const named: Case[] = Object.entries(ALL).map(([id, Body]) => ({ name: `a11y names ${id}`, Body, steps: [{ a11y: true }] }))
  for (const l of ['en', 'ja', 'my'] as const) for (const c of [...cases(l), ...named]) {
    total++
    const host = document.createElement('div')
    document.body.append(host)
    let err: string | null
    try { err = await runCase(c, host, STRINGS[l]) } catch (e) { err = String(e) }
    host.remove()
    if (err) out.push(`FAIL ${l} ${c.name}: ${err}`)
    else { pass++; out.push(`ok ${l} ${c.name}`) }
  }
  out.push(`CLICKS ${pass === total ? 'PASS' : 'FAIL'} ${pass}/${total}`)
  document.getElementById('out')!.textContent = out.join('\n')
}
void main()
