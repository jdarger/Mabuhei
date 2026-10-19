import { useEffect } from 'react'
import type { Course, Item } from '../content/types'
import { speak } from '../speech'

interface Props {
  course: Course
  item: Item
  hasVoice: boolean
  onNext: () => void
}

export default function NewWordCard({ course, item, hasVoice, onNext }: Props) {
  useEffect(() => speak(item.target, course.ttsLang), [item.target, course.ttsLang])
  return (
    <>
      <div className="session-body">
        <p className="badge">✨ New word</p>
        <div className="card new-word">
          <div className="big-word">
            <span>{item.target}</span>
            {hasVoice && (
              <button className="speaker" aria-label={`Play ${item.target}`} onClick={() => speak(item.target, course.ttsLang)}>
                🔊
              </button>
            )}
          </div>
          <p className="new-english">{item.english}</p>
          {item.note && <p className="note">💡 {item.note}</p>}
        </div>
      </div>
      <footer className="feedback">
        <button className="btn btn-primary" onClick={onNext} autoFocus>
          Got it
        </button>
      </footer>
    </>
  )
}
