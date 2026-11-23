// Same English, same Burmese: every English string ships with one Burmese rendering, and pinned teaching terms use
// their one word. node scripts/my-consistency.mjs -> one line per conflict; exit 1 when any is left.
// scripts/my-consistency.test.mjs runs the same check on every test run.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Same English, different meaning on the page: these may differ.
const ALLOW = new Map([
  ['stopped', 'robot result (has stopped) vs node state in a table (stopped)'],
  ['yes', 'quiz answer (polite) vs a yes/no table cell'],
  ['no', 'quiz answer (polite) vs a yes/no table cell'],
])
// One Burmese word per teaching term: where the English has the term, the Burmese has this word.
const TERMS = [
  { en: 'rule', my: 'စည်းကမ်းချက်', except: { 'l1/decide:realSensor': 'a ROS standard (REP 117), not the robot\'s decision rule' } },
]

/** @param {Record<string, {status: string, en: string, my: string}>} status @returns {string[]} one line per conflict */
export function conflicts(status) {
  const live = Object.entries(status).filter(([, s]) => s.status === 'pass' || s.status === 'pass-alt')
  const out = []
  const byEn = new Map()
  for (const [id, s] of live) {
    const forms = byEn.get(s.en.trim()) ?? new Map()
    byEn.set(s.en.trim(), forms.set(s.my, [...(forms.get(s.my) ?? []), id]))
  }
  for (const [en, forms] of byEn) {
    if (forms.size > 1 && !ALLOW.has(en)) out.push(`"${en}": ${[...forms].map(([my, ids]) => `${my} <- ${ids.join(', ')}`).join(' | ')}`)
  }
  for (const t of TERMS) {
    const rx = new RegExp(`(^|[^A-Za-z0-9_/])${t.en}s?([^A-Za-z0-9_/]|$)`, 'i')
    for (const [id, s] of live) if (rx.test(s.en) && !s.my.includes(t.my) && !(id in t.except)) out.push(`term "${t.en}" must be ${t.my}: ${id}  ${s.my}`)
  }
  return out
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const found = conflicts(JSON.parse(readFileSync(new URL('./my-status.json', import.meta.url), 'utf8')))
  for (const line of found) console.log(line)
  console.log(`${found.length} conflicts`)
  process.exit(found.length ? 1 : 0)
}
