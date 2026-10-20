// Generates pre-recorded audio clips for a course via ElevenLabs on OpenRouter.
// Usage: node scripts/make-audio.mjs tl   (needs ffmpeg; uses OPENROUTER_API_KEY if set)
// Existing clips are kept, so re-running only records new words.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const VOICES = {
  tl: { model: 'elevenlabs/eleven-multilingual-v2', voice: 'nPczCjzI2devNBz1zQrb' },
  no: { model: 'elevenlabs/eleven-multilingual-v2', voice: 'nPczCjzI2devNBz1zQrb' },
}

const lang = process.argv[2]
const cfg = VOICES[lang]
if (!cfg) throw new Error(`No voice configured for "${lang}"`)
const { course } = await import(`../src/content/${lang}.ts`)
const dir = `public/audio/${lang}`
mkdirSync(dir, { recursive: true })

async function record(text, file) {
  const headers = { 'Content-Type': 'application/json' }
  if (process.env.OPENROUTER_API_KEY) headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY}`
  for (let attempt = 1; ; attempt++) {
    const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST', headers, body: JSON.stringify({ model: cfg.model, voice: cfg.voice, input: text }),
    })
    if (res.ok) {
      const pcm = Buffer.from(await res.arrayBuffer())
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0', '-b:a', '48k', file], { input: pcm })
      return
    }
    if (attempt >= 3) throw new Error(`${res.status} for "${text}": ${await res.text()}`)
    await new Promise((r) => setTimeout(r, 2000 * attempt))
  }
}

const entries = [...course.items, ...course.phrases].map((x) => ({ text: x.target, file: `${dir}/${x.id}.mp3`, url: `audio/${lang}/${x.id}.mp3` }))
const todo = entries.filter((e) => !existsSync(e.file))
let next = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < todo.length) {
    const e = todo[next++]
    await record(e.text, e.file)
    console.log('recorded', e.file)
  }
}))

const map = Object.fromEntries(entries.map((e) => [e.text, e.url]))
writeFileSync(`src/content/${lang}-audio.json`, JSON.stringify(map, null, 2) + '\n')
console.log(`${todo.length} new clips, ${entries.length} total`)
