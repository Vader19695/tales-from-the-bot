/**
 * generate-image.ts
 *
 * Generates a black-and-white ink illustration for a story using:
 *   1. Claude (haiku) to craft a concise visual scene description from the story text.
 *   2. OpenAI DALL-E 3 to render that description as a B&W pen-and-ink drawing.
 *
 * The resulting PNG is downloaded and saved to
 *   public/story-images/<slug>.png
 * and the relative URL path (/story-images/<slug>.png) is returned.
 *
 * If OPENAI_API_KEY is not set the function logs a warning and returns null
 * so callers can degrade gracefully without failing the whole story pipeline.
 *
 * Environment variables:
 *   OPENAI_API_KEY     — required for image generation
 *   ANTHROPIC_API_KEY  — required to generate the visual description prompt
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnthropicProvider } from './anthropic-provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = path.resolve(__dirname, '../public/story-images');

/** Maximum characters of story body used when building the visual description. */
const MAX_EXCERPT_LENGTH = 1500;

/**
 * Use Claude haiku to distill the story into a short visual scene description
 * suitable for an image generation prompt.
 */
async function buildVisualDescription(title: string, body: string): Promise<string> {
  const provider = new AnthropicProvider('claude-haiku-4-5');

  // Trim body to MAX_EXCERPT_LENGTH chars so the haiku call stays cheap.
  const excerpt = body.slice(0, MAX_EXCERPT_LENGTH);

  const prompt =
    `You are writing a one-sentence visual scene description for an illustrator.\n` +
    `The story is titled "${title}".\n\n` +
    `Story excerpt:\n${excerpt}\n\n` +
    `Write a single sentence (20–35 words) describing the most visually striking moment or setting ` +
    `from this story. Be concrete: name the key subject, the environment, and the mood or action. ` +
    `Do NOT mention colour — the illustration will be black and white. ` +
    `Output only the sentence, no preamble or punctuation at the end beyond the period.`;

  // Strip any trailing punctuation the model may add.
  return (await provider.generate(prompt)).trim().replace(/[.!?,;:]+$/, '');
}

/**
 * Generate a black-and-white ink illustration for a story and save it to disk.
 *
 * @returns The web-root-relative path to the saved image (e.g. /story-images/my-slug.png),
 *          or null if image generation was skipped or failed.
 */
export async function generateStoryImage(
  slug: string,
  title: string,
  body: string,
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠  OPENAI_API_KEY not set — skipping image generation.');
    return null;
  }

  console.log(`\nGenerating image for "${title}"…`);

  // 1. Build a focused visual description via Claude.
  const visualDescription = await buildVisualDescription(title, body);
  console.log(`  Visual description: ${visualDescription}`);

  // 2. Assemble the DALL-E 3 prompt.
  const dallePrompt =
    `Black and white pen-and-ink illustration in the style of a vintage engraving. ` +
    `Detailed cross-hatching, strong contrast, no grey tones, no colour: ` +
    `${visualDescription}`;

  // 3. Call DALL-E 3.
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: dallePrompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    response_format: 'url',
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('DALL-E 3 returned no image URL.');
  }

  // 4. Download and save the image.
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  const filename = `${slug}.png`;
  const outPath = path.join(IMAGE_DIR, filename);

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
  }
  const buffer = await imageResponse.arrayBuffer();
  await fs.writeFile(outPath, Buffer.from(buffer));

  const webPath = `/story-images/${filename}`;
  console.log(`  ✓ Image saved to public${webPath}`);
  return webPath;
}
