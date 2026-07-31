/**
 * Minimal DeepL client. Only the one endpoint this app needs, so there is no
 * reason to pull in a dependency.
 *
 * Free keys end in ":fx" and must go to api-free.deepl.com; paid keys go to
 * api.deepl.com. Sending a free key to the paid host fails with a 403 that
 * does not explain itself, so the host is derived from the key.
 */

const FREE_SUFFIX = ":fx";

export class DeepLError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DeepLError";
  }
}

function endpoint(key: string): string {
  const host = key.trim().endsWith(FREE_SUFFIX)
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";
  return `${host}/v2/translate`;
}

export async function translate(
  text: string,
  { source = "IT", target = process.env.DEEPL_TARGET_LANG ?? "EN-GB" }: {
    source?: string;
    target?: string;
  } = {},
): Promise<string> {
  const key = process.env.DEEPL_API_KEY?.trim();
  // The placeholder from .env.example counts as unset - otherwise DeepL 403s and
  // the user is told their key was rejected when they never entered one.
  if (!key || key.startsWith("your-key-here")) {
    throw new DeepLError(
      "No API key yet. Open .env.local, replace the placeholder with your DeepL key, and restart the dev server.",
      401,
    );
  }

  const response = await fetch(endpoint(key), {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: source,
      target_lang: target,
      // Letters are prose, not markup - keeps DeepL from second-guessing
      // line breaks in a handwritten-style layout.
      preserve_formatting: true,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 403) {
      throw new DeepLError("DeepL rejected the key. Check it is correct and active.", 401);
    }
    if (response.status === 429) {
      throw new DeepLError("DeepL is rate limiting. Wait a moment and try again.", 429);
    }
    if (response.status === 456) {
      throw new DeepLError(
        "DeepL free quota for this month is used up. It resets on your billing date.",
        429,
      );
    }
    throw new DeepLError(
      `DeepL error ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      502,
    );
  }

  const data = (await response.json()) as {
    translations?: { text: string; detected_source_language?: string }[];
  };
  const translated = data.translations?.[0]?.text;
  if (!translated) {
    throw new DeepLError("DeepL returned no translation.", 502);
  }
  return translated;
}
