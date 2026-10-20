import { describe, expect, it } from 'vitest'
import { buildPattern, countLetters, pickEliminations } from './hints'
import { seededRng } from './rng'

describe('buildPattern', () => {
  it('reveals the first letter and keeps spaces', () => {
    expect(buildPattern('hvordan har du det', 1)).toBe('h _ _ _ _ _ _   _ _ _   _ _   _ _ _')
  })
  it('reveals letters in order, skipping spaces', () => {
    expect(buildPattern('hei du', 4)).toBe('h e i   d _')
  })
  it('keeps punctuation', () => {
    expect(buildPattern('Hei, du!', 1)).toBe('H _ _ ,   _ _ !')
  })
  it('handles diacritics', () => {
    expect(buildPattern('å være', 2)).toBe('å   v _ _ _')
    expect(buildPattern('Magandang umaga po', 1).startsWith('M _')).toBe(true)
    expect(buildPattern('niño', 3)).toBe('n i ñ _')
  })
  it('shows everything when fully revealed', () => {
    const t = 'Jeg heter Åse.'
    expect(buildPattern(t, countLetters(t))).toBe('J e g   h e t e r   Å s e .')
    expect(buildPattern(t, 99)).not.toContain('_')
  })
  it('shows nothing for zero', () => {
    expect(buildPattern('ja', 0)).toBe('_ _')
  })
})

describe('countLetters', () => {
  it('ignores spaces and punctuation', () => {
    expect(countLetters('hei, på deg!')).toBe(8)
  })
})

describe('pickEliminations', () => {
  const opts = ['a', 'b', 'c', 'd']
  it('never removes the correct answer and has no duplicates', () => {
    for (let s = 0; s < 200; s++) {
      const out = pickEliminations(opts, 'c', seededRng(s), 2)
      expect(out).toHaveLength(2)
      expect(out).not.toContain('c')
      expect(new Set(out).size).toBe(2)
    }
  })
  it('skips already struck options', () => {
    for (let s = 0; s < 50; s++) {
      const out = pickEliminations(opts, 'a', seededRng(s), 1, ['b', 'c'])
      expect(out).toEqual(['d'])
    }
  })
  it('returns fewer when not enough wrong options', () => {
    expect(pickEliminations(['x', 'y'], 'x', seededRng(1), 2)).toEqual(['y'])
  })
})
