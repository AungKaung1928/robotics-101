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

async function ask(text) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt(text) }] }] }),
  })
  if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`) // status only: the body can echo request details
  const j = await r.json()
  return j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() ?? ''
}

const src = JSON.parse(readFileSync(inFile, 'utf8'))
const out = {}
let sent = 0
for (const [k, text] of Object.entries(src)) {
  const h = createHash('sha256').update(text).digest('hex').slice(0, 16)
  if (!cache[h]) { cache[h] = await ask(text); sent++; writeFileSync(cachePath, JSON.stringify(cache, null, 1) + '\n') }
  out[k] = cache[h]
}
writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n')
console.log(`${Object.keys(out).length} strings, ${sent} sent, ${Object.keys(out).length - sent} from cache`)
