/**
 * generate-story.ts
 *
 * Asks the LLM to invent a story concept, then asks it to write the story,
 * and saves the result to src/content/stories/YYYY-MM-DD-<slug>.md with
 * proper Astro frontmatter.
 *
 * Usage:
 *   npx tsx scripts/generate-story.ts
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  — required when using the Anthropic provider
 *   LLM_MODEL          — model name (default: claude-opus-4-5)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickPrompt } from './prompts.js';
import type { LLMProvider } from './types.js';

export type { LLMProvider };

// ── Anthropic Implementation ─────────────────────────────────────────────────

export class AnthropicProvider implements LLMProvider {
  readonly modelName: string;
  private client: import('@anthropic-ai/sdk').Anthropic;

  constructor(modelName = 'claude-opus-4-5') {
    this.modelName = modelName;
  }

  async generate(prompt: string): Promise<string> {
    // Lazy-load so the module can be imported without the SDK installed.
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    if (!this.client) {
      // @ts-expect-error — client is assigned lazily
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    const message = await (this.client as import('@anthropic-ai/sdk').Anthropic).messages.create({
      model: this.modelName,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = message.content[0];
    if (block.type !== 'text') {
      throw new Error(`Unexpected content block type: ${block.type}`);
    }
    return block.text.trim();
  }
}

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
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Escape a string for safe inclusion in YAML frontmatter. */
function yamlString(value: string): string {
  // Use a block scalar (|) so multi-line prompts render cleanly.
  if (value.includes('\n') || value.includes('"')) {
    const indented = value
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    return `|-\n${indented}`;
  }
  // Wrap in double quotes, escaping backslashes and double-quotes.
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
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
  const modelName = process.env.LLM_MODEL ?? 'claude-opus-4-5';
  const provider: LLMProvider = new AnthropicProvider(modelName);

  console.log(`Generating story…`);
  console.log(`  Model   : ${provider.modelName}`);

  // Step 1 — ask the AI to invent a story concept (with guardrails).
  console.log(`  Step 1  : generating story concept…`);
  const { slug, text: promptText } = await pickPrompt(provider);
  console.log(`  Slug    : ${slug}`);
  console.log(`  Prompt  : ${promptText.slice(0, 80)}…`);

  // Step 2 — ask the AI to write the story from the generated concept.
  console.log(`  Step 2  : writing story…`);
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
