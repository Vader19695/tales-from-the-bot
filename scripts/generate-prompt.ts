/**
 * generate-prompt.ts
 *
 * Step 1 of story generation.
 * Either accepts a custom prompt from the caller or asks the LLM to invent a
 * fresh story concept.  The result is saved to /tmp/story-prompt.json so the
 * next step (generate-story.ts) can pick it up.
 *
 * Usage:
 *   npx tsx scripts/generate-prompt.ts
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  — required when AI prompt generation is used
 *   CUSTOM_PROMPT      — if set, use this text verbatim and skip the AI call
 *   PROMPT_MODEL       — model used to generate the prompt concept
 *                        (default: claude-haiku-4-5; ignored when CUSTOM_PROMPT is set)
 */

import fs from 'node:fs/promises';
import { AnthropicProvider } from './anthropic-provider.js';
import { pickPrompt } from './prompts.js';

const PROMPT_FILE = '/tmp/story-prompt.json';

async function main(): Promise<void> {
  const customPrompt = process.env.CUSTOM_PROMPT?.trim();

  let slug: string;
  let text: string;

  if (customPrompt) {
    // Use the caller-supplied prompt verbatim.
    console.log('Using custom prompt (skipping AI prompt generation).');
    text = customPrompt;
    // Derive a slug from the first meaningful words of the prompt.
    slug =
      customPrompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50) || 'custom-prompt';
  } else {
    // Ask the LLM to invent a story concept.
    const modelName = process.env.PROMPT_MODEL ?? 'claude-haiku-4-5';
    const provider = new AnthropicProvider(modelName);
    console.log(`Generating story prompt…`);
    console.log(`  Model   : ${provider.modelName}`);
    const result = await pickPrompt(provider);
    slug = result.slug;
    text = result.text;
  }

  console.log(`  Slug    : ${slug}`);
  console.log(`  Prompt  : ${text.slice(0, 100)}…`);

  await fs.writeFile(PROMPT_FILE, JSON.stringify({ slug, text }), 'utf8');
  console.log(`\n✓ Prompt saved to ${PROMPT_FILE}`);

  // Expose the slug as a GitHub Actions output for use in step summaries /
  // branch names without having to re-parse the JSON file.
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    await fs.appendFile(githubOutput, `slug=${slug}\n`, 'utf8');
  }
}

main().catch((err) => {
  console.error('Error generating prompt:', err);
  process.exit(1);
});
