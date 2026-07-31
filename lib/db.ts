import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import type { Translation } from "./translation-schema";

// Next.js hot-reloads modules in dev, so the connection is cached on globalThis
// to avoid opening a new handle on every request.
const globalForDb = globalThis as unknown as { __db?: DatabaseSync };

function open(): DatabaseSync {
  const conn = new DatabaseSync(path.join(process.cwd(), "letters.db"));
  conn.exec("PRAGMA foreign_keys = ON");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title           TEXT NOT NULL,
      source_text     TEXT NOT NULL,
      natural         TEXT NOT NULL,
      literal         TEXT NOT NULL,
      notes           TEXT NOT NULL,
      suggested_reply TEXT NOT NULL,
      created_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vocab (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id     INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      term         TEXT NOT NULL,
      translation  TEXT NOT NULL,
      note         TEXT NOT NULL,
      reviewed_at  TEXT,
      review_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS vocab_entry_idx ON vocab(entry_id);
  `);
  return conn;
}

export function db(): DatabaseSync {
  if (!globalForDb.__db) globalForDb.__db = open();
  return globalForDb.__db;
}

export type VocabRow = {
  id: number;
  entry_id: number;
  term: string;
  translation: string;
  note: string;
  reviewed_at: string | null;
  review_count: number;
};

export type EntryRow = {
  id: number;
  title: string;
  source_text: string;
  natural: string;
  literal: string;
  notes: string;
  suggested_reply: string;
  created_at: string;
};

export type Entry = Omit<EntryRow, "notes"> & {
  notes: string[];
  vocab: VocabRow[];
};

function hydrate(row: EntryRow, vocab: VocabRow[]): Entry {
  const { notes, ...rest } = row;
  return { ...rest, notes: JSON.parse(notes) as string[], vocab };
}

export function saveEntry(sourceText: string, t: Translation): Entry {
  const conn = db();
  const title = t.natural.slice(0, 60).replace(/\s+\S*$/, "") || "Untitled";

  const inserted = conn
    .prepare(
      `INSERT INTO entries (title, source_text, natural, literal, notes, suggested_reply, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .get(
      title,
      sourceText,
      t.natural,
      t.literal,
      JSON.stringify(t.notes),
      t.suggestedReply,
      new Date().toISOString(),
    ) as { id: number };

  const addVocab = conn.prepare(
    `INSERT INTO vocab (entry_id, term, translation, note) VALUES (?, ?, ?, ?)`,
  );
  for (const v of t.vocabulary) {
    addVocab.run(inserted.id, v.term, v.translation, v.note);
  }

  return getEntry(inserted.id)!;
}

export function getEntry(id: number): Entry | null {
  const conn = db();
  const row = conn.prepare(`SELECT * FROM entries WHERE id = ?`).get(id) as
    | EntryRow
    | undefined;
  if (!row) return null;
  const vocab = conn
    .prepare(`SELECT * FROM vocab WHERE entry_id = ? ORDER BY id`)
    .all(id) as VocabRow[];
  return hydrate(row, vocab);
}

export function listEntries(): Entry[] {
  const conn = db();
  const rows = conn
    .prepare(`SELECT * FROM entries ORDER BY created_at DESC`)
    .all() as EntryRow[];
  const vocab = conn.prepare(`SELECT * FROM vocab ORDER BY id`).all() as VocabRow[];

  const byEntry = new Map<number, VocabRow[]>();
  for (const v of vocab) {
    const list = byEntry.get(v.entry_id) ?? [];
    list.push(v);
    byEntry.set(v.entry_id, list);
  }
  return rows.map((r) => hydrate(r, byEntry.get(r.id) ?? []));
}

export function deleteEntry(id: number): void {
  db().prepare(`DELETE FROM entries WHERE id = ?`).run(id);
}

/**
 * Words due for review: never reviewed, or last seen more than `days` ago.
 * Deliberately simple - widening the interval as review_count grows is the
 * natural next step if you want real spaced repetition.
 */
export function vocabDue(days = 7, limit = 20): VocabRow[] {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  return db()
    .prepare(
      `SELECT * FROM vocab
       WHERE reviewed_at IS NULL OR reviewed_at < ?
       ORDER BY review_count ASC, id ASC
       LIMIT ?`,
    )
    .all(cutoff, limit) as VocabRow[];
}

export function markReviewed(vocabId: number): void {
  db()
    .prepare(
      `UPDATE vocab SET reviewed_at = ?, review_count = review_count + 1 WHERE id = ?`,
    )
    .run(new Date().toISOString(), vocabId);
}
