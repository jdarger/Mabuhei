import { describe, expect, it } from 'vitest'
import type { Course, Item } from '../content/types'
import { buildOptions, makeExercise } from './exercises'
import { planLesson, planReview, unitProgress, MAX_NEW } from './plan'
import { seededRng } from './rng'
import { introduceCard } from '../srs/fsrs'

const mk = (i: number, unit: string, english = `word${i}`): Item => ({ id: `x-${i}`, target: `ord${i}`, english, unit })
const items: Item[] = [
  ...Array.from({ length: 10 }, (_, i) => mk(i, 'u1')),
  ...Array.from({ length: 10 }, (_, i) => mk(i + 10, 'u2')),
]
const course: Course = {
  lang: 'no',
  name: 'Norwegian',
  flag: '🇳🇴',
  ttsLang: 'nb-NO',
  units: [
    { id: 'u1', title: 'One', emoji: '1️⃣' },
    { id: 'u2', title: 'Two', emoji: '2️⃣' },
  ],
  items,
  phrases: [],
}

describe('buildOptions', () => {
  it('contains the answer, no duplicates, 4 options, prefers same unit', () => {
    for (let s = 0; s < 50; s++) {
      const rng = seededRng(s)
      const opts = buildOptions(items[0], 'english', course, rng)
      expect(opts).toHaveLength(4)
      expect(opts).toContain('word0')
      expect(new Set(opts).size).toBe(4)
      // 9 other items exist in unit u1, so all distractors must come from it
      for (const o of opts) expect(['word0', ...items.slice(1, 10).map((i) => i.english)]).toContain(o)
    }
  })
  it('falls back to other units when the unit is small', () => {
    const small: Pick<Course, 'items'> = { items: [mk(1, 'a'), mk(2, 'b'), mk(3, 'b'), mk(4, 'b')] }
    const opts = buildOptions(small.items[0], 'target', small)
    expect(opts).toHaveLength(4)
    expect(new Set(opts).size).toBe(4)
  })
  it('never offers the same text twice even if items share a meaning', () => {
    const dup: Pick<Course, 'items'> = {
      items: [mk(1, 'a', 'you'), mk(2, 'a', 'you'), mk(3, 'a', 'YOU'), mk(4, 'a', 'me'), mk(5, 'a', 'we')],
    }
    const opts = buildOptions(dup.items[0], 'english', dup)
    expect(new Set(opts.map((o) => o.toLowerCase())).size).toBe(opts.length)
  })
})

describe('makeExercise', () => {
  it('translation uses target strings and includes the answer', () => {
    const ex = makeExercise('translation', items[3], course, true)
    expect(ex.options).toContain(items[3].target)
    expect(ex.answer).toBe(items[3].target)
  })
  it('substitutes meaning for listen when no voice', () => {
    expect(makeExercise('listen', items[0], course, false).kind).toBe('meaning')
    expect(makeExercise('listen', items[0], course, true).kind).toBe('listen')
  })
  it('type has no options', () => {
    const ex = makeExercise('type', items[0], course, true)
    expect(ex.options).toBeUndefined()
    expect(ex.answer).toBe(items[0].target)
  })
  it('falls back to typing when there are not enough distractors', () => {
    const ex = makeExercise('meaning', items[0], { items: [items[0]] }, true)
    expect(ex.kind).toBe('type')
  })
})

describe('planLesson', () => {
  it('first lesson introduces up to 4 new items from unit 1, with valid exercises', () => {
    const plan = planLesson(course, { cards: {} }, { hasVoice: false, rng: seededRng(1) })!
    expect(plan.unitId).toBe('u1')
    expect(plan.newItems).toHaveLength(MAX_NEW)
    expect(plan.steps.slice(0, 4).every((s) => s.type === 'new')).toBe(true)
    const exercises = plan.steps.flatMap((s) => (s.type === 'exercise' ? [s.exercise] : []))
    expect(exercises.length).toBeGreaterThanOrEqual(8)
    expect(exercises.length).toBeLessThanOrEqual(10)
    for (const ex of exercises) {
      expect(ex.kind).not.toBe('listen')
      if (ex.options) {
        expect(ex.options).toContain(ex.answer)
        expect(new Set(ex.options).size).toBe(ex.options.length)
      }
    }
    // every new item gets practised
    for (const it of plan.newItems) expect(exercises.some((e) => e.item.id === it.id)).toBe(true)
  })

  it('mixes in recently learned items and locks units until 80% introduced', () => {
    const now = new Date('2026-01-01T10:00:00Z')
    const cards = Object.fromEntries(items.slice(0, 7).map((it) => [it.id, introduceCard('correct', now)]))
    // 7/10 = 70%: u2 still locked, so we keep going in u1
    expect(unitProgress(course, { cards }).map((p) => p.unlocked)).toEqual([true, false])
    let plan = planLesson(course, { cards }, { hasVoice: true, rng: seededRng(2) })!
    expect(plan.unitId).toBe('u1')
    expect(plan.newItems.map((i) => i.id)).toEqual(['x-7', 'x-8', 'x-9'])
    const ids = plan.steps.flatMap((s) => (s.type === 'exercise' ? [s.exercise.item.id] : []))
    expect(ids.some((id) => cards[id])).toBe(true)

    // 8/10 = 80%: u2 unlocks, but u1 still has items to finish first
    const cards8 = Object.fromEntries(items.slice(0, 8).map((it) => [it.id, introduceCard('correct', now)]))
    expect(unitProgress(course, { cards: cards8 })[1].unlocked).toBe(true)
    plan = planLesson(course, { cards: cards8 }, { hasVoice: true, rng: seededRng(3) })!
    expect(plan.unitId).toBe('u1')
  })

  it('practice-only lesson when everything has been introduced', () => {
    const now = new Date()
    const cards = Object.fromEntries(items.map((it) => [it.id, introduceCard('correct', now)]))
    const plan = planLesson(course, { cards }, { hasVoice: true, rng: seededRng(4) })!
    expect(plan.newItems).toHaveLength(0)
    expect(plan.steps.length).toBeGreaterThan(0)
  })
})

describe('planReview', () => {
  it('only includes due items, capped at 15', () => {
    const past = new Date('2026-01-01T10:00:00Z')
    const cards = Object.fromEntries(items.map((it) => [it.id, introduceCard('correct', past)]))
    const farFuture = new Date('2035-01-01T00:00:00Z')
    const due = planReview(course, { cards }, { now: farFuture, hasVoice: true, rng: seededRng(5) })
    expect(due).toHaveLength(15)
    expect(new Set(due.map((e) => e.item.id)).size).toBe(15)
    expect(planReview(course, { cards }, { now: past, hasVoice: true })).toHaveLength(0)
  })
})
