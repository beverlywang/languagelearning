import { NextResponse } from "next/server";
import { markReviewed, vocabDue } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(vocabDue());
}

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
