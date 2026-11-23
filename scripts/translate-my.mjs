// Burmese drafts by Gemini: node scripts/translate-my.mjs <in.json> <out.json> [--back]
// in.json = { key: English text } (or Burmese with --back, for the back-translation check). Results are cached by a
// hash of the source text in scripts/my-cache.json, so only changed strings are sent again. The API key is read at run
// time from the file named by GEMINI_KEY_FILE and never printed or written.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [inFile, outFile, mode] = process.argv.slice(2)
if (!inFile || !outFile) { console.error('usage: translate-my.mjs <in.json> <out.json> [--back]'); process.exit(2) }
const back = mode === '--back'
const here = new URL('.', import.meta.url).pathname
const cachePath = join(here, back ? 'my-back-cache.json' : 'my-cache.json')
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}
const glossary = JSON.parse(readFileSync(join(here, 'my-glossary.json'), 'utf8'))
if (!process.env.GEMINI_KEY_FILE) { console.error('set GEMINI_KEY_FILE to the file holding the API key'); process.exit(2) }
const key = readFileSync(process.env.GEMINI_KEY_FILE, 'utf8').trim()
const URL_ = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent'

const prompt = (text) => back
  ? `Translate this Burmese text to plain English, literally. Reply with the translation only.\n\n${text}`
  : `Translate this text from a beginner robotics course into Burmese (Myanmar Unicode). Keep these terms in English: ${glossary.keepEnglish.join(', ')}. ${glossary.rules.join(' ')} Use simple words for a reader with no experience. Reply with the translation only.\n\n${text}`

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms))

// Free tier allows a few requests a minute: on 429 wait (Retry-After, else 20 s more each try) and try again, 6 tries.
async function ask(text, tries = 6) {
  for (let i = 1; ; i++) {
    try { return await askOnce(text) } catch (e) {
      if (!String(e.message).endsWith('429') || i >= tries) throw e
      await sleep((e.retryAfter ?? 20 * i) * 1000)
    }
  }
}

async function askOnce(text) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt(text) }] }] }),
  })
  if (!r.ok) throw Object.assign(new Error(`Gemini HTTP ${r.status}`), { retryAfter: Number(r.headers.get('retry-after')) || undefined }) // status only: the body can echo request details
  const j = await r.json()
  return j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() ?? ''
}

// One request per batch (free tier counts requests per day): send { hash: text }, expect the same keys back.
const BATCH = 60
const askBatch = async (items) => {
  const raw = await ask(`${prompt('<each value of the JSON below>')}\nReply with JSON only: the same keys, each value translated.\n\n${JSON.stringify(items)}`)
  const j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  for (const h of Object.keys(items)) if (typeof j[h] !== 'string' || !j[h]) throw new Error(`batch reply misses ${h}`)
  return j
}

const src = JSON.parse(readFileSync(inFile, 'utf8'))
const hashOf = (t) => createHash('sha256').update(t).digest('hex').slice(0, 16)
const todo = Object.fromEntries(Object.values(src).map((t) => [hashOf(t), t]).filter(([h]) => !cache[h]))
const hs = Object.keys(todo)
for (let i = 0; i < hs.length; i += BATCH) {
  Object.assign(cache, await askBatch(Object.fromEntries(hs.slice(i, i + BATCH).map((h) => [h, todo[h]]))))
  writeFileSync(cachePath, JSON.stringify(cache, null, 1) + '\n')
}
const out = Object.fromEntries(Object.entries(src).map(([k, t]) => [k, cache[hashOf(t)]]))
writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n')
console.log(`${Object.keys(out).length} strings, ${hs.length} sent in ${Math.ceil(hs.length / BATCH)} requests, ${Object.keys(out).length - hs.length} from cache`)
