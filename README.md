# Mabuhei

Mabuhei is a small Duolingo-style web app for practising Norwegian and Tagalog at home. It teaches short lessons, schedules reviews with spaced repetition (FSRS), and suggests a few real phrases each evening to try out with Glenn. Everything is stored in your browser (no accounts, no server), and it can be installed on a phone like an app and used offline.

## Run locally

```sh
npm install
npm run dev        # development server
npm test           # unit tests
npm run build      # type-check + production build into dist/
npx vite preview   # try the production build locally
```

## Deploy to Cloudflare Pages

Create a Pages project from this repository with:

- Build command: `npm run build`
- Build output directory: `dist`

## Adding words

Courses live in `src/content/no.ts` (Norwegian) and `src/content/tl.ts` (Tagalog). Add new items to the `items` array (and new phrases to `phrases`), following the shape in `src/content/types.ts`.

**Never change an existing item's `id`**: review history is saved against it, so changing an id makes that word look brand new. You can freely fix spelling, English text or notes. New units unlock automatically once the previous unit is 80% introduced.

## Notes

- Spoken audio uses the browser's built-in speech voices. If your device has no Norwegian or Filipino voice, the speaker buttons and "listen" exercises are hidden.
- Progress is saved under the `mabuhei:v1` key in `localStorage`, separately per language.
- Icons: `public/icon.svg`; PNGs can be regenerated with `node scripts/make-icons.mjs` (needs Playwright).
