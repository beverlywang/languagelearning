import { NextResponse } from "next/server";
import { saveEntry } from "@/lib/db";
import { TranslationError, translate } from "@/lib/mymemory";

export const runtime = "nodejs";

// A long letter is split into 450-character chunks and translated one at a
// time, so allow well past the default serverless window.
export const maxDuration = 120;

export async function POST(request: Request) {
  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "No text to translate." }, { status: 400 });
  }

  try {
    const translation = await translate(text);
    return NextResponse.json(saveEntry(text, translation));
  } catch (error) {
    if (error instanceof TranslationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}
