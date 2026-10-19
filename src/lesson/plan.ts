import type { Course, Item } from '../content/types'
import type { LangState } from '../state/types'
import { makeExercise, randomKind, type Exercise } from './exercises'
import { shuffle, type Rng } from './rng'

export const UNLOCK_THRESHOLD = 0.8
export const MAX_NEW = 4
export const LESSON_LENGTH = 10
export const REVIEW_MAX = 15

export interface UnitProgress {
  unitId: string
  total: number
  introduced: number
  unlocked: boolean
}

export function unitProgress(course: Course, ls: Pick<LangState, 'cards'>): UnitProgress[] {
  const out: UnitProgress[] = []
  course.units.forEach((u, i) => {
    const items = course.items.filter((it) => it.unit === u.id)
    const introduced = items.filter((it) => ls.cards[it.id]).length
    const prev = out[i - 1]
    const unlocked = i === 0 || (prev.total > 0 ? prev.introduced / prev.total >= UNLOCK_THRESHOLD : true)
    out.push({ unitId: u.id, total: items.length, introduced, unlocked })
  })
  return out
}

/** First unlocked unit that still has items to introduce, if any. */
export function currentUnitId(course: Course, ls: Pick<LangState, 'cards'>): string | undefined {
  return unitProgress(course, ls).find((p) => p.unlocked && p.introduced < p.total)?.unitId
}

export type Step = { type: 'new'; item: Item } | { type: 'exercise'; exercise: Exercise }

export interface LessonPlan {
  unitId: string | undefined
  newItems: Item[]
  steps: Step[]
}

/** Spread out consecutive exercises about the same item where possible. */
function separateNeighbours(list: Exercise[]): Exercise[] {
  const a = list.slice()
  for (let i = 1; i < a.length; i++) {
    if (a[i].item.id !== a[i - 1].item.id) continue
    const j = a.findIndex((e, idx) => idx > i && e.item.id !== a[i - 1].item.id)
    if (j > -1) [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function planLesson(
  course: Course,
  ls: Pick<LangState, 'cards'>,
  opts: { unitId?: string; hasVoice: boolean; rng?: Rng },
): LessonPlan | null {
  const rng = opts.rng ?? Math.random
  const unitId = opts.unitId ?? currentUnitId(course, ls)
  const newItems = unitId
    ? course.items.filter((it) => it.unit === unitId && !ls.cards[it.id]).slice(0, MAX_NEW)
    : []

  // Recently learned items (newest first), preferably from the same unit.
  const learned = course.items.filter((it) => ls.cards[it.id])
  const byRecent = (a: Item, b: Item) => ls.cards[b.id].introducedAt.localeCompare(ls.cards[a.id].introducedAt)
  const sameUnit = learned.filter((it) => it.unit === unitId).sort(byRecent)
  const others = learned.filter((it) => it.unit !== unitId).sort(byRecent)
  const recents = [...sameUnit, ...others].slice(0, 6)

  if (newItems.length === 0 && recents.length === 0) return null

  let seq = 0
  const make = (kind: Parameters<typeof makeExercise>[0], item: Item) =>
    makeExercise(kind, item, course, opts.hasVoice, rng, seq++)

  const first: Exercise[] = newItems.map((it) => make('meaning', it))
  const rest: Exercise[] = []
  newItems.forEach((it, i) => rest.push(make(i % 2 === 0 ? 'translation' : 'type', it)))

  const pool = newItems.length ? [...newItems, ...shuffle(recents, rng).slice(0, 4)] : shuffle(recents, rng)
  // Fill (with one exercise per pool item per pass) up to the lesson length.
  let guard = 0
  while (first.length + rest.length < LESSON_LENGTH && pool.length && guard++ < 50) {
    for (const it of pool) {
      if (first.length + rest.length >= LESSON_LENGTH) break
      const isNew = newItems.includes(it)
      rest.push(make(isNew ? 'type' : randomKind(opts.hasVoice, rng), it))
    }
  }

  const exercises = [...first, ...separateNeighbours(shuffle(rest, rng))]
  const steps: Step[] = [
    ...newItems.map((item): Step => ({ type: 'new', item })),
    ...exercises.map((exercise): Step => ({ type: 'exercise', exercise })),
  ]
  return { unitId, newItems, steps }
}

/** Items whose card is due, soonest first, capped at REVIEW_MAX. */
export function dueItems(course: Course, ls: Pick<LangState, 'cards'>, now: Date): Item[] {
  return course.items
    .filter((it) => ls.cards[it.id] && new Date(ls.cards[it.id].due).getTime() <= now.getTime())
    .sort((a, b) => ls.cards[a.id].due.localeCompare(ls.cards[b.id].due))
}

export function planReview(
  course: Course,
  ls: Pick<LangState, 'cards'>,
  opts: { now: Date; hasVoice: boolean; rng?: Rng },
): Exercise[] {
  const rng = opts.rng ?? Math.random
  return dueItems(course, ls, opts.now)
    .slice(0, REVIEW_MAX)
    .map((it, i) => makeExercise(randomKind(opts.hasVoice, rng), it, course, opts.hasVoice, rng, i))
}
