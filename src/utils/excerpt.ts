/**
 * Produces a plain-text excerpt from a story's raw Markdown body.
 * Strips heading markers, emphasis, code, and extra whitespace, then
 * truncates to 200 characters.
 */
export function buildExcerpt(body: string | undefined): string {
  if (!body) return '';
  return body
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 200)
    .concat('…');
}
