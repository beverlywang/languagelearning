"use client";

import { useEffect, useState } from "react";
import EntryView from "@/components/EntryView";
import type { Entry } from "@/lib/db";

export default function SavedPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/entries")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  async function remove(id: number) {
    await fetch(`/api/entries?id=${id}`, { method: "DELETE" });
    setEntries((current) => current?.filter((e) => e.id !== id) ?? null);
    if (openId === id) setOpenId(null);
  }

  if (entries === null) return <p className="muted">Loading...</p>;

  if (entries.length === 0) {
    return (
      <p className="muted">
        Nothing saved yet. Translate a letter and it will show up here.
      </p>
    );
  }

  return (
    <main>
      {entries.map((entry) => {
        const open = openId === entry.id;
        return (
          <article key={entry.id} className="card">
            <div className="cardHead">
              <div>
                <h2>
                  {new Date(entry.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <p className="prose" style={{ fontSize: "1rem" }}>
                  {entry.title}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  className="ghost"
                  onClick={() => setOpenId(open ? null : entry.id)}
                >
                  {open ? "Collapse" : "Open"}
                </button>
                <button className="ghost" onClick={() => remove(entry.id)}>
                  Delete
                </button>
              </div>
            </div>

            {open && (
              <div style={{ marginTop: "1.5rem" }}>
                <EntryView entry={entry} />
              </div>
            )}
          </article>
        );
      })}
    </main>
  );
}
