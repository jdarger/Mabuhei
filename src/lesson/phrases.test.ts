import { describe, expect, it } from 'vitest'
import type { Phrase } from '../content/types'
import { pickDailyPhrases } from './phrases'

const phrases: Phrase[] = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, target: `t${i}`, english: `e${i}`, context: 'c' }))

describe('pickDailyPhrases', () => {
  it('is deterministic for the same date and language', () => {
    const a = pickDailyPhrases(phrases, {}, '2026-03-01', 'no')
    const b = pickDailyPhrases(phrases, {}, '2026-03-01', 'no')
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id))
    expect(a).toHaveLength(3)
    expect(new Set(a.map((p) => p.id)).size).toBe(3)
  })
  it('varies across days and languages', () => {
    const days = new Set<string>()
    for (let d = 1; d <= 10; d++) days.add(pickDailyPhrases(phrases, {}, `2026-03-${String(d).padStart(2, '0')}`, 'no').map((p) => p.id).join())
    expect(days.size).toBeGreaterThan(1)
    const no = pickDailyPhrases(phrases, {}, '2026-03-01', 'no').map((p) => p.id).join()
    const tl = new Set(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'].map((d) => pickDailyPhrases(phrases, {}, d, 'tl').map((p) => p.id).join()))
    expect(tl.size > 1 || [...tl][0] !== no).toBe(true)
  })
  it('prefers phrases not used on earlier days', () => {
    const used = Object.fromEntries(phrases.slice(0, 10).map((p) => [p.id, '2026-02-01']))
    for (let d = 1; d <= 20; d++) {
      const ids = pickDailyPhrases(phrases, used, `2026-03-${String(d).padStart(2, '0')}`, 'no').map((p) => p.id)
      // only p10 and p11 are unused; they must always be in
      expect(ids).toContain('p10')
      expect(ids).toContain('p11')
    }
  })
  it("doesn't change the day's picks when you mark one used today", () => {
    const before = pickDailyPhrases(phrases, {}, '2026-03-05', 'no').map((p) => p.id)
    const after = pickDailyPhrases(phrases, { [before[0]]: '2026-03-05' }, '2026-03-05', 'no').map((p) => p.id)
    expect(after).toEqual(before)
  })
  it('handles fewer phrases than requested', () => {
    expect(pickDailyPhrases(phrases.slice(0, 2), {}, '2026-03-01', 'no')).toHaveLength(2)
    expect(pickDailyPhrases([], {}, '2026-03-01', 'no')).toHaveLength(0)
  })
})
