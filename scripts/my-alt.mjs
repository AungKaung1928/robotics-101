// The second-model check used while Gemini is out (status pass-alt), in three steps:
//   node scripts/my-alt.mjs prep  <draft.json> <dir>   lint each { id: Burmese } draft; lint-clean ones go to <dir>/blind.json
//                                                     under opaque keys (the checker sees no id, no English); fails are printed
//   (a fresh model translates <dir>/blind.json to <dir>/back.json, same keys, seeing nothing else)
//   node scripts/my-alt.mjs pairs <dir>               English next to the blind back-translation, for the meaning compare
//   node scripts/my-alt.mjs apply <dir> [key,key...]  writes status pass-alt for every key except the listed drifts
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { lint } from './my-lint.mjs'

const here = new URL('.', import.meta.url).pathname
const read = (f) => JSON.parse(readFileSync(f, 'utf8'))
const write = (f, j) => writeFileSync(f, JSON.stringify(j, null, 1) + '\n')
const [cmd, a, b] = process.argv.slice(2)
if (!['prep', 'pairs', 'apply'].includes(cmd) || !a) { console.error('usage: my-alt.mjs prep <draft.json> <dir> | pairs <dir> | apply <dir> [skip,keys]'); process.exit(2) }

const dir = cmd === 'prep' ? b : a
mkdirSync(dir, { recursive: true })
const itemsPath = join(dir, 'items.json')
if (!existsSync(itemsPath)) execFileSync(process.execPath, [join(here, 'my-extract.mjs'), itemsPath], { stdio: 'ignore' })
const items = Object.fromEntries(read(itemsPath).items.map((i) => [i.id, i]))

if (cmd === 'prep') {
  const draft = read(a)
  const clean = Object.entries(draft).filter(([id, my]) => {
    const fail = lint(items[id].en, my, items[id].role).fail
    if (fail.length) console.log(`${id} | ${fail.join('; ')} | ${items[id].en} | ${my}`)
    return fail.length === 0
  })
  const key = Object.fromEntries(clean.map(([id], n) => [`k${String(n).padStart(3, '0')}`, id]))
  write(join(dir, 'key.json'), key)
  write(join(dir, 'blind.json'), Object.fromEntries(clean.map(([, my], n) => [`k${String(n).padStart(3, '0')}`, my])))
  console.log(`clean ${clean.length} of ${Object.keys(draft).length} -> ${join(dir, 'blind.json')}`)
} else {
  const key = read(join(dir, 'key.json'))
  const blind = read(join(dir, 'blind.json'))
  const back = read(join(dir, 'back.json'))
  if (cmd === 'pairs') {
    for (const [k, id] of Object.entries(key)) console.log(`${k} | EN: ${items[id].en}\n     BK: ${back[k]}`)
  } else {
    const skip = new Set((b ?? '').split(',').filter(Boolean))
    const statusPath = join(here, 'my-status.json')
    const status = read(statusPath)
    let n = 0
    for (const [k, id] of Object.entries(key)) {
      if (skip.has(k)) continue
      status[id] = { status: 'pass-alt', en: items[id].en, my: blind[k], back: back[k] }
      n++
    }
    write(statusPath, Object.fromEntries(Object.entries(status).sort(([x], [y]) => x.localeCompare(y))))
    console.log(`pass-alt ${n}, skipped ${skip.size}`)
  }
}
