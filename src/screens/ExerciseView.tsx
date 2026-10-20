import { useEffect, useRef, useState } from 'react'
import type { Course } from '../content/types'
import type { Exercise } from '../lesson/exercises'
import { checkAnswer } from '../lesson/check'
import type { Result } from '../srs/fsrs'
import { speak } from '../speech'
import { playCorrect, playWrong } from '../sound'
import Keyboard from './Keyboard'

interface Props {
  course: Course
  exercise: Exercise
  hasVoice: boolean
  sound: boolean
  onAnswer: (r: Result) => void
  onNext: () => void
}

const PROMPTS = {
  meaning: 'What does this mean?',
  translation: 'How do you say this?',
  type: 'Type it in',
  listen: 'What do you hear?',
} as const

export default function ExerciseView({ course, exercise, hasVoice, sound, onAnswer, onNext }: Props) {
  const { kind, item, options, answer } = exercise
  const [picked, setPicked] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const say = () => speak(item.target, course.ttsLang)

  // Auto-play audio for exercises that show/hear the target.
  useEffect(() => {
    if (kind === 'meaning' || kind === 'listen') speak(item.target, course.ttsLang)
    // inputMode="none" keeps the system keyboard away; focus just shows the caret.
    // Skip it on touch screens so iOS never flashes its own keyboard.
    const touch = window.matchMedia?.('(pointer: coarse)').matches
    if (kind === 'type' && !touch) inputRef.current?.focus({ preventScroll: true })
  }, [kind, item.target, course.ttsLang])

  const finish = (r: Result) => {
    setResult(r)
    if (sound) (r === 'wrong' ? playWrong : playCorrect)()
    onAnswer(r)
  }

  const check = () => {
    if (result) return
    if (kind === 'type') finish(checkAnswer(typed, item))
    else if (picked !== null) finish(picked === answer ? 'correct' : 'wrong')
  }

  const canCheck = kind === 'type' ? typed.trim() !== '' : picked !== null

  return (
    <>
      <div className="session-body">
        <h2 className="prompt">
          {PROMPTS[kind]}
          {kind === 'type' ? ` ${course.name}` : ''}
        </h2>

        {kind === 'meaning' && (
          <div className="big-word">
            <span>{item.target}</span>
            {hasVoice && <SpeakerButton onClick={say} label={`Play ${item.target}`} />}
          </div>
        )}
        {kind === 'listen' && (
          <div className="big-word">
            <SpeakerButton onClick={say} label="Play audio" large />
          </div>
        )}
        {(kind === 'translation' || kind === 'type') && (
          <div className="big-word">
            <span>{item.english}</span>
          </div>
        )}

        {options && (
          <div className="options" role="radiogroup">
            {options.map((opt) => {
              const cls = ['option']
              if (picked === opt) cls.push('picked')
              if (result && opt === answer) cls.push('right')
              if (result && picked === opt && opt !== answer) cls.push('wrong')
              return (
                <button
                  key={opt}
                  role="radio"
                  aria-checked={picked === opt}
                  className={cls.join(' ')}
                  disabled={!!result}
                  onClick={() => setPicked(opt)}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {kind === 'type' && (
          <div className="type-area">
            <input
              ref={inputRef}
              className={`text-input ${result ? (result === 'wrong' ? 'wrong' : 'right') : ''}`}
              value={typed}
              disabled={!!result}
              placeholder={`Type in ${course.name}`}
              inputMode="none"
              enterKeyHint="done"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !result && canCheck) {
                  e.preventDefault()
                  e.stopPropagation()
                  check()
                }
              }}
            />
            {!result && (
              <button type="button" className="btn btn-ghost idk" onClick={() => finish('wrong')}>
                I don&apos;t know
              </button>
            )}
          </div>
        )}
      </div>

      <footer className={`feedback ${result ? (result === 'wrong' ? 'bad' : result === 'almost' ? 'meh' : 'good') : ''}`}>
        {!result ? (
          kind === 'type' ? (
            <Keyboard
              lang={course.lang}
              canCheck={canCheck}
              onKey={(c) => setTyped((t) => t + c)}
              onBackspace={() => setTyped((t) => t.slice(0, -1))}
              onCheck={check}
            />
          ) : (
            <div className="footer-row">
              <button className="btn btn-primary" disabled={!canCheck} onClick={check}>
                Check
              </button>
            </div>
          )
        ) : (
          <>
            <div className="feedback-msg" role="status">
              {result === 'correct' && <strong>✅ Correct!</strong>}
              {result === 'almost' && (
                <>
                  <strong>👍 Almost — watch the spelling:</strong>
                  <span>{item.target}</span>
                </>
              )}
              {result === 'wrong' && (
                <>
                  <strong>❌ Not quite</strong>
                  <span>Correct answer: {answer}</span>
                </>
              )}
            </div>
            <button className="btn btn-next" onClick={onNext} autoFocus>
              Continue
            </button>
          </>
        )}
      </footer>
    </>
  )
}

function SpeakerButton({ onClick, label, large }: { onClick: () => void; label: string; large?: boolean }) {
  return (
    <button className={large ? 'speaker large' : 'speaker'} aria-label={label} onClick={onClick}>
      🔊
    </button>
  )
}
