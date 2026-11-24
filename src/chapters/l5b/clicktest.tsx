// Dev-only: drives chapters 5.4-5.6 in a real browser (DOM clicks) in en/ja/my and prints CLICKS PASS/FAIL into #out.
// Run: bash src/chapters/l5b/clicktest.sh (headless Chrome --dump-dom).
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import '../../index.css'
import { STRINGS, type Lang, type Strings } from '../../i18n'
import FieldfailChapter from './FieldfailChapter'
import LifecycleChapter from './LifecycleChapter'
import QosChapter from './QosChapter'
import { FAILS, options } from './fieldfail'

const out = document.getElementById('out')!
const fails: string[] = []
let checks = 0
const ok = (cond: boolean, what: string) => { checks++; if (!cond) fails.push(what) }

function mount(C: ComponentType<{ t: Strings }>, lang: Lang) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  flushSync(() => root.render(<C t={STRINGS[lang]} />))
  const q = (sel: string) => host.querySelector(sel) as HTMLElement
  const read = (k: string) => q(`[data-k="${k}"]`)?.textContent ?? ''
  const click = (el: HTMLElement | null, what: string) => { ok(!!el, `missing ${what}`); if (el) flushSync(() => el.click()) }
  return { q, read, click, done: () => { root.unmount(); host.remove() } }
}

for (const lang of ['en', 'ja', 'my'] as Lang[]) {
  // 5.4 QoS: defaults 20/20; break it = 0/20 and not connected; both transient local = challenge solved.
  let m = mount(QosChapter, lang)
  ok(m.read('got') === '20/20', `${lang} qos default got ${m.read('got')}`)
  m.click(m.q('button.break'), 'qos break')
  ok(m.read('got') === '0/20', `${lang} qos break got ${m.read('got')}`)
  ok(m.q('[data-k="challenge"]').classList.contains('no'), `${lang} qos challenge early`)
  const tl = [...m.q('[data-k="pub"]').querySelectorAll('button')][3] as HTMLElement
  const tl2 = [...m.q('[data-k="sub"]').querySelectorAll('button')][3] as HTMLElement
  const rel = [...m.q('[data-k="pub"]').querySelectorAll('button')][0] as HTMLElement
  m.click(rel, 'qos pub reliable'); m.click(tl, 'qos pub TL'); m.click(tl2, 'qos sub TL')
  ok(m.read('late') === '3/3', `${lang} qos late ${m.read('late')}`)
  ok(m.q('[data-k="challenge"]').classList.contains('ok'), `${lang} qos challenge`)
  m.done()

  // 5.5 lifecycle: activate from unconfigured is rejected; configure + activate = active; executors.
  m = mount(LifecycleChapter, lang)
  m.click(m.q('[data-tr="activate"]'), 'activate')
  ok(m.read('state') === 'unconfigured' && m.read('rejected') !== '', `${lang} lc reject ${m.read('state')}`)
  m.click(m.q('[data-tr="configure"]'), 'configure'); m.click(m.q('[data-tr="activate"]'), 'activate')
  ok(m.read('state') === 'active', `${lang} lc active ${m.read('state')}`)
  m.click(m.q('[data-tr="error"]'), 'error')
  ok(m.q('[data-state="errorprocessing"]').classList.contains('ok'), `${lang} lc errorprocessing ${m.read('state')}`)
  m.click(m.q('[data-tr="onerror-fail"]'), 'onError fails')
  ok(m.q('[data-state="finalized"]').classList.contains('ok'), `${lang} lc error->finalized ${m.read('state')}`)
  m.click(m.q('[data-tr="onerror-ok"]'), 'onError ok from finalized')
  ok(m.read('rejected') !== '', `${lang} lc onError rejected outside ErrorProcessing`)
  m.click(m.q('button.break'), 'lc break')
  ok(m.read('late') === '3', `${lang} lc multi default late ${m.read('late')}`)
  const groups = [...m.q('[aria-pressed]').parentElement!.querySelectorAll('button')]
  m.click(groups[2] as HTMLElement, 'own groups')
  ok(groups.length === 3 && m.read('late') === '0' && m.q('[data-k="challenge"]').classList.contains('ok'), `${lang} lc groups ${m.read('late')}`)
  m.done()

  // 5.6 failures: a wrong pick then the right one scores 0; six right first picks solve it.
  m = mount(FieldfailChapter, lang)
  const pick = (id: string) => m.click(m.q(`[data-pick="${id}"]`), `pick ${id}`)
  pick(options(0).find((p) => p !== FAILS[0].id)!); pick(FAILS[0].id)
  ok(m.read('score') === '0/6' && m.read('fix') !== '', `${lang} ff wrong-first ${m.read('score')}`)
  for (let i = 1; i < FAILS.length; i++) { m.click(m.q('[data-k="next"]'), 'next'); pick(FAILS[i].id) }
  ok(m.read('score') === '5/6' && m.q('[data-k="challenge"]').classList.contains('no'), `${lang} ff 5/6 ${m.read('score')}`)
  m.done()
  m = mount(FieldfailChapter, lang)
  for (let i = 0; i < FAILS.length; i++) { if (i) m.click(m.q('[data-k="next"]'), 'next'); m.click(m.q(`[data-pick="${FAILS[i].id}"]`), 'pick') }
  ok(m.read('score') === '6/6' && m.q('[data-k="challenge"]').classList.contains('ok'), `${lang} ff solved ${m.read('score')}`)
  m.done()
}
out.textContent = fails.length ? `CLICKS FAIL ${fails.length}/${checks}\n${fails.join('\n')}` : `CLICKS PASS ${checks} checks`
