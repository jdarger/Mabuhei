import { initialState, emptyLangState, type AppState, type LangState } from './types'

export const STORAGE_KEY = 'mabuhei:v1'

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

function cleanLang(raw: unknown): LangState {
  const base = emptyLangState()
  if (!isObj(raw)) return base
  if (isObj(raw.cards)) base.cards = raw.cards as LangState['cards']
  if (isObj(raw.xpByDay)) base.xpByDay = raw.xpByDay as LangState['xpByDay']
  if (isObj(raw.phrasesUsed)) base.phrasesUsed = raw.phrasesUsed as LangState['phrasesUsed']
  if (typeof raw.lessonsDone === 'number') base.lessonsDone = raw.lessonsDone
  return base
}

/** Parse stored JSON defensively; anything unexpected falls back to a fresh state. */
export function parseState(json: string | null): AppState {
  const s = initialState()
  if (!json) return s
  try {
    const raw: unknown = JSON.parse(json)
    if (!isObj(raw) || raw.v !== 1) return s
    if (raw.lang === 'no' || raw.lang === 'tl') s.lang = raw.lang
    if (typeof raw.sound === 'boolean') s.sound = raw.sound
    if (isObj(raw.langs)) {
      s.langs.no = cleanLang(raw.langs.no)
      s.langs.tl = cleanLang(raw.langs.tl)
    }
  } catch {
    /* corrupted data: start fresh */
  }
  return s
}

export function loadState(): AppState {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY))
  } catch {
    return initialState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable or full: the app keeps working in memory */
  }
}
