import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { conflicts } from './my-consistency.mjs'

const ok = (en, my) => ({ status: 'pass-alt', en, my })

describe('Burmese consistency', () => {
  it('flags one English string with two Burmese renderings', () => {
    expect(conflicts({ a: ok('Left wheel', 'ဘယ်ဘက် ဘီး'), b: ok('Left wheel', 'ဘယ်ဘီး') })).toHaveLength(1)
  })
  it('flags a pinned term written with another word, not inside an identifier', () => {
    expect(conflicts({ a: ok('Give it a rule', 'စည်းမျဉ်း ပေးပါ') })).toHaveLength(1)
    expect(conflicts({ a: ok('Give it a rule', 'စည်းကမ်းချက် ပေးပါ'), b: ok('rules_file', 'rules_file') })).toEqual([])
  })
  it('ignores strings that do not ship', () => {
    expect(conflicts({ a: ok('Next', 'ရှေ့သို့'), b: { status: 'needs-human', en: 'Next', my: 'နောက်' } })).toEqual([])
  })
  it('every shipped Burmese string is consistent', () => {
    expect(conflicts(JSON.parse(readFileSync(new URL('./my-status.json', import.meta.url), 'utf8')))).toEqual([])
  })
})
