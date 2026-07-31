import { NextResponse } from "next/server";
import { deleteEntry, listEntries } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listEntries());
}

export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  deleteEntry(id);
  return NextResponse.json({ ok: true });
}
