// Every English UI/lesson string with context, for the Burmese drafts: node scripts/my-extract.mjs <out.json>
// Item = { id, file, key, role, chapter, en, ja }. Sources: src/i18n.ts STRINGS and every src/chapters/*/*.strings.ts.
// Function-valued strings (templates with numbers) are listed under "fn" and stay English until the lead's contract says
// how Burmese templates are written.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { transformSync } from 'rolldown/utils'

const root = join(dirname(new URL(import.meta.url).pathname), '..')
const tmp = join(tmpdir(), 'r101-my-extract')
mkdirSync(tmp, { recursive: true })

async function load(rel) {
  const src = readFileSync(join(root, rel), 'utf8')
  const r = transformSync(rel, src, { lang: 'ts' })
  if (r.errors?.length) throw new Error(`${rel}: ${r.errors[0].message}`)
  const js = r.code
  if (/^import (?!type)/m.test(js)) throw new Error(`${rel}: runtime import, extractor cannot load it`)
  const out = join(tmp, rel.replace(/[/.]/g, '_') + '.mjs')
  writeFileSync(out, js)
  return import(pathToFileURL(out).href)
}

const role = (key, en) => {
  const last = key.split('.').filter((k) => !/^\d+$/.test(k)).pop() ?? ''
  if (/alt$/i.test(last)) return 'alt'
  if (/aria|label$/i.test(last) && en.split(' ').length <= 6) return 'aria'
  if (/^(title|heading|s\d+)$/i.test(last) || /^\d+\. /.test(en)) return 'heading'
  if (en.split(/\s+/).length <= 5 && !/[.:?!]$/.test(en)) return 'label'
  return 'body'
}

const items = []
const fn = []
function walk(file, chapter, en, ja, path) {
  if (typeof en === 'string') {
    const key = path.join('.')
    items.push({ id: `${chapter}:${key}`, file, key, role: role(key, en), chapter, en, ja: typeof ja === 'string' ? ja : undefined })
  } else if (typeof en === 'function') fn.push(`${chapter}:${path.join('.')}`)
  else if (en && typeof en === 'object') for (const k of Object.keys(en)) walk(file, chapter, en[k], ja?.[k], [...path, k])
}

const core = await load('src/i18n.ts')
walk('src/i18n.ts', 'core', core.STRINGS.en, core.STRINGS.ja, [])
for (const lvl of readdirSync(join(root, 'src/chapters')).sort()) {
  for (const f of readdirSync(join(root, 'src/chapters', lvl)).filter((f) => f.endsWith('.strings.ts')).sort()) {
    const rel = `src/chapters/${lvl}/${f}`
    const mod = await load(rel)
    const obj = Object.values(mod).find((v) => v && typeof v === 'object' && 'en' in v)
    walk(rel, `${lvl}/${basename(f, '.strings.ts')}`, obj.en, obj.ja, [])
  }
}

const outFile = process.argv[2]
if (!outFile) { console.error('usage: my-extract.mjs <out.json>'); process.exit(2) }
writeFileSync(outFile, JSON.stringify({ items, fn }, null, 1) + '\n')
const by = {}
for (const i of items) by[i.chapter] = (by[i.chapter] ?? 0) + 1
console.log(`${items.length} strings, ${fn.length} templates (English for now)`, JSON.stringify(by))
