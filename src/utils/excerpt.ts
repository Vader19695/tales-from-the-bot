/**
 * Produces a plain-text excerpt from a story's raw Markdown body.
 * Strips heading markers, emphasis, links, images, code fences, and extra
 * whitespace, then truncates to 200 characters (adding an ellipsis only when
 * the text was actually truncated).
 */
export function buildExcerpt(body: string | undefined): string {
  if (!body) return '';
  const plain = body
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images: keep alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // links: keep link text
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return plain.length > 200 ? plain.slice(0, 200).concat('…') : plain;
}
