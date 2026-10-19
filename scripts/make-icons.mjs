// Renders public/icon.svg to PNG icons. Run: node scripts/make-icons.mjs (needs playwright + chromium)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const svg = readFileSync('public/icon.svg', 'utf8')
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH })
for (const s of [192, 512]) {
  const p = await b.newPage({ viewport: { width: s, height: s } })
  await p.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</body>`)
  await p.screenshot({ path: `public/icon-${s}.png`, omitBackground: true })
}
await b.close()
