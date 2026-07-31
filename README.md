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
npm install
npm run dev   # http://localhost:3000
```

No API key, no signup, no card. Translation goes through
[MyMemory](https://mymemory.translated.net), which is free to call anonymously.

The free quota is roughly 5,000 words per day per IP address — far more than a
correspondence needs. Setting `MYMEMORY_EMAIL` in `.env.local` raises it to
about 50,000; the address is sent as an identifier and is not verified.

## How it works

| Concern | Choice |
|---|---|
| Translation | MyMemory — free, anonymous, 500 characters per request |
| Storage | SQLite via Node's built-in `node:sqlite` — no native build step |
| Audio | The browser's `speechSynthesis` API — free, offline, no key |
| Vocabulary | Entered by hand while reading |

```
app/
  page.tsx              paste Italian, get English, save both
  saved/page.tsx        every letter, with its word list
  review/page.tsx       flashcards for words due
  api/translate/        chunk, translate, save
  api/entries/          list, delete
  api/vocab/            add, remove, list due, mark reviewed
components/
  EntryView.tsx         one letter, plus its vocabulary editor
  SpeakButton.tsx       text-to-speech playback
lib/
  db.ts                 schema and queries
  mymemory.ts           translation client and chunker
```

Data lives in `letters.db` in the project root, which is gitignored. Delete the
file to start over; the schema recreates itself on next run.

## Known limits

- **Translation only, and it is the weakest engine of the free options.**
  MyMemory handles everyday prose well but takes idioms literally — *del più e
  del meno* ("about this and that") came back as "about the plus and minus" in
  testing. It cannot tell you why a phrase is idiomatic, which words are worth
  learning, or how the register differs from what you would say. That is the
  price of needing no account; see *Going further* below.
- **Letters are split into 500-character chunks.** That is MyMemory's per-request
  limit. Splitting happens at sentence boundaries and paragraphs are preserved,
  but the engine occasionally sees a fragment without its surrounding context,
  which costs a little accuracy on long sentences.
- **Editing `lib/db.ts` can break the dev server** with `Failed to load external
  module node:sqlite`. It is a Turbopack hot-reload quirk, not a code fault —
  restart `npm run dev` and it clears.
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

Two upgrades are worth knowing about, in order of effort:

**Better translations, still free.** DeepL API Free is noticeably stronger on
Italian and allows 500,000 characters a month with no 500-character request
limit, so the chunking could go away. It needs a signup and a card for
verification, though the free tier is not charged.

**The parts no translation engine can do.** A second button that sends one
letter to a language model would give the word-for-word structure, the idioms,
the register, and a suggested reply, while MyMemory keeps handling everyday
translation for free. At roughly half a cent per letter that is under a dollar
a year.

Others worth considering:

- Photo of a handwritten letter → text, via a vision model
- Speaking Italian as input, via the browser's `SpeechRecognition` API
  (Chrome only, and unreliable — worth knowing before starting)
- Export the vocabulary deck to Anki
