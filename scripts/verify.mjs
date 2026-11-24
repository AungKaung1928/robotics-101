// Loads the built site in headless Chrome and exits non-zero when a route is broken. Run via scripts/verify.sh.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// A free port per run: on a fixed port a second worktree's preview answered instead of ours and its build was checked (2026-11-24).
const freePort = () => new Promise((ok) => { const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)) }) })
const PORT = Number(process.env.VERIFY_PORT ?? (await freePort()))
const BASE = `http://localhost:${PORT}/`
const DIST = process.env.VERIFY_DIST ?? 'dist'
const OUT = join(ROOT, 'verify-out')
// Route, then the readouts (data-k) its page must show with a number in them.
const ROUTES = [
  { hash: '', h1: { en: 'Robotics 101', ja: 'ロボティクス 101' }, links: ['#/bringup', '#/tf', '#/scan', '#/detect', '#/grid', '#/costmap', '#/goal', '#/0/loop', '#/3/scan', '#/3/tf', '#/3/detect', '#/4/grid', '#/4/costmap', '#/4/goal', '#/4/bringup', '#/0/meet', '#/ep/bfs', '#/ep/late'], has: 'class="levelmap"', words: { peek: /^1 \/ 7 · Nav2 @ 10 s$/ } },
  { hash: '#/bringup', readouts: ['patrol', 'step'], words: { early: /none|なし/ } },
  { hash: '#/bringup/3', readouts: ['step'], off: 4 },
  { hash: '#/tf', readouts: ['hit-map', 'hit-base_footprint', 'hit-base_scan', 'odomhz'], equals: { drive: '0.13 m', mapodom: '0.02 s (50 Hz)' }, words: { verdict: /healthy|正常/ } },
  { hash: '#/tf?t=8', readouts: ['hit-map'], words: { scene: /0\.\d\d m (healthy|正常)/ }, has: 'class="trail"' },
  { hash: '#/tf?jump=0.6', readouts: ['hit-map'], words: { verdict: /JUMP/ }, has: 'ghost-move is-bad' },
  { hash: '#/detect?t=1.5', readouts: ['found'], words: { pass: /^180 \/ 360 · \d$/ }, has: 'cl-raw' },
  { hash: '#/detect?th=0.5', readouts: ['truth'], equals: { found: '3' } },
  { hash: '#/detect?noise=1', readouts: ['truth'], equals: { found: '7' } },
  { hash: '#/costmap?d=0.1', readouts: ['cost'], words: { cost: /^253 \((inscribed|内接)\)$/ } },
  { hash: '#/costmap?k=9.8&d=0.54', readouts: ['cost'], words: { cost: /^1[01]$/ } },
  { hash: '#/goal?d=0.2', readouts: ['tick'], equals: { ticks: '0', drive: '0.00 m' } },
  { hash: '#/scan?t=0.1', readouts: ['hits'], equals: { fired: '180 / 360' }, has: 'class="sweep"' },
  { hash: '#/scan?x=1.2&y=2&yaw=0', readouts: ['beam'], words: { beam: /^-?[01]° → 0\.33 m$/ } },
  { hash: '#/scan', equals: { movemeasured: '5.4–5.8 cm', noise: '1 / 1.5 cm' }, readouts: ['hits', 'gap', 'move', 'scanhz', 'beam'], words: { beam: /^-?[01]° → 1\.4\d m$/ } },
  { hash: '#/detect', readouts: ['found', 'truth'] },
  { hash: '#/grid', readouts: ['cells', 'scans', 'known'], equals: { scans: '1', kept: '1.9 s', between: '8.7–9.2', republish: '5 s' }, has: ' %"' }, // canvas label carries the result
  { hash: '#/0/loop', has: ['class="num">0.6<', 'class="loop-actor"'], equals: { blind: '5.2 cm' } },
  { hash: '#/0/meet', has: 'class="num">0.1<' },
  { hash: '#/0/think', has: ['class="pathline"', 'class="think-scene"'] },
  { hash: '#/0/pipe', has: 'class="num">0.9<' },
  { hash: '#/0/scope', has: ['class="num">0.12<', 'class="scope"'], equals: { ros2: '21 / 23', cpp: '8 / 23' } },
  { hash: '#/3/tflab', has: ['class="num">3.3<', 'class="tfc"', 'class="inset tflab"', 'data-k="stalelesson"'], equals: { stale: 'OK', staleyaw: '17.2°', staleoff: '12.1 cm' } }, // tfc = the animated chain scene; tflab = the STALE scene, 0.3 s old at 1 rad/s
  { hash: '#/ep/bfs', has: 'class="num">EP1<' },
  { hash: '#/ep/late', has: 'class="num">EP2<' },
  { hash: '#/0/tools', has: 'class="num">0.10<' },
  { hash: '#/0/ros', has: 'class="num">0.11<' },
  { hash: '#/1/decide', has: 'class="num">1.1<' },
  { hash: '#/1/closest', has: 'class="num">1.2<' },
  { hash: '#/1/callback', has: 'class="num">1.3<' },
  { hash: '#/1/cpp', has: 'class="num">1.4<' },
  { hash: '#/1/shell', has: 'class="num">1.5<' },
  { hash: '#/2/nodes', has: 'class="num">2.1<' },
  { hash: '#/2/topics', has: 'class="num">2.2<' },
  { hash: '#/2/msgtypes', has: 'class="num">2.3<' },
  { hash: '#/2/actions', has: 'class="num">2.4<' },
  { hash: '#/2/params', has: 'class="num">2.5<' },
  { hash: '#/2/ws', has: 'class="num">2.6<' },
  { hash: '#/2/drive', has: 'class="num">2.7<' },
  { hash: '#/4/grid', readouts: ['cells'], equals: { cells: '40,000' } }, // level route opens the same chapter
  { hash: '#/grid?res=0.1', readouts: ['cells'], equals: { cells: '10,000' } },
  { hash: '#/grid?t=2.5', readouts: ['known'], equals: { scans: '3' }, moreThan: { known: ['#/grid', 'known'] } },
  { hash: '#/grid/7', readouts: ['known'], equals: { scans: '7' }, moreThan: { known: ['#/grid', 'known'] } },
  { hash: '#/costmap', readouts: ['cost', 'edge', 'smooth'], equals: { window: '3 × 3 m = 3,600', ladder: '3.5&nbsp;→ 3.0&nbsp;→ 2.5&nbsp;→ 1.5&nbsp;m' }, has: ['class="pathline"', 'data-k="grow"', 'data-k="ripple"'] }, // ladder as dumped HTML (no-break spaces serialize as &nbsp;); older chapters: dots + Level 0 link + intro line; ripple = the inflation scene's caption
  { hash: '#/4/patrol', has: ['class="num">4.4<', 'class="side graph patrolmap"', 'data-k="skipped"', 'data-k="sleep"'] }, // counts depend on the play position; patrol.test pins them
  { hash: '#/goal', readouts: ['tick', 'drive', 'time', 'ticks', 'cmdhz'], equals: { time: '14.4 s', timeaccel: '14.5 s', yaw: '0.25 rad = 14.3°', progress: '1.9 s', planner: 'NavFn · Dijkstra', recover: 'spin · backup · wait' } },
]
const JA_TEXT = /[぀-ヿ一-龯]/
// Product names stay in Latin letters on Japanese pages too.
const PROPER_NAMES = new Set(['TurtleBot3 Burger', 'Python', 'C++', 'ROS 2']) // product and language names stay in Latin script in Japanese text

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
  writeFileSync(join(ROOT, DIST, 'phone.html'), `<!doctype html><body style="margin:0"><iframe id="f" style="width:390px;height:844px;border:0"></iframe><script>
const f = document.getElementById('f'); f.src = '/' + location.hash
f.onload = () => setTimeout(() => { const d = f.contentDocument.documentElement
  // A slider's 'drag me' hint must not sit on top of the element above the slider (2.4 actions table, 2026-11-24).
  const hit = [...d.querySelectorAll('.slider .hint')].filter((h) => { const o = h.closest('.slider').previousElementSibling
    if (!o) return false; const a = h.getBoundingClientRect(), b = o.getBoundingClientRect(); return a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left }).length
  document.body.append('PHONE ' + d.scrollWidth + ' ' + d.clientWidth + ' HINTX ' + hit) }, 800)</script>`)
  const vite = spawn(join(ROOT, 'node_modules/.bin/vite'), ['preview', '--outDir', DIST, '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
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
        // Every prose paragraph and label on a Japanese page must be Japanese (source lines are citations, a term that is only <code> is a command: skipped).
        if (lang === 'ja') {
          const prose = [...dom.matchAll(/<p(?: class="(?:lede|note)")?>([^<]+)<\/p>|<dt>(?!<code>[^<]*<\/code><\/dt>)(.*?)<\/dt>/g)].map((m) => (m[1] ?? m[2]).replace(/<[^>]+>/g, '').trim())
          for (const t of prose) if (!JA_TEXT.test(t) && !PROPER_NAMES.has(t)) fails.push(`${name}: English left on the Japanese page: '${t.slice(0, 50)}'`)
          // Headline values (title spot, overview waypoints): numbers and units only, no English word of 3+ letters.
          const values = [...dom.matchAll(/data-k="spot"[^>]*>([^<]*)|class="wp-value"[^>]*>([^<]*)/g)].map((m) => (m[1] ?? m[2]).trim())
          for (const v of values) if (/\b[a-z]{3,}\b/.test(v)) fails.push(`${name}: English in a headline value: '${v}'`)
        }
        if (!/<(svg|canvas)[^>]*role="(img|group)"|<pre[^>]*role="log"/.test(dom)) fails.push(`${name}: no figure`) // a terminal chapter's figure is its log
        // Links inside role="img" are hidden from screen readers.
        for (const m of dom.matchAll(/<svg[^>]*role="img"[^>]*>([\s\S]*?)<\/svg>/g)) if (m[1].includes('<a ')) fails.push(`${name}: link inside an svg with role="img"`)
        if (r.readouts && !/data-k="spot"[^>]*>[^<]*\d/.test(dom)) fails.push(`${name}: no headline value under the title`)
        if (r.readouts && (dom.match(/class="hint"/g) ?? []).length !== 1) fails.push(`${name}: want exactly one drag hint`)
        // Mini plan waypoints are links (<a ... aria-current="step">); a Player step rail marks its own step on a <button>.
        if (r.readouts && (dom.match(/<a [^>]*aria-current="step"/g) ?? []).length !== 1) fails.push(`${name}: mini plan does not light exactly one waypoint`)
        for (const h of [r.has ?? []].flat()) if (!dom.includes(h)) fails.push(`${name}: no '${h}' in the page`)
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
        // One retry, as for the DOM dump: under load the dump can end before the frame has printed its widths.
        const measure = () => chrome(BASE + 'phone.html' + r.hash, { lang, size: '390,844' }).match(/PHONE (\d+) (\d+) HINTX (\d+)/)
        const phone = measure() ?? measure()
        if (!phone) fails.push(`${name}: 390 px frame not measured`)
        else if (+phone[1] > +phone[2]) fails.push(`${name}: sideways scroll at 390 px (${phone[1]} > ${phone[2]})`)
        if (phone && +phone[3] > 0) fails.push(`${name}: 'drag me' hint covers the element above its slider at 390 px`)
        console.log(`${name}: checked`)
      }
    }
    chrome(BASE + 'phone.html#/scan', { size: '390,844', shot: 'scan-390.png' })
    chrome(BASE + 'phone.html', { size: '390,844', shot: 'plan-390.png' })
    for (const h of ['bringup', 'tf', 'detect', 'grid', 'costmap', 'goal']) chrome(BASE + `phone.html#/${h}`, { size: '390,844', shot: `${h}-390.png` })
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
