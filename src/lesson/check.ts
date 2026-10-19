import type { Item } from '../content/types'
import type { Result } from '../srs/fsrs'

/** trim, lowercase, collapse spaces, strip punctuation. Keeps diacritics. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?¿¡'"’‘“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** normalize() plus folding of diacritics: æ->ae, ø->o, å->a, aa->a, accents and ñ removed. */
export function fold(s: string): string {
  return normalize(s)
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/aa/g, 'a')
}

/** 'correct' on a match, 'almost' if only diacritics differ, else 'wrong'. */
export function checkAnswer(input: string, item: Pick<Item, 'target' | 'alts'>): Result {
  const accepted = [item.target, ...(item.alts ?? [])]
  const typed = normalize(input)
  if (typed === '') return 'wrong'
  if (accepted.some((a) => normalize(a) === typed)) return 'correct'
  const folded = fold(input)
  if (accepted.some((a) => fold(a) === folded)) return 'almost'
  return 'wrong'
}
