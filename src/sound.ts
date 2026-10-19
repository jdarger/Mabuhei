let ctx: AudioContext | null = null

function blip(freqs: number[], dur: number, type: OscillatorType) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    const t0 = ctx.currentTime
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.type = type
      o.frequency.value = f
      const start = t0 + i * dur
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(0.15, start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      o.connect(g).connect(ctx!.destination)
      o.start(start)
      o.stop(start + dur + 0.02)
    })
  } catch {
    /* sound is optional */
  }
}

export const playCorrect = () => blip([660, 880], 0.11, 'sine')
export const playWrong = () => blip([220, 165], 0.16, 'triangle')
