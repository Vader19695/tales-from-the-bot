/**
 * Prompt generation via LLM.
 *
 * Rather than maintaining a hard-coded list, the AI invents a fresh story
 * concept each week. Guardrails are baked into the meta-prompt sent to the
 * LLM so every generated prompt respects them automatically.
 */

import type { LLMProvider } from './types.js';

export interface Prompt {
  /** Short kebab-case slug used in the story filename. */
  slug: string;
  /** Full prompt text that will be sent back to the LLM to write the story. */
  text: string;
}

/**
 * Absolute content guardrails included in every prompt-generation request.
 * These mirror the site's stated policy and are non-negotiable.
 */
const GUARDRAILS = `
Guardrails — every single one of these is a hard requirement:
- All content must be PG-rated and suitable for general audiences. No sexual content, no graphic violence, no adult themes.
- Do not reference any real, living people — no celebrities, politicians, athletes, or other public figures.
- No fan-fiction: do not use characters, settings, or intellectual property from existing books, films, games, TV shows, or other media.
- Keep language clean throughout (no profanity, no slurs).
`.trim();

/**
 * The instruction sent to the LLM to produce a new story concept.
 * The model must respond with a single JSON object and nothing else.
 */
const PROMPT_GENERATOR_INSTRUCTION = `You are a creative writing prompt generator for a short-story website.
Invent one completely original story concept that a different AI will then write as a short story (600–800 words).

${GUARDRAILS}

Respond with ONLY a valid JSON object — no markdown fences, no explanation, no surrounding text:
{
  "slug": "three-to-five-word-kebab-case-title",
  "text": "The complete writing prompt in 2–4 sentences. Be specific about tone, the central image or tension, and any stylistic guidance. Do not mention real people or existing fictional properties."
}`;

/**
 * Ask the LLM to invent a fresh story concept and return it as a Prompt.
 *
 * Two API calls are made per weekly run:
 *   1. This function — asks for a prompt concept (cheap, short response).
 *   2. generate-story.ts — sends the resulting prompt to write the full story.
 */
export async function pickPrompt(provider: LLMProvider): Promise<Prompt> {
  const response = await provider.generate(PROMPT_GENERATOR_INSTRUCTION);

  // Extract the outermost JSON object from the response.
  // This handles cases where the model wraps the JSON in markdown code fences
  // or adds explanatory text before/after the JSON.
  const jsonStart = response.indexOf('{');
  const jsonEnd = response.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error(`LLM response contains no JSON object:\n${response}`);
  }
  const jsonSlice = response.slice(jsonStart, jsonEnd + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonSlice);
  } catch {
    throw new Error(`LLM returned invalid JSON for prompt generation:\n${response}`);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).slug !== 'string' ||
    typeof (parsed as Record<string, unknown>).text !== 'string'
  ) {
    throw new Error(`LLM returned unexpected prompt structure:\n${JSON.stringify(parsed, null, 2)}`);
  }

  const { slug, text } = parsed as { slug: string; text: string };

  // Sanitise the slug: lowercase kebab-case, safe for filenames.
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled';

  return { slug: safeSlug, text };
}
