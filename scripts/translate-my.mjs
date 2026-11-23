// Burmese drafts and blind back-translations by Gemini.
//   draft: node scripts/translate-my.mjs draft <items.json> <out.json> [chapter-prefix]
//          items.json from my-extract.mjs; out = { id: Burmese }. Each request carries role, chapter, en, ja per string,
//          plus the glossary tiers, pinned UI verbs and the style rules from my-glossary.json.
//          MY_REDO=<file> = { id: problem }: those ids are drafted again with the problem stated, overwriting the cache.
//   back:  node scripts/translate-my.mjs back <my.json> <out.json>
//          my.json = { id: Burmese }; the checker model sees ONLY the Burmese (no English), out = { id: English }.
//   compare: node scripts/translate-my.mjs compare <pairs.json> <out.json>
//          pairs.json = { id: { en, back } }: two English texts, no Burmese; out = { id: "same" | "drift: <what changed>" }.
// Drafts are cached by hash of (glossary version, role, en) in scripts/my-cache.json; back-translations are not cached
// (a re-check must be a fresh look). The API key is read at run time from the file named by GEMINI_KEY_FILE and is
// never printed or written; errors carry the HTTP status only.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [mode, inFile, outFile, prefix = ''] = process.argv.slice(2)
if (!['draft', 'back', 'compare'].includes(mode) || !inFile || !outFile) {
  console.error('usage: translate-my.mjs draft <items.json> <out.json> [chapter-prefix] | back|compare <in.json> <out.json>')
  process.exit(2)
}
const here = new URL('.', import.meta.url).pathname
const G = JSON.parse(readFileSync(join(here, 'my-glossary.json'), 'utf8'))
if (!process.env.GEMINI_KEY_FILE) { console.error('set GEMINI_KEY_FILE to the file holding the API key'); process.exit(2) }
const key = readFileSync(process.env.GEMINI_KEY_FILE, 'utf8').trim()
// Drafter and checker are different models with separate free daily counts (research/R101_MY_PIPELINE.md).
const MODEL = mode === 'draft' ? process.env.MY_DRAFT_MODEL ?? 'gemini-3.5-flash' : process.env.MY_BACK_MODEL ?? 'gemini-3.6-flash'
const URL_ = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms))

const draftPrompt = `You translate a beginner robotics course (web app) from English into Burmese.
Rules:
${G.style.map((s) => `- ${s}`).join('\n')}
Tier A, keep in Latin letters: ${G.tierA_keepEnglish.join(', ')}. ${G.tierA_rule}
Tier B loanwords, pinned spelling: ${JSON.stringify(G.tierB_loanwords)}
Tier C plain words: ${JSON.stringify(G.tierC_plain)}
UI verbs, when the whole string is one of these: ${JSON.stringify(G.uiVerbs)}
Example: {"role":"body","en":"Drag the robot on the map to move the scan."} -> "scan ကို ရွှေ့ဖို့ map ပေါ်က စက်ရုပ်ကို ဆွဲပါ။"
Input: a JSON array of {id, role, chapter, en, ja, problem?}. When "problem" is set, the previous draft failed that check: write a new one that fixes it. Reply with JSON only: an object {id: Burmese} with every id.`

const comparePrompt = `Each item has "en" (the original English of a robotics course string) and "back" (a literal English back-translation of its Burmese translation).
Judge only meaning: does "back" say the same thing as "en" for a beginner reader? Ignore word order, style, plurals and small wording differences; Latin terms and numbers must match.
Reply with JSON only: {id: "same"} or {id: "drift: <what changed, max 15 words>"} for every id.`

const backPrompt = `Translate each Burmese string below into plain, literal English. Keep Latin-letter terms as they are.
Input: a JSON object {id: Burmese}. Reply with JSON only: the same ids, each value the English.`

async function ask(text, tries = 6) {
  for (let i = 1; ; i++) {
    try { return await askOnce(text) } catch (e) {
      if (!/HTTP (429|503)$/.test(e.message) || i >= tries) throw e
      await sleep((e.retryAfter ?? 20 * i) * 1000)
    }
  }
}

async function askOnce(text) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseMimeType: 'application/json' } }),
  })
  if (!r.ok) throw Object.assign(new Error(`${MODEL} HTTP ${r.status}`), { retryAfter: Number(r.headers.get('retry-after')) || undefined })
  const j = await r.json()
  return j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() ?? ''
}

async function askJson(prompt, payload, ids) {
  const raw = await ask(`${prompt}\n\n${JSON.stringify(payload)}`)
  const j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  const miss = ids.filter((id) => typeof j[id] !== 'string' || !j[id])
  if (miss.length) throw new Error(`reply misses ${miss.length} ids, first ${miss[0]}`)
  return j
}

// Drafts: 80 strings per request. Back-translation and compare: 40, so one reply stays under the 300 s fetch header timeout.
const BATCH = mode === 'draft' ? 80 : 40
if (mode === 'draft') {
  const cachePath = join(here, 'my-cache.json')
  const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}
  const hashOf = (i) => createHash('sha256').update(`${G.version}|${i.role}|${i.en}`).digest('hex').slice(0, 16)
  const items = JSON.parse(readFileSync(inFile, 'utf8')).items.filter((i) => i.chapter.startsWith(prefix))
  const redo = process.env.MY_REDO ? JSON.parse(readFileSync(process.env.MY_REDO, 'utf8')) : {}
  const todo = items.filter((i) => !cache[hashOf(i)] || redo[i.id]).map((i) => (redo[i.id] ? { ...i, problem: `${redo[i.id]} | previous: ${cache[hashOf(i)]}` } : i))
  let sent = 0
  for (let s = 0; s < todo.length; s += BATCH) {
    const part = todo.slice(s, s + BATCH)
    const got = await askJson(draftPrompt, part.map(({ id, role, chapter, en, ja, problem }) => ({ id, role, chapter, en, ja, problem })), part.map((i) => i.id))
    for (const i of part) cache[hashOf(i)] = got[i.id]
    sent++
    writeFileSync(cachePath, JSON.stringify(cache, null, 1) + '\n')
  }
  writeFileSync(outFile, JSON.stringify(Object.fromEntries(items.map((i) => [i.id, cache[hashOf(i)]])), null, 1) + '\n')
  console.log(`${items.length} strings, ${todo.length} drafted in ${sent} requests (${MODEL}), ${items.length - todo.length} from cache`)
} else if (mode === 'compare') {
  const src = JSON.parse(readFileSync(inFile, 'utf8'))
  const ids = Object.keys(src)
  const out = {}
  for (let s = 0; s < ids.length; s += BATCH) {
    const part = ids.slice(s, s + BATCH)
    Object.assign(out, await askJson(comparePrompt, Object.fromEntries(part.map((id) => [id, src[id]])), part))
  }
  writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n')
  console.log(`${ids.length} compared (${MODEL})`)
} else {
  const src = JSON.parse(readFileSync(inFile, 'utf8'))
  const ids = Object.keys(src)
  const out = {}
  for (let s = 0; s < ids.length; s += BATCH) {
    const part = ids.slice(s, s + BATCH)
    Object.assign(out, await askJson(backPrompt, Object.fromEntries(part.map((id) => [id, src[id]])), part))
  }
  writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n')
  console.log(`${ids.length} back-translated (${MODEL})`)
}
