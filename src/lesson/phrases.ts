import type { Phrase } from '../content/types'
import { hashString, seededRng, shuffle } from './rng'

/**
 * Deterministically pick `n` phrases for a given local date and language.
 * Phrases marked used on an EARLIER day are deprioritised; ones marked today still count
 * as unused so the day's set doesn't change when you tick them off.
 */
export function pickDailyPhrases(
  phrases: readonly Phrase[],
  usedOn: Record<string, string>,
  date: string,
  lang: string,
  n = 3,
): Phrase[] {
  const rng = seededRng(hashString(`${date}|${lang}`))
  const isUsed = (p: Phrase) => usedOn[p.id] !== undefined && usedOn[p.id] < date
  const fresh = shuffle(phrases.filter((p) => !isUsed(p)), rng)
  const used = shuffle(phrases.filter(isUsed), rng)
  return [...fresh, ...used].slice(0, n)
}
