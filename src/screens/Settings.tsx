import { useState } from 'react'
import type { Course } from '../content/types'

interface Props {
  course: Course
  sound: boolean
  onSound: (on: boolean) => void
  onReset: () => void
  onExit: () => void
}

export default function Settings({ course, sound, onSound, onReset, onExit }: Props) {
  const [confirming, setConfirming] = useState(false)
  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Back" onClick={onExit}>
          ←
        </button>
        <h1 className="title">Settings</h1>
        <span className="icon-btn" aria-hidden />
      </header>

      <label className="row">
        <span>Sound effects</span>
        <input type="checkbox" className="switch" checked={sound} onChange={(e) => onSound(e.target.checked)} />
      </label>

      <div className="card danger-zone">
        <h2>
          Reset {course.flag} {course.name} progress
        </h2>
        <p>Clears words learned, XP, streak and phrases used for this language only.</p>
        {!confirming ? (
          <button className="btn btn-red-outline" onClick={() => setConfirming(true)}>
            Reset progress…
          </button>
        ) : (
          <div className="confirm">
            <p>
              <strong>Really erase all {course.name} progress?</strong> This can&apos;t be undone.
            </p>
            <button
              className="btn btn-red"
              onClick={() => {
                onReset()
                setConfirming(false)
                onExit()
              }}
            >
              Yes, reset
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
