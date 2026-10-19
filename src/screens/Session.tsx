import { useRef, useState } from 'react'
import type { Course } from '../content/types'
import type { Step } from '../lesson/plan'
import type { Result } from '../srs/fsrs'
import type { SessionOutcome } from '../state/actions'
import ExerciseView from './ExerciseView'
import NewWordCard from './NewWordCard'

export interface SessionStats {
  /** Distinct exercises answered correctly (or almost) on the first try. */
  firstTryCorrect: number
  exerciseCount: number
}

interface Props {
  course: Course
  steps: Step[]
  hasVoice: boolean
  sound: boolean
  /** Re-queue wrong exercises at the end (lessons). */
  requeueWrong: boolean
  onFinish: (o: SessionOutcome, stats: SessionStats) => void
  onExit: () => void
}

const severity: Record<Result, number> = { correct: 0, almost: 1, wrong: 2 }

/** Runs a queue of steps with a progress bar, collecting results. */
export default function Session({ course, steps, hasVoice, sound, requeueWrong, onFinish, onExit }: Props) {
  const [queue, setQueue] = useState<Step[]>(steps)
  const [index, setIndex] = useState(0)
  const attempted = useRef(new Set<string>())
  const firstResults = useRef<Record<string, Result>>({})
  const correctAnswers = useRef(0)
  const firstTryCorrect = useRef(0)
  const exerciseCount = steps.filter((s) => s.type === 'exercise').length

  const step = queue[index]

  const advance = () => {
    if (index + 1 >= queue.length) {
      onFinish(
        { firstResults: firstResults.current, correctAnswers: correctAnswers.current },
        { firstTryCorrect: firstTryCorrect.current, exerciseCount },
      )
    } else {
      setIndex(index + 1)
    }
  }

  const onAnswer = (r: Result) => {
    if (step.type !== 'exercise') return
    const ex = step.exercise
    if (r !== 'wrong') correctAnswers.current++
    if (!attempted.current.has(ex.id)) {
      attempted.current.add(ex.id)
      if (r !== 'wrong') firstTryCorrect.current++
      // Keep the worst first-attempt result for each item.
      const prev = firstResults.current[ex.item.id]
      if (!prev || severity[r] > severity[prev]) firstResults.current[ex.item.id] = r
    }
    if (r === 'wrong' && requeueWrong) setQueue((q) => [...q, step])
  }

  const pct = Math.round((index / queue.length) * 100)

  return (
    <main className="screen session">
      <header className="session-top">
        <button className="icon-btn" aria-label="Quit" onClick={onExit}>
          ✕
        </button>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </header>
      {step.type === 'new' ? (
        <NewWordCard key={`new-${step.item.id}`} course={course} item={step.item} hasVoice={hasVoice} onNext={advance} />
      ) : (
        <ExerciseView
          key={`${step.exercise.id}-${index}`}
          course={course}
          exercise={step.exercise}
          hasVoice={hasVoice}
          sound={sound}
          onAnswer={onAnswer}
          onNext={advance}
        />
      )}
    </main>
  )
}
