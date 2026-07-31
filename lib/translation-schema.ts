import { z } from "zod";

/**
 * The shape Claude must return. Structured outputs require every field to be
 * present, so "nothing to report" is an empty string or empty array rather
 * than an omitted key.
 */
export const TranslationSchema = z.object({
  natural: z
    .string()
    .describe("Fluent, idiomatic English translation of the whole text."),
  literal: z
    .string()
    .describe(
      "Word-order-preserving English rendering that exposes how the Italian is built. Awkward English is fine and expected here.",
    ),
  vocabulary: z
    .array(
      z.object({
        term: z.string().describe("The Italian word or phrase."),
        translation: z
          .string()
          .describe("Its meaning in the specific sense used here."),
        note: z
          .string()
          .describe(
            "Why it is worth learning: register, false friend, common collocation, irregular form. Empty string if there is nothing useful to add.",
          ),
      }),
    )
    .describe(
      "Up to 12 words or phrases worth learning. Skip anything an English speaker already knows.",
    ),
  notes: z
    .array(z.string())
    .describe(
      "Idioms, regional usage, cultural references, or tone that a machine translation would flatten. Empty array if there is nothing notable.",
    ),
  suggestedReply: z
    .string()
    .describe(
      "A short, natural Italian reply the reader could adapt, matching the register of the original.",
    ),
});

export type Translation = z.infer<typeof TranslationSchema>;
