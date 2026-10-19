import { useState } from 'react'
import type { Course } from '../content/types'
import type { LangState } from '../state/types'
import { planReview } from '../lesson/plan'
import { reviewXp, type SessionOutcome } from '../state/actions'
import { computeStreak } from '../state/streak'
import { localDate } from '../state/dates'
import Session, { type SessionStats } from './Session'
import Results from './Results'

interface Props {
  course: Course
  ls: LangState
  hasVoice: boolean
  sound: boolean
  onComplete: (o: SessionOutcome) => void
  onExit: () => void
}

export default function Review({ course, ls, hasVoice, sound, onComplete, onExit }: Props) {
  const [steps] = useState(() =>
    planReview(course, ls, { now: new Date(), hasVoice }).map((exercise) => ({ type: 'exercise' as const, exercise })),
  )
  const [done, setDone] = useState<{ xp: number; stats: SessionStats } | null>(null)

  if (steps.length === 0) {
    return (
      <main className="screen">
        <div className="session-body center">
          <div className="trophy">✅</div>
          <h1>All caught up!</h1>
          <p className="muted">Nothing is due for review right now.</p>
        </div>
        <footer className="feedback">
          <button className="btn btn-primary" onClick={onExit}>
            Back
          </button>
        </footer>
      </main>
    )
  }

  if (done) {
    return (
      <Results
        title="Review complete!"
        xp={done.xp}
        stats={done.stats}
        streak={computeStreak(ls.xpByDay, localDate())}
        onDone={onExit}
      />
    )
  }

  return (
    <Session
      course={course}
      steps={steps}
      hasVoice={hasVoice}
      sound={sound}
      requeueWrong={false}
      onExit={onExit}
      onFinish={(o, stats) => {
        onComplete(o)
        setDone({ xp: reviewXp(o), stats })
      }}
    />
  )
}
