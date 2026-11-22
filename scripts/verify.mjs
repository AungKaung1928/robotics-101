// Loads the built site in headless Chrome and exits non-zero when a route is broken. Run via scripts/verify.sh.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.VERIFY_PORT ?? 4191)
const BASE = `http://localhost:${PORT}/`
const OUT = join(ROOT, 'verify-out')
// Route, then the readouts (data-k) its page must show with a number in them.
const ROUTES = [
  { hash: '', h1: { en: 'Robotics First Steps', ja: 'ロボティクス はじめの一歩' }, links: ['#/bringup', '#/tf', '#/scan', '#/detect', '#/grid', '#/costmap', '#/goal'], words: { peek: /^1 \/ 7 · Nav2 @ 10 s$/ } },
  { hash: '#/bringup', readouts: ['patrol', 'step'], words: { early: /none|なし/ } },
  { hash: '#/bringup/3', readouts: ['step'], off: 4 },
  { hash: '#/tf', readouts: ['hit-map', 'hit-base_scan'], words: { verdict: /healthy|正常/ } },
  { hash: '#/tf?jump=0.6', readouts: ['hit-map'], words: { verdict: /JUMP/ }, has: 'ghost-move is-bad' },
  { hash: '#/detect?th=0.5', readouts: ['truth'], equals: { found: '3' } },
  { hash: '#/costmap?d=0.1', readouts: ['cost'], words: { cost: /^253 \((inscribed|内接)\)$/ } },
  { hash: '#/costmap?k=9.8&d=0.54', readouts: ['cost'], words: { cost: /^1[01]$/ } },
  { hash: '#/goal?d=0.2', readouts: ['tick'], equals: { ticks: '0', drive: '0.00 m' } },
  { hash: '#/scan?x=1.2&y=2&yaw=0', readouts: ['beam'], words: { beam: /^-?[01]° → 0\.33 m$/ } },
  { hash: '#/scan', readouts: ['hits', 'gap', 'move', 'scanhz', 'beam'], words: { beam: /^-?[01]° → 1\.4\d m$/ } },
  { hash: '#/detect', readouts: ['found', 'truth'] },
  { hash: '#/grid', readouts: ['cells', 'scans', 'known'], equals: { scans: '1' } },
  { hash: '#/grid/7', readouts: ['known'], equals: { scans: '7' }, moreThan: { known: ['#/grid', 'known'] } },
  { hash: '#/costmap', readouts: ['cost', 'edge', 'smooth'] },
  { hash: '#/goal', readouts: ['tick', 'drive', 'time', 'ticks', 'cmdhz'] },
]
const JA_TEXT = /[぀-ヿ一-龯]/

const CHROME = [process.env.CHROME, 'google-chrome', 'chromium', '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe']
  .filter(Boolean).find((c) => (c.includes('/') ? existsSync(c) : spawnSync('which', [c]).status === 0))
if (!CHROME) throw new Error('no Chrome found: set CHROME=/path/to/chrome')
const winPath = (p) => (CHROME.endsWith('.exe') ? spawnSync('wslpath', ['-w', p], { encoding: 'utf8' }).stdout.trim() : p)

function chrome(url, { lang = 'en', size = '1280,1000', shot } = {}) {
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', `--lang=${lang}`, `--accept-lang=${lang}`,
    '--virtual-time-budget=4000', `--window-size=${size}`]
  const env = { ...process.env, LANGUAGE: lang }
  const run = (extra) => spawnSync(CHROME, [...args, ...extra, url], { encoding: 'utf8', timeout: 60_000, env })
  let r = run(['--dump-dom'])
  if (!r.stdout) r = run(['--dump-dom']) // first start can return no DOM; a broken page still returns one
  if (shot) run([`--screenshot=${winPath(join(OUT, shot))}`])
  return r.stdout ?? ''
}

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT)
  // 390 px: a same-origin page frames the site and prints the frame's scroll width vs its width.
  writeFileSync(join(ROOT, 'dist/phone.html'), `<!doctype html><body style="margin:0"><iframe id="f" style="width:390px;height:844px;border:0"></iframe><script>
const f = document.getElementById('f'); f.src = '/' + location.hash
f.onload = () => setTimeout(() => { const d = f.contentDocument.documentElement
  document.body.append('PHONE ' + d.scrollWidth + ' ' + d.clientWidth) }, 800)</script>`)
  const vite = spawn(join(ROOT, 'node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
  const fails = []
  const seen = {} // dom per route and language, for checks that compare two pages
  try {
    let up = false
    for (let i = 0; i < 50 && !up; i++) {
      up = await fetch(BASE).then((r) => r.ok, () => false)
      if (!up) await new Promise((r) => setTimeout(r, 200))
    }
    if (!up) throw new Error(`preview did not start on ${PORT}`)
    for (const r of ROUTES) {
      for (const lang of ['en', 'ja']) {
        const name = `${r.hash || '#/'} (${lang})`
        const dom = chrome(BASE + r.hash, { lang, shot: `${(r.hash.slice(2).replace(/[/?=&]/g, '-') || 'plan')}-${lang}.png` })
        const h1 = dom.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim()
        if (!h1) fails.push(`${name}: no h1`)
        if (r.h1 && h1 !== r.h1[lang]) fails.push(`${name}: h1 '${h1}'`)
        if (!dom.includes(`<html lang="${lang}"`)) fails.push(`${name}: <html lang> is not ${lang}`)
        if (lang === 'ja' && !JA_TEXT.test(h1 ?? '')) fails.push(`${name}: h1 not Japanese`)
        // Every prose paragraph and label on a Japanese page must be Japanese (source lines are citations: skipped).
        if (lang === 'ja') {
          const prose = [...dom.matchAll(/<p(?: class="(?:lede|note)")?>([^<]+)<\/p>|<dt>(.*?)<\/dt>/g)].map((m) => (m[1] ?? m[2]).replace(/<[^>]+>/g, '').trim())
          for (const t of prose) if (!JA_TEXT.test(t)) fails.push(`${name}: English left on the Japanese page: '${t.slice(0, 50)}'`)
        }
        if (!/<(svg|canvas)[^>]*role="(img|group)"/.test(dom)) fails.push(`${name}: no figure`)
        // Links inside role="img" are hidden from screen readers.
        for (const m of dom.matchAll(/<svg[^>]*role="img"[^>]*>([\s\S]*?)<\/svg>/g)) if (m[1].includes('<a ')) fails.push(`${name}: link inside an svg with role="img"`)
        if (r.readouts && (dom.match(/class="hint"/g) ?? []).length !== 1) fails.push(`${name}: want exactly one drag hint`)
        if (r.readouts && (dom.match(/aria-current="step"/g) ?? []).length !== 1) fails.push(`${name}: mini plan does not light exactly one waypoint`)
        if (r.has && !dom.includes(r.has)) fails.push(`${name}: no '${r.has}' in the page`)
        const read = (k, d = dom) => d.match(new RegExp(`data-k="${k}"[^>]*>([^<]*)`))?.[1]
        for (const [k, want] of Object.entries(r.equals ?? {})) if (read(k) !== want) fails.push(`${name}: readout ${k} '${read(k)}', want '${want}'`)
        for (const [k, [hash, k2]] of Object.entries(r.moreThan ?? {})) {
          const other = parseFloat(read(k2, seen[`${hash} ${lang}`] ?? '') ?? 'NaN')
          if (!(parseFloat(read(k) ?? 'NaN') > other)) fails.push(`${name}: readout ${k} ${read(k)} not above ${hash} (${other})`)
        }
        seen[`${r.hash} ${lang}`] = dom
        if (r.off !== undefined) {
          const n = (dom.match(/is-off/g) ?? []).length
          if (n !== r.off) fails.push(`${name}: ${n} timeline rows dimmed, want ${r.off}`)
        }
        for (const l of r.links ?? []) if (!dom.includes(`href="${l}"`)) fails.push(`${name}: no waypoint link ${l}`)
        for (const k of r.readouts ?? []) {
          const v = dom.match(new RegExp(`data-k="${k}"[^>]*>([^<]*)`))?.[1]
          if (!v || !/\d/.test(v)) fails.push(`${name}: readout ${k} empty`)
        }
        for (const [k, want] of Object.entries(r.words ?? {})) {
          const v = dom.match(new RegExp(`data-k="${k}"[^>]*>([^<]*)`))?.[1]
          if (!want.test(v ?? '')) fails.push(`${name}: readout ${k} '${v}', want ${want}`)
        }
        const phone = chrome(BASE + 'phone.html' + r.hash, { lang, size: '390,844' }).match(/PHONE (\d+) (\d+)/)
        if (!phone) fails.push(`${name}: 390 px frame not measured`)
        else if (+phone[1] > +phone[2]) fails.push(`${name}: sideways scroll at 390 px (${phone[1]} > ${phone[2]})`)
        console.log(`${name}: checked`)
      }
    }
    chrome(BASE + 'phone.html#/scan', { size: '390,844', shot: 'scan-390.png' })
    chrome(BASE + 'phone.html', { size: '390,844', shot: 'plan-390.png' })
  } finally {
    vite.kill()
  }
  if (fails.length) {
    console.error(`FAIL ${fails.length}\n` + fails.join('\n'))
    process.exit(1)
  }
  console.log(`PASS ${ROUTES.length * 2} pages`)
}
main().catch((e) => { console.error(e); process.exit(1) })
