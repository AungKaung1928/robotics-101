// One Burmese batch end to end: node scripts/my-run.mjs <chapter-prefix> <work-dir>
// extract -> draft (cache) -> lint -> blind back-translation -> meaning compare -> one redo of every fail/drift with the
// problem stated -> again lint/back/compare -> status. Writes scripts/my-status.json { id: { status, my, note } }:
//   pass        lint clean and the blind back-translation means the same as the English
// (en is stored so a later change of the English makes the entry stale.)
//   needs-human failed twice (lint or drift): the English shows for that string
// Gemini work runs through translate-my.mjs (key from GEMINI_KEY_FILE, never printed).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { lint } from './my-lint.mjs'

const [prefix, dir] = process.argv.slice(2)
if (prefix === undefined || !dir) { console.error('usage: my-run.mjs <chapter-prefix> <work-dir>'); process.exit(2) }
mkdirSync(dir, { recursive: true })
const here = new URL('.', import.meta.url).pathname
const node = (...a) => execFileSync(process.execPath, a, { stdio: ['ignore', 'inherit', 'inherit'], env: process.env })
const read = (f) => JSON.parse(readFileSync(f, 'utf8'))
const write = (f, j) => writeFileSync(f, JSON.stringify(j, null, 1) + '\n')
const statusPath = join(here, 'my-status.json')
const status = existsSync(statusPath) ? read(statusPath) : {}

node(join(here, 'my-extract.mjs'), join(dir, 'items.json'))
const items = read(join(dir, 'items.json')).items.filter((i) => i.chapter.startsWith(prefix))
const byId = Object.fromEntries(items.map((i) => [i.id, i]))

function round(n, redo) {
  const tag = `r${n}`
  if (redo) write(join(dir, `redo-${tag}.json`), redo)
  const env = redo ? { ...process.env, MY_REDO: join(dir, `redo-${tag}.json`) } : process.env
  execFileSync(process.execPath, [join(here, 'translate-my.mjs'), 'draft', join(dir, 'items.json'), join(dir, `my-${tag}.json`), prefix],
    { stdio: ['ignore', 'inherit', 'inherit'], env })
  const my = read(join(dir, `my-${tag}.json`))
  const ids = redo ? Object.keys(redo) : items.map((i) => i.id)
  const problems = {}
  const clean = {}
  for (const id of ids) {
    const r = lint(byId[id].en, my[id], byId[id].role)
    if (r.fail.length) problems[id] = `mechanical check: ${r.fail.join('; ')}`
    else clean[id] = my[id]
  }
  if (Object.keys(clean).length) {
    const cleanPath = join(dir, `clean-${tag}.json`)
    const sameInput = existsSync(cleanPath) && JSON.stringify(read(cleanPath)) === JSON.stringify(clean)
    write(cleanPath, clean)
    // An existing back-translation or compare file (a restart, or a compare written by the reviewer) is reused when it
    // was made from exactly these Burmese strings, so a restart never spends the free daily count twice.
    const have = (f) => sameInput && existsSync(f) && Object.keys(clean).every((id) => id in read(f))
    if (!have(join(dir, `back-${tag}.json`))) node(join(here, 'translate-my.mjs'), 'back', join(dir, `clean-${tag}.json`), join(dir, `back-${tag}.json`))
    const back = read(join(dir, `back-${tag}.json`))
    write(join(dir, `pairs-${tag}.json`), Object.fromEntries(Object.keys(clean).map((id) => [id, { en: byId[id].en, back: back[id] }])))
    if (!have(join(dir, `cmp-${tag}.json`))) node(join(here, 'translate-my.mjs'), 'compare', join(dir, `pairs-${tag}.json`), join(dir, `cmp-${tag}.json`))
    const cmp = read(join(dir, `cmp-${tag}.json`))
    for (const id of Object.keys(clean)) {
      if (cmp[id] === 'same') status[id] = { status: 'pass', en: byId[id].en, my: my[id], back: back[id] }
      else problems[id] = `meaning drift (blind back-translation: "${back[id]}"): ${cmp[id]}`
    }
  }
  return { my, problems }
}

const r1 = round(1)
const r2 = Object.keys(r1.problems).length ? round(2, r1.problems) : { problems: {}, my: r1.my }
for (const [id, note] of Object.entries(r2.problems)) status[id] = { status: 'needs-human', en: byId[id].en, my: r2.my[id], note }
write(statusPath, Object.fromEntries(Object.entries(status).sort(([a], [b]) => a.localeCompare(b))))
const n = (s) => items.filter((i) => status[i.id]?.status === s).length
console.log(`${prefix}: ${items.length} strings | pass ${n('pass')} | needs-human ${n('needs-human')} | round-1 problems ${Object.keys(r1.problems).length}`)
