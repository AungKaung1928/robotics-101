import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Mascot, { MascotFigure } from './Mascot'
import { REST, SPARK_AT } from './mascot'

describe('Mascot render', () => {
  it('inSvg: a <g> hit area holding a nested <svg>, valid inside a chapter figure', () => {
    const html = renderToStaticMarkup(<svg><g transform="translate(10 20)"><Mascot label="robot" inSvg /></g></svg>)
    expect(html).toContain('<g class="mascot-hit"><svg class="mascot"')
    expect(html).not.toContain('<span')
  })
  it('first frame: idle face with two eyes, labelled, inside the boop hit area, no sparks', () => {
    const html = renderToStaticMarkup(<Mascot label="guide robot" cheer={0} oops={0} />)
    expect(html).toMatch(/^<span class="mascot-hit">/)
    expect(html).toContain('aria-label="guide robot"')
    expect(html).toContain('data-mood="idle"')
    expect(html.match(/<circle[^>]*r="2.2"/g)).toHaveLength(2)
    expect(html).not.toContain('m-spark')
  })
  it('faces: happy = arcs, oops = wide eyes + mouth; six sparks mid-celebration', () => {
    expect(renderToStaticMarkup(<MascotFigure pose={REST} mood="happy" label="" />)).toContain('q3-4 6 0')
    expect(renderToStaticMarkup(<MascotFigure pose={REST} mood="oops" label="" />)).toContain('m-mouth')
    expect(renderToStaticMarkup(<MascotFigure pose={REST} mood="happy" label="" spark={SPARK_AT + 0.2} />).match(/m-spark/g)).toHaveLength(6)
  })
})
