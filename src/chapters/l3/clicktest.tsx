// Dev-only: drives 3.4 TF lab in a real browser (DOM clicks); prints CLICKS PASS/FAIL. Run: bash src/chapters/l3/clicktest.sh
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import '../../index.css'
import { STRINGS } from '../../i18n'
import TfLabChapter from './TfLabChapter'
import { BROKEN, CHOICES, apply, healthy } from './tflab'

const tick = () => new Promise((r) => setTimeout(r, 30))
const RIGHT = CHOICES.findIndex((c) => healthy(apply(BROKEN, c)))
const WRONG = CHOICES.findIndex((c) => !healthy(apply(BROKEN, c)))
type Case = { name: string; run: (h: HTMLElement) => Promise<string | null> }
const fixBtn = (h: HTMLElement, i: number) => h.querySelectorAll<HTMLButtonElement>('.choices button.break')[i].click()
const chal = (h: HTMLElement) => h.querySelector<HTMLElement>('[data-k="challenge"]')!
const solved = (h: HTMLElement) => chal(h).classList.contains('ok')

const CASES: Case[] = [
  { name: 'right first pick solves it', run: async (h) => { fixBtn(h, RIGHT); await tick(); return solved(h) ? null : `not solved: ${chal(h).textContent}` } },
  { name: 'every control once in page order does not solve it', run: async (h) => {
    h.querySelector<HTMLElement>('[data-act="check"]')!.click(); h.querySelector<HTMLElement>('[data-act="run"]')!.click(); await tick()
    for (let i = 0; i < CHOICES.length; i++) { fixBtn(h, i); await tick() }
    return !solved(h) && h.querySelector('[data-k="notfirst"]') ? null : `solved by clicking through: ${chal(h).textContent}`
  } },
  { name: 'wrong pick, break again, right pick solves it', run: async (h) => {
    fixBtn(h, WRONG); await tick(); fixBtn(h, RIGHT); await tick()
    if (solved(h)) return 'second pick counted'
    h.querySelector<HTMLElement>('[data-act="reset"]')!.click(); await tick(); fixBtn(h, RIGHT); await tick()
    return solved(h) && !h.querySelector('[data-k="notfirst"]') ? null : `not solved after reset: ${chal(h).textContent}`
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
    try { flushSync(() => root.render(<TfLabChapter t={STRINGS[l]} />)); await tick(); err = await c.run(host) } catch (e) { err = String(e) }
    root.unmount(); host.remove()
    if (err) out.push(`FAIL ${l} ${c.name}: ${err}`)
    else { pass++; out.push(`ok ${l} ${c.name}`) }
  }
  out.push(`CLICKS ${pass === total ? 'PASS' : 'FAIL'} ${pass}/${total}`)
  document.getElementById('out')!.textContent = out.join('\n')
}
void main()
