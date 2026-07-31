import { NextResponse } from "next/server";
import { addVocab, deleteVocab, markReviewed, vocabDue } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(vocabDue());
}

/** Add a word to the review deck. */
export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const entryId = Number(body.entry_id);
  const term = typeof body.term === "string" ? body.term.trim() : "";
  const translation =
    typeof body.translation === "string" ? body.translation.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!Number.isInteger(entryId) || entryId <= 0) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }
  if (!term || !translation) {
    return NextResponse.json(
      { error: "Both the Italian and the meaning are required." },
      { status: 400 },
    );
  }

  return NextResponse.json(addVocab(entryId, term, translation, note));
}

/** Mark a word reviewed. */
export async function POST(request: Request) {
  let id: unknown;
  try {
    ({ id } = await request.json());
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }
  if (!Number.isInteger(id) || (id as number) <= 0) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  markReviewed(id as number);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  deleteVocab(id);
  return NextResponse.json({ ok: true });
}
