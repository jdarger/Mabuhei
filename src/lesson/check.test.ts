import { describe, expect, it } from 'vitest'
import { checkAnswer, normalize } from './check'

const hei = { target: 'Hei!', alts: ['Hallo'] }

describe('normalize', () => {
  it('trims, lowercases, collapses spaces and strips punctuation', () => {
    expect(normalize('  Hvor   ER du?! ')).toBe('hvor er du')
    expect(normalize('¿Cómo estás?')).toBe('cómo estás')
    expect(normalize(`"it's"`)).toBe('its')
  })
})

describe('checkAnswer', () => {
  it('accepts exact answers ignoring case, spacing and punctuation', () => {
    expect(checkAnswer('hei', hei)).toBe('correct')
    expect(checkAnswer('  HEI!! ', hei)).toBe('correct')
  })
  it('accepts alternatives', () => {
    expect(checkAnswer('hallo', hei)).toBe('correct')
  })
  it('rejects wrong and empty answers', () => {
    expect(checkAnswer('hade', hei)).toBe('wrong')
    expect(checkAnswer('   ', hei)).toBe('wrong')
  })
  it('is lenient (almost) when only diacritics differ', () => {
    expect(checkAnswer('jeg er glad i deg', { target: 'jeg er glad i deg' })).toBe('correct')
    expect(checkAnswer('baerekraftig', { target: 'bærekraftig' })).toBe('almost')
    expect(checkAnswer('bok', { target: 'bøk' })).toBe('almost')
    expect(checkAnswer('gar', { target: 'går' })).toBe('almost')
    expect(checkAnswer('gaar', { target: 'går' })).toBe('almost')
    expect(checkAnswer('manana', { target: 'mañana' })).toBe('almost')
    expect(checkAnswer('kumusta po', { target: 'Kumustá po' })).toBe('almost')
  })
  it('does not treat real typos as almost', () => {
    expect(checkAnswer('gor', { target: 'går' })).toBe('wrong')
  })
  it('exact diacritic match is fully correct', () => {
    expect(checkAnswer('Går', { target: 'går' })).toBe('correct')
  })
  it('checks diacritic-leniency against alts too', () => {
    expect(checkAnswer('takk', { target: 'tusen takk', alts: ['takk skal du ha', 'tákk'] })).toBe('almost')
  })
})
