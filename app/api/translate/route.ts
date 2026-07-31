import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { saveEntry } from "@/lib/db";
import { TranslationSchema } from "@/lib/translation-schema";

export const runtime = "nodejs";

const SYSTEM = `You translate Italian correspondence for an English speaker who is
learning the language by reading letters from a friend.

A machine translation already gives them the gist. Your job is the part it cannot do:
show how the Italian actually works, and flag what would otherwise be lost.

- The natural translation should read like something a person wrote, not like output.
  Preserve the writer's tone, warmth, and register - if they are being teasing or
  formal or affectionate, that has to survive.
- The literal rendering exists to expose Italian word order and structure. Awkward
  English is correct here; do not smooth it out.
- Choose vocabulary the reader will plausibly meet again. Skip cognates and anything
  an English speaker can already guess.
- Notes are for idioms, regional usage, cultural references, and tonal choices that a
  literal reading would flatten. Say what the phrase actually does, not just what it
  means.
- The suggested reply should be short and in the same register as the original -
  something they could send with minor edits.`;

const client = new Anthropic();

export async function POST(request: Request) {
  let text: string;
  try {
    ({ text } = await request.json());
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "No text to translate." }, { status: 400 });
  }

  // Checked up front because the SDK surfaces a missing key as a generic
  // "could not resolve authentication method" error, which is not actionable.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "No API key found. Copy .env.example to .env.local, add your Anthropic key, and restart the dev server.",
      },
      { status: 401 },
    );
  }

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
      output_config: {
        effort: "medium",
        format: zodOutputFormat(TranslationSchema),
      },
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The model declined to translate this text." },
        { status: 422 },
      );
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      return NextResponse.json(
        { error: "The model returned a response that did not match the schema." },
        { status: 502 },
      );
    }

    return NextResponse.json(saveEntry(text, parsed));
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is missing or invalid." },
        { status: 401 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited. Wait a moment and try again." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error (${error.status}): ${error.message}` },
        { status: 502 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}
