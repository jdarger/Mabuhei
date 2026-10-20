import { describe, expect, it } from 'vitest'
import { COURSES, LANGS } from '../courses'

describe.each(LANGS)('course %s', (lang) => {
  const c = COURSES[lang]
  it('has consistent ids and unit references', () => {
    expect(c.lang).toBe(lang)
    const unitIds = new Set(c.units.map((u) => u.id))
    expect(unitIds.size).toBe(c.units.length)
    expect(new Set(c.items.map((i) => i.id)).size).toBe(c.items.length)
    expect(new Set(c.phrases.map((p) => p.id)).size).toBe(c.phrases.length)
    for (const it of c.items) expect(unitIds.has(it.unit)).toBe(true)
    for (const u of c.units) expect(c.items.some((i) => i.unit === u.id)).toBe(true)
  })
  it('has at least 3 phrases', () => {
    expect(c.phrases.length).toBeGreaterThanOrEqual(3)
  })
})

describe.each(LANGS)('%s audio clips', (lang) => {
  it('has a recorded clip for every word and phrase', async () => {
    const course = COURSES[lang]
    const clips: Record<string, string> = (await import(`./${lang}-audio.json`)).default
    const missing = [...course.items, ...course.phrases].filter((x) => !clips[x.target]).map((x) => x.id)
    expect(missing).toEqual([])
  })
})
