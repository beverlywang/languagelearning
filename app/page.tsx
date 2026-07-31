"use client";

import { useState } from "react";
import EntryView from "@/components/EntryView";
import type { Entry } from "@/lib/db";

export default function TranslatePage() {
  const [text, setText] = useState("");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function translate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setEntry(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setEntry(data as Entry);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      {error && <p className="error">{error}</p>}

      <form onSubmit={translate}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the Italian here..."
          spellCheck={false}
        />
        <p style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="submit"
            className="primary"
            disabled={pending || text.trim().length === 0}
          >
            {pending ? "Translating..." : "Translate & save"}
          </button>
          {pending && (
            <span className="muted">
              Reading it properly takes a few seconds.
            </span>
          )}
        </p>
      </form>

      {entry && (
        <div style={{ marginTop: "2rem" }}>
          <EntryView entry={entry} />
        </div>
      )}
    </main>
  );
}
