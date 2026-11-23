// Shared contract between main (routes, overview), the level chapters (src/chapters/l1, l2)
// and the animation system (src/anim, src/scenarios). Types only: no runtime code here.
import type { ReactNode } from 'react'
import type { IconName } from '../icons'
import type { Strings } from '../i18n'

/** Scene state at one instant. Each scenario defines its own shape; the figure draws it. */
export type SceneState = Record<string, unknown>

/**
 * An animated scenario. frame() must be pure: the same tMs always gives the same scene,
 * so Play, Step, the scrubber and a ?t= deep link all show the same picture.
 * The scene comes from the chapter's model (the same one its sliders drive), never keyframes.
 */
export interface Scenario<S extends SceneState = SceneState> {
  id: string
  durationMs: number
  /** Times (ms) the Step buttons jump between, ascending, inside [0, durationMs]. */
  eventsMs?: number[]
  frame: (tMs: number) => S
}

/** Props of the scenario Player (Back / Play-Pause / Step / scrubber). The chapter owns tMs. */
export interface PlayerProps {
  tMs: number
  setTMs: (tMs: number) => void
  durationMs: number
  eventsMs: number[]
  /** Playback rate: scenario ms per wall-clock ms. */
  speed: number
  autoplay?: boolean
  caption: ReactNode
  s: Strings
}

/** One chapter as the level map and router see it. Route: #/<level>/<id>. */
export interface ChapterMeta {
  id: string
  level: number
  titleEn: string
  titleJa: string
  icon: IconName
}
