import type { Item } from '../content/types'
import { introduceCard, reviewCard, type Result } from '../srs/fsrs'
import { emptyLangState, type AppState, type LangState } from './types'
import { localDate } from './dates'
import type { LangCode } from '../content/types'

export const LESSON_XP = 10
export const REVIEW_BONUS_XP = 5
export const PHRASE_XP = 5

export interface SessionOutcome {
  /** Result of the FIRST attempt at each item. */
  firstResults: Record<string, Result>
  /** Number of correct (or almost) answers, including retries. */
  correctAnswers: number
}

const addXp = (ls: LangState, date: string, xp: number): LangState => ({
  ...ls,
  xpByDay: { ...ls.xpByDay, [date]: Math.max(0, (ls.xpByDay[date] ?? 0) + xp) },
})

export const lessonXp = (o: SessionOutcome) => LESSON_XP + o.correctAnswers
export const reviewXp = (o: SessionOutcome) => REVIEW_BONUS_XP + o.correctAnswers

export function finishLesson(ls: LangState, newItems: Item[], o: SessionOutcome, now: Date): LangState {
  const cards = { ...ls.cards }
  for (const it of newItems) {
    if (!cards[it.id]) cards[it.id] = introduceCard(o.firstResults[it.id] ?? 'correct', now)
  }
  return addXp({ ...ls, cards, lessonsDone: ls.lessonsDone + 1 }, localDate(now), lessonXp(o))
}

export function finishReview(ls: LangState, o: SessionOutcome, now: Date): LangState {
  const cards = { ...ls.cards }
  for (const [id, result] of Object.entries(o.firstResults)) {
    if (cards[id]) cards[id] = reviewCard(cards[id], result, now)
  }
  return addXp({ ...ls, cards }, localDate(now), reviewXp(o))
}

export function setPhraseUsed(ls: LangState, phraseId: string, used: boolean, now: Date): LangState {
  const today = localDate(now)
  if (used) {
    if (ls.phrasesUsed[phraseId]) return ls
    return addXp({ ...ls, phrasesUsed: { ...ls.phrasesUsed, [phraseId]: today } }, today, PHRASE_XP)
  }
  const day = ls.phrasesUsed[phraseId]
  if (!day) return ls
  const { [phraseId]: _removed, ...rest } = ls.phrasesUsed
  return addXp({ ...ls, phrasesUsed: rest }, day, -PHRASE_XP)
}

export const resetLang = (s: AppState, lang: LangCode): AppState => ({
  ...s,
  langs: { ...s.langs, [lang]: emptyLangState() },
})
