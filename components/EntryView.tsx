"use client";

import type { Entry } from "@/lib/db";
import SpeakButton from "./SpeakButton";

export default function EntryView({ entry }: { entry: Entry }) {
  return (
    <>
      <section className="card">
        <div className="cardHead">
          <h2>Original</h2>
          <SpeakButton text={entry.source_text} lang="it-IT" />
        </div>
        <p className="prose">{entry.source_text}</p>
      </section>

      <section className="card">
        <div className="cardHead">
          <h2>Translation</h2>
          <SpeakButton text={entry.natural} lang="en-US" />
        </div>
        <p className="prose">{entry.natural}</p>
      </section>

      <section className="card">
        <h2>Word for word</h2>
        <p className="literal">{entry.literal}</p>
      </section>

      {entry.vocab.length > 0 && (
        <section className="card">
          <h2>Worth learning</h2>
          <ul className="vocabList">
            {entry.vocab.map((v) => (
              <li key={v.id}>
                <span className="term">{v.term}</span>
                <span>{v.translation}</span>
                {v.note && <span className="vocabNote">{v.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {entry.notes.length > 0 && (
        <section className="card">
          <h2>What a machine translation misses</h2>
          <ul className="notes">
            {entry.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {entry.suggested_reply && (
        <section className="card">
          <div className="cardHead">
            <h2>A reply you could send</h2>
            <SpeakButton text={entry.suggested_reply} lang="it-IT" />
          </div>
          <p className="prose">{entry.suggested_reply}</p>
        </section>
      )}
    </>
  );
}
