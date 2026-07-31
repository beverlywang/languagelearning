/**
 * MyMemory translation client.
 *
 * Chosen because it needs no signup, no key, and no card. The cost of that is a
 * hard 500-character limit per request, so anything longer than a postcard has
 * to be split, translated in pieces, and stitched back together.
 *
 * Quota is per day per IP: roughly 5,000 words anonymously, or 50,000 if you
 * set MYMEMORY_EMAIL. The email is sent as an identifier, not verified.
 */

const ENDPOINT = "https://api.mymemory.translated.net/get";

// Below the API's 500 so punctuation and encoding overhead cannot push a chunk over.
const CHUNK_LIMIT = 450;

export class TranslationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TranslationError";
  }
}

/**
 * Split a paragraph into pieces under the limit, preferring sentence breaks so
 * the translator sees complete thoughts. A sentence longer than the limit is
 * split on spaces as a last resort.
 */
function chunkParagraph(paragraph: string): string[] {
  if (paragraph.length <= CHUNK_LIMIT) return [paragraph];

  const sentences = paragraph.split(/(?<=[.!?…])\s+/);
  const chunks: string[] = [];
  let current = "";

  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const sentence of sentences) {
    if (sentence.length > CHUNK_LIMIT) {
      push();
      let words = "";
      for (const word of sentence.split(/\s+/)) {
        if ((words + " " + word).trim().length > CHUNK_LIMIT) {
          if (words.trim()) chunks.push(words.trim());
          words = word;
        } else {
          words = (words + " " + word).trim();
        }
      }
      if (words.trim()) chunks.push(words.trim());
      continue;
    }

    if ((current + " " + sentence).trim().length > CHUNK_LIMIT) push();
    current = (current + " " + sentence).trim();
  }
  push();
  return chunks;
}

async function translateChunk(text: string, langpair: string): Promise<string> {
  const params = new URLSearchParams({ q: text, langpair });
  const email = process.env.MYMEMORY_EMAIL?.trim();
  if (email && !email.startsWith("you@")) params.set("de", email);

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?${params}`, {
      headers: { accept: "application/json" },
    });
  } catch {
    throw new TranslationError("Could not reach the translation service.", 503);
  }

  if (!response.ok) {
    throw new TranslationError(
      `Translation service returned ${response.status}.`,
      response.status === 429 ? 429 : 502,
    );
  }

  const data = (await response.json()) as {
    responseStatus?: number | string;
    responseDetails?: string;
    responseData?: { translatedText?: string };
  };

  const status = Number(data.responseStatus);
  if (status !== 200) {
    const detail = (data.responseDetails ?? "").toUpperCase();
    if (detail.includes("QUOTA")) {
      throw new TranslationError(
        "Daily free quota used up. It resets tomorrow — set MYMEMORY_EMAIL in .env.local to raise the limit tenfold.",
        429,
      );
    }
    throw new TranslationError(
      data.responseDetails || "The translation service rejected the request.",
      502,
    );
  }

  const translated = data.responseData?.translatedText;
  if (!translated) throw new TranslationError("No translation came back.", 502);

  // MyMemory echoes its own error strings in the success field on some failures.
  if (/^(QUERY LENGTH LIMIT|INVALID|MYMEMORY WARNING)/i.test(translated)) {
    throw new TranslationError(translated, 502);
  }

  return translated;
}

/**
 * Chunking means the engine sometimes sees a fragment rather than a full
 * sentence, and it returns a lowercase "i" for the English pronoun. A standalone
 * lowercase "i" is never correct in English, so it is safe to repair.
 */
function tidyEnglish(text: string): string {
  return text.replace(/\bi\b(?=\s|$|['’])/g, "I");
}

export async function translate(
  text: string,
  { source = "it", target = process.env.TARGET_LANG ?? "en" } = {},
): Promise<string> {
  const langpair = `${source}|${target}`;

  // Paragraphs are translated separately so the letter keeps its shape.
  const paragraphs = text.trim().split(/\n\s*\n/);
  const out: string[] = [];

  for (const paragraph of paragraphs) {
    const chunks = chunkParagraph(paragraph.trim());
    const translated: string[] = [];
    for (const chunk of chunks) {
      translated.push(await translateChunk(chunk, langpair));
    }
    out.push(translated.join(" "));
  }

  const joined = out.join("\n\n");
  return target.toLowerCase().startsWith("en") ? tidyEnglish(joined) : joined;
}

export const __test = { chunkParagraph, CHUNK_LIMIT };
