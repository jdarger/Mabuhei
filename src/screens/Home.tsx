import type { Course, LangCode } from '../content/types'
import type { LangState } from '../state/types'
import { LANGS, COURSES } from '../courses'
import { localDate } from '../state/dates'
import { computeStreak } from '../state/streak'
import { dueItems, unitProgress, currentUnitId } from '../lesson/plan'
import type { Screen } from '../App'

interface Props {
  course: Course
  ls: LangState
  hasVoice: boolean
  onLang: (l: LangCode) => void
  onNav: (s: Screen) => void
}

export default function Home({ course, ls, onLang, onNav }: Props) {
  const now = new Date()
  const today = localDate(now)
  const streak = computeStreak(ls.xpByDay, today)
  const todayXp = ls.xpByDay[today] ?? 0
  const words = Object.keys(ls.cards).length
  const due = dueItems(course, ls, now).length
  const progress = unitProgress(course, ls)
  const current = currentUnitId(course, ls)
  const started = words > 0

  return (
    <main className="screen">
      <header className="topbar">
        <div className="lang-switch" role="tablist" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={l === course.lang}
              className={l === course.lang ? 'pill active' : 'pill'}
              onClick={() => onLang(l)}
            >
              {COURSES[l].flag} {COURSES[l].name}
            </button>
          ))}
        </div>
        <button className="icon-btn" aria-label="Settings" onClick={() => onNav({ name: 'settings' })}>
          ⚙️
        </button>
      </header>

      <section className="stats" aria-label="Your stats">
        <div className="stat">
          <span className="stat-icon">🔥</span>
          <strong>{streak}</strong>
          <span>day streak</span>
        </div>
        <div className="stat">
          <span className="stat-icon">⚡</span>
          <strong>{todayXp}</strong>
          <span>XP today</span>
        </div>
        <div className="stat">
          <span className="stat-icon">📚</span>
          <strong>{words}</strong>
          <span>words learned</span>
        </div>
      </section>

      <div className="actions">
        <button className="btn btn-primary" onClick={() => onNav({ name: 'lesson' })}>
          {started ? 'Continue lesson' : 'Start lesson'}
        </button>
        <button className="btn btn-blue" disabled={due === 0} onClick={() => onNav({ name: 'review' })}>
          Review ({due} due)
        </button>
        <button className="btn btn-orange" onClick={() => onNav({ name: 'phrases' })}>
          Tonight&apos;s phrases
        </button>
      </div>

      <h2 className="section-title">Your path</h2>
      <ol className="path">
        {course.units.map((u, i) => {
          const p = progress[i]
          const pct = p.total ? Math.round((p.introduced / p.total) * 100) : 0
          const cls = ['unit', !p.unlocked && 'locked', u.id === current && 'current'].filter(Boolean).join(' ')
          return (
            <li key={u.id}>
              <button
                className={cls}
                disabled={!p.unlocked}
                onClick={() => onNav({ name: 'lesson', unitId: u.id })}
                aria-label={`${u.title}, ${p.introduced} of ${p.total}${p.unlocked ? '' : ', locked'}`}
              >
                <span className="unit-emoji">{p.unlocked ? u.emoji : '🔒'}</span>
                <span className="unit-body">
                  <span className="unit-title">{u.title}</span>
                  <span className="bar small">
                    <span className="bar-fill" style={{ width: `${pct}%` }} />
                  </span>
                </span>
                <span className="unit-count">
                  {p.introduced}/{p.total}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
