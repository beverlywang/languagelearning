# Letters

Translate Italian letters, keep them, and review the words later.

The translation itself is the least interesting part — a machine translation
already gives you the gist. What this does instead is show you *how* the Italian
works and flag what a literal reading would flatten:

- a natural English translation that keeps the writer's tone
- a word-for-word rendering that exposes Italian word order
- vocabulary worth learning, in the specific sense used
- idioms, regional usage, and cultural references
- a short reply in Italian you could adapt and send

Everything is saved locally so you can come back to it, and any Italian text on
the page can be read aloud.

## Setup

```bash
cp .env.example .env.local   # then paste your Anthropic API key
npm install
npm run dev                  # http://localhost:3000
```

## How it works

| Concern | Choice |
|---|---|
| Translation | Claude (`claude-opus-5`) with structured outputs, so the response arrives as validated JSON rather than prose to parse |
| Storage | SQLite via Node's built-in `node:sqlite` — no native build step, no dependency |
| Audio | The browser's `speechSynthesis` API — free, offline, no key |

```
app/
  page.tsx              paste Italian, see the breakdown
  saved/page.tsx        everything you've translated
  review/page.tsx       flashcards for words due
  api/translate/        Claude call + save
  api/entries/          list, delete
  api/vocab/            due words, mark reviewed
components/
  EntryView.tsx         renders one translated letter
  SpeakButton.tsx       text-to-speech playback
lib/
  db.ts                 schema and queries
  translation-schema.ts the shape Claude must return
```

Data lives in `letters.db` in the project root, which is gitignored. Delete the
file to start over; the schema recreates itself on next run.

## Cost

A letter is roughly 500 tokens in and 900 out — about half a cent at Opus 5
pricing ($5/$25 per million tokens). Translating a letter a week costs well
under a dollar a year.

## Known limits

- **Audio is playback-only.** `speechSynthesis` can't be saved to a file, so
  there's nothing to download or listen to offline. Adding real audio files
  means calling a TTS API and storing the result alongside the entry — replace
  `SpeakButton` and add a column.
- **Italian voice quality depends on your OS.** macOS ships good ones. If none
  is installed the button still works but uses a default voice; install one in
  System Settings → Accessibility → Spoken Content.
- **`node:sqlite` prints an experimental warning** on startup. It's stable
  enough in Node 24 for a single-user local app, but it is the reason you'll see
  that line in the console.
- **Review is a fixed 7-day interval**, not real spaced repetition. Widening the
  interval as `review_count` grows is a few lines in `vocabDue()`.
- **Single user, no auth.** It assumes it's running on your machine.

## Possible next steps

- Speaking Italian as input, via the browser's `SpeechRecognition` API (Chrome
  only, and flaky — worth knowing before you start)
- Photo of a handwritten letter → text, using Claude's vision support
- Export vocabulary to Anki
