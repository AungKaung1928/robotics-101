import { describe, expect, it } from 'vitest'
import { LIDAR, NAV2 } from '../../content/world'
import { DEPTH, PERIOD_MS } from '../l1/callback'
import { CALLBACK_STRINGS } from '../l1/callback.strings'
import { SCAN_HZ, STEP_M } from '../l1/decide'
import { DECIDE_STRINGS } from '../l1/decide.strings'
import { MAX_ACC } from './drive'
import { DRIVE_STRINGS } from './drive.strings'
import { CHECK_MS, DEFAULT, STEP_M as PARAMS_STEP_M } from './params'
import { PARAMS_STRINGS } from './params.strings'
import { TOPICS } from './topics'
import { TOPICS_STRINGS } from './topics.strings'

/** Level 1-2 step text writes numbers as literals; the models and source.test.ts pin the constants to the cited repo
 * lines. This test ties the two, so a constant that changes (or a typo in one language) turns red instead of the page
 * quietly disagreeing with its own figure. Level 0 pages have the same test per chapter. */
const hz = (name: string) => TOPICS.find((t) => t.name === name)!.hz
const blindS = 1 / SCAN_HZ
const blindCm = Math.round(STEP_M * 100)

type Case = [string, object, string[], string[]]
/** Every plain string in a chapter's language object (step lines, notes), not the function-valued templates. */
const text = (o: unknown): string[] => typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(text) : []
const CASES: Case[] = [
  ['1.3 callback', CALLBACK_STRINGS.en, [`${LIDAR.hz} times a second`, `${PERIOD_MS} ms`, `queue of ${DEPTH}`], []],
  ['1.3 callback', CALLBACK_STRINGS.ja, [], [`1秒に${LIDAR.hz}回`, `${PERIOD_MS} ms`, `長さ${DEPTH}のキュー`]],
  ['1.1 decide', DECIDE_STRINGS.en, [`(${SCAN_HZ} times a second)`, `${blindS} s, about ${blindCm} cm`], []],
  ['1.1 decide', DECIDE_STRINGS.ja, [], [`1秒に${SCAN_HZ}回`, `${blindS}秒（約${blindCm} cm）`]],
  ['2.7 drive', DRIVE_STRINGS.en, [`at most ${MAX_ACC} m/s²`], []],
  ['2.7 drive', DRIVE_STRINGS.ja, [], [`最大 ${MAX_ACC} m/s²`]],
  ['2.5 params', PARAMS_STRINGS.en,
    [`every ${CHECK_MS / 1000} s`, `"max_position_jump", ${DEFAULT})`, `${NAV2.maxVelX} m/s`, `moves ${PARAMS_STEP_M} m`], []],
  ['2.5 params', PARAMS_STRINGS.ja, [],
    [`${CHECK_MS / 1000} 秒ごと`, `"max_position_jump", ${DEFAULT})`, `${NAV2.maxVelX} m/s`, `${PARAMS_STEP_M} m 動く`]],
  ['2.2 topics', TOPICS_STRINGS.en, [`/scan, ${hz('/scan')} times a second`, `${hz('/cmd_vel')} times a second`], []],
  ['2.2 topics', TOPICS_STRINGS.ja, [], [`1秒${hz('/scan')}回`, `1秒${hz('/cmd_vel')}回`]],
]

describe('Level 1-2 step text numbers == model constants (EN and JA)', () => {
  it.each(CASES.map(([id, s, en, ja]) => [id, en.length ? 'en' : 'ja', s, [...en, ...ja]] as const))(
    '%s (%s)', (_, __, s, needles) => {
      const all = text(s).join(' ')
      for (const n of needles) expect(all, n).toContain(n)
    })
  it('the numbers the needles use are the cited ones (guards the test itself)', () => {
    expect([LIDAR.hz, PERIOD_MS, DEPTH, MAX_ACC, CHECK_MS, DEFAULT, NAV2.maxVelX, PARAMS_STEP_M, hz('/cmd_vel')])
      .toEqual([5, 200, 10, 1, 500, 0.5, 0.26, 0.13, 20])
    expect([blindS, blindCm]).toEqual([0.2, 5])
  })
})
