import type { Course, Item } from '../content/types'
import { pick, shuffle, type Rng } from './rng'

export type ExerciseKind = 'meaning' | 'translation' | 'type' | 'listen'

export interface Exercise {
  id: string
  kind: ExerciseKind
  item: Item
  /** Multiple-choice options (English for meaning/listen, target for translation). */
  options?: string[]
  /** The correct option text (for 'type', the item's target). */
  answer: string
}

const MAX_OPTIONS = 4

/** Build up to 4 shuffled, unique options including the correct one. Prefers same-unit distractors. */
export function buildOptions(
  item: Item,
  field: 'english' | 'target',
  course: Pick<Course, 'items'>,
  rng: Rng = Math.random,
): string[] {
  const correct = item[field]
  const taken = new Set<string>([correct.toLowerCase()])
  const take = (pool: Item[], out: string[]) => {
    for (const it of shuffle(pool, rng)) {
      if (out.length >= MAX_OPTIONS - 1) break
      const text = it[field]
      if (it.id === item.id || taken.has(text.toLowerCase())) continue
      taken.add(text.toLowerCase())
      out.push(text)
    }
  }
  const distractors: string[] = []
  take(course.items.filter((i) => i.unit === item.unit), distractors)
  take(course.items.filter((i) => i.unit !== item.unit), distractors)
  return shuffle([correct, ...distractors], rng)
}

export function makeExercise(
  kind: ExerciseKind,
  item: Item,
  course: Pick<Course, 'items'>,
  hasVoice: boolean,
  rng: Rng = Math.random,
  seq = 0,
): Exercise {
  let k = kind
  if (k === 'listen' && !hasVoice) k = 'meaning'
  const id = `${k}:${item.id}:${seq}`
  if (k === 'type') return { id, kind: k, item, answer: item.target }
  const field = k === 'translation' ? 'target' : 'english'
  const options = buildOptions(item, field, course, rng)
  // A course too small to offer a real choice: fall back to typing.
  if (options.length < 2) return { id, kind: 'type', item, answer: item.target }
  return { id, kind: k, item, options, answer: item[field] }
}

export const randomKind = (hasVoice: boolean, rng: Rng = Math.random): ExerciseKind =>
  pick<ExerciseKind>(hasVoice ? ['meaning', 'translation', 'type', 'listen'] : ['meaning', 'translation', 'type'], rng)
