/**
 * generate-cover.ts
 *
 * Step 3 of story generation (optional).
 * Reads the story written by generate-story.ts, asks the LLM to draw a
 * black-and-white ink line-art SVG cover for it, saves the SVG to
 * public/covers/YYYY-MM-DD-<slug>.svg, and records the image path in the
 * story's frontmatter.
 *
 * Run generate-story.ts first to create /tmp/story-meta.json.
 *
 * Usage:
 *   npx tsx scripts/generate-prompt.ts   # step 1
 *   npx tsx scripts/generate-story.ts    # step 2
 *   npx tsx scripts/generate-cover.ts    # step 3
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  — required
 *   COVER_MODEL        — model used to draw the cover (default: claude-opus-4-8)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnthropicProvider } from './anthropic-provider.js';
import type { LLMProvider } from './types.js';

const META_FILE = '/tmp/story-meta.json';

// ── SVG extraction & safety checks ───────────────────────────────────────────

/**
 * Pull the <svg>…</svg> element out of the model output, tolerating markdown
 * code fences or stray commentary around it.
 */
export function extractSvg(raw: string): string {
  const start = raw.indexOf('<svg');
  const end = raw.lastIndexOf('</svg>');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Model output did not contain a complete <svg> element.');
  }
  return raw.slice(start, end + '</svg>'.length);
}

// The SVG is committed to the repo and served on our own pages, so reject
// anything that could execute code or pull in external resources.
const FORBIDDEN_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /<script/i, reason: 'contains a <script> element' },
  { pattern: /<foreignObject/i, reason: 'contains a <foreignObject> element' },
  { pattern: /<image\b/i, reason: 'contains an <image> element' },
  { pattern: /\bon[a-z]+\s*=/i, reason: 'contains an inline event handler' },
  { pattern: /javascript:/i, reason: 'contains a javascript: URL' },
  { pattern: /(?:href|src)\s*=\s*["']?\s*https?:/i, reason: 'references an external URL' },
];

export function validateSvg(svg: string): void {
  for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
    if (pattern.test(svg)) {
      throw new Error(`Generated SVG rejected: ${reason}.`);
    }
  }
  if (!/viewBox\s*=/.test(svg)) {
    throw new Error('Generated SVG rejected: missing viewBox attribute.');
  }
}

// ── Frontmatter update ────────────────────────────────────────────────────────

/**
 * Insert an `image:` line just before the closing frontmatter fence.
 * The opening fence is at position 0, so the first "\n---\n" is the close.
 */
export function addImageToFrontmatter(content: string, imagePath: string): string {
  if (!content.startsWith('---\n') || !content.includes('\n---\n')) {
    throw new Error('Story file does not contain YAML frontmatter.');
  }
  if (/^image:/m.test(content.slice(0, content.indexOf('\n---\n')))) {
    throw new Error('Story frontmatter already contains an image field.');
  }
  return content.replace('\n---\n', `\nimage: ${imagePath}\n---\n`);
}

// ── Cover prompt ──────────────────────────────────────────────────────────────

function buildCoverPrompt(title: string, body: string): string {
  return [
    'You are a master pen-and-ink illustrator creating a cover image for a short',
    'story, as a single SVG, in the tradition of detailed etchings and book',
    'engravings.',
    '',
    'Requirements:',
    '- One <svg> element with viewBox="0 0 1200 630" and xmlns="http://www.w3.org/2000/svg".',
    '- Black ink (#1a1a18) on off-white paper (#fcfbf7) only — no other colors,',
    '  no gradients.',
    '- Aim for the density of a master etching, not a simple line drawing. Build',
    '  a full tonal range from bare paper to near-black using layered hatching',
    '  and crosshatching. Define <pattern> tiles in <defs> for hatch textures at',
    '  several angles and densities (give the tile strokes slight irregularity so',
    '  they read as hand-drawn) and fill shaded regions with them, then draw',
    '  contour strokes on top that follow each form.',
    '- Texture every surface: individual stones in walls, shingles on roofs,',
    '  wood grain on planks, scribbled foliage masses, stippled skies and ground.',
    '- Compose a full scene with foreground, midground, and background; use',
    '  lighter, sparser line work as elements recede.',
    '- Vary stroke weight widely: heavy outlines (4-6) on foreground forms,',
    '  fine detail lines (0.75-1.5) for texture and distant elements.',
    '- Capture the mood and a central image or symbol from the story — evocative,',
    '  not a literal scene-by-scene depiction.',
    '- Absolutely no text, letters, or numbers in the artwork.',
    '- The first child of the <svg> must be a <title> element with a one-sentence',
    '  description of the artwork (for screen readers).',
    '- Entirely self-contained: no <script>, no <image>, no <foreignObject>, no',
    '  event handlers, no external references of any kind.',
    '',
    'Output ONLY the SVG markup. No markdown fences, no commentary.',
    '',
    `Story title: ${title}`,
    '',
    'Story:',
    body,
  ].join('\n');
}

// ── Cover generation ──────────────────────────────────────────────────────────

/**
 * Generate a cover for one story file: draw the SVG, save it to
 * public/covers/, and record the image path in the story's frontmatter.
 * Returns the site-relative image URL.
 */
export async function generateCoverForStory(
  provider: LLMProvider,
  storyFile: string,
  title: string,
): Promise<string> {
  const storyContent = await fs.readFile(storyFile, 'utf8');
  const fenceEnd = storyContent.indexOf('\n---\n');
  const storyBody = fenceEnd === -1 ? storyContent : storyContent.slice(fenceEnd + 5).trim();

  const raw = await provider.generate(buildCoverPrompt(title, storyBody));
  const svg = extractSvg(raw);
  validateSvg(svg);

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const coversDir = path.resolve(__dirname, '../public/covers');
  await fs.mkdir(coversDir, { recursive: true });

  const svgName = `${path.basename(storyFile, '.md')}.svg`;
  const svgPath = path.join(coversDir, svgName);
  await fs.writeFile(svgPath, `${svg}\n`, 'utf8');

  // Record the cover in the story's frontmatter so the site picks it up.
  const imageUrl = `/covers/${svgName}`;
  await fs.writeFile(storyFile, addImageToFrontmatter(storyContent, imageUrl), 'utf8');
  return imageUrl;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const modelName = process.env.COVER_MODEL ?? 'claude-opus-4-8';
  // SVG output runs long — give it more room than the 4096-token default.
  const provider = new AnthropicProvider(modelName, 8192);

  // Read the handoff written by generate-story.ts.
  let meta: { file: string; slug: string; title: string };
  try {
    meta = JSON.parse(await fs.readFile(META_FILE, 'utf8')) as typeof meta;
  } catch {
    throw new Error(
      `Could not read ${META_FILE}. Run generate-story.ts first:\n  npx tsx scripts/generate-story.ts`,
    );
  }

  console.log(`Generating cover…`);
  console.log(`  Model   : ${provider.modelName}`);
  console.log(`  Story   : ${meta.title}`);

  const imageUrl = await generateCoverForStory(provider, meta.file, meta.title);

  console.log(`\n✓ Cover written to public${imageUrl}`);
  console.log(`✓ Frontmatter updated with image: ${imageUrl}`);
}

// Allow importing the helpers (e.g. in tests) without running the pipeline.
const isDirectRun =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error('Error generating cover:', err);
    process.exit(1);
  });
}
