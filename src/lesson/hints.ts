import { shuffle, type Rng } from './rng'

const isLetter = (ch: string) => /[\p{L}\p{N}]/u.test(ch)

/** Number of revealable characters (letters and digits) in a target. */
export function countLetters(target: string): number {
  let n = 0
  for (const ch of target) if (isLetter(ch)) n++
  return n
}

/**
 * Hint pattern: the first `revealedCount` letters shown, the rest as underscores.
 * Spaces and punctuation are kept. Characters are separated by a space and words by
 * three spaces, e.g. "hvordan har" -> "h _ _ _ _ _ _   _ _ _".
 */
export function buildPattern(target: string, revealedCount: number): string {
  let seen = 0
  return target
    .trim()
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((ch) => {
          if (!isLetter(ch)) return ch
          return seen++ < revealedCount ? ch : '_'
        })
        .join(' '),
    )
    .join('   ')
}

/** Pick `count` distinct wrong options to strike out (never the correct one, never ones already struck). */
export function pickEliminations(
  options: readonly string[],
  correct: string,
  rng: Rng = Math.random,
  count = 1,
  already: readonly string[] = [],
): string[] {
  const pool = [...new Set(options)].filter((o) => o !== correct && !already.includes(o))
  return shuffle(pool, rng).slice(0, count)
}

export const MAX_ELIMINATIONS = 2
