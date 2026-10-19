import type { SessionStats } from './Session'

interface Props {
  title: string
  xp: number
  stats: SessionStats
  streak: number
  onDone: () => void
}

export default function Results({ title, xp, stats, streak, onDone }: Props) {
  const accuracy = stats.exerciseCount ? Math.round((stats.firstTryCorrect / stats.exerciseCount) * 100) : 100
  return (
    <main className="screen results">
      <div className="session-body center">
        <div className="trophy">🎉</div>
        <h1>{title}</h1>
        <div className="result-grid">
          <div className="result-card xp">
            <span>Total XP</span>
            <strong>⚡ {xp}</strong>
          </div>
          <div className="result-card acc">
            <span>Accuracy</span>
            <strong>🎯 {accuracy}%</strong>
          </div>
          <div className="result-card streak">
            <span>Streak</span>
            <strong>🔥 {streak}</strong>
          </div>
        </div>
        <p className="muted">{streak === 1 ? 'Day 1 — nice start!' : `${streak} days in a row. Keep it going!`}</p>
      </div>
      <footer className="feedback">
        <button className="btn btn-primary" onClick={onDone}>
          Continue
        </button>
      </footer>
    </main>
  )
}
