import { useState } from 'react'
import type { Course, Item } from '../content/types'
import type { LangState } from '../state/types'
import { planLesson } from '../lesson/plan'
import { lessonXp, type SessionOutcome } from '../state/actions'
import { computeStreak } from '../state/streak'
import { localDate } from '../state/dates'
import Session, { type SessionStats } from './Session'
import Results from './Results'

interface Props {
  course: Course
  ls: LangState
  hasVoice: boolean
  sound: boolean
  unitId?: string
  onComplete: (newItems: Item[], o: SessionOutcome) => void
  onExit: () => void
}

export default function Lesson({ course, ls, hasVoice, sound, unitId, onComplete, onExit }: Props) {
  // Plan once, when the lesson starts (progress changes mid-lesson must not reshuffle it).
  const [plan] = useState(() => planLesson(course, ls, { unitId, hasVoice }))
  const [done, setDone] = useState<{ xp: number; stats: SessionStats } | null>(null)

  if (!plan) {
    return (
      <main className="screen">
        <div className="session-body center">
          <h1>Nothing to learn yet</h1>
          <p className="muted">There are no words available in this course.</p>
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
        title="Lesson complete!"
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
      steps={plan.steps}
      hasVoice={hasVoice}
      sound={sound}
      requeueWrong
      onExit={onExit}
      onFinish={(o, stats) => {
        onComplete(plan.newItems, o)
        setDone({ xp: lessonXp(o), stats })
      }}
    />
  )
}
