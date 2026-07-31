"use client";

import { useEffect, useState } from "react";
import SpeakButton from "@/components/SpeakButton";
import type { VocabRow } from "@/lib/db";

export default function ReviewPage() {
  const [queue, setQueue] = useState<VocabRow[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetch("/api/vocab")
      .then((r) => r.json())
      .then(setQueue)
      .catch(() => setQueue([]));
  }, []);

  if (queue === null) return <p className="muted">Loading...</p>;

  if (queue.length === 0) {
    return (
      <p className="muted">
        Nothing due for review. Words come back around a week after you last saw
        them.
      </p>
    );
  }

  if (index >= queue.length) {
    return (
      <p className="muted">
        Done — {queue.length} {queue.length === 1 ? "word" : "words"} reviewed.
      </p>
    );
  }

  const card = queue[index];

  async function next() {
    await fetch("/api/vocab", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: card.id }),
    });
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <main>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        {index + 1} of {queue.length}
      </p>

      <section className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <p
          className="prose"
          style={{ fontSize: "1.9rem", color: "var(--accent)", marginBottom: "1rem" }}
        >
          {card.term}
        </p>

        <SpeakButton text={card.term} lang="it-IT" label="Hear it" />

        {revealed ? (
          <div style={{ marginTop: "2rem" }}>
            <p className="prose" style={{ fontSize: "1.2rem" }}>
              {card.translation}
            </p>
            {card.note && (
              <p className="muted" style={{ marginTop: "0.75rem" }}>
                {card.note}
              </p>
            )}
            <p style={{ marginTop: "2rem" }}>
              <button className="primary" onClick={next}>
                Next
              </button>
            </p>
          </div>
        ) : (
          <p style={{ marginTop: "2rem" }}>
            <button className="primary" onClick={() => setRevealed(true)}>
              Show meaning
            </button>
          </p>
        )}
      </section>
    </main>
  );
}
