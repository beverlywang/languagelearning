"use client";

import { useState } from "react";
import type { Entry, VocabRow } from "@/lib/db";
import SpeakButton from "./SpeakButton";

export default function EntryView({ entry }: { entry: Entry }) {
  const [vocab, setVocab] = useState<VocabRow[]>(entry.vocab);
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/vocab", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entry_id: entry.id,
          term,
          translation: meaning,
          note,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save that word.");
        return;
      }
      setVocab((current) => [...current, data as VocabRow]);
      setTerm("");
      setMeaning("");
      setNote("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/vocab?id=${id}`, { method: "DELETE" });
    setVocab((current) => current.filter((v) => v.id !== id));
  }

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
          <SpeakButton text={entry.translation} lang="en-US" />
        </div>
        <p className="prose">{entry.translation}</p>
      </section>

      <section className="card">
        <h2>Words to remember</h2>

        {vocab.length > 0 ? (
          <ul className="vocabList">
            {vocab.map((v) => (
              <li key={v.id}>
                <span className="term">{v.term}</span>
                <span>
                  {v.translation}
                  <button
                    className="linkish"
                    onClick={() => remove(v.id)}
                    aria-label={`Remove ${v.term}`}
                  >
                    remove
                  </button>
                </span>
                {v.note && <span className="vocabNote">{v.note}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            Nothing yet. Add the words you had to look up — they go into the
            review deck.
          </p>
        )}

        {error && <p className="error" style={{ marginTop: "1rem" }}>{error}</p>}

        <form onSubmit={add} className="vocabForm">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Italian"
            aria-label="Italian word or phrase"
          />
          <input
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="What it means"
            aria-label="Meaning in English"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            aria-label="Optional note"
          />
          <button
            type="submit"
            className="ghost"
            disabled={saving || !term.trim() || !meaning.trim()}
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </form>
      </section>
    </>
  );
}
