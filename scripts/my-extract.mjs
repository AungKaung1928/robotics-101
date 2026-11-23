// Every English UI/lesson string with context, for the Burmese drafts: node scripts/my-extract.mjs <out.json>
// Item = { id, file, out, key, role, chapter, en, ja }; out = the src/i18n/my/<out>.json file it belongs to (README there).
// titles = { chapter id: item id of its English title } for src/i18n/my/titles.json. Sources: src/i18n.ts STRINGS and every src/chapters/*/*.strings.ts.
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
  // Vite's import.meta.glob (the Burmese overlays) does not exist in plain Node: the extractor only needs the English.
  const js = r.code.replace(/import\.meta\.glob\(/g, '((..._) => ({}))(')
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
  if (!/[.:?!]['")]?$/.test(en.trim())) return 'label'
  return 'body'
}

const items = []
const fn = []
function walk(file, out, chapter, en, ja, path) {
  if (typeof en === 'string') {
    const key = path.join('.')
    items.push({ id: `${chapter}:${key}`, file, out, key, role: role(key, en), chapter, en, ja: typeof ja === 'string' ? ja : undefined })
  } else if (typeof en === 'function') fn.push(`${chapter}:${path.join('.')}`)
  else if (en && typeof en === 'object') for (const k of Object.keys(en)) walk(file, out, chapter, en[k], ja?.[k], [...path, k])
}

const core = await load('src/i18n.ts')
walk('src/i18n.ts', 'core', 'core', core.STRINGS.en, core.STRINGS.ja, [])
// Only chapters listed in src/chapters/*/index.ts have a titles.json entry (src/i18n.parity.test.ts TITLE_IDS).
const titles = {}
const exportOf = {}
for (const lvl of readdirSync(join(root, 'src/chapters')).sort()) {
  for (const f of readdirSync(join(root, 'src/chapters', lvl)).filter((f) => f.endsWith('.strings.ts')).sort()) {
    const rel = `src/chapters/${lvl}/${f}`
    const mod = await load(rel)
    const [name, obj] = Object.entries(mod).find(([, v]) => v && typeof v === 'object' && 'en' in v)
    const chapter = `${lvl}/${basename(f, '.strings.ts')}`
    exportOf[name] = chapter
    walk(rel, `${lvl}.${basename(f, '.strings.ts')}.${name}`, chapter, obj.en, obj.ja, [])
  }
}

// Chapter metadata ({ id: 'x', ..., titleEn: X_STRINGS.en.title }) lives in index.ts files next to React imports, so it is
// read as text, not imported.
for (const lvl of readdirSync(join(root, 'src/chapters'))) {
  const src = readFileSync(join(root, 'src/chapters', lvl, 'index.ts'), 'utf8')
  for (const m of src.matchAll(/id: '([\w-]+)'[^}]*?titleEn: (\w+)\.en\.title/g)) titles[m[1]] = `${exportOf[m[2]]}:title`
}
const outFile = process.argv[2]
if (!outFile) { console.error('usage: my-extract.mjs <out.json>'); process.exit(2) }
writeFileSync(outFile, JSON.stringify({ items, fn, titles }, null, 1) + '\n')
const by = {}
for (const i of items) by[i.chapter] = (by[i.chapter] ?? 0) + 1
console.log(`${items.length} strings, ${fn.length} templates (English for now)`, JSON.stringify(by))
