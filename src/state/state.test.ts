import { describe, expect, it } from 'vitest'
import { computeStreak } from './streak'
import { addDays, localDate } from './dates'
import { parseState } from './persistence'
import { emptyLangState } from './types'
import { finishLesson, finishReview, lessonXp, setPhraseUsed } from './actions'
import { isDue } from '../srs/fsrs'

describe('computeStreak', () => {
  const xp = (...days: string[]) => Object.fromEntries(days.map((d) => [d, 10]))
  it('is 0 with no activity', () => {
    expect(computeStreak({}, '2026-03-10')).toBe(0)
  })
  it('counts consecutive days ending today', () => {
    expect(computeStreak(xp('2026-03-08', '2026-03-09', '2026-03-10'), '2026-03-10')).toBe(3)
  })
  it('stays alive if only yesterday is done', () => {
    expect(computeStreak(xp('2026-03-08', '2026-03-09'), '2026-03-10')).toBe(2)
  })
  it('breaks after a missed day', () => {
    expect(computeStreak(xp('2026-03-07', '2026-03-08'), '2026-03-10')).toBe(0)
    expect(computeStreak(xp('2026-03-05', '2026-03-06', '2026-03-08', '2026-03-09', '2026-03-10'), '2026-03-10')).toBe(3)
  })
  it('works across month and year boundaries', () => {
    expect(computeStreak(xp('2025-12-30', '2025-12-31', '2026-01-01'), '2026-01-01')).toBe(3)
    expect(computeStreak(xp('2026-02-27', '2026-02-28', '2026-03-01'), '2026-03-01')).toBe(3)
  })
  it('ignores days with 0 XP', () => {
    expect(computeStreak({ '2026-03-10': 0, '2026-03-09': 10 }, '2026-03-10')).toBe(1)
  })
})

describe('dates', () => {
  it('addDays crosses boundaries', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('parseState', () => {
  it('falls back to a fresh state for junk', () => {
    expect(parseState(null).v).toBe(1)
    expect(parseState('not json').langs.no.cards).toEqual({})
    expect(parseState('{"v":2}').lang).toBe('no')
  })
  it('round-trips valid state', () => {
    const s = parseState(JSON.stringify({ v: 1, lang: 'tl', sound: false, langs: { tl: { xpByDay: { a: 1 } } } }))
    expect(s.lang).toBe('tl')
    expect(s.sound).toBe(false)
    expect(s.langs.tl.xpByDay).toEqual({ a: 1 })
    expect(s.langs.no).toEqual(emptyLangState())
  })
})

describe('progress actions', () => {
  const now = new Date(2026, 2, 10, 9, 0)
  const item = { id: 'no-hei', target: 'hei', english: 'hi', unit: 'u1' }
  it('lesson introduces cards, awards XP and counts toward the streak', () => {
    const o = { firstResults: { 'no-hei': 'correct' as const }, correctAnswers: 5 }
    const ls = finishLesson(emptyLangState(), [item], o, now)
    expect(ls.cards['no-hei']).toBeDefined()
    expect(ls.xpByDay['2026-03-10']).toBe(lessonXp(o))
    expect(lessonXp(o)).toBe(15)
    expect(computeStreak(ls.xpByDay, '2026-03-10')).toBe(1)
  })
  it('review reschedules the card; wrong comes back sooner than correct', () => {
    const base = finishLesson(emptyLangState(), [item], { firstResults: {}, correctAnswers: 0 }, now)
    const later = new Date(2026, 2, 20, 9, 0)
    const good = finishReview(base, { firstResults: { 'no-hei': 'correct' }, correctAnswers: 1 }, later)
    const bad = finishReview(base, { firstResults: { 'no-hei': 'wrong' }, correctAnswers: 0 }, later)
    expect(new Date(good.cards['no-hei'].due) > new Date(bad.cards['no-hei'].due)).toBe(true)
    expect(isDue(good.cards['no-hei'], later)).toBe(false)
    expect(good.xpByDay['2026-03-20']).toBeGreaterThan(0) // review alone keeps the streak
    expect(bad.xpByDay['2026-03-20']).toBeGreaterThan(0)
  })
  it('phrases give 5 XP once, and can be undone', () => {
    let ls = setPhraseUsed(emptyLangState(), 'p1', true, now)
    ls = setPhraseUsed(ls, 'p1', true, now)
    expect(ls.xpByDay['2026-03-10']).toBe(5)
    expect(Object.keys(ls.phrasesUsed)).toEqual(['p1'])
    ls = setPhraseUsed(ls, 'p1', false, now)
    expect(ls.xpByDay['2026-03-10']).toBe(0)
    expect(computeStreak(ls.xpByDay, '2026-03-10')).toBe(0)
  })
})
