// Smoke checks on the built site in the one Chrome this laptop has (headless, --dump-dom), per language en/ja/my:
// no sideways scroll at 320/360/390/820 px on every route the level map links to, the chosen language survives a reload,
// next/prev links and arrow keys move between chapters, Burmese loads Noto Sans Myanmar, the 'break it' button
// changes the page, the drag handle has a keyboard path. Input here is synthetic (element.click, dispatched keydown):
// real touch, real keys and Firefox/WebKit are in e2e/smoke/smoke.spec.ts (CI). Exit 1 = a check failed.
// Run after a build: `node e2e/smoke/local.mjs` (SMOKE_DIST=<folder>, default dist).
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DIST = process.env.SMOKE_DIST ?? 'dist'
const OUT = join(ROOT, 'verify-out')
const LANGS = ['en', 'ja', 'my']
const CHROME = [process.env.CHROME, 'google-chrome', 'chromium', '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe']
  .filter(Boolean).find((c) => (c.includes('/') ? existsSync(c) : spawnSync('which', [c]).status === 0))
if (!CHROME) throw new Error('no Chrome found: set CHROME=/path/to/chrome')
const winPath = (p) => (CHROME.endsWith('.exe') ? spawnSync('wslpath', ['-w', p], { encoding: 'utf8' }).stdout.trim() : p)

// Runs inside smoke.html; drives the site in a same-origin iframe and prints one line per check.
const HARNESS = `<!doctype html><body style="margin:0"><iframe id="f" style="width:1280px;height:900px;border:0"></iframe><pre id="out"></pre><script>
const lang = new URLSearchParams(location.search).get('lang')
const f = document.getElementById('f'), lines = [], sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const check = (name, ok, detail = '') => lines.push((ok ? 'ok   ' : 'FAIL ') + name + (detail ? ' (' + detail + ')' : ''))
let n = 0
// Poll for the new page after a load, click or key, never a fixed sleep.
const until = async (ok, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (ok()) return true; await sleep(100) } return false }
// A view transition waits for a rendered frame, which a headless --dump-dom iframe may never produce: switch it off
// so swaps run at once (the transition itself is not checked here).
const noVt = () => { f.contentDocument.startViewTransition = undefined }
// Loaded = the app has rendered its h1 (a fixed wait failed 1 run in 5 with the laptop at load 8), then 300 ms for layout.
const load = (hash, w = 1280) => new Promise((r) => { f.style.width = w + 'px'; f.onload = () => { noVt(); until(() => f.contentDocument.querySelector('h1')).then(() => setTimeout(r, 300)) }; f.src = '/?n=' + n++ + hash })
const doc = () => f.contentDocument, h1 = () => doc().querySelector('h1')?.textContent.trim() ?? ''
const arrow = (dir) => (dir > 0 ? '\\u2192' : '\\u2190')
async function main() {
  localStorage.setItem('r101-lang', lang)
  await load('')
  check('map loads in ' + lang, doc().documentElement.lang === lang, 'html lang=' + doc().documentElement.lang)
  const routes = [...new Set([...doc().querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute('href')))].filter((h) => h !== '#/')
  check('map links chapters', routes.length >= 30, routes.length + ' routes')
  for (const w of [320, 360, 390, 820]) { // 820 = tablet portrait (iPad Air width)
    const wide = []
    for (const h of ['', ...routes]) { await load(h, w); const d = doc().documentElement; if (d.scrollWidth > d.clientWidth) wide.push((h || '#/') + ' ' + d.scrollWidth + '>' + d.clientWidth) }
    check('no sideways scroll at ' + w + ' px on ' + (routes.length + 1) + ' pages', !wide.length, wide.join(', '))
  }
  // Map -> first chapter -> next -> prev (links), then arrow keys on a patrol chapter.
  await load('')
  const first = doc().querySelector('a[href^="#/0/"]')
  const t0 = h1(); first.click(); await until(() => h1() !== t0)
  const at1 = f.contentWindow.location.hash, t1 = h1()
  check('map link opens a chapter', /^#\\/0\\//.test(at1) && t1 !== '', at1 + ' h1=' + t1)
  const step = (dir) => [...doc().querySelectorAll('nav.steps a')].find((a) => a.textContent.includes(arrow(dir)))
  step(1).click(); await until(() => h1() !== t1)
  const at2 = f.contentWindow.location.hash
  check('next link moves on', at2 !== at1 && h1() !== t1, at1 + ' -> ' + at2)
  step(-1).click(); await until(() => h1() === t1)
  check('prev link comes back', f.contentWindow.location.hash === at1, f.contentWindow.location.hash)
  await load('#/scan')
  const s0 = h1()
  f.contentWindow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); await until(() => h1() !== s0)
  const k1 = f.contentWindow.location.hash
  f.contentWindow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })); await until(() => h1() === s0)
  check('arrow keys move between chapters', k1 !== '#/scan' && f.contentWindow.location.hash === '#/scan', '#/scan -> ' + k1 + ' -> ' + f.contentWindow.location.hash)
  // Saved language: switch with the header button, reload, still switched.
  const btns = [...doc().querySelectorAll('.langs button')], btn = btns.find((b) => b.getAttribute('aria-pressed') === 'false'), idx = btns.indexOf(btn)
  btn.click(); await sleep(400)
  const picked = doc().documentElement.lang
  await new Promise((r) => { f.onload = () => { noVt(); setTimeout(r, 500) }; f.contentWindow.location.reload() })
  check('switched language survives reload', picked !== lang && doc().documentElement.lang === picked, lang + ' -> ' + picked + ' -> after reload ' + doc().documentElement.lang + ' (button ' + idx + ')')
  localStorage.setItem('r101-lang', lang)
  // Feedback: the 'break it' button changes what the chapter shows.
  await load('#/1/decide')
  const before = doc().querySelector('main').textContent, brk = doc().querySelector('button.break')
  brk?.click(); await sleep(1500)
  check('break-it button gives feedback', !!brk && doc().querySelector('main').textContent !== before, brk ? 'text changed: ' + (doc().querySelector('main').textContent !== before) : 'no button.break')
  // Drag handle: keyboard path = range inputs on the same page.
  await load('#/scan')
  const ranges = doc().querySelectorAll('input[type=range]').length
  check('drag handle has a keyboard path', !!doc().querySelector('.grab') && ranges >= 2, ranges + ' sliders')
  if (lang === 'my') {
    await load('#/0/meet')
    await doc().fonts.load('16px "Noto Sans Myanmar"', '\\u1019'); await doc().fonts.ready
    const face = [...doc().fonts].find((x) => x.family.includes('Myanmar'))
    const fam = getComputedStyle(doc().querySelector('h1')).fontFamily
    check('Burmese uses Noto Sans Myanmar', face?.status === 'loaded' && fam.startsWith('"Noto Sans Myanmar"'), 'face ' + face?.status + ', h1 font ' + fam)
    check('Burmese text on the page', /[\\u1000-\\u109F]/.test(doc().body.textContent))
  }
  await load('#/0/meet', 390)
}
main().catch((e) => check('harness', false, String(e))).finally(() => { document.getElementById('out').textContent = lines.join('\\n') + '\\nSMOKE-END' })
</script>`

const freePort = () => new Promise((ok) => { const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)) }) })
const PORT = await freePort()
const BASE = `http://localhost:${PORT}/`
writeFileSync(join(ROOT, DIST, 'smoke.html'), HARNESS)
mkdirSync(OUT, { recursive: true })
const vite = spawn(join(ROOT, 'node_modules/.bin/vite'), ['preview', '--outDir', DIST, '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
let failed = 0
try {
  let up = false
  for (let i = 0; i < 50 && !up; i++) {
    up = await fetch(BASE).then((r) => r.ok, () => false)
    if (!up) await new Promise((r) => setTimeout(r, 200))
  }
  if (!up) throw new Error(`preview did not start on ${PORT}`)
  for (const lang of LANGS) {
    const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--virtual-time-budget=900000', '--window-size=1300,1000']
    const dump = () => spawnSync(CHROME, [...args, '--dump-dom', `${BASE}smoke.html?lang=${lang}`], { encoding: 'utf8', timeout: 300_000 })
    let r = dump()
    if (!r.stdout) r = dump() // first start can return no DOM (as in scripts/verify.mjs)
    const body = r.stdout?.match(/<pre id="out">([\s\S]*?)SMOKE-END/)?.[1]
    if (!body) { console.log(`FAIL ${lang}: harness printed nothing (exit ${r.status}, ${r.error ?? ''})`); failed++; continue }
    for (const line of body.trim().split('\n')) {
      console.log(`[${lang}] ${line.replace(/&gt;/g, '>').replace(/&amp;/g, '&')}`)
      if (line.startsWith('FAIL')) failed++
    }
    // The page the harness ends on: chapter 0.1 at 390 px, for an eye check of the script (fallback boxes show here).
    spawnSync(CHROME, [...args, `--screenshot=${winPath(join(OUT, `smoke-${lang}-390.png`))}`, `${BASE}smoke.html?lang=${lang}`], { timeout: 300_000 })
  }
} finally {
  vite.kill()
}
console.log(failed ? `FAIL ${failed}` : 'PASS')
process.exit(failed ? 1 : 0)
