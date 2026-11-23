// Dev-only: loads each chapter preview in a 390 px iframe and checks the page never scrolls sideways
// (scrollWidth > clientWidth), the same measure as the site's page check, for chapters not routed yet.
const L1 = ['decide', 'closest', 'callback', 'cpp', 'shell', 'intro1']
const L2 = ['nodes', 'topics', 'msgtypes', 'actions', 'params', 'ws', 'drive', 'intro2']
const L0 = ['meet', 'move', 'sense', 'think', 'act', 'simwhat', 'simpick']
const EP = ['bfs', 'late']
const pages = [...L0, ...L1, ...L2].map((c) => `./preview.html?c=${c}`).concat(EP.map((c) => `../ep/preview.html?c=${c}`))

// The routed Level 0 chapters on the real app (lang from localStorage, as the app reads it): h1 present, Japanese on JA,
// Myanmar script on the Burmese page.
const ROUTED = L0.map((c) => `/#/0/${c}`)
const JA_TEXT = /[぀-ヿ一-龯]/
const MY_TEXT = /[\u1000-\u109F]/ // Myanmar block: Burmese pages carry Burmese core UI even where chapter text is still English

const out = document.getElementById('out')!
const measure = (src: string, lang?: string) => new Promise<string>((done) => {
  if (lang) localStorage.setItem('r101-lang', lang)
  const f = document.createElement('iframe')
  f.style.cssText = 'width:390px;height:800px;border:0'
  f.src = src
  f.onload = () => setTimeout(() => {
    const d = f.contentDocument!.documentElement
    const h1 = f.contentDocument!.querySelector('h1')?.textContent ?? ''
    const h1ok = !lang || (h1 !== '' && (lang !== 'ja' || JA_TEXT.test(h1)) && (lang !== 'my' || MY_TEXT.test(f.contentDocument!.body.textContent ?? '')))
    const ok = d.scrollWidth <= d.clientWidth && !!f.contentDocument!.querySelector('.panel') && h1ok
    done(`${ok ? 'ok' : 'FAIL'} ${lang ? `${src} (${lang}) h1 '${h1}'` : src.replace(/^.*\?/, '')} ${d.scrollWidth}/${d.clientWidth}`)
    f.remove()
  }, 600)
  document.body.append(f)
})

;(async () => {
  const lines: string[] = []
  for (const p of pages) for (const lang of ['en', 'ja']) lines.push(await measure(`${p}&lang=${lang}`))
  for (const r of ROUTED) for (const lang of ['en', 'ja', 'my']) lines.push(await measure(r, lang))
  const bad = lines.filter((l) => l.startsWith('FAIL')).length
  out.textContent = `${lines.join('\n')}\nPHONE ${bad ? 'FAIL' : 'PASS'} ${lines.length - bad}/${lines.length}`
})()
