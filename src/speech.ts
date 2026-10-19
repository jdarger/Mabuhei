import { useEffect, useState } from 'react'
import tlAudio from './content/tl-audio.json'

/** Pre-recorded clips by language tag, keyed by the exact target text. Used before the device voice. */
const clips: Record<string, Record<string, string>> = { 'fil-PH': tlAudio }
const hasClips = (ttsLang: string) => !!clips[ttsLang]
let playing: HTMLAudioElement | null = null

const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

/** Language tags to try, best first. */
export function voiceCandidates(ttsLang: string): string[] {
  const l = ttsLang.toLowerCase()
  if (l === 'nb-no' || l.startsWith('nb') || l.startsWith('no')) return ['nb-no', 'no-no', 'nn-no', 'no', 'nb']
  if (l === 'fil-ph' || l.startsWith('fil') || l.startsWith('tl')) return ['fil-ph', 'tl-ph', 'fil', 'tl']
  return [l, l.split('-')[0]]
}

export function findVoice(ttsLang: string, voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const norm = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase()
  for (const cand of voiceCandidates(ttsLang)) {
    const v = voices.find((x) => norm(x) === cand)
    if (v) return v
  }
  return undefined
}

function currentVoice(ttsLang: string) {
  return synth ? findVoice(ttsLang, synth.getVoices()) : undefined
}

/** True when a matching voice exists. Voices load asynchronously, so this updates when they arrive. */
export function useHasVoice(ttsLang: string): boolean {
  const [has, setHas] = useState(() => hasClips(ttsLang) || !!currentVoice(ttsLang))
  useEffect(() => {
    if (hasClips(ttsLang)) return setHas(true)
    if (!synth) return
    const update = () => setHas(!!currentVoice(ttsLang))
    update()
    synth.addEventListener('voiceschanged', update)
    return () => synth.removeEventListener('voiceschanged', update)
  }, [ttsLang])
  return has
}

export function speak(text: string, ttsLang: string): void {
  const clip = clips[ttsLang]?.[text]
  if (clip) {
    try {
      playing?.pause()
      playing = new Audio(clip)
      void playing.play().catch(() => {})
      return
    } catch {
      /* fall back to the device voice */
    }
  }
  if (!synth) return
  const voice = currentVoice(ttsLang)
  if (!voice) return
  try {
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = 0.9
    synth.speak(u)
  } catch {
    /* speech is a nice-to-have */
  }
}
