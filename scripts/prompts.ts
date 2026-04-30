/**
 * Rotating list of creative-writing prompts.
 *
 * The selection logic is exported as `pickPrompt` so it can be replaced
 * with a fresh-prompt generation strategy later (e.g., asking an LLM to
 * propose a new prompt each week) without changing generate-story.ts.
 */

export interface Prompt {
  /** Short slug used in the story filename. */
  slug: string;
  /** Full prompt text sent to the LLM. */
  text: string;
}

export const prompts: Prompt[] = [
  {
    slug: 'lighthouse-last-signal',
    text: 'Write a melancholy short story (600–800 words) set in a lighthouse on a remote rocky coast. The lighthouse keeper has been alone for months. One stormy night, they receive a signal they were never meant to intercept. Explore themes of isolation, duty, and the unknown. End ambiguously.',
  },
  {
    slug: 'last-cartographer',
    text: 'Write a short story (600–800 words) about the last human cartographer in a world where AI can map anything instantly and perfectly. The cartographer is commissioned for one final job that no algorithm will take. Explore what is lost and gained when craft gives way to efficiency. End on a note that is neither triumphant nor despairing — simply true.',
  },
  {
    slug: 'the-apology',
    text: 'Write a short story (600–800 words) in which a person tries to apologise to someone who died before they could do so. The mechanism — a letter, a ritual, a technology — is left to you. The story should feel earned, not sentimental.',
  },
  {
    slug: 'borrowed-memory',
    text: 'Write a quiet science-fiction story (600–800 words) set in a near-future city where memories can be borrowed and returned like library books. Focus on a single transaction between two strangers. Avoid action and plot twists — let the tension live in what is left unsaid.',
  },
  {
    slug: 'the-translator',
    text: 'Write a short story (600–800 words) about a professional translator at an unusual summit — not between nations, but between species. The translator is the only one who understands both sides. She must decide whether to translate faithfully or protect one side from the truth.',
  },
  {
    slug: 'the-inheritance',
    text: 'Write a short story (600–800 words) in which someone inherits an object with no apparent value — a broken clock, a jar of soil, a single shoe — and slowly understands what it actually meant to the person who left it.',
  },
  {
    slug: 'the-last-open-library',
    text: 'Write a short story (600–800 words) set in the last physical library on earth, the night before it closes. A single librarian locks up. A single patron refuses to leave. Neither is who the other expected.',
  },
  {
    slug: 'first-winter',
    text: 'Write a short story (600–800 words) told from the perspective of a river experiencing its first winter. The river does not understand what ice is. Use precise, sensory language. Avoid metaphors that explain — let the strangeness stand.',
  },
  {
    slug: 'the-understudy',
    text: 'Write a short story (600–800 words) about an understudy who has rehearsed a role for twenty years and never performed it. Tonight, for the first time, the lead cannot go on. The story happens in the forty minutes before curtain.',
  },
  {
    slug: 'the-census-taker',
    text: 'Write a short story (600–800 words) set in a remote village where a census taker arrives to count the population. The villagers are cooperative and give accurate numbers. But the numbers do not add up — they never have, for as long as anyone can remember. No one finds this strange except the census taker.',
  },
];

/**
 * Picks a prompt from the list.
 *
 * Default implementation: cycles through the list in order using the
 * current ISO week number as the index, so the prompt rotates weekly
 * without requiring persistent state.
 *
 * To plug in a different strategy (random, LLM-generated, etc.), replace
 * this function. The only contract is that it returns a `Prompt`.
 */
export function pickPrompt(): Prompt {
  const weekNumber = getISOWeekNumber(new Date());
  const index = weekNumber % prompts.length;
  return prompts[index];
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}
