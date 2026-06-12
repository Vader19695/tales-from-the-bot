import { defineCollection, z } from 'astro:content';

const stories = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    model: z.string(),
    prompt: z.string(),
    humanPrompt: z.boolean().optional(),
    /** Site-relative path to the AI-drawn SVG cover, e.g. /covers/2026-06-12-foo.svg */
    image: z.string().optional(),
    editedAt: z.coerce.date().optional(),
    slug: z.string().optional(),
  }),
});

export const collections = { stories };
