import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ICON_NAMES, Icon } from './icons'

describe('icon set', () => {
  it('has the 9 icons the chapters use', () => {
    expect(ICON_NAMES.sort()).toEqual(['clock', 'costmap', 'frame', 'goal', 'launch', 'lidar', 'map', 'robot', 'warning'])
  })
  for (const name of ICON_NAMES) {
    it(`${name}: one stroke style, titled when named`, () => {
      const html = renderToStaticMarkup(<Icon name={name} title={`t-${name}`} />)
      expect(html).toContain('stroke-width="1.75"')
      expect(html).toContain('stroke-linecap="round"')
      expect(html).toContain('fill="none"')
      expect(html).toContain('role="img"')
      expect(html).toContain(`<title>t-${name}</title>`)
      // No per-path overrides of the shared style.
      expect(html.match(/stroke-width/g)).toHaveLength(1)
      expect(html).not.toMatch(/<(path|circle|rect)[^>]*\sfill="(?!none)/)
    })
  }
  it('is hidden from screen readers without a title', () => {
    const html = renderToStaticMarkup(<Icon name="robot" />)
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('<title>')
  })
})
