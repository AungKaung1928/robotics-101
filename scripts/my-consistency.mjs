// Same English, same Burmese: lists every English string that ships with more than one Burmese rendering.
// node scripts/my-consistency.mjs  -> one block per conflict; exit 1 when any conflict is left.
import { readFileSync } from 'node:fs'

const status = JSON.parse(readFileSync(new URL('./my-status.json', import.meta.url), 'utf8'))
// Same English, different meaning on the page: these may differ.
const ALLOW = new Map([
  ['stopped', 'robot result (has stopped) vs node state in a table (stopped)'],
  ['yes', 'quiz answer (polite) vs a yes/no table cell'],
  ['no', 'quiz answer (polite) vs a yes/no table cell'],
])
const byEn = new Map()
for (const [id, s] of Object.entries(status)) {
  if (s.status !== 'pass' && s.status !== 'pass-alt') continue
  const key = s.en.trim()
  if (!byEn.has(key)) byEn.set(key, new Map())
  const forms = byEn.get(key)
  forms.set(s.my, [...(forms.get(s.my) ?? []), id])
}
let n = 0
for (const [en, forms] of byEn) {
  if (forms.size < 2 || ALLOW.has(en)) continue
  n++
  console.log(`"${en}"`)
  for (const [my, ids] of forms) console.log(`  ${my}  <- ${ids.join(', ')}`)
}
console.log(`${n} conflicts`)
process.exit(n ? 1 : 0)
