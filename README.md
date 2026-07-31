# Letters

Translate Italian letters, keep them, and review the words later.

Built around a pen pal correspondence: paste what arrived, get it in English,
and keep both halves so you can come back to them. Any Italian on the page can
be read aloud.

Words are added by you, not extracted automatically — as you read a letter you
add the ones you had to look up, and they go into a flashcard deck that brings
them back a week later.

## Setup

```bash
cp .env.example .env.local   # then paste your DeepL key
npm install
npm run dev                  # http://localhost:3000
```

The key is free: sign up for **DeepL API Free** at
[deepl.com/pro-api](https://www.deepl.com/pro-api). It allows roughly 500,000
characters a month, which is far more letters than anyone writes. A card is
required for verification but the free tier is not charged.

## How it works

| Concern | Choice |
|---|---|
| Translation | DeepL API Free — noticeably better than Google on Italian |
| Storage | SQLite via Node's built-in `node:sqlite` — no native build step |
| Audio | The browser's `speechSynthesis` API — free, offline, no key |
| Vocabulary | Entered by hand while reading |

```
app/
  page.tsx              paste Italian, get English, save both
  saved/page.tsx        every letter, with its word list
  review/page.tsx       flashcards for words due
  api/translate/        DeepL call + save
  api/entries/          list, delete
  api/vocab/            add, remove, list due, mark reviewed
components/
  EntryView.tsx         one letter, plus its vocabulary editor
  SpeakButton.tsx       text-to-speech playback
lib/
  db.ts                 schema and queries
  deepl.ts              DeepL client
```

Data lives in `letters.db` in the project root, which is gitignored. Delete the
file to start over; the schema recreates itself on next run.

## Known limits

- **Translation only.** DeepL returns prose. It cannot tell you why a phrase is
  idiomatic, which words are worth learning, or how the register differs from
  what you would say — that needs a language model. This was a deliberate
  tradeoff to keep the app free; see *Going further* below.
- **Audio is playback-only.** `speechSynthesis` cannot be saved to a file, so
  there is nothing to download or play offline. Real audio files mean a TTS API
  and a new column; the swap is isolated to `SpeakButton`.
- **Italian voice quality depends on your OS.** macOS ships good ones. If none
  is installed the button still works but falls back to a default voice — add
  one under System Settings → Accessibility → Spoken Content.
- **`node:sqlite` prints an experimental warning** on startup. Stable enough in
  Node 24 for a single-user local app, but that is why the line appears.
- **Review is a fixed 7-day interval**, not real spaced repetition. Widening the
  interval as `review_count` grows is a few lines in `vocabDue()`.
- **Single user, no auth.** It assumes it is running on your machine.

## Going further

The obvious upgrade is a second button that sends one letter to a language
model for the full breakdown — word-for-word structure, idioms, register, a
suggested reply — while DeepL keeps handling everyday translation for free.
At roughly half a cent per letter it would cost under a dollar a year.

Others worth considering:

- Photo of a handwritten letter → text, via a vision model
- Speaking Italian as input, via the browser's `SpeechRecognition` API
  (Chrome only, and unreliable — worth knowing before starting)
- Export the vocabulary deck to Anki
