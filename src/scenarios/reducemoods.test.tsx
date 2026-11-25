import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MascotFigure } from '../anim/Mascot'
import { REST, STILL_DIZZY, STILL_SPARK } from '../anim/mascot'
import { ciReaction } from './cimood'
import { exReaction, lcReaction } from './lcmood'

// Reduced motion for the 5.2 CI and 5.5 lifecycle / executor moods: the model's mood STATE must still reach the face,
// drawn as one still frame at the rest pose (no bounce, no wobble), then back to idle.
const still = (mood: 'happy' | 'oops') =>
  renderToStaticMarkup(<MascotFigure pose={REST} mood={mood} label="" spark={mood === 'happy' ? STILL_SPARK : 0} dizzy={mood === 'oops' ? STILL_DIZZY : 0} />)

describe('reduced motion: new 5.2 / 5.5 moods', () => {
  it('lifecycle error = oops, executor fix = cheer, executor worse = oops (model state, not CSS)', () => {
    expect(lcReaction('active', 'errorprocessing')).toBe('oops')
    expect(exReaction(3, 0)).toBe('cheer')
    expect(exReaction(0, 3)).toBe('oops')
    expect(ciReaction('none', 'build', true)).toBe('cheer') // 5.2: solving the challenge cheers even with a wrong guess
  })
  it('each mood shows as a still cue: oops = mouth + 3 stars, cheer = arcs + sparks, at rest', () => {
    const o = still('oops'), h = still('happy'), rest = renderToStaticMarkup(<MascotFigure pose={REST} mood="idle" label="" />)
    expect(o).toContain('data-mood="oops"'); expect(o).toContain('m-mouth'); expect(o.match(/m-star/g)).toHaveLength(3)
    expect(h).toContain('data-mood="happy"'); expect(h.match(/m-spark/g)!.length).toBeGreaterThan(0)
    const body = (s: string) => /<g transform="([^"]*)"/.exec(s)![1]
    expect(body(o)).toBe(body(rest)); expect(body(h)).toBe(body(rest)) // no squash, no hop
  })
  it('Mascot: reduced branch holds the face 900 ms and never animates the pose', () => {
    const src = readFileSync('src/anim/Mascot.tsx', 'utf8')
    const branch = /if \(reduced\(\)\) \{([\s\S]*?)\n    \}/.exec(src)![1]
    expect(branch).toContain("act.kind === 'happy' || act.kind === 'oops' ? 900 : 0")
    expect(branch).not.toContain('setPose(f')
    expect(branch).not.toContain('requestAnimationFrame')
  })
})
