import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { CHECK_MS, DEFAULT, JUMP_M, N, caught, challengeOk, effective, falseAlarms, flagged, scenario, steps, type Source } from './params'
import { PARAMS_STRINGS } from './params.strings'
import '../l1/l1.css'
import './l2.css'
import Gloss from '../l1/Gloss'

const W = 640, H = 230, X0 = 50, BAR = (W - X0 - 10) / N, Y0 = 190, PX = 180 // px per metre of jump
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const SRC = `${SOURCE_REPO}/blob/main/src/tf_anomaly_detector.cpp`

/** 2.5: one parameter, three places to set it; the bar chart shows each 0.5 s check against the limit. */
export default function ParamsChapter({ t }: { t: Strings }) {
  const s = PARAMS_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [value, setValue] = useState(0.3)
  const [src, setSrc] = useState<Source>('default')
  const max = effective(src, value)
  const sc = useMemo(() => scenario(max), [max])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const fl = flagged(max)
  const ok = src !== 'default' && challengeOk(max) // the task is to override the default
  const v = value.toFixed(2)
  const code = {
    default: `this->declare_parameter("max_position_jump", ${DEFAULT});`,
    launch: `Node(package='tf_explorer', executable='tf_anomaly_detector',\n     parameters=[{'use_sim_time': True,\n                  'max_position_jump': ${v}}])`,
    cli: `ros2 run tf_explorer tf_anomaly_detector \\\n  --ros-args -p max_position_jump:=${v}`,
  }[src]
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.title}>
          {steps().map((d, k) => (
            <rect key={k} className={k < f.done ? (fl[k] ? 'qfull' : 'body') : 'qslot'} x={X0 + k * BAR + 2} y={Y0 - d * PX} width={BAR - 4} height={d * PX} rx={2} />
          ))}
          <line className="stopline lim" x1={X0} x2={W - 10} y1={Y0 - max * PX} y2={Y0 - max * PX} />
          <text className="legend" x={X0 - 4} y={Y0 - max * PX + 5} textAnchor="end">{max.toFixed(2)}</text>
          <text className="legend" x={X0 + 8} y={Y0 - max * PX - 6}>max_position_jump</text>
          <line className="floor" x1={X0} x2={W - 10} y1={Y0} y2={Y0} />
          <text className="legend" x={X0} y={H - 10}>0 s</text>
          <text className="legend" x={W - 10} y={H - 10} textAnchor="end">{(N * CHECK_MS) / 1000} s</text>
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(f.done, f.warns)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <div className="stepper" role="group" aria-label={s.source}>
          {(['default', 'launch', 'cli'] as const).map((k) => <button key={k} type="button" aria-pressed={src === k} onClick={() => setSrc(k)}>{s.sources[k]}</button>)}
        </div>
        <Slider hint={t.drag} label={s.value} value={max} min={0.05} max={1} step={0.01} mark={DEFAULT} fmt={(x) => x.toFixed(2)}
          onChange={(x) => { setValue(x); if (src === 'default') setSrc('launch'); setTS(Infinity) }} />
        <pre className="code" aria-label={s.sources[src]}>{code}</pre>
        <p><button type="button" className="break" onClick={() => { setValue(0.1); setSrc('launch'); setTS(Infinity) }}>{s.breakIt}</button></p>
        <dl className="readout">
          <div><dt>{s.warns}</dt><dd data-k="warns">{fl.filter(Boolean).length}</dd></div>
          <div><dt>{s.false}</dt><dd data-k="false">{falseAlarms(max)}</dd></div>
          <div><dt>{s.jump} ({JUMP_M} m)</dt><dd data-k="caught">{caught(max) ? s.yes : s.no}</dd></div>
        </dl>
        <p className="runs">{s.jumpNote}</p>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {max.toFixed(2)} m</p>
        <p className="note">{s.runtimeNote}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={`${SRC}#L10-L14`}>tf_anomaly_detector.cpp:10-14</a>, <a href={`${SRC}#L25-L26`}>:25-26</a> (500 ms), <a href={`${SRC}#L74-L77`}>:74-77</a> (jump {'>'} max), <a href={`${SOURCE_REPO}/blob/main/launch/tf_explorer.launch.py#L101-L113`}>tf_explorer.launch.py:101-113</a> (passes only use_sim_time) · <a href="https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Parameters/Understanding-ROS2-Parameters.html">Humble: Understanding parameters</a>, <a href="https://docs.ros.org/en/humble/Tutorials/Intermediate/Launch/Creating-Launch-Files.html">Creating launch files</a></p>
      </div>
    </>
  )
}
