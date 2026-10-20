interface Props {
  lang: string
  canCheck: boolean
  onKey: (c: string) => void
  onBackspace: () => void
  onCheck: () => void
}

const ROWS: Record<string, string[][]> = {
  no: [
    [...'qwertyuiop', 'å'],
    [...'asdfghjkl', 'ø', 'æ'],
    [...'zxcvbnm'],
  ],
  tl: [[...'qwertyuiop'], [...'asdfghjkl'], [...'zxcvbnm', 'ñ']],
}

/** On-screen keyboard for Type-it, so the system keyboard never covers the page. */
export default function Keyboard({ lang, canCheck, onKey, onBackspace, onCheck }: Props) {
  const rows = ROWS[lang] ?? ROWS.tl
  // Keep focus (and the caret) in the answer input while tapping keys.
  const keep = (e: React.PointerEvent | React.MouseEvent) => e.preventDefault()

  return (
    <div className="kb" role="group" aria-label="Keyboard" onPointerDown={keep} onMouseDown={keep}>
      {rows.map((row, i) => (
        <div className="kb-row" key={i}>
          {row.map((c) => (
            <button key={c} type="button" className="kb-key" onClick={() => onKey(c)}>
              {c}
            </button>
          ))}
        </div>
      ))}
      <div className="kb-row">
        <button type="button" className="kb-key kb-space" aria-label="Space" onClick={() => onKey(' ')}>
          space
        </button>
        <button type="button" className="kb-key kb-back" aria-label="Backspace" onClick={onBackspace}>
          ⌫
        </button>
        <button type="button" className="kb-key kb-check" disabled={!canCheck} onClick={onCheck}>
          Check
        </button>
      </div>
    </div>
  )
}
