// Mechanical checks for one Burmese string against its English source. lint(en, my, role) -> { fail: [...], warn: [...] }.
// A string with any fail is never shipped (English shows instead); warns are listed for the review.
import { readFileSync } from 'node:fs'

const G = JSON.parse(readFileSync(new URL('./my-glossary.json', import.meta.url), 'utf8'))

// Burmese base consonants (+ ဥ ဿ that also carry vowels), and the four medials ျ ြ ွ ှ.
const CONS = /[က-အဥဿ]/
const MEDIAL = /[ျ-ှ]/

/** Zawgyi or broken Unicode order: Zawgyi-only code points, ေ / medials not after a consonant, ္ not between consonants. */
export function encodingErrors(s) {
  const e = []
  if (/[ၠ-႗]/.test(s)) e.push('zawgyi code point U+1060-1097')
  if (/​/.test(s)) e.push('zero-width space')
  const ch = [...s]
  ch.forEach((c, i) => {
    const p = ch[i - 1] ?? ''
    if (c === 'ေ' && !(CONS.test(p) || MEDIAL.test(p))) e.push(`ေ at ${i} not after a consonant or medial`)
    if (MEDIAL.test(c) && !(CONS.test(p) || MEDIAL.test(p))) e.push(`medial at ${i} not after a consonant`)
    // ္ joins two consonants; kinzi (င + ် + ္ before a consonant, as in စင်္ကာပူ) is the one valid form after ်.
    const kinzi = p === '\u103A' && ch[i - 2] === '\u1004'
    if (c === '\u1039' && !((CONS.test(p) || kinzi) && CONS.test(ch[i + 1] ?? ''))) e.push(`stack sign ္ at ${i} not between consonants`)
  })
  if (/[぀-ヿ一-鿿]/.test(s)) e.push('Japanese text')
  if (/[၀-၉]/.test(s)) e.push('Burmese digits (use 0-9)')
  return e
}

const nums = (s) => (s.match(/\d+(?:\.\d+)?/g) ?? []).sort()
// English number words may become digits in Burmese ("one scan" -> "scan 1 ကြိမ်"): count them as digits on the English side.
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twice: 2, once: 1 }
const numsEn = (en, my) => {
  const extra = (en.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|twice|once)\b/gi) ?? []).map((w) => String(WORDS[w.toLowerCase()]))
  const want = nums(en)
  const got = nums(my)
  // Each number word may or may not be written as a digit: keep the ones the Burmese actually uses.
  for (const d of extra) if (got.filter((x) => x === d).length > want.filter((x) => x === d).length) want.push(d)
  return want.sort()
}
const ticks = (s) => (s.match(/`[^`]+`/g) ?? []).sort()
// Identifiers, topics, files, commands: a capital after the first letter, digit, _ / . + :: inside the token.
const idents = (s) => (s.match(/[A-Za-z_/~][\w/.+:-]*/g) ?? []).map((t) => t.replace(/[.:-]+$/, ''))
  .filter((t) => /[_/+]|::|\.\w|\w[A-Z]|\d/.test(t.slice(1)) || /^\/\w/.test(t))
const word = (w) => new RegExp(`(^|[^A-Za-z])${w.replace(/[.+*?()[\]\\]/g, '\\$&')}s?([^A-Za-z]|$)`, 'i')
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])

export function lint(en, my, role = 'body') {
  const fail = []
  const warn = []
  if (!my || !my.trim()) return { fail: ['empty'], warn }
  fail.push(...encodingErrors(my))
  if (!eq(numsEn(en, my), nums(my))) fail.push(`numbers ${numsEn(en, my)} vs ${nums(my)}`)
  if (!eq(ticks(en), ticks(my))) fail.push('backtick spans differ')
  for (const t of idents(en)) if (!my.includes(t)) fail.push(`identifier ${t} missing`)
  for (const t of G.tierA_keepEnglish) if (word(t).test(en) && !word(t).test(my)) fail.push(`tier A "${t}" not kept`)
  if (G.uiVerbs[en] !== undefined && my !== G.uiVerbs[en]) fail.push(`UI verb "${en}" must be ${G.uiVerbs[en]}`)
  for (const [w, b] of Object.entries(G.tierB_loanwords)) if (word(w).test(en) && !my.includes(b)) fail.push(`"${w}" must be ${b}`)
  if (role === 'body' || role === 'heading') {
    let t = my
    for (const a of G.literaryAllow) t = t.split(a).join('')
    for (const l of G.literaryBanned) if (t.includes(l)) fail.push(`literary form ${l}`)
  }
  if (role === 'body' && /[.!]["')]?$/.test(en.trim()) && /[က-႟]/.test(my) && !/။["')]?$/.test(my.trim())) fail.push('body sentence must end with ။')
  if (!/[.!?:]['")]?$/.test(en.trim()) && /(။|ဖြစ်ပါတယ်)['")]?$/.test(my.trim())) fail.push('label or fragment got a sentence ending')
  if (/[က-႟]\s*\.$/.test(my.trim())) fail.push('"." after Burmese text')
  const r = [...my].length / [...en].length
  if (en.length > 12 && (r < 0.5 || r > 3)) warn.push(`length ratio ${r.toFixed(2)}`)
  const latinRun = my.replace(/`[^`]+`/g, ' ').match(/[A-Za-z][\w'-]*(\s+[A-Za-z][\w'-]*){3,}/g) ?? []
  for (const run of latinRun) if (!G.tierA_keepEnglish.some((t) => run.includes(t)) && !idents(run).length) warn.push(`English run "${run}"`)
  if (!/[က-႟]/.test(my) && /[a-z]{3,}\s+[a-z]{3,}/i.test(en) && my === en) warn.push('left in English')
  return { fail, warn }
}
