import { addDays } from './dates'

/**
 * Current streak in days. `xpByDay` maps local dates to XP earned; a day counts
 * when it has XP > 0. A streak stays alive through today if you haven't practised yet
 * (it only breaks once a full day is missed).
 */
export function computeStreak(xpByDay: Record<string, number>, today: string): number {
  const active = (d: string) => (xpByDay[d] ?? 0) > 0
  let day = active(today) ? today : addDays(today, -1)
  let n = 0
  while (active(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}
