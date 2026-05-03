/**
 * backfill-images.ts
 *
 * Generates banner images for every story that does not yet have an `image`
 * frontmatter field and updates the Markdown file in-place.
 *
 * Also sets (or updates) the `editedAt` field to the current UTC timestamp so
 * the site shows the correct "last updated" date.
 *
 * Usage:
 *   npx tsx scripts/backfill-images.ts
 *
 * Environment variables:
 *   OPENAI_API_KEY    — required for image generation
 *   ANTHROPIC_API_KEY — required to generate the visual description prompt
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateStoryImage } from './generate-image.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORIES_DIR = path.resolve(__dirname, '../src/content/stories');

interface ParsedStory {
  frontmatter: Record<string, string>;
  body: string;
  raw: string;
  filePath: string;
}

/** Very small YAML-aware frontmatter parser — handles only the fields we need. */
function parseFrontmatter(content: string, filePath: string): ParsedStory {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`No frontmatter found in ${filePath}`);

  const rawYaml = match[1];
  const body = match[2];

  // Parse top-level scalar fields only (no nested objects or block scalars).
  // Intentionally skips lines that begin with whitespace (block scalar
  // continuation lines) to avoid false matches on embedded colons.
  const frontmatter: Record<string, string> = {};
  for (const line of rawYaml.split('\n')) {
    // Only match top-level keys (no leading whitespace).
    const kv = line.match(/^([a-zA-Z]\w*):\s*(.*)/);
    if (kv) frontmatter[kv[1]] = kv[2].trim();
  }

  return { frontmatter, body, raw: content, filePath };
}

/** Strip surrounding YAML quotes from a scalar value. */
function unquoteYaml(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Rebuild the file with an added/updated `image` field and an updated
 * `editedAt` timestamp.  We do a targeted string replacement rather than
 * reconstructing the whole frontmatter to preserve multi-line scalars
 * (block YAML) that a naive serialiser would mangle.
 */
function updateFrontmatter(
  raw: string,
  image: string,
  editedAt: string,
): string {
  // Extract just the frontmatter block.
  const match = raw.match(/^(---\n[\s\S]*?\n---)/);
  if (!match) throw new Error('Could not locate frontmatter block');

  let fm = match[1];

  // Remove any existing image/editedAt lines (global flag handles duplicates).
  fm = fm.replace(/\nimage:.*$/gm, '');
  fm = fm.replace(/\neditedAt:.*$/gm, '');

  // Insert before the closing --- delimiter.
  fm = fm.replace(/\n---$/, `\nimage: "${image}"\neditedAt: ${editedAt}\n---`);

  return raw.replace(match[1], fm);
}

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set.');
    process.exit(1);
  }

  const files = (await fs.readdir(STORIES_DIR)).filter((f) => f.endsWith('.md'));
  console.log(`Found ${files.length} story file(s) in ${STORIES_DIR}\n`);

  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(STORIES_DIR, file);
    const content = await fs.readFile(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content, filePath);

    if (frontmatter.image) {
      console.log(`  skip  ${file} (already has image)`);
      skipped++;
      continue;
    }

    const slug = unquoteYaml(frontmatter.slug?.trim() ?? '').trim()
      || path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const title = unquoteYaml(frontmatter.title?.trim() ?? '') || slug;

    console.log(`  → ${file}`);
    console.log(`    slug: ${slug}, title: ${title}`);

    try {
      const imagePath = await generateStoryImage(slug, title, body);
      if (!imagePath) {
        console.warn(`    ⚠  No image returned — skipping frontmatter update.`);
        continue;
      }

      const editedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const updated = updateFrontmatter(content, imagePath, editedAt);
      await fs.writeFile(filePath, updated, 'utf8');
      console.log(`    ✓ Updated frontmatter: image=${imagePath}, editedAt=${editedAt}\n`);
      processed++;
    } catch (err) {
      console.error(`    ✗ Failed: ${(err as Error).message}\n`);
    }
  }

  console.log(`\nDone. Processed: ${processed}, Skipped (already had image): ${skipped}.`);
}

main().catch((err) => {
  console.error('Error during backfill:', err);
  process.exit(1);
});
