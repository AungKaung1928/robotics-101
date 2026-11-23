import type { ReactNode } from 'react'
import type { ChapterId } from './lib/route'

// One line set: 24×24 grid, currentColor stroke 1.75, round caps and joins, no fills.
const PATHS = {
  robot: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12 L18 12" />
      <path d="M8 6.5 v-1.5 M16 6.5 v-1.5" />
    </>
  ),
  lidar: (
    <>
      <circle cx="6" cy="12" r="2" />
      <path d="M9.5 8.5 A5 5 0 0 1 9.5 15.5" />
      <path d="M12.5 6 A8.5 8.5 0 0 1 12.5 18" />
      <path d="M15.5 3.5 A12 12 0 0 1 15.5 20.5" />
    </>
  ),
  frame: (
    <>
      <path d="M5 19 L19 19" />
      <path d="M5 19 L5 5" />
      <path d="M16 16 L19 19 L16 22 M2 8 L5 5 L8 8" />
    </>
  ),
  map: (
    <>
      <path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z" />
      <path d="M9 4 V18 M15 6 V20" />
    </>
  ),
  costmap: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="10" y="10" width="4" height="4" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </>
  ),
  goal: (
    <>
      <path d="M6 21 V4" />
      <path d="M6 4 H17 L14.5 7.5 L17 11 H6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7 V12 L15.5 14" />
    </>
  ),
  launch: (
    <>
      <path d="M8 5 L19 12 L8 19 Z" />
      <path d="M4 8 V16" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5 L21.5 20 H2.5 Z" />
      <path d="M12 10 V14" />
      <path d="M12 17 V17.01" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS
export const ICON_NAMES = Object.keys(PATHS) as IconName[]

/** Decorative unless `title` is given; with a title it is an image with that name. */
export function Icon({ name, title, size = 20 }: { name: IconName; title?: string; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  )
}

/** One icon per chapter, shown next to its title (overview peek card, chapter heading). */
export const CHAPTER_ICON = {
  bringup: 'launch',
  tf: 'frame',
  scan: 'lidar',
  detect: 'warning',
  grid: 'map',
  costmap: 'costmap',
  goal: 'goal',
} as const satisfies Record<ChapterId, IconName>
