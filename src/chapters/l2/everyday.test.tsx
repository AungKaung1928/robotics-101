import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import CallbackChapter from '../l1/CallbackChapter'
import { CALLBACK_STRINGS } from '../l1/callback.strings'
import ClosestChapter from '../l1/ClosestChapter'
import { CLOSEST_STRINGS } from '../l1/closest.strings'
import ActionsChapter from './ActionsChapter'
import { ACTIONS_STRINGS } from './actions.strings'
import ParamsChapter from './ParamsChapter'
import { PARAMS_STRINGS } from './params.strings'
import TopicsChapter from './TopicsChapter'
import SimpickChapter from '../l0/SimpickChapter'
import { SIMPICK_STRINGS } from '../l0/simpick.strings'
import SimwhatChapter from '../l0/SimwhatChapter'
import { SIMWHAT_STRINGS } from '../l0/simwhat.strings'
import { TOPICS_STRINGS } from './topics.strings'

// Spec APP_R101_ONRAMP.md: one everyday example next to the robot example, in both languages, on the page.
const CASES = [
  ['closest', ClosestChapter, CLOSEST_STRINGS], ['callback', CallbackChapter, CALLBACK_STRINGS],
  ['topics', TopicsChapter, TOPICS_STRINGS], ['actions', ActionsChapter, ACTIONS_STRINGS], ['params', ParamsChapter, PARAMS_STRINGS],
  ['simwhat', SimwhatChapter, SIMWHAT_STRINGS], ['simpick', SimpickChapter, SIMPICK_STRINGS],
] as const

describe('everyday examples (Level 0 group B, Levels 1-2)', () => {
  it.each(CASES)('%s: EN and JA have one, and the page shows it', (_, Body, S) => {
    for (const l of ['en', 'ja'] as const) {
      expect(S[l].everyday.length).toBeGreaterThan(20)
      expect(renderToStaticMarkup(<Body t={STRINGS[l]} />)).toContain('data-k="everyday"')
    }
  })
})
