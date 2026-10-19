import { useCallback, useEffect, useState } from 'react'
import type { Item, LangCode } from '../content/types'
import { loadState, saveState } from './persistence'
import type { AppState, LangState } from './types'
import { finishLesson, finishReview, resetLang, setPhraseUsed, type SessionOutcome } from './actions'

export function useStore() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => saveState(state), [state])

  const updateLang = useCallback((lang: LangCode, fn: (ls: LangState) => LangState) => {
    setState((s) => ({ ...s, langs: { ...s.langs, [lang]: fn(s.langs[lang]) } }))
  }, [])

  return {
    state,
    setLang: (lang: LangCode) => setState((s) => ({ ...s, lang })),
    setSound: (sound: boolean) => setState((s) => ({ ...s, sound })),
    completeLesson: (lang: LangCode, newItems: Item[], o: SessionOutcome) =>
      updateLang(lang, (ls) => finishLesson(ls, newItems, o, new Date())),
    completeReview: (lang: LangCode, o: SessionOutcome) => updateLang(lang, (ls) => finishReview(ls, o, new Date())),
    togglePhrase: (lang: LangCode, id: string, used: boolean) =>
      updateLang(lang, (ls) => setPhraseUsed(ls, id, used, new Date())),
    reset: (lang: LangCode) => setState((s) => resetLang(s, lang)),
  }
}
