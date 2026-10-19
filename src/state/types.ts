import type { LangCode } from '../content/types'

/** A FSRS card as stored in localStorage (dates as ISO strings). */
export interface StoredCard {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review?: string
  introducedAt: string
}

export interface LangState {
  cards: Record<string, StoredCard> // keyed by item id
  xpByDay: Record<string, number> // local date -> XP
  phrasesUsed: Record<string, string> // phrase id -> local date it was marked used
  lessonsDone: number
}

export interface AppState {
  v: 1
  lang: LangCode
  sound: boolean
  langs: Record<LangCode, LangState>
}

export const emptyLangState = (): LangState => ({
  cards: {},
  xpByDay: {},
  phrasesUsed: {},
  lessonsDone: 0,
})

export const initialState = (): AppState => ({
  v: 1,
  lang: 'no',
  sound: true,
  langs: { no: emptyLangState(), tl: emptyLangState() },
})
