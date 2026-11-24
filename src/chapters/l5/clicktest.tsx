// Dev-only: drives the Level 5 chapters in a real browser (DOM clicks, slider input events); prints CLICKS PASS/FAIL.
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import '../../index.css'
import { STRINGS, stringsFor, type Strings } from '../../i18n'
import PortChapter from './PortChapter'
import CiChapter from './CiChapter'
import DebugChapter from './DebugChapter'
import { DEBUG_STRINGS } from './debug.strings'
import { LDS, cppIndex, pyIndex } from './port'
import { PORT_STRINGS } from './port.strings'
import { CI_STRINGS } from './ci.strings'

const tick = () => new Promise((r) => setTimeout(r, 30))
const k = (h: HTMLElement, key: string) => h.querySelector<HTMLElement>(`[data-k="${key}"]`)?.textContent ?? '(missing)'
function slide(h: HTMLElement, v: number) {
  const el = h.querySelector<HTMLInputElement>('input[type=range]')!
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, String(v))
  el.dispatchEvent(new Event('input', { bubbles: true }))
}
const radio = (h: HTMLElement, name: string, i: number) => h.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)[i].click()
const click = (h: HTMLElement, sel: string) => h.querySelector<HTMLElement>(sel)!.click()

type Case = { name: string; Body: ComponentType<{ t: Strings }>; run: (h: HTMLElement, t: Strings) => Promise<string | null> }
const want = (got: string, has: string) => (got.includes(has) ? null : `expected "${has}" in "${got}"`)

const CASES: Case[] = [
  { name: 'port −90° agrees', Body: PortChapter, run: async (h) => want(k(h, 'py') + '|' + k(h, 'cpp'), `${pyIndex(LDS, -90)}|${pyIndex(LDS, -90)}`) },
  { name: 'port break: −90° reads ray 286', Body: PortChapter, run: async (h, t) => {
    click(h, '.break'); await tick()
    return want(k(h, 'cpp'), String(cppIndex(LDS, -90, false).idx)) ?? want(k(h, 'same'), stringsFor(PORT_STRINGS, t, 'l5.port.PORT_STRINGS').differ)
  } },
  { name: 'port challenge: one agree + one disagree', Body: PortChapter, run: async (h, t) => {
    click(h, '.break'); await tick(); slide(h, 45); await tick(); slide(h, -45); await tick()
    return want(k(h, 'challenge'), stringsFor(PORT_STRINGS, t, 'l5.port.PORT_STRINGS').solved)
  } },
  { name: 'port −π layout hides the bug', Body: PortChapter, run: async (h) => {
    click(h, '.break'); radio(h, 'port-layout', 1); await tick()
    return want(k(h, 'py') + '|' + k(h, 'cpp'), '90|90')
  } },
  { name: 'ci clean push green', Body: CiChapter, run: async (h, t) => {
    click(h, '[data-act="run"]'); await tick()
    return want(k(h, 'step-figure'), stringsFor(CI_STRINGS, t, 'l5.ci.CI_STRINGS').result.success) ?? want(k(h, 'seconds'), '117') ?? want(k(h, 'predict'), '✓')
  } },
  { name: 'ci typo: build red, test skipped, challenge solved', Body: CiChapter, run: async (h, t) => {
    const s = stringsFor(CI_STRINGS, t, 'l5.ci.CI_STRINGS')
    radio(h, 'ci-push', 1); radio(h, 'ci-guess', 1); await tick(); click(h, '[data-act="run"]'); await tick()
    return want(k(h, 'step-build'), s.result.failure) ?? want(k(h, 'step-test'), s.result.skipped) ?? want(k(h, 'predict'), '✓')
      ?? want(k(h, 'seconds'), '91') ?? want(k(h, 'challenge'), s.solved)
  } },
  { name: 'ci failing test: wrong guess "build" is marked wrong', Body: CiChapter, run: async (h, t) => {
    radio(h, 'ci-push', 2); radio(h, 'ci-guess', 1); await tick(); click(h, '[data-act="run"]'); await tick()
    return want(k(h, 'predict'), stringsFor(CI_STRINGS, t, 'l5.ci.CI_STRINGS').wrong) ?? want(k(h, 'real'), '5590e97')
  } },
  { name: 'debug echo alone names nothing', Body: DebugChapter, run: async (h) => {
    click(h, '[data-act="tool-echo"]'); await tick()
    return want(k(h, 'named'), ': 3')
  } },
  { name: 'debug hz + tf2_echo name remap', Body: DebugChapter, run: async (h, t) => {
    click(h, '[data-act="tool-hz"]'); click(h, '[data-act="tool-tf"]'); await tick()
    return want(k(h, 'named'), stringsFor(DEBUG_STRINGS, t, 'l5.debug.DEBUG_STRINGS').named) ?? want(k(h, 'used'), '2')
  } },
  { name: 'debug challenge: rqt_graph on all 3 faults', Body: DebugChapter, run: async (h, t) => {
    for (const i of [0, 1, 2]) { radio(h, 'dbg-fault', i); await tick(); click(h, '[data-act="tool-graph"]'); await tick() }
    return want(k(h, 'challenge'), stringsFor(DEBUG_STRINGS, t, 'l5.debug.DEBUG_STRINGS').solved)
  } },
]

async function main() {
  const out: string[] = []
  let pass = 0, total = 0
  for (const l of ['en', 'ja', 'my'] as const) for (const c of CASES) {
    total++
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    let err: string | null
    try { flushSync(() => root.render(<c.Body t={STRINGS[l]} />)); await tick(); err = await c.run(host, STRINGS[l]) } catch (e) { err = String(e) }
    root.unmount(); host.remove()
    if (err) out.push(`FAIL ${l} ${c.name}: ${err}`)
    else { pass++; out.push(`ok ${l} ${c.name}`) }
  }
  out.push(`CLICKS ${pass === total ? 'PASS' : 'FAIL'} ${pass}/${total}`)
  document.getElementById('out')!.textContent = out.join('\n')
}
void main()
