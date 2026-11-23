// Dev-only: drives every Level 1-2, EP and app2 Level 0 chapter in a real browser (DOM clicks, typed input, slider input events)
// and prints CLICKS PASS/FAIL into #out. Run: bash src/chapters/l1/clicktest.sh (headless Chrome --dump-dom).
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import '../../index.css'
import { STRINGS, type Strings } from '../../i18n'
import BfsChapter from '../ep/BfsChapter'
import LateChapter from '../ep/LateChapter'
import MoveChapter from '../l0/MoveChapter'
import SenseChapter from '../l0/SenseChapter'
import ThinkChapter from '../l0/ThinkChapter'
import ActChapter from '../l0/ActChapter'
import SimwhatChapter from '../l0/SimwhatChapter'
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

type Step =
  | { click: string; text?: string }
  | { type: string; value: string; submit?: boolean }
  | { slide: number; in?: string }
  | { key: string; on: string }
  | { a11y: true }
  | { expect: string; has?: string; is?: string; ok?: true; re?: RegExp }
interface Case { name: string; Body: ComponentType<{ t: Strings }>; steps: Step[] }

const typeAll = (lines: string[]): Step[] => lines.map((value) => ({ type: 'input.code', value, submit: true }))
type Lang = 'en' | 'ja'
/** Readouts and buttons that carry words come from the chapter's own strings, so both languages run the same cases. */
const cell = (l: Lang, x: number, y: number) => `rect[aria-label="${BFS_STRINGS[l].cellLabel(x, y, false)}"]`
const cases = (l: Lang): Case[] => [
  { name: 'decide break', Body: BODIES.decide, steps: [{ click: '.break' }, { expect: 'final', has: '2.00 m' }] },
  { name: 'closest break', Body: BODIES.closest, steps: [{ click: '.break' }, { expect: 'closest', has: '0.00 m' }] },
  { name: 'callback break', Body: BODIES.callback, steps: [{ click: '.break' }, { expect: 'dropped', re: /[1-9]/ }] },
  { name: 'cpp challenge', Body: BODIES.cpp, steps: [{ click: 'button', text: 'int stop_at{0.5};' }, { expect: 'challenge', ok: true }] },
  { name: 'shell challenge', Body: BODIES.shell, steps: [...typeAll(['source /opt/ros/humble/setup.bash', 'ros2 pkg list']), { expect: 'challenge', ok: true }] },
  { name: 'nodes stop bridge', Body: BODIES.nodes, steps: [{ click: 'g[aria-label^="ros_gz_bridge"]' }, { expect: 'patrols', is: NODES_STRINGS[l].no }] },
  { name: 'topics challenge', Body: BODIES.topics, steps: [{ type: 'input.code', value: 'scan' }, { expect: 'challenge', ok: true }] },
  { name: 'msgtypes break', Body: BODIES.msgtypes, steps: [{ click: '.break' }, { expect: 'ignored', has: 'angular.x' }] },
  { name: 'actions unreachable', Body: BODIES.actions, steps: [{ click: '.break', text: ACTIONS_STRINGS[l].breakIt }, { expect: 'status', has: 'ABORTED (6)' }] },
  { name: 'params break', Body: BODIES.params, steps: [{ click: '.break' }, { expect: 'false', has: '19' }] },
  { name: 'ws challenge', Body: BODIES.ws, steps: [...typeAll(SCRIPT), { expect: 'challenge', ok: true }] },
  { name: 'drive break', Body: BODIES.drive, steps: [{ click: '.break' }, { expect: 'challenge', has: DRIVE_STRINGS[l].moving }] },
  { name: 'bfs stack', Body: BfsChapter, steps: [{ expect: 'len', has: '13' }, { click: '.break' }, { expect: 'len', has: '15' }] },
  { name: 'bfs wall click', Body: BfsChapter, steps: [{ click: cell(l, 3, 3) }, { expect: 'len', has: '13' }, { click: cell(l, 0, 2) }, { click: cell(l, 0, 4) }, { click: cell(l, 1, 3) }, { expect: 'len', is: BFS_STRINGS[l].none }] },
  { name: 'bfs keyboard', Body: BfsChapter, steps: [{ expect: 'tabstops', is: '1' }, { key: 'ArrowDown', on: '.ep-bfs [tabindex="0"]' }, { key: 'ArrowDown', on: ':focus' }, { key: 'ArrowDown', on: ':focus' }, { key: 'ArrowDown', on: ':focus' }, { key: 'Enter', on: ':focus' }, { expect: 'len', has: '13' }, { key: 'ArrowRight', on: ':focus' }, { key: 'Enter', on: ':focus' }, { key: 'ArrowUp', on: ':focus' }, { key: 'ArrowUp', on: ':focus' }, { key: 'ArrowRight', on: ':focus' }, { key: 'Enter', on: ':focus' }, { expect: 'walls', is: '9' }, { expect: 'wallAt', is: BFS_STRINGS[l].cellLabel(2, 4, true) }] },
  { name: 'bfs costmap', Body: BfsChapter, steps: [{ click: 'button.costmap' }, { expect: 'len', has: '15' }, { expect: 'cost', has: '15' }, { click: 'button.costmap' }, { expect: 'len', has: '13' }] },
  { name: 'late slider', Body: LateChapter, steps: [{ expect: 'backwards', has: '5' }, { slide: 0.17 }, { expect: 'challenge', ok: true }, { slide: 0.18 }, { expect: 'backwards', has: '1' }] },
  { name: 'late reorder', Body: LateChapter, steps: [{ expect: 'r-dropped', is: '4' }, { slide: 450, in: '.reorder input[type=range]' }, { expect: 'r-used', is: '20' }, { expect: 'r-delay', has: '0.45' }] },
  { name: 'late backpressure', Body: LateChapter, steps: [{ slide: 100, in: '.bp-work input[type=range]' }, { expect: 'b-dropped', is: '0' }, { slide: 150, in: '.bp-work input[type=range]' }, { slide: 1, in: '.bp-depth input[type=range]' }, { expect: 'b-dropped', re: /^[1-9]/ }] },
  { name: 'late keep-latest', Body: LateChapter, steps: [{ expect: 'count:svg.late rect.env', is: '0' }, { click: '.break' }, { expect: 'count:svg.late rect.env', is: '20' }, { expect: 'backwards', has: '0' }, { expect: 'acted', has: '15' }] },
  { name: 'move straight + spin', Body: MoveChapter, steps: [{ expect: 'kind', is: MOVE_STRINGS[l].kind.curveLeft }, { slide: 0.15 }, { expect: 'kind', is: MOVE_STRINGS[l].kind.straight }, { slide: -0.15 }, { expect: 'kind', is: MOVE_STRINGS[l].kind.spin }] },
  { name: 'move slip', Body: MoveChapter, steps: [{ slide: 0.15 }, { click: '.break' }, { expect: 'kind', is: MOVE_STRINGS[l].kind.curveLeft }] },
  { name: 'move check', Body: MoveChapter, steps: [{ click: 'button.pick', text: MOVE_STRINGS[l].answers.curveRight }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'sense wall', Body: SenseChapter, steps: [{ slide: 0.5 }, { expect: 'front', is: '0.50 m' }, { slide: 3.8 }, { expect: 'front', is: SENSE_STRINGS[l].nothing }] },
  { name: 'sense cover', Body: SenseChapter, steps: [{ click: '.break' }, { expect: 'count', has: '0 /' }, { expect: 'front', is: SENSE_STRINGS[l].nothing }] },
  { name: 'sense check', Body: SenseChapter, steps: [{ click: 'button.pick', text: SENSE_STRINGS[l].answers.nothing }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'think rule', Body: ThinkChapter, steps: [{ slide: 0.9 }, { expect: 'final', re: /^0\.8\d m$/ }, { slide: 0.02 }, { expect: 'final', is: THINK_STRINGS[l].bumped }] },
  { name: 'think break', Body: ThinkChapter, steps: [{ click: '.break' }, { expect: 'final', is: THINK_STRINGS[l].bumped }, { click: '.break' }, { expect: 'final', has: '0.4' }] },
  { name: 'think check', Body: ThinkChapter, steps: [{ click: 'button.pick', text: THINK_STRINGS[l].answers.earlier }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'act wheels', Body: ActChapter, steps: [{ slide: 0, in: '.act-turn input[type=range]' }, { expect: 'left', is: '0.15 m/s' }, { expect: 'right', is: '0.15 m/s' }, { slide: 0.22 }, { slide: 1.5, in: '.act-turn input[type=range]' }, { expect: 'right', has: ACT_STRINGS[l].tooFast }] },
  { name: 'act stop', Body: ActChapter, steps: [{ slide: 0.22 }, { click: '.break' }, { expect: 'rolled', is: '1.0 cm' }, { expect: 'note', has: '0.09' }] },
  { name: 'act check', Body: ActChapter, steps: [{ click: 'button.pick', text: ACT_STRINGS[l].answers.later }, { expect: 'check', ok: true }, { a11y: true }] },
  { name: 'simwhat wall', Body: SimwhatChapter, steps: [{ slide: 3 }, { expect: 'world', is: '3.0 m' }, { expect: 'dots', is: '360' }] },
  { name: 'simwhat sensor off', Body: SimwhatChapter, steps: [{ click: '.break' }, { expect: 'dots', is: '0' }, { expect: 'world', is: '1.5 m' }, { expect: 'count:svg.simwhat circle.sw-dot', is: '0' }] },
  { name: 'simwhat check', Body: SimwhatChapter, steps: [{ click: 'button.pick', text: SIMWHAT_STRINGS[l].answers.empty }, { expect: 'check', ok: true }, { a11y: true }] },
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
  for (const l of ['en', 'ja'] as const) for (const c of [...cases(l), ...named]) {
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
