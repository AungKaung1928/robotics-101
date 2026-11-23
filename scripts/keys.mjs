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

  // Scan: dragging the robot 2 m right in the map moves the x slider from 0.50 to 2.50 and leaves y alone.
  await open('#/scan')
  const g = await js(`(() => { const c = document.querySelector('.grab').getBoundingClientRect(), v = document.querySelector('.arena').getBoundingClientRect()
    return [c.x + c.width / 2, c.y + c.height / 2, Math.min(v.width, v.height) / 10.8] })()`)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: g[0], y: g[1], button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: g[0] + 2 * g[2], y: g[1], button: 'left', buttons: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: g[0] + 2 * g[2], y: g[1], button: 'left', clickCount: 1 })
  await sleep(200)
  const xy = await js(`[...document.querySelectorAll('.panel input[type=range]')].slice(0, 2).map((i) => (+i.value).toFixed(2)).join(' ')`)
  report('scan: drag the robot 2 m right → x 0.50 → 2.50, y stays 0.50', xy === '2.50 0.50' ? [] : [`sliders x y = ${xy}`])

  // Bring-up: Play from step 1 advances one launch stage per second and stops on the last.
  await open('#/bringup/1')
  const caption = `document.querySelector('[data-k="step"]').textContent`
  const start = await js(caption)
  await js(`document.querySelectorAll('.stepper button')[1].click()`)
  await sleep(1300)
  const next = await js(caption)
  await sleep(7000)
  const end = await js(`[${caption}, document.querySelectorAll('.stepper button')[2].disabled].join(' | ')`)
  report('bring-up Play: gazebo → spawn after one beat, stops on patrol', [
    ...(start.startsWith('t = 0 s') ? [] : [`start ${start}`]),
    ...(next.startsWith('t = 3 s') ? [] : [`after one beat ${next}, expected t = 3 s`]),
    ...(end.startsWith('t = 25 s') && end.endsWith('true') ? [] : [`end ${end}, expected t = 25 s and Next disabled`]),
  ])

  // Grid: Add scan adds one scan and makes more cells known.
  await open('#/grid')
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
  await js(`document.querySelectorAll('.langs button')[0].click()`)
  report('EN/JA toggle switches title and lang, and survives a reload', [
    ...(switched === 'ja true' ? [] : [`after click: ${switched}, expected ja true`]),
    ...(kept === 'ja true' ? [] : [`after reload: ${kept}, expected ja true`]),
  ])
} finally {
  chrome.kill()
  vite.kill()
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
}

console.log(`${checks - failed}/${checks} input checks passed`)
process.exit(failed ? 1 : 0)
