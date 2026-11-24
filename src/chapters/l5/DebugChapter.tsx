import { useState } from 'react'
import { stringsFor, type Strings } from '../../i18n'
import Gloss from '../l1/Gloss'
import { CMD, DOC, DOCS, FAULTS, TOOLS, look, remaining, type Fault, type Tool } from './debug'
import { DEBUG_STRINGS } from './debug.strings'
import './l5.css'

/** 5.3: pick a hidden fault, run tools, each clue narrows the faults still possible. */
export default function DebugChapter({ t }: { t: Strings }) {
  const s = stringsFor(DEBUG_STRINGS, t, 'l5.debug.DEBUG_STRINGS')
  const [fault, setFault] = useState<Fault>('remap')
  const [used, setUsed] = useState<Tool[]>([])
  const [solo, setSolo] = useState<Record<Fault, Tool[]>>({ sensor: [], remap: [], tf: [] }) // tools that named a fault alone
  const seen = used.map((tool) => ({ tool, clue: look(fault, tool) }))
  const left = remaining(seen)
  const runTool = (tool: Tool) => {
    setUsed((u) => (u.includes(tool) ? u : [...u, tool])) // functional: two quick clicks must both count
    if (remaining([{ tool, clue: look(fault, tool) }]).length === 1) setSolo((x) => ({ ...x, [fault]: [...new Set([...x[fault], tool])] }))
  }
  const allNamedBy = TOOLS.filter((tool) => FAULTS.every((f) => solo[f].includes(tool)))
  return (
    <>
      <div className="figure">
        <ul className="dbg-left" aria-live="polite" data-k="left">
          {FAULTS.map((f) => <li key={f} className={left.includes(f) ? 'in' : 'out'}>{s.faults[f]}</li>)}
        </ul>
        <p className="note">{s.setup}</p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <h2>{s.fault}</h2>
        <p className="choices">
          {FAULTS.map((f) => <label key={f} className="pick"><input type="radio" name="dbg-fault" checked={fault === f} onChange={() => { setFault(f); setUsed([]) }} /> {s.faults[f]}</label>)}
        </p>
        <h2>{s.tools}</h2>
        <p className="choices">{TOOLS.map((tool) => <button key={tool} type="button" data-act={`tool-${tool}`} onClick={() => runTool(tool)}><code>{CMD[tool].split('  ')[0]}</code></button>)}</p>
        <p className="note">{s.simplified}</p>
        <pre role="log" className="code port-code" data-k="clues">{seen.map(({ tool, clue }) => `$ ${CMD[tool]}\n  ${clue.ok ? '✓' : '✗'} ${s.clues[clue.key as keyof typeof s.clues]}`).join('\n')}</pre>
        <p data-k="used">{s.used}: {used.length}</p>
        <p className={`verdict ${left.length === 1 ? 'ok' : 'no'}`} data-k="named">{left.length === 1 ? '✓ ' + s.named : `${s.left}: ${left.length}`}</p>
        <p><button type="button" data-act="reset" onClick={() => setUsed([])}>{s.reset}</button></p>
        <h2>{s.breakTitle}</h2>
        <p className="note">{s.breakNote}</p>
        <p>{s.challenge}</p>
        <p className={`verdict ${allNamedBy.length ? 'ok' : 'no'}`} data-k="challenge">{allNamedBy.length ? '✓ ' + s.solved : s.notYet}</p>
        <ul className="port-diff">{TOOLS.map((tool) => <li key={tool}><a href={`${DOCS}/${DOC[tool]}`}>{s.docs}</a>: <code>{CMD[tool]}</code></li>)}</ul>
        <Gloss items={s.glossary} />
      </div>
    </>
  )
}
