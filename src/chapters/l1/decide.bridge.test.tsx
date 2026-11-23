import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { RULE_M } from '../l0/think'
import { THINK_STRINGS } from '../l0/think.strings'
import DecideChapter from './DecideChapter'
import { DECIDE_STRINGS } from './decide.strings'

// Spec APP_R101_ONRAMP.md: 1.1 opens with the Level 0 think rule, same numbers and figure.
describe('1.1 bridges back to Level 0 think', () => {
  it.each(['en', 'ja'] as const)('%s: names the think chapter and its rule number, rendered', (l) => {
    const line = DECIDE_STRINGS[l].already
    expect(line).toContain(THINK_STRINGS[l].title.split(/[:：]/)[0])
    expect(line).toContain(`${RULE_M} m`)
    expect(renderToStaticMarkup(<DecideChapter t={STRINGS[l]} />)).toContain('data-k="already"')
  })
})
