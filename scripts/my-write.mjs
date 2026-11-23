// Writes src/i18n/my/*.json (shape: src/i18n/my/README.md) from scripts/my-status.json: node scripts/my-write.mjs
// Only strings with status pass or pass-alt (second-model blind check while Gemini is out) whose stored English equals today's English go out; everything else is left out, so the
// app shows English there. Prints per file: live / English fallback.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lint } from './my-lint.mjs'

const here = new URL('.', import.meta.url).pathname
const outDir = join(here, '../src/i18n/my')
const itemsFile = join(tmpdir(), 'r101-my-items.json')
execFileSync(process.execPath, [join(here, 'my-extract.mjs'), itemsFile], { stdio: 'ignore' })
const { items, titles } = JSON.parse(readFileSync(itemsFile, 'utf8'))
const status = JSON.parse(readFileSync(join(here, 'my-status.json'), 'utf8'))

const live = (i) => {
  const s = status[i.id]
  return (s?.status === 'pass' || s?.status === 'pass-alt') && s.en === i.en && lint(i.en, s.my, i.role).fail.length === 0 ? s.my : undefined
}
const files = {}
const count = {}
for (const i of items) {
  const c = (count[i.out] ??= { live: 0, en: 0 })
  const my = live(i)
  if (!my) { c.en++; continue }
  c.live++
  let node = (files[i.out] ??= {})
  const path = i.key.split('.')
  path.forEach((k, n) => {
    if (n === path.length - 1) node[k] = my
    else node = node[k] ??= /^\d+$/.test(path[n + 1]) ? [] : {}
  })
}
const byId = Object.fromEntries(items.map((i) => [i.id, i]))
files.titles = Object.fromEntries(Object.entries(titles).map(([ch, id]) => [ch, live(byId[id])]).filter(([, v]) => v))

mkdirSync(outDir, { recursive: true })
for (const f of readdirSync(outDir)) if (f.endsWith('.json')) rmSync(join(outDir, f))
// Arrays keep their indexes: a missing entry is written as null and the app shows English there.
for (const [name, obj] of Object.entries(files)) {
  if (Object.keys(obj).length) writeFileSync(join(outDir, `${name}.json`), JSON.stringify(obj, (k, v) => (Array.isArray(v) ? Array.from(v, (x) => x ?? null) : v), 1) + '\n')
}
let L = 0, E = 0
for (const [f, c] of Object.entries(count)) { L += c.live; E += c.en; if (c.live) console.log(`${f}: ${c.live} live, ${c.en} English`) }
console.log(`total ${L} live, ${E} English fallback, ${Object.keys(files.titles).length} titles`)
