import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { ACT_STRINGS } from '../l0/act.strings'
import DriveChapter from './DriveChapter'
import { DRIVE_STRINGS } from './drive.strings'

// Spec APP_R101_ONRAMP.md: 2.7 first drive sends the two numbers from Level 0 act.
describe('2.7 bridges back to Level 0 act', () => {
  it.each(['en', 'ja'] as const)('%s: names the act chapter and both numbers, rendered', (l) => {
    const line = DRIVE_STRINGS[l].already
    expect(line).toContain(ACT_STRINGS[l].title.split(/[:：]/)[0])
    for (const w of [ACT_STRINGS[l].glossary[0][0], ACT_STRINGS[l].glossary[1][0], 'linear.x', 'angular.z']) expect(line).toContain(w)
    expect(renderToStaticMarkup(<DriveChapter t={STRINGS[l]} />)).toContain('data-k="already"')
  })
})
