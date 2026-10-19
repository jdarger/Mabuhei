import { useState } from 'react'
import { COURSES } from './courses'
import { useStore } from './state/useStore'
import { useHasVoice } from './speech'
import Home from './screens/Home'
import Lesson from './screens/Lesson'
import Review from './screens/Review'
import Phrases from './screens/Phrases'
import Settings from './screens/Settings'

export type Screen = { name: 'home' } | { name: 'lesson'; unitId?: string } | { name: 'review' } | { name: 'phrases' } | { name: 'settings' }

export default function App() {
  const store = useStore()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const { state } = store
  const course = COURSES[state.lang]
  const ls = state.langs[state.lang]
  const hasVoice = useHasVoice(course.ttsLang)
  const home = () => setScreen({ name: 'home' })

  // key={lang} remounts screens when switching language so no state leaks across courses.
  const common = { course, ls, hasVoice, sound: state.sound, onExit: home }
  switch (screen.name) {
    case 'lesson':
      return <Lesson key={state.lang} {...common} unitId={screen.unitId} onComplete={(n, o) => store.completeLesson(state.lang, n, o)} />
    case 'review':
      return <Review key={state.lang} {...common} onComplete={(o) => store.completeReview(state.lang, o)} />
    case 'phrases':
      return <Phrases key={state.lang} {...common} onToggle={(id, used) => store.togglePhrase(state.lang, id, used)} />
    case 'settings':
      return (
        <Settings
          course={course}
          sound={state.sound}
          onSound={store.setSound}
          onReset={() => store.reset(state.lang)}
          onExit={home}
        />
      )
    default:
      return <Home key={state.lang} course={course} ls={ls} hasVoice={hasVoice} onLang={store.setLang} onNav={setScreen} />
  }
}
