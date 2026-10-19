import { FSRS, Rating, State, createEmptyCard, generatorParameters, type Card, type Grade } from 'ts-fsrs'
import type { StoredCard } from '../state/types'

/** Outcome of one answer. */
export type Result = 'correct' | 'almost' | 'wrong'

const scheduler = new FSRS(
  generatorParameters({
    request_retention: 0.9,
    enable_fuzz: true,
    // Skip minute-level learning steps: a rated card goes straight onto a day-based schedule.
    enable_short_term: false,
  }),
)

export function resultToRating(r: Result): Grade {
  return r === 'wrong' ? Rating.Again : r === 'almost' ? Rating.Hard : Rating.Good
}

const toStored = (c: Card, introducedAt: string): StoredCard => ({
  due: c.due.toISOString(),
  stability: c.stability,
  difficulty: c.difficulty,
  elapsed_days: c.elapsed_days,
  scheduled_days: c.scheduled_days,
  learning_steps: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  last_review: c.last_review ? c.last_review.toISOString() : undefined,
  introducedAt,
})

const fromStored = (s: StoredCard): Card => ({
  due: new Date(s.due),
  stability: s.stability,
  difficulty: s.difficulty,
  elapsed_days: s.elapsed_days,
  scheduled_days: s.scheduled_days,
  learning_steps: s.learning_steps,
  reps: s.reps,
  lapses: s.lapses,
  state: s.state as State,
  last_review: s.last_review ? new Date(s.last_review) : undefined,
})

/** Create a card when an item is first introduced, rated by how the first attempts went. */
export function introduceCard(result: Result, now: Date): StoredCard {
  const { card } = scheduler.next(createEmptyCard(now), now, resultToRating(result))
  return toStored(card, now.toISOString())
}

/** Apply a review answer to an existing card. */
export function reviewCard(stored: StoredCard, result: Result, now: Date): StoredCard {
  const { card } = scheduler.next(fromStored(stored), now, resultToRating(result))
  return toStored(card, stored.introducedAt)
}

export const isDue = (c: StoredCard, now: Date): boolean => new Date(c.due).getTime() <= now.getTime()
