// Dev-only: loads each chapter preview in a 390 px iframe and checks the page never scrolls sideways
// (scrollWidth > clientWidth), the same measure as the site's page check, for chapters not routed yet.
const L1 = ['decide', 'closest', 'callback', 'cpp', 'shell', 'intro1']
const L2 = ['nodes', 'topics', 'msgtypes', 'actions', 'params', 'ws', 'drive', 'intro2']
const L0 = ['meet', 'move', 'sense', 'think', 'act', 'simwhat', 'simpick']
const EP = ['bfs', 'late']
const pages = [...L0, ...L1, ...L2].map((c) => `./preview.html?c=${c}`).concat(EP.map((c) => `../ep/preview.html?c=${c}`))

const out = document.getElementById('out')!
const measure = (src: string) => new Promise<string>((done) => {
  const f = document.createElement('iframe')
  f.style.cssText = 'width:390px;height:800px;border:0'
  f.src = src
  f.onload = () => setTimeout(() => {
    const d = f.contentDocument!.documentElement
    const ok = d.scrollWidth <= d.clientWidth && !!f.contentDocument!.querySelector('.panel')
    done(`${ok ? 'ok' : 'FAIL'} ${src.replace(/^.*\?/, '')} ${d.scrollWidth}/${d.clientWidth}`)
    f.remove()
  }, 600)
  document.body.append(f)
})

;(async () => {
  const lines: string[] = []
  for (const p of pages) for (const lang of ['en', 'ja']) lines.push(await measure(`${p}&lang=${lang}`))
  const bad = lines.filter((l) => l.startsWith('FAIL')).length
  out.textContent = `${lines.join('\n')}\nPHONE ${bad ? 'FAIL' : 'PASS'} ${lines.length - bad}/${lines.length}`
})()
