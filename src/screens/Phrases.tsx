import type { Course } from '../content/types'
import type { LangState } from '../state/types'
import { localDate } from '../state/dates'
import { pickDailyPhrases } from '../lesson/phrases'
import { speak } from '../speech'
import { PHRASE_XP } from '../state/actions'

interface Props {
  course: Course
  ls: LangState
  hasVoice: boolean
  onToggle: (id: string, used: boolean) => void
  onExit: () => void
}

export default function Phrases({ course, ls, hasVoice, onToggle, onExit }: Props) {
  const today = localDate()
  const picks = pickDailyPhrases(course.phrases, ls.phrasesUsed, today, course.lang)
  const usedCount = Object.keys(ls.phrasesUsed).length

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Back" onClick={onExit}>
          ←
        </button>
        <h1 className="title">Tonight&apos;s phrases</h1>
        <span className="icon-btn" aria-hidden />
      </header>
      <p className="muted center">
        Try these {course.name} phrases at home today. +{PHRASE_XP} XP each when you use one!
      </p>

      {picks.length === 0 && <p className="center">No phrases in this course yet.</p>}
      {picks.map((p) => {
        const used = !!ls.phrasesUsed[p.id]
        return (
          <article key={p.id} className={used ? 'card phrase used' : 'card phrase'}>
            <div className="phrase-head">
              <p className="phrase-target">{p.target}</p>
              {hasVoice && (
                <button className="speaker" aria-label={`Play ${p.target}`} onClick={() => speak(p.target, course.ttsLang)}>
                  🔊
                </button>
              )}
            </div>
            <p className="phrase-english">{p.english}</p>
            <p className="phrase-context muted">{p.context}</p>
            <button
              className={used ? 'btn btn-primary' : 'btn btn-outline'}
              aria-pressed={used}
              onClick={() => onToggle(p.id, !used)}
            >
              {used ? 'We used it! ✅' : 'We used it!'}
            </button>
          </article>
        )
      })}

      <p className="center muted">
        Phrases used with Glenn: <strong>{usedCount}</strong>
      </p>
    </main>
  )
}
