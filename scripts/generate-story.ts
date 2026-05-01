/**
 * generate-story.ts
 *
 * Step 2 of story generation.
 * Reads the story prompt written by generate-prompt.ts, asks the LLM to
 * write the full story, and saves the result to
 * src/content/stories/YYYY-MM-DD-<slug>.md with proper Astro frontmatter.
 *
 * Run generate-prompt.ts first to create /tmp/story-prompt.json.
 *
 * Usage:
 *   npx tsx scripts/generate-prompt.ts   # step 1
 *   npx tsx scripts/generate-story.ts    # step 2
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  — required
 *   LLM_MODEL          — model used to write the story (default: claude-sonnet-4-5)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnthropicProvider } from './anthropic-provider.js';
import type { LLMProvider } from './types.js';

export type { LLMProvider };

const PROMPT_FILE = '/tmp/story-prompt.json';

// ── OpenAI Stub ───────────────────────────────────────────────────────────────
//
// To use OpenAI, install `openai` and implement this class.
// Then replace `new AnthropicProvider(...)` with `new OpenAIProvider(...)` below.
//
// export class OpenAIProvider implements LLMProvider {
//   readonly modelName: string;
//
//   constructor(modelName = 'gpt-4o') {
//     this.modelName = modelName;
//   }
//
//   async generate(prompt: string): Promise<string> {
//     const { OpenAI } = await import('openai');
//     const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//     const response = await client.chat.completions.create({
//       model: this.modelName,
//       messages: [{ role: 'user', content: prompt }],
//       max_tokens: 2048,
//     });
//     return response.choices[0].message.content?.trim() ?? '';
//   }
// }

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  // Always use UTC so the date matches the GitHub Actions runner clock (UTC).
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Escape a string for safe inclusion in YAML frontmatter. */
function yamlString(value: string): string {
  // Use a literal block scalar (|-) for multi-line values or values that
  // contain double-quote characters — block scalars need no escaping.
  if (value.includes('\n') || value.includes('"')) {
    const indented = value
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    return `|-\n${indented}`;
  }
  // Double-quoted scalar: escape backslashes, double-quotes, and ASCII
  // control characters (U+0000–U+001F) that are illegal in plain YAML.
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\x00-\x1f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return `"${escaped}"`;
}

function buildFrontmatter(
  title: string,
  date: string,
  model: string,
  prompt: string,
  slug: string,
): string {
  return [
    '---',
    `title: ${yamlString(title)}`,
    `date: ${date}`,
    `model: ${model}`,
    `slug: ${slug}`,
    `prompt: ${yamlString(prompt)}`,
    '---',
  ].join('\n');
}

/** Extract a title from the first heading in the generated text, or fall back to slug. */
function extractTitle(body: string, slug: string): { title: string; body: string } {
  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    const title = headingMatch[1].trim();
    const withoutHeading = body.replace(/^#\s+.+\n*/m, '').trimStart();
    return { title, body: withoutHeading };
  }
  // No heading found — derive a title from the slug.
  const title = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { title, body };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const modelName = process.env.LLM_MODEL ?? 'claude-sonnet-4-5';
  const provider: LLMProvider = new AnthropicProvider(modelName);

  // Read the prompt written by generate-prompt.ts.
  let promptData: { slug: string; text: string };
  try {
    promptData = JSON.parse(await fs.readFile(PROMPT_FILE, 'utf8')) as { slug: string; text: string };
  } catch {
    throw new Error(
      `Could not read ${PROMPT_FILE}. Run generate-prompt.ts first:\n  npx tsx scripts/generate-prompt.ts`,
    );
  }
  const { slug, text: promptText } = promptData;

  console.log(`Generating story…`);
  console.log(`  Model   : ${provider.modelName}`);
  console.log(`  Slug    : ${slug}`);
  console.log(`  Prompt  : ${promptText.slice(0, 80)}…`);

  const date = toDateString(new Date());
  const filename = `${date}-${slug}.md`;

  const rawBody = await provider.generate(promptText);
  const { title, body } = extractTitle(rawBody, slug);

  const frontmatter = buildFrontmatter(title, date, provider.modelName, promptText, slug);
  const fileContent = `${frontmatter}\n\n${body}\n`;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.resolve(__dirname, '../src/content/stories');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);

  await fs.writeFile(outPath, fileContent, 'utf8');
  console.log(`\n✓ Story written to ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error('Error generating story:', err);
  process.exit(1);
});
