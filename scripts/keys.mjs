// Real input in headless Chrome (DevTools protocol): keys, clicks, hover. Exits non-zero when one is broken.
// Needs Node 22+ (built-in WebSocket) and a Chrome whose debug port this process can reach (Linux CI).
// Run after `npm run build`. scripts/verify.mjs checks the pages; this checks what a reader does on them.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4193
const DEBUG = 9239
const BASE = `http://localhost:${PORT}/`
const CHROME = process.env.CHROME ?? 'google-chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function until(what, probe) {
  for (let i = 0; i < 75; i++) {
    try {
      const v = await probe()
      if (v) return v
    } catch {
      // not up yet
    }
    await sleep(200)
  }
  throw new Error(`${what} did not start`)
}

if (typeof WebSocket === 'undefined') {
  console.error(`keys.mjs needs Node 22+ (built-in WebSocket); this is ${process.version}`)
  process.exit(2)
}

const profile = mkdtempSync(join(tmpdir(), 'keys-'))
const vite = spawn(join(ROOT, 'node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-first-run', '--lang=en-US', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${profile}`, '--window-size=1280,1600', 'about:blank'],
  { stdio: 'ignore' },
)

let failed = 0
let checks = 0
const report = (name, bad) => {
  checks++
  if (bad.length) failed++
  console.log(`${bad.length ? 'FAIL' : 'ok  '} ${name}${bad.length ? '\n     ' + bad.join('\n     ') : ''}`)
}

try {
  await until('preview server', async () => (await fetch(BASE)).ok)
  const target = await until('Chrome debug port', async () => {
    const list = await (await fetch(`http://127.0.0.1:${DEBUG}/json/list`)).json()
    return list.find((t) => t.type === 'page')
  })
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })
  let id = 0
  const pending = new Map()
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id
      pending.set(n, (msg) => (msg.error ? rej(new Error(`${method}: ${msg.error.message}`)) : res(msg.result)))
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value
  const KEYS = { ArrowRight: 39, ArrowLeft: 37, Tab: 9, 5: 53 }
  const press = async (key) => {
    for (const type of ['rawKeyDown', 'keyUp']) {
      const code = /^\d$/.test(key) ? `Digit${key}` : key
      await send('Input.dispatchKeyEvent', { type, key, code, text: /^\d$/.test(key) && type === 'rawKeyDown' ? key : undefined, windowsVirtualKeyCode: KEYS[key], nativeVirtualKeyCode: KEYS[key] })
    }
    await sleep(150)
  }
  const open = async (hash) => {
    // A hash change keeps the old document (and its state); pass through a blank page for a fresh one.
    await send('Page.navigate', { url: 'about:blank' })
    await until('blank page', () => js(`location.href === 'about:blank'`))
    await send('Page.navigate', { url: BASE + hash })
    await until(`page ${hash}`, () => js(`!!document.querySelector('h1') && location.hash === '${hash}'`))
    await sleep(300)
  }
  const readout = (k) => `document.querySelector('[data-k="${k}"]')?.textContent`
  await send('Page.enable')
  await send('Runtime.enable')

  // Arrow keys walk the waypoints in patrol order and stop at the first one.
  await open('#/scan')
  const seen = []
  for (const k of ['ArrowRight', 'ArrowLeft', 'ArrowLeft']) {
    await press(k)
    seen.push(await js('location.hash'))
  }
  const want = ['#/detect', '#/scan', '#/tf']
  report('arrow keys: right, left, left from #/scan', seen.join() === want.join() ? [] : [`went ${seen.join(' → ')}, expected ${want.join(' → ')}`])
  await open('#/bringup')
  await press('ArrowLeft')
  const first = await js('location.hash')
  report('arrow left on waypoint 1 stays there', first === '#/bringup' ? [] : [`went to ${first}`])
  await open('#/')
  await press('5')
  const jumped = await js('location.hash')
  report('key 5 on the overview opens waypoint 5', jumped === '#/grid' ? [] : [`went to ${jumped}`])

  // Arrows inside a slider move the slider, not the chapter; the drag hint goes after the first move.
  await open('#/scan')
  const slider = `document.querySelector('.panel input[type=range]')`
  const before = await js(`(${slider}.focus(), [${slider}.value, document.querySelectorAll('.hint').length].join(' '))`)
  await press('ArrowRight')
  const after = await js(`[location.hash, ${slider}.value, document.querySelectorAll('.hint').length].join(' ')`)
  const [v0, h0] = before.split(' ')
  const [hash1, v1, h1] = after.split(' ')
  report('arrow in a slider moves it, keeps the chapter, removes the drag hint', [
    ...(hash1 === '#/scan' ? [] : [`chapter changed to ${hash1}`]),
    ...(v1 !== v0 ? [] : [`slider stayed at ${v0}`]),
    ...(h0 === '1' && h1 === '0' ? [] : [`hints ${h0} → ${h1}, expected 1 → 0`]),
  ])

  // Scan and detector: dragging the robot 2 m right in the map moves the x slider from 0.50 to 2.50 and leaves y alone.
  for (const hash of ['#/scan', '#/detect']) {
    await open(hash)
    const g = await js(`(() => { const c = document.querySelector('.grab').getBoundingClientRect(), v = document.querySelector('.arena').getBoundingClientRect()
      return [c.x + c.width / 2, c.y + c.height / 2, Math.min(v.width, v.height) / 10.8] })()`)
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: g[0], y: g[1], button: 'left', clickCount: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g[0] + 2 * g[2], y: g[1], button: 'left', buttons: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: g[0] + 2 * g[2], y: g[1], button: 'left', clickCount: 1 })
    await sleep(200)
    const xy = await js(`[...document.querySelectorAll('.panel input[type=range]')].slice(0, 2).map((i) => (+i.value).toFixed(2)).join(' ')`)
    report(`${hash}: drag the robot 2 m right → x 0.50 → 2.50, y stays 0.50`, xy === '2.50 0.50' ? [] : [`sliders x y = ${xy}`])
  }

  // Bring-up: Play from stage 1 moves the playhead at 5 scenario s per s, lights stages on the way, stops at patrol (24 s: its node at 9 s + startup_delay 15 s).
  await open('#/bringup/1')
  const caption = `document.querySelector('[data-k="step"]').textContent`
  const start = await js(caption)
  await js(`document.querySelectorAll('.stepper button')[1].click()`)
  await sleep(1300)
  const mid = parseFloat((await js(caption)).slice(4))
  await sleep(7000)
  const end = await js(`[${caption}, document.querySelectorAll('.stepper button')[2].disabled].join(' | ')`)
  report('bring-up Play: playhead moves past spawn (3 s) within 1.3 s, stops on patrol', [
    ...(start.startsWith('t = 0 s') ? [] : [`start ${start}`]),
    ...(mid >= 3 && mid < 24 ? [] : [`after 1.3 s t = ${mid}, expected 3 ≤ t < 24`]),
    ...(end.startsWith('t = 24 s · patrol') && end.endsWith('true') ? [] : [`end ${end}, expected t = 24 s · patrol and Next disabled`]),
  ])

  // Grid: Add scan adds one scan and makes more cells known ('#/grid/1': paused, so the scenario does not add scans itself).
  await open('#/grid/1')
  const k0 = await js(`[${readout('scans')}, parseFloat(${readout('known')})].join(' ')`)
  await js(`document.querySelector('.buttons button').click()`)
  await sleep(300)
  const k1 = await js(`[${readout('scans')}, parseFloat(${readout('known')})].join(' ')`)
  report('grid Add scan: 1 → 2 scans, more cells known', k1.split(' ')[0] === '2' && +k1.split(' ')[1] > +k0.split(' ')[1] ? [] : [`${k0} → ${k1}`])

  // Overview: hovering waypoint 3 shows its preview.
  await open('#/')
  const box = await js(`(() => { const r = document.querySelectorAll('.overview svg a')[2].querySelector('circle').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] })()`)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box[0], y: box[1] })
  await sleep(200)
  const peek = await js(readout('peek'))
  report('hover on waypoint 3 previews it', peek?.startsWith('3 / 7') ? [] : [`preview shows ${peek}`])

  // Every Tab stop on a chapter page shows focus: a CSS outline, or the stroke the mini plan dots draw instead.
  await open('#/scan')
  const hidden = []
  for (let k = 0; k < 20; k++) {
    await press('Tab')
    const f = await js(`(() => { const a = document.activeElement; if (!a || a === document.body) return 'body'
      const mp = a.closest('.miniplan'); const s = getComputedStyle(a)
      const ok = mp ? getComputedStyle(a.querySelector('circle')).strokeWidth === '0.25px' : s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2
      return (ok ? 'ok ' : 'NO ') + (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 20) || a.tagName) })()`)
    if (f.startsWith('NO')) hidden.push(f.slice(3))
  }
  report('every Tab stop on #/scan shows focus (20 stops)', hidden.length ? [`no visible focus: ${hidden.join(', ')}`] : [])

  // Language toggle: JA switches the title and <html lang>, and the choice survives a reload.
  await open('#/tf')
  const enTitle = await js(`document.querySelector('h1').textContent`)
  await js(`document.querySelectorAll('.langs button')[1].click()`)
  await sleep(150)
  const switched = await js(`[document.documentElement.lang, document.querySelector('h1').textContent !== ${JSON.stringify(enTitle)}].join(' ')`)
  await open('#/tf')
  const kept = await js(`[document.documentElement.lang, document.querySelectorAll('.langs button')[1].getAttribute('aria-pressed')].join(' ')`)
  // Burmese: third button, <html lang="my">, the chapter still renders (English fallback per string), survives a reload.
  await js(`document.querySelectorAll('.langs button')[2].click()`)
  await sleep(150)
  await open('#/tf')
  const my = await js(`[document.querySelectorAll('.langs button')[2].textContent, document.documentElement.lang, document.querySelector('h1')?.textContent.trim().length > 0, document.querySelectorAll('.langs button')[2].getAttribute('aria-pressed')].join(' ')`)
  report('Burmese button: label, lang=my, page renders, survives a reload', my === 'Burmese my true true' ? [] : [`got: ${my}, expected Burmese my true true`])
  await js(`document.querySelectorAll('.langs button')[0].click()`)
  report('EN/JA toggle switches title and lang, and survives a reload', [
    ...(switched === 'ja true' ? [] : [`after click: ${switched}, expected ja true`]),
    ...(kept === 'ja true' ? [] : [`after reload: ${kept}, expected ja true`]),
  ])

  // 3.3 TF lab, all 5 steps in each language (predict, see, inspect, fix, verify); the right guess = the two pairs through base_link,
  // restarting the detector leaves MISSING, the odom broadcaster heals it. Headings must be in the page's own script.
  const SCRIPT = { en: /[A-Za-z]/, ja: /[\u3040-\u30ff\u4e00-\u9fff]/, my: /[\u1000-\u109f]/ }
  for (const [i, lang] of ['en', 'ja', 'my'].entries()) {
    await open('#/3/tflab')
    await js(`document.querySelectorAll('.langs button')[${i}].click()`)
    await open('#/3/tflab')
    const q = (sel) => `document.querySelector('${sel}')`
    const step = async (code) => { const v = await js(code); await sleep(100); return v }
    const bad = []
    const head = await js(`[document.documentElement.lang, [...document.querySelectorAll('.panel h2')].map((h) => h.textContent).join('|')].join(' ')`)
    // The 5 numbered steps in the page's script; the 6th heading is the STALE section (Burmese may still fall back to English).
    const steps = head.split('|').filter((h) => /^\d\./.test(h))
    if (!head.startsWith(lang + ' ') || head.split('|').length !== 6 || steps.length !== 5 || !steps.every((h) => SCRIPT[lang].test(h))) bad.push(`headings: ${head}`)
    await step(`[...document.querySelectorAll('.pick')].filter((l) => l.textContent.includes('base_link')).forEach((l) => l.querySelector('input').click())`)
    await step(`${q('[data-act="check"]')}.click()`)
    if ((await js(`${q('[data-k="predict"]')}?.textContent.startsWith('✓')`)) !== true) bad.push('1 predict: no ✓ for the base_link pairs')
    await step(`${q('[data-act="run"]')}.click()`)
    if ((await js(`${q('[data-k="diag"]')}?.textContent.includes('map->base_link: MISSING')`)) !== true) bad.push('2 see: diag lacks map->base_link: MISSING')
    const links = await js(`[...document.querySelectorAll('.tflab-code a')].filter((a) => /tf_anomaly_detector|test_tf_lab_missing_link/.test(a.href) && a.parentElement.textContent.length > a.textContent.length + 3).length`)
    if (links !== 3) bad.push(`3 inspect: ${links} of 3 code links with a line of text`)
    await step(`document.querySelectorAll('.choices button')[0].click()`)
    if ((await js(`${q('[data-k="diag"]')}.textContent.includes('MISSING') && !${q('[data-k="challenge"]')}.textContent.startsWith('✓')`)) !== true) bad.push('4 fix: restart should leave MISSING')
    await step(`document.querySelectorAll('.choices button')[2].click()`)
    if ((await js(`!${q('[data-k="diag"]')}.textContent.includes('MISSING') && ${q('[data-k="challenge"]')}.textContent.startsWith('✓') && ${q('.tflab-cmd')}.textContent.includes('test_tf_lab_missing_link')`)) !== true) bad.push('5 verify: odom broadcaster should give all OK, ✓ and the colcon test line')
    await step(`${q('[data-act="reset"]')}.click()`)
    if ((await js(`!${q('[data-k="challenge"]')}.textContent.startsWith('✓') && !${q('[data-k="diag"]')}`)) !== true) bad.push('reset: back to the broken chain')
    // STALE: 0.3 s old reads OK but 12.1 cm off; a fresh transform springs the hits back onto the wall.
    const stale = () => js(`[${q('[data-k="stale"]')}.textContent, ${q('[data-k="staleoff"]')}.textContent].join(' ')`)
    if ((await stale()) !== 'OK 12.1 cm') bad.push(`stale before: ${await stale()}`)
    await step(`${q('[data-act="fresh"]')}.click()`); await sleep(2500)
    if ((await stale()) !== 'OK 0.0 cm') bad.push(`stale after fresh: ${await stale()}`)
    report(`TF lab ${lang}: 5 steps (predict, see, inspect, fix, verify) + reset + STALE fresh transform`, bad)
  }
  await js(`document.querySelectorAll('.langs button')[0].click()`)

  // 0.6 loop, break it 'slow the loop to once per second': 26 cm between looks, stops 18 cm past the line, warning note; fix = back to 5 Hz.
  {
    await open('#/0/loop')
    const read = () => js(`[document.querySelector('[data-k="blind"]').textContent, document.querySelector('[data-k="result"]').textContent, document.querySelector('[data-k="past"]')?.textContent, !!document.querySelector('[data-k="slow"]')].join(' | ')`)
    const before = await read()
    await js(`document.querySelector('[data-act="slow"]').click()`); await sleep(150)
    const slow = await read()
    await js(`document.querySelector('[data-act="slow"]').click()`); await sleep(150)
    const fixed = await read()
    report('Loop break it: slow to 1 Hz overshoots the line, fix restores 5 Hz', [
      ...(/^5\.2 cm \| stopped 0\.48 m \| 2 cm \| false$/.test(before) ? [] : [`before: ${before}`]),
      ...(/^26\.0 cm \| stopped 0\.32 m \| 18 cm \| true$/.test(slow) ? [] : [`slow: ${slow}`]),
      ...(fixed === before ? [] : [`after fix: ${fixed}, expected ${before}`]),
    ])
  }
} finally {
  chrome.kill()
  vite.kill()
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
}

console.log(`${checks - failed}/${checks} input checks passed`)
process.exit(failed ? 1 : 0)
